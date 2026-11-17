#!/usr/bin/env node
/** 全量上传候选包，验证整批产物后统一切换 latest，失败时保留同版重试状态。 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'
import { ROOT, getReleasePackages, validateReleasePackages } from './release-workspace.mjs'
import { prepareNpmPackages } from './prepare-npm-publish.mjs'
import { git, beginRelease as beginGitRelease, completeRelease as completeGitRelease } from './release-git.mjs'

const REGISTRY = 'https://registry.npmjs.org/'
const CANDIDATE = 'release-candidate'
const DEP_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies']
const VIEW_FLAGS = ['--prefer-online', '--prefer-offline=false', '--offline=false']
export const RELEASE_PROTOCOL = 3

export function runCommand(command, args, options = {}) {
    const result = spawnSync(command, args, { ...options, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    if (result.error) throw result.error
    return result
}

function parseJson(output, description) {
    try { return JSON.parse(output) }
    catch { throw new Error(`${description} 未返回有效 JSON`) }
}

function singleResult(value, description) {
    if (!Array.isArray(value)) return value
    if (value.length !== 1) throw new Error(`${description} 必须返回唯一结果`)
    return value[0]
}

function isNotFound(result) {
    for (const output of [result.stdout, result.stderr]) {
        try { if (JSON.parse(output).error?.code === 'E404') return true }
        catch { /* npm 的 stderr 通常是文本，继续检查明确的错误码。 */ }
    }
    return /(?:^|\n)npm (?:error|ERR!) code E404(?:\s|$)/.test(result.stderr || '')
}

export function readReleaseManifest(root, packages, version) {
    const path = join(root, '.release', 'manifest.json')
    if (!existsSync(path)) throw new Error('真实发布缺少 .release/manifest.json，请先生成并提交统一版本')
    const manifest = parseJson(readFileSync(path, 'utf8'), '发布清单')
    if (manifest.version !== version || !/^[0-9a-f]{40}$/.test(manifest.submoduleSha || '')) {
        throw new Error('发布清单的统一版本或子模块 SHA 无效')
    }
    const expected = packages.map(({ dir, packageJson }) => `${packageJson.name}\0${relative(root, dir).split(sep).join('/')}`).sort()
    const actual = (manifest.packages || []).map(({ name, dir }) => `${name}\0${dir}`).sort()
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('发布清单与当前 workspace 包集合不一致')
    return manifest
}

function entrypoints(pkg) {
    const paths = [pkg.main, pkg.module, pkg.types, pkg.typings].filter(Boolean)
    function visit(value) {
        if (typeof value === 'string' && value.startsWith('./')) paths.push(value)
        else if (value && typeof value === 'object') Object.values(value).forEach(visit)
    }
    visit(pkg.exports)
    return [...new Set(paths.map(path => path.replace(/^\.\//, '')))]
}

function verifyPackedFiles(pkg, packed) {
    const paths = new Set((packed.files || []).map(file => file.path))
    if (!paths.has('package.json')) throw new Error(`${pkg.name}: 打包清单缺少 package.json`)
    for (const path of entrypoints(pkg)) {
        if (!paths.has(path)) throw new Error(`${pkg.name}: 打包清单缺少入口 ${path}，请先构建全部包`)
    }
}

export function verifyRegistryPackage(expected, actual, artifact, names) {
    if (actual.name !== expected.name || actual.version !== expected.version) {
        throw new Error(`${expected.name}: registry 返回的包名或版本不一致`)
    }
    for (const field of DEP_FIELDS) {
        const internal = pkg => Object.entries(pkg[field] || {}).filter(([name]) => names.has(name)).sort(([a], [b]) => a.localeCompare(b))
        if (JSON.stringify(internal(expected)) !== JSON.stringify(internal(actual))) {
            throw new Error(`${expected.name}: registry 的 ${field} 内部精确引用与发布产物不一致`)
        }
    }
    let compared = false
    if (actual.dist?.integrity) {
        for (const token of actual.dist.integrity.split(/\s+/)) {
            const match = /^(sha512|sha384|sha256|sha1)-([^?]+)(?:\?.*)?$/.exec(token)
            if (!match) continue
            compared = true
            const expectedHash = createHash(match[1]).update(artifact.contents).digest('base64')
            if (match[2] !== expectedHash) throw new Error(`${expected.name}: 已存在同版本产物的 integrity 不一致，禁止混用源码`)
        }
    }
    if (actual.dist?.shasum) {
        compared = true
        if (actual.dist.shasum !== artifact.shasum) throw new Error(`${expected.name}: 已存在同版本产物的 shasum 不一致，禁止混用源码`)
    }
    if (!compared) throw new Error(`${expected.name}: registry 缺少可核验的产物 integrity/shasum`)
}

/** 所有命令和 Git 副作用均可注入，测试不连接 registry。 */
export async function publishRelease({ root = ROOT, dryRun = false, prepareOnly = false, finalizeOnly = false, env = process.env,
    runCommand: execute = runCommand, beginRelease = beginGitRelease, completeRelease = completeGitRelease,
    sourceSha = directory => git(directory, ['rev-parse', 'HEAD']),
    wait = sleep, now = Date.now, visibilityTimeout = 20 * 60_000, tagVisibilityTimeout = 5 * 60_000, pollInterval = 15_000,
    log = console.log } = {}) {
    if ([dryRun, prepareOnly, finalizeOnly].filter(Boolean).length > 1) throw new Error('--dry-run、--prepare 与 --finalize-only 不能同时使用')
    if (!dryRun && env.CI !== 'true') throw new Error('真实 npm 发布只能在 CI 中执行；本地请使用 --dry-run')
    const provenanceError = 'npm provenance 要求事件提交与冻结版本提交一致；必须从冻结版本提交启动新 workflow，不能覆盖 GITHUB_SHA'
    if (!dryRun && !prepareOnly && !/^[0-9a-f]{40}$/.test(env.GITHUB_SHA || '')) {
        throw new Error(finalizeOnly ? '收尾维修要求 CI 提供有效的 40 位 GITHUB_SHA' : provenanceError)
    }
    if (existsSync(join(root, '.changeset', 'pre.json'))) throw new Error('统一发布流程暂不支持 Changesets 预发布模式')
    const packages = await getReleasePackages(root)
    const version = validateReleasePackages(packages)
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) throw new Error('统一发布流程只支持正式 semver 版本')
    const manifest = dryRun ? undefined : readReleaseManifest(root, packages, version)
    const frozenSha = dryRun ? undefined : await sourceSha(root)
    if (!dryRun && !/^[0-9a-f]{40}$/.test(frozenSha || '')) throw new Error('无法确定本批次冻结的主仓库提交')
    if (!dryRun && !prepareOnly && !finalizeOnly && env.GITHUB_SHA !== frozenSha) throw new Error(provenanceError)
    const saved = new Map(packages.map(({ dir }) => {
        const path = join(dir, 'package.json')
        return [path, readFileSync(path, 'utf8')]
    }))
    const restore = () => { for (const [path, content] of saved) writeFileSync(path, content) }
    const scratch = mkdtempSync(join(tmpdir(), 'bit-framework-publish-'))
    const names = new Set(packages.map(({ packageJson }) => packageJson.name))
    const command = async (bin, args, cwd = root) => execute(bin, args, { cwd,
        env: { ...env, npm_config_ignore_scripts: 'true' } })
    const required = async (bin, args, cwd = root) => {
        const result = await command(bin, args, cwd)
        if (result.status !== 0) throw new Error(`${bin} ${args.join(' ')} 失败\n${result.stderr || result.stdout || ''}`)
        return result
    }
    const view = async name => {
        const result = await command('npm', ['view', `${name}@${version}`, '--json', `--registry=${REGISTRY}`, ...VIEW_FLAGS])
        if (result.status !== 0) {
            if (isNotFound(result)) return null
            throw new Error(`${name}: registry 查询失败，停止发布\n${result.stderr || result.stdout || ''}`)
        }
        const actual = singleResult(parseJson(result.stdout, `${name} registry 查询`), `${name} registry 查询`)
        if (!actual || typeof actual !== 'object' || actual.error) throw new Error(`${name}: registry 查询没有返回有效包清单`)
        return actual
    }
    const readTag = async (name, tag) => {
        const result = await required('npm', ['view', `${name}@${version}`, `dist-tags.${tag}`, '--json', `--registry=${REGISTRY}`, ...VIEW_FLAGS])
        if (!result.stdout.trim()) return undefined
        const parsed = parseJson(result.stdout, `${name} ${tag}`)
        if (Array.isArray(parsed) && parsed.length === 0) return undefined
        const value = singleResult(parsed, `${name} ${tag}`)
        if (value == null) return undefined
        if (typeof value !== 'string') throw new Error(`${name}: ${tag} 查询结果不是有效版本号`)
        return value
    }
    const pause = async (deadline, progress, timeoutMessage) => {
        const remaining = deadline - now()
        if (remaining <= 0) throw new Error(timeoutMessage)
        const delay = Math.min(pollInterval, remaining)
        log(`${progress}；${Math.ceil(delay / 1000)} 秒后重试`)
        await wait(delay)
    }
    const waitForTags = async (targets, deadline) => {
        const pending = new Map(targets.map(target => [`${target.name}\0${target.tag}`, target]))
        while (pending.size) {
            for (const [key, { name, tag }] of pending) {
                if (await readTag(name, tag) === version) pending.delete(key)
            }
            if (pending.size) {
                const remaining = [...pending.values()].map(({ name, tag }) => `${name}@${version} ${tag}`).join(', ')
                await pause(deadline, `等待标签可见性，剩余标签：${remaining}`,
                    `${remaining} 可见性等待超时，仍未指向 ${version}；冻结批次已保留，请稍后按同一版本重试`)
            }
        }
    }
    const writeTag = async (name, tag) => {
        if (await readTag(name, tag) !== version) {
            await required('npm', ['dist-tag', 'add', `${name}@${version}`, tag, `--registry=${REGISTRY}`])
        }
    }

    try {
        const prepared = prepareNpmPackages(packages)
        const artifacts = new Map()
        for (const { dir, packageJson } of prepared) {
            if (packageJson.publishConfig?.directory) throw new Error(`${packageJson.name}: 不支持 publishConfig.directory`)
            if (packageJson.publishConfig?.registry && packageJson.publishConfig.registry.replace(/\/$/, '') !== REGISTRY.replace(/\/$/, '')) {
                throw new Error(`${packageJson.name}: 只支持 npmjs registry`)
            }
            const result = await required('npm', ['pack', '--json', '--ignore-scripts', '--cache', join(scratch, 'cache'), '--pack-destination', scratch], dir)
            const packed = singleResult(parseJson(result.stdout, `${packageJson.name} 打包`), `${packageJson.name} 打包`)
            verifyPackedFiles(packageJson, packed)
            if (!packed.filename || basename(packed.filename) !== packed.filename) throw new Error(`${packageJson.name}: 打包文件名无效`)
            const path = join(scratch, packed.filename)
            const contents = readFileSync(path)
            artifacts.set(packageJson.name, { path, contents, shasum: createHash('sha1').update(contents).digest('hex') })
        }
        // Git 校验必须看到原始清单；临时转换不会改变任何包的版本。
        restore()
        if (dryRun) {
            log(`dry-run：${packages.length} 个包的 ${version} 发布清单、精确引用和本地产物检查通过`)
            return { version, packages: [...names], dryRun: true }
        }

        if (finalizeOnly) await beginRelease(root, version, manifest.submoduleSha, { requirePending: true })
        else await beginRelease(root, version, manifest.submoduleSha)
        if (await sourceSha(root) !== frozenSha) throw new Error('来源冻结过程中主仓库 HEAD 发生变化，停止发布操作')
        if (prepareOnly) {
            log(`${packages.length} 个包已完成 ${version} 全量预检并冻结来源 ${frozenSha}，等待该提交的新 workflow 上传`)
            return { status: 'prepared', version, sourceSha: frozenSha, submoduleSha: manifest.submoduleSha,
                packages: [...names], dryRun: false }
        }
        const missing = []
        for (const { packageJson } of prepared) {
            const existing = await view(packageJson.name)
            if (existing) verifyRegistryPackage(packageJson, existing, artifacts.get(packageJson.name), names)
            else if (finalizeOnly) throw new Error(`${packageJson.name}@${version}: 收尾维修缺少已发布目标包，停止操作`)
            else missing.push(packageJson.name)
        }
        // 直接上传已校验的 tarball，避免包管理器二次打包改变产物内容。
        if (!finalizeOnly) {
            for (const name of missing) {
                log(`上传候选包 ${name}@${version}`)
                try {
                    const result = await required('npm', ['publish', artifacts.get(name).path, '--tag', CANDIDATE,
                        '--access', 'public', '--provenance', '--ignore-scripts', `--registry=${REGISTRY}`])
                    if (result.stdout) log(result.stdout.trim())
                } catch (error) {
                    throw new Error(`${name}@${version} 候选上传失败：${error.message}`)
                }
            }
        }
        // 发布扫描期间明确的 E404 可暂时存在；整批共享窗口，不重传已上传的包。
        const visibilityDeadline = now() + visibilityTimeout
        const verifyVisibleCandidates = async () => {
            const pending = new Map(prepared.map(({ packageJson }) => [packageJson.name, packageJson]))
            while (pending.size) {
                for (const [name, packageJson] of pending) {
                    const actual = await view(name)
                    if (actual) {
                        verifyRegistryPackage(packageJson, actual, artifacts.get(name), names)
                        pending.delete(name)
                    }
                }
                if (pending.size) {
                    const remaining = [...pending.keys()].map(name => `${name}@${version}`).join(', ')
                    await pause(visibilityDeadline, `等待 npm 发布扫描/可见性，剩余包：${remaining}`,
                        `${remaining}: 等待 npm 发布扫描/可见性超时；冻结批次已保留，请稍后按同一版本重试`)
                }
            }
        }
        // 所有候选内容均核验通过之后，才允许修改任何 latest；标签也共享独立窗口。
        // 仅收尾已在前面立即核验全部现有包，缺包必须直接停止，不能等待后补发。
        if (!finalizeOnly) await verifyVisibleCandidates()
        const tagTargets = [CANDIDATE, 'latest'].flatMap(tag => prepared.map(({ packageJson }) => ({ name: packageJson.name, tag })))
        // 先完成全部标签写入，再为整批回读建立共同窗口，避免逐包传播延迟累加。
        for (const { name, tag } of tagTargets) await writeTag(name, tag)
        const tagDeadline = now() + tagVisibilityTimeout
        await waitForTags(tagTargets, tagDeadline)
        // 最终证据重新读取，但沿用原窗口，短暂 E404 或标签旧值不能重置等待预算。
        await verifyVisibleCandidates()
        await waitForTags(tagTargets, tagDeadline)
        // 清单转换不能进入 Git tag，也不能影响子模块工作区检查。
        restore()
        await completeRelease(root, version, manifest.submoduleSha)
        log(`${packages.length} 个包已完成 ${version} ${finalizeOnly ? '收尾维修' : '全量发布'}和双仓 tag 验证`)
        return { status: finalizeOnly ? 'finalized' : 'published', version, sourceSha: frozenSha, submoduleSha: manifest.submoduleSha,
            packages: [...names], dryRun: false }
    } finally {
        restore()
        rmSync(scratch, { recursive: true, force: true })
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try { await publishRelease({ dryRun: process.argv.includes('--dry-run'), prepareOnly: process.argv.includes('--prepare'),
        finalizeOnly: process.argv.includes('--finalize-only') }) }
    catch (error) {
        console.error(error.message)
        process.exitCode = 1
    }
}
