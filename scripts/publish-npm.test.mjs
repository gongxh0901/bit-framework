import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { publishRelease, runCommand } from './publish-npm.mjs'
import { prepareNpmPackages } from './prepare-npm-publish.mjs'
import { getReleasePackages } from './release-workspace.mjs'

const VERSION = '1.0.0'
const SUBMODULE_SHA = 'a'.repeat(40)
const SOURCE_SHA = 'c'.repeat(40)

function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'bit-publisher-test-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'release-fixture', private: true }))
    writeFileSync(join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
    const dirs = ['base', 'ui', 'extra'].map(name => join(root, 'packages', name))
    const originals = new Map()
    for (const [index, dir] of dirs.entries()) {
        mkdirSync(join(dir, 'dist'), { recursive: true })
        const pkg = { name: `@fixture/${['base', 'ui', 'extra'][index]}`, version: VERSION,
            main: './dist/index.js', files: ['dist'], publishConfig: { registry: 'https://registry.npmjs.org/' } }
        if (index === 1) {
            pkg.peerDependencies = { '@fixture/base': 'workspace:*' }
            pkg.devDependencies = { '@fixture/base': 'workspace:*', typescript: '^5.0.0' }
        }
        const raw = JSON.stringify(pkg, null, 4) + '\n'
        writeFileSync(join(dir, 'package.json'), raw)
        originals.set(join(dir, 'package.json'), raw)
        writeFileSync(join(dir, 'dist', 'index.js'), `export const value = ${index}\n`)
    }
    mkdirSync(join(root, '.release'))
    const manifest = { version: VERSION, submoduleSha: SUBMODULE_SHA,
        packages: dirs.map(dir => ({ name: JSON.parse(readFileSync(join(dir, 'package.json'))).name, dir: relative(root, dir) })) }
    writeFileSync(join(root, '.release', 'manifest.json'), JSON.stringify(manifest))
    return { root, dirs, originals, manifest,
        restored() { for (const [path, raw] of originals) assert.equal(readFileSync(path, 'utf8'), raw) } }
}

function simulation(files) {
    const registry = new Map()
    const tags = new Map()
    const calls = []
    const state = { uploads: 0, begin: 0, complete: 0, sourceReads: 0, partialFailure: false, queryError: undefined,
        failLatest: undefined, failComplete: false, missingEntrypoint: false, corruptAfterUpload: false }
    const artifact = dir => {
        const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
        const contents = Buffer.from(JSON.stringify({ pkg, code: readFileSync(join(dir, 'dist', 'index.js'), 'utf8') }))
        return { pkg, contents, dist: { integrity: `sha512-${createHash('sha512').update(contents).digest('base64')}`,
            shasum: createHash('sha1').update(contents).digest('hex') } }
    }
    const success = value => ({ status: 0, stdout: JSON.stringify(value), stderr: '' })
    const failure = code => ({ status: 1, stdout: JSON.stringify({ error: { code } }), stderr: `npm error code ${code}\n` })
    function upload(contents) {
        const { pkg } = JSON.parse(contents.toString())
        const dist = { integrity: `sha512-${createHash('sha512').update(contents).digest('base64')}`,
            shasum: createHash('sha1').update(contents).digest('hex') }
        registry.set(pkg.name, { ...pkg, dist })
        tags.set(`${pkg.name}:release-candidate`, VERSION)
    }
    async function runCommand(bin, args, { cwd, env }) {
        calls.push({ bin, args, cwd, sourceSha: env.GITHUB_SHA })
        assert.equal(env.npm_config_ignore_scripts, 'true')
        if (state.sourceReads) assert.equal(env.GITHUB_SHA, SOURCE_SHA)
        if (bin === 'npm' && args[0] === 'pack') {
            const { pkg, contents } = artifact(cwd)
            const filename = pkg.name.replace('@', '').replace('/', '-') + '.tgz'
            writeFileSync(join(args[args.indexOf('--pack-destination') + 1], filename), contents)
            return success([{ filename, files: [{ path: 'package.json' }, ...(state.missingEntrypoint ? [] : [{ path: 'dist/index.js' }])] }])
        }
        files.restored()
        if (bin === 'npm' && args[0] === 'publish') {
            assert.deepEqual(args.slice(2), ['--tag', 'release-candidate', '--access', 'public', '--provenance', '--ignore-scripts', '--registry=https://registry.npmjs.org/'])
            state.uploads++
            upload(readFileSync(args[1]))
            if (state.partialFailure) {
                state.partialFailure = false
                return failure('EPUBLISH')
            }
            if (state.corruptAfterUpload) registry.values().next().value.dist.integrity = 'sha512-invalid'
            return success({ published: true })
        }
        if (bin === 'npm' && args[0] === 'view') {
            if (state.queryError) return failure(state.queryError)
            const explicitVersion = args[1].endsWith(`@${VERSION}`)
            const name = explicitVersion ? args[1].slice(0, args[1].lastIndexOf('@')) : args[1]
            if (args[2].startsWith('dist-tags.')) {
                // npm 裸包名默认查询 latest，首次只发 candidate 时会返回空。
                if (!explicitVersion && !tags.has(`${name}:latest`)) return { status: 0, stdout: '', stderr: '' }
                return success(tags.get(`${name}:${args[2].slice('dist-tags.'.length)}`) ?? null)
            }
            return registry.has(name) ? success(registry.get(name)) : failure('E404')
        }
        if (bin === 'npm' && args[0] === 'dist-tag') {
            const name = args[2].slice(0, args[2].lastIndexOf('@'))
            if (args[3] === 'latest' && state.failLatest === name) {
                state.failLatest = undefined
                return failure('E403')
            }
            tags.set(`${name}:${args[3]}`, VERSION)
            return success(true)
        }
        assert.fail(`未模拟的命令：${bin} ${args.join(' ')}`)
    }
    const options = { root: files.root, env: { CI: 'true', GITHUB_SHA: 'b'.repeat(40) }, runCommand, log() {},
        sourceSha() { state.sourceReads++; return SOURCE_SHA },
        async beginRelease(root, version, submoduleSha) {
            files.restored()
            assert.deepEqual([root, version, submoduleSha], [files.root, VERSION, SUBMODULE_SHA])
            state.begin++
        },
        async completeRelease() {
            files.restored()
            state.complete++
            if (state.failComplete) { state.failComplete = false; throw new Error('tag 推送失败') }
        } }
    const latestChanges = () => calls.filter(({ bin, args }) => bin === 'npm' && args[0] === 'dist-tag' && args[3] === 'latest')
    return { state, registry, tags, calls, options, latestChanges }
}

test('dry-run 只打包本地全部动态 workspace，不调用 Git 或 registry，并恢复原始清单', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const result = await publishRelease({ ...sim.options, env: {}, dryRun: true })
    assert.equal(result.packages.length, 3)
    assert.equal(sim.state.begin, 0)
    assert.equal(sim.state.complete, 0)
    assert.equal(sim.state.sourceReads, 0)
    assert.equal(sim.calls.length, 3)
    assert.ok(sim.calls.every(({ bin, args }) => bin === 'npm' && args[0] === 'pack'))
    files.restored()
})

test('真实 npm 本地打包可重复，精确依赖转换不污染源码清单', async t => {
    const files = fixture(t)
    const hashes = []
    const execute = (bin, args, options) => {
        assert.equal(bin, 'npm')
        assert.equal(args[0], 'pack')
        const result = runCommand(bin, args, options)
        if (result.status === 0) hashes.push(JSON.parse(result.stdout)[0].integrity)
        return result
    }
    for (let attempt = 0; attempt < 2; attempt++) {
        await publishRelease({ root: files.root, dryRun: true, runCommand: execute, log() {} })
        files.restored()
    }
    assert.deepEqual(hashes.slice(0, 3), hashes.slice(3))
})

test('本地 dry-run 不依赖 CI 发布清单；真实发布缺清单时先失败', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    unlinkSync(join(files.root, '.release', 'manifest.json'))
    await assert.rejects(publishRelease(sim.options), /缺少 .release\/manifest.json/)
    assert.equal(sim.calls.length, 0)
    assert.equal(sim.state.begin, 0)
    await publishRelease({ ...sim.options, dryRun: true })
    assert.equal(sim.calls.length, 3)
    assert.equal(sim.state.begin, 0)
    files.restored()
})

test('开发期 dry-run 使用当前 workspace，不受已完成旧批次清单影响', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    writeFileSync(join(files.root, '.release', 'manifest.json'), JSON.stringify({ version: '0.9.0', packages: [] }))
    await publishRelease({ ...sim.options, dryRun: true })
    assert.equal(sim.calls.length, 3)
    files.restored()
})

test('checkOnly 在内存转换精确 peer 并移除内部开发引用，不改文件', async t => {
    const files = fixture(t)
    const prepared = prepareNpmPackages(await getReleasePackages(files.root), { checkOnly: true })
    const ui = prepared.find(({ packageJson }) => packageJson.name === '@fixture/ui').packageJson
    assert.equal(ui.peerDependencies['@fixture/base'], VERSION)
    assert.deepEqual(ui.devDependencies, { typescript: '^5.0.0' })
    files.restored()
})

test('本地真实发布和清单漂移都在任何外部动作前拒绝', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    await assert.rejects(publishRelease({ ...sim.options, env: {} }), /只能在 CI/)
    files.manifest.packages.pop()
    writeFileSync(join(files.root, '.release', 'manifest.json'), JSON.stringify(files.manifest))
    await assert.rejects(publishRelease(sim.options), /包集合不一致/)
    assert.equal(sim.calls.length, 0)
    assert.equal(sim.state.begin, 0)
})

test('候选上传部分失败不修改任何 latest；同版重试补齐并完成', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    sim.state.partialFailure = true
    await assert.rejects(publishRelease(sim.options), /EPUBLISH/)
    assert.equal(sim.registry.size, 1)
    assert.equal(sim.latestChanges().length, 0)
    assert.equal(sim.state.complete, 0)
    files.restored()
    await publishRelease(sim.options)
    assert.equal(sim.registry.size, 3)
    assert.equal(sim.state.uploads, 3)
    assert.equal(sim.latestChanges().length, 3)
    assert.equal(sim.state.complete, 1)
    const firstLatest = sim.calls.findIndex(({ args }) => args[0] === 'dist-tag' && args[3] === 'latest')
    const lastUpload = sim.calls.findLastIndex(({ bin, args }) => bin === 'npm' && args[0] === 'publish')
    assert.ok(firstLatest > lastUpload)
    files.restored()
})

test('所有 npm 子进程使用冻结 HEAD 的 provenance SHA，覆盖触发事件的新提交', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    await publishRelease(sim.options)
    assert.equal(sim.state.sourceReads, 2)
    assert.ok(sim.calls.every(call => call.sourceSha === SOURCE_SHA))
    assert.equal(sim.options.env.GITHUB_SHA, 'b'.repeat(40))
    files.restored()
})

test('首次 candidate 发布没有 latest 时，标签查询按显式版本完成提升', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    assert.equal(sim.tags.size, 0)
    await publishRelease(sim.options)
    const tagQueries = sim.calls.filter(({ args }) => args[0] === 'view' && args[2].startsWith('dist-tags.'))
    assert.ok(tagQueries.length > 0)
    assert.ok(tagQueries.every(({ args }) => args[1].endsWith(`@${VERSION}`)))
    for (const { name } of files.manifest.packages) assert.equal(sim.tags.get(`${name}:latest`), VERSION)
    assert.equal(sim.state.complete, 1)
    files.restored()
})

test('冻结过程中 HEAD 变化时禁止任何候选上传', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    let reads = 0
    sim.options.sourceSha = () => ++reads === 1 ? SOURCE_SHA : 'd'.repeat(40)
    await assert.rejects(publishRelease(sim.options), /HEAD 发生变化/)
    assert.equal(sim.state.uploads, 0)
    assert.equal(sim.latestChanges().length, 0)
    files.restored()
})

test('只有明确 E404 可以视为未发布；网络或鉴权错误阻止上传和 latest', async t => {
    for (const code of ['ETIMEDOUT', 'E401', 'E500']) {
        const files = fixture(t)
        const sim = simulation(files)
        sim.state.queryError = code
        await assert.rejects(publishRelease(sim.options), /registry 查询失败/)
        assert.equal(sim.state.uploads, 0)
        assert.equal(sim.latestChanges().length, 0)
        files.restored()
    }
})

test('registry 的成功空响应不能当作未发布继续上传', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const execute = sim.options.runCommand
    sim.options.runCommand = (bin, args, options) => {
        if (bin === 'npm' && args[0] === 'view') return { status: 0, stdout: 'null', stderr: '' }
        return execute(bin, args, options)
    }
    await assert.rejects(publishRelease(sim.options), /没有返回有效包清单/)
    assert.equal(sim.state.uploads, 0)
    assert.equal(sim.latestChanges().length, 0)
    files.restored()
})

test('同版本已有包的内部引用或 integrity 不一致时拒绝补发', async t => {
    for (const damage of ['dependencies', 'integrity']) {
        const files = fixture(t)
        const sim = simulation(files)
        sim.state.partialFailure = true
        await assert.rejects(publishRelease(sim.options), /EPUBLISH/)
        const existing = sim.registry.values().next().value
        if (damage === 'dependencies') existing.peerDependencies = { '@fixture/base': '^1.0.0' }
        else existing.dist.integrity = 'sha512-wrong'
        const uploadCount = sim.state.uploads
        await assert.rejects(publishRelease(sim.options), damage === 'dependencies' ? /精确引用/ : /integrity 不一致/)
        assert.equal(sim.state.uploads, uploadCount)
        assert.equal(sim.latestChanges().length, 0)
        files.restored()
    }
})

test('上传返回成功后仍会核验所有候选内容，损坏产物不会 promote', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    sim.state.corruptAfterUpload = true
    await assert.rejects(publishRelease(sim.options), /integrity 不一致/)
    assert.equal(sim.latestChanges().length, 0)
    assert.equal(sim.state.complete, 0)
    files.restored()
})

test('latest 切换中途失败后只补齐未完成的切换，不重新上传已有版本', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    sim.state.failLatest = '@fixture/ui'
    await assert.rejects(publishRelease(sim.options), /E403/)
    assert.equal(sim.state.complete, 0)
    await publishRelease(sim.options)
    assert.equal(sim.state.uploads, 3)
    assert.equal(sim.state.complete, 1)
    assert.equal(sim.tags.get('@fixture/ui:latest'), VERSION)
    files.restored()
})

test('dist-tag 查询的无效对象不会被当成缺失标签继续修改 latest', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const execute = sim.options.runCommand
    sim.options.runCommand = (bin, args, options) => {
        if (bin === 'npm' && args[0] === 'view' && args[2] === 'dist-tags.latest') {
            return { status: 0, stdout: '{"unexpected":"value"}', stderr: '' }
        }
        return execute(bin, args, options)
    }
    await assert.rejects(publishRelease(sim.options), /不是有效版本号/)
    assert.equal(sim.latestChanges().length, 0)
    assert.equal(sim.state.complete, 0)
    files.restored()
})

test('双仓 tag 收尾失败后保留同版重试，不重新上传或切换已完成 latest', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    sim.state.failComplete = true
    await assert.rejects(publishRelease(sim.options), /tag 推送失败/)
    const latestCount = sim.latestChanges().length
    await publishRelease(sim.options)
    assert.equal(sim.state.uploads, 3)
    assert.equal(sim.latestChanges().length, latestCount)
    assert.equal(sim.state.complete, 2)
    files.restored()
})

test('缺失构建入口会在建立远端 pending 之前拒绝', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    sim.state.missingEntrypoint = true
    await assert.rejects(publishRelease(sim.options), /打包清单缺少入口/)
    assert.equal(sim.state.begin, 0)
    assert.equal(sim.state.uploads, 0)
    files.restored()
})
