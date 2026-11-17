#!/usr/bin/env node
/** 跨仓库版本提交、发布来源冻结及完成标签。所有远端写入仅由 CI 调用。 */
import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const SUBMODULE = 'vendor/fairygui-cc'
export const PENDING_REF = 'refs/heads/bit-framework-release/pending'
export const MANIFEST = '.release/manifest.json'

export function git(root, args, { allowFailure = false } = {}) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
    if (result.error) throw result.error
    if (result.status !== 0 && !allowFailure) {
        throw new Error(`git ${args.join(' ')} 失败：${result.stderr.trim()}`)
    }
    return allowFailure ? result : result.stdout.trimEnd()
}

/** 注释标签使用剥离后的提交，普通 ref 使用自身提交。 */
export function remoteCommit(root, ref) {
    const output = git(root, ['ls-remote', 'origin', ref, `${ref}^{}`])
    const refs = new Map(output.split('\n').filter(Boolean).map(line => {
        const [sha, name] = line.split(/\s+/)
        return [name, sha]
    }))
    return refs.get(`${ref}^{}`) ?? refs.get(ref)
}

function checkVersion(version) {
    if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`只支持统一正式版本：${version}`)
}

function head(root) {
    return git(root, ['rev-parse', 'HEAD'])
}

function submoduleCommit(root) {
    const line = git(root, ['ls-tree', 'HEAD', '--', SUBMODULE])
    const match = /^160000 commit ([0-9a-f]+)\t/.exec(line)
    if (!match) throw new Error('主仓库必须记录 FairyGUI git 子模块')
    return match[1]
}

function assertSource(root, subSha) {
    if (submoduleCommit(root) !== subSha || head(join(root, SUBMODULE)) !== subSha) {
        throw new Error('FairyGUI 检出提交、主仓库 gitlink 和发布清单不一致')
    }
}

export function readManifest(root = ROOT) {
    return existsSync(join(root, MANIFEST)) ? JSON.parse(readFileSync(join(root, MANIFEST), 'utf8')) : undefined
}

/** 返回尚未完成的版本来源；没有批次时再决定是否生成统一版本。 */
export function releaseSelection(root = ROOT) {
    const pending = remoteCommit(root, PENDING_REF)
    if (pending) return { mode: 'publish', sha: pending, resumed: true }
    const manifest = readManifest(root)
    if (manifest) {
        checkVersion(manifest.version)
        const tag = `refs/tags/v${manifest.version}`
        const parentTag = remoteCommit(root, tag)
        const childTag = remoteCommit(join(root, SUBMODULE), tag)
        const source = git(root, ['log', '--first-parent', '-1', '--format=%H', '--', MANIFEST])
        if (!source) throw new Error('发布清单尚未提交，无法确定本批次的源码来源')
        if (parentTag && parentTag !== source) throw new Error(`${tag} 没有指向发布清单所属的主仓库提交`)
        if (childTag && childTag !== manifest.submoduleSha) throw new Error(`FairyGUI ${tag} 与发布清单不一致`)
        if (!parentTag || !childTag) return { mode: 'publish', sha: source, resumed: true }
    }
    const hasChangesets = readdirSync(join(root, '.changeset')).some(name => name.endsWith('.md') && name !== 'README.md')
    return { mode: hasChangesets ? 'version' : 'none', sha: head(root), resumed: false }
}

export function assertNoPendingRelease(root = ROOT) {
    const selection = releaseSelection(root)
    if (selection.mode === 'publish') throw new Error(`必须先完成冻结批次 ${selection.sha}，不能生成下一版本`)
}

/** 在安装依赖和构建之前，恢复本批次的主仓库及子模块提交。 */
export function selectReleaseSource(root = ROOT) {
    const selection = releaseSelection(root)
    if (selection.sha !== head(root)) {
        if (git(root, ['status', '--porcelain'])) throw new Error('恢复发布来源前工作区必须干净')
        git(root, ['fetch', '--no-tags', 'origin', selection.sha])
        git(root, ['checkout', '--detach', selection.sha])
        git(root, ['submodule', 'update', '--init', '--recursive'])
    }
    if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, `mode=${selection.mode}\nresumed=${selection.resumed}\n`)
    }
    console.log(`发布阶段：${selection.mode}，来源：${selection.sha}`)
    return selection
}

/** 先保留子提交的远端引用，再由主仓库版本提交记录新的 gitlink。 */
export function prepareSubmoduleRelease(root, version, packages) {
    checkVersion(version)
    const child = join(root, SUBMODULE)
    const source = head(root)
    const branch = `refs/heads/bit-framework-release/${source}/v${version}`
    const status = git(child, ['status', '--porcelain', '--untracked-files=all'])
    const allowed = ['source/package.json', 'source/CHANGELOG.md', 'source/dist/']
    for (const line of status.split('\n').filter(Boolean)) {
        const path = line.slice(3)
        if (!allowed.some(prefix => path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`))) {
            throw new Error(`FairyGUI 有发布范围外的修改：${path}`)
        }
    }
    git(child, ['add', '--', 'source/package.json', 'source/CHANGELOG.md', 'source/dist'])
    const tree = git(child, ['write-tree'])
    const existing = remoteCommit(child, branch)
    let sha
    if (existing) {
        git(child, ['fetch', '--no-tags', 'origin', branch])
        if (git(child, ['rev-parse', `${existing}^{tree}`]) !== tree) {
            throw new Error('同一发布来源已存在内容不同的 FairyGUI 候选提交，停止覆盖')
        }
        // 复用同一份文件树对应的已推送提交，确保重复运行稳定引用原 SHA。
        git(child, ['reset', '--soft', existing])
        sha = existing
    } else {
        git(child, ['commit', '-m', `chore: release v${version}`])
        sha = head(child)
        git(child, ['push', 'origin', `${sha}:${branch}`])
        if (remoteCommit(child, branch) !== sha) throw new Error('FairyGUI 候选提交未能在远端确认')
    }
    const manifest = {
        version,
        packages: packages.map(pkg => ({ name: pkg.packageJson.name, dir: relative(root, pkg.dir).split('\\').join('/') })),
        submoduleSha: sha,
    }
    mkdirSync(join(root, dirname(MANIFEST)), { recursive: true })
    writeFileSync(join(root, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`)
    return manifest
}

/** 只提交生成的发布文件，并在 npm 上传前将主版本提交推到正式分支。 */
export function finalizeVersionCommit(root, version, packages) {
    checkVersion(version)
    const manifest = readManifest(root)
    if (!manifest || manifest.version !== version || manifest.submoduleSha !== head(join(root, SUBMODULE))) {
        throw new Error('主版本提交的版本或 FairyGUI 提交与发布清单不一致')
    }
    if (packages.some(({ packageJson }) => packageJson.version !== version)) {
        throw new Error('主版本提交必须包含全部包的统一版本')
    }
    const source = head(root)
    if (remoteCommit(root, 'refs/heads/main') !== source) {
        throw new Error('origin/main 已推进，停止生成主版本提交，请基于最新 main 重试')
    }
    const paths = ['pnpm-lock.yaml', '.changeset', MANIFEST, SUBMODULE]
    for (const { dir } of packages) {
        const path = relative(root, dir).split('\\').join('/')
        if (!path || path === '..' || path.startsWith('../')) throw new Error(`发布包不在主仓库内：${dir}`)
        // 子模块自己的文件已由候选提交记录，主仓库只记录其 gitlink。
        if (path === SUBMODULE || path.startsWith(`${SUBMODULE}/`)) continue
        paths.push(`${path}/package.json`, `${path}/CHANGELOG.md`)
    }
    const existingPaths = paths.filter(path => existsSync(join(root, path)) ||
        git(root, ['ls-files', '--error-unmatch', '--', path], { allowFailure: true }).status === 0)
    // --only 只使用列出的工作文件，不把用户已有的其他暂存条目混入提交。
    git(root, ['add', '-A', '--', ...existingPaths])
    git(root, ['commit', '--only', '-m', `chore: release v${version}`, '--', ...existingPaths])
    const sha = head(root)
    assertSource(root, manifest.submoduleSha)
    git(root, ['push', 'origin', 'HEAD:refs/heads/main'])
    if (remoteCommit(root, 'refs/heads/main') !== sha) throw new Error('主版本提交未能在 origin/main 确认，停止上传')
    return sha
}

/** 首次上传前冻结主提交；维修模式只接续已有批次。 */
export function beginRelease(root, version, subSha, { requirePending = false } = {}) {
    checkVersion(version)
    assertSource(root, subSha)
    const sha = head(root)
    const pending = remoteCommit(root, PENDING_REF)
    if (requirePending && !pending) throw new Error('维修模式要求已存在的 pending 冻结批次，禁止创建新 pending')
    if (pending && pending !== sha) throw new Error(`本次必须使用冻结提交 ${pending}`)
    const child = join(root, SUBMODULE)
    const branch = 'refs/heads/ccc3.0'
    const current = remoteCommit(child, branch)
    if (!current) throw new Error('FairyGUI 远端 ccc3.0 分支不存在')
    git(child, ['fetch', '--no-tags', 'origin', branch])
    const canFastForward = git(child, ['merge-base', '--is-ancestor', current, subSha], { allowFailure: true }).status === 0
    // 正式分支已包含该版本提交时可继续，发布来源仍固定为清单 SHA，不混入后代源码。
    const alreadyIncluded = git(child, ['merge-base', '--is-ancestor', subSha, current], { allowFailure: true }).status === 0
    if (!canFastForward && !alreadyIncluded) {
        throw new Error('FairyGUI ccc3.0 无法快进到本批次提交，必须协调源码后重新生成统一版本')
    }
    if (canFastForward && current !== subSha) git(child, ['push', 'origin', `${subSha}:${branch}`])
    if (remoteCommit(child, branch) !== (alreadyIncluded ? current : subSha)) throw new Error('FairyGUI ccc3.0 快进结果发生变化，停止上传')
    if (!pending) {
        git(root, ['push', 'origin', `--force-with-lease=${PENDING_REF}:`, `${sha}:${PENDING_REF}`])
    }
    if (remoteCommit(root, PENDING_REF) !== sha) throw new Error('发布来源冻结失败')
}

function ensureRemoteTag(root, version, sha) {
    const ref = `refs/tags/v${version}`
    const existing = remoteCommit(root, ref)
    if (existing && existing !== sha) throw new Error(`${ref} 已存在且指向其他提交，禁止覆盖`)
    if (!existing) git(root, ['push', 'origin', `${sha}:${ref}`])
    if (remoteCommit(root, ref) !== sha) throw new Error(`${ref} 推送后校验失败`)
}

/** 双仓标签均可验证后才能解除下一版本的门禁。 */
export function completeRelease(root, version, subSha) {
    checkVersion(version)
    assertSource(root, subSha)
    const sha = head(root)
    const pending = remoteCommit(root, PENDING_REF)
    if (pending !== sha) throw new Error('完成发布时的冻结提交不一致')
    ensureRemoteTag(join(root, SUBMODULE), version, subSha)
    ensureRemoteTag(root, version, sha)
    git(root, ['push', 'origin', `--force-with-lease=${PENDING_REF}:${sha}`, `:${PENDING_REF}`])
    if (remoteCommit(root, PENDING_REF)) throw new Error('发布已打标签，但冻结批次尚未清除')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        if (process.argv[2] !== 'select') throw new Error('用法：node scripts/release-git.mjs select')
        if (process.env.CI !== 'true') throw new Error('发布来源切换仅允许在 CI 中执行')
        selectReleaseSource()
    } catch (error) {
        console.error(error.message)
        process.exitCode = 1
    }
}
