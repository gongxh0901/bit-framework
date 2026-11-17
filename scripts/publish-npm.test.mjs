import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { RELEASE_PROTOCOL, publishRelease, runCommand } from './publish-npm.mjs'
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
    const calls = [], logs = []
    const state = { uploads: 0, begin: 0, complete: 0, sourceReads: 0, partialFailure: false, queryError: undefined,
        failLatest: undefined, failComplete: false, missingEntrypoint: false, corruptAfterUpload: false, packError: false,
        time: 0, waits: [], clockReads: 0, beginArguments: [] }
    const artifact = (dir, pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))) => {
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
        calls.push({ bin, args, cwd, sourceSha: env.GITHUB_SHA, time: state.time })
        assert.equal(env.npm_config_ignore_scripts, 'true')
        if (bin === 'npm' && args[0] === 'pack') {
            if (state.packError) return failure('EPACK')
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
            for (const flag of ['--prefer-online', '--prefer-offline=false', '--offline=false']) assert.ok(args.includes(flag))
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
    const options = { root: files.root, env: { CI: 'true', GITHUB_SHA: SOURCE_SHA }, runCommand, log: message => logs.push(message),
        now() { state.clockReads++; return state.time },
        async wait(milliseconds) { state.waits.push(milliseconds); state.time += milliseconds },
        visibilityTimeout: 40, tagVisibilityTimeout: 30, pollInterval: 10,
        sourceSha() { state.sourceReads++; return SOURCE_SHA },
        async beginRelease(root, version, submoduleSha) {
            files.restored()
            assert.deepEqual([root, version, submoduleSha], [files.root, VERSION, SUBMODULE_SHA])
            state.begin++
            state.beginArguments.push([...arguments])
        },
        async completeRelease() {
            files.restored()
            state.complete++
            if (state.failComplete) { state.failComplete = false; throw new Error('tag 推送失败') }
        } }
    async function seedRegistry() {
        for (const { dir, packageJson } of prepareNpmPackages(await getReleasePackages(files.root), { checkOnly: true })) {
            registry.set(packageJson.name, { ...packageJson, dist: artifact(dir, packageJson).dist })
            tags.set(`${packageJson.name}:release-candidate`, VERSION)
            tags.set(`${packageJson.name}:latest`, '0.9.0')
        }
        files.restored()
    }
    const latestChanges = () => calls.filter(({ bin, args }) => bin === 'npm' && args[0] === 'dist-tag' && args[3] === 'latest')
    return { state, registry, tags, calls, logs, options, latestChanges, success, failure, seedRegistry }
}

test('dry-run 只打包本地全部动态 workspace，不调用 Git 或 registry，并恢复原始清单', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const result = await publishRelease({ ...sim.options, env: {}, dryRun: true })
    assert.equal(result.packages.length, 3)
    assert.equal(sim.state.begin, 0)
    assert.equal(sim.state.complete, 0)
    assert.equal(sim.state.sourceReads, 0)
    assert.equal(sim.state.clockReads, 0)
    assert.deepEqual(sim.state.waits, [])
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

test('事件 SHA 缺失、格式无效或与冻结 HEAD 不同时，在打包及发布副作用前拒绝', async t => {
    for (const eventSha of [undefined, 'not-a-sha', 'b'.repeat(40)]) {
        const files = fixture(t)
        const sim = simulation(files)
        sim.options.env = { CI: 'true', ...(eventSha ? { GITHUB_SHA: eventSha } : {}) }
        await assert.rejects(publishRelease(sim.options), /必须从冻结版本提交启动新 workflow/)
        assert.equal(sim.calls.length, 0)
        assert.equal(sim.state.begin, 0)
        assert.equal(sim.state.complete, 0)
        assert.equal(sim.state.uploads, 0)
        assert.equal(sim.registry.size, 0)
        files.restored()
    }
})

test('事件与冻结 SHA 一致时原样继承 npm 环境，并返回已发布来源', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    sim.options.env = Object.freeze({ CI: 'true', GITHUB_SHA: SOURCE_SHA })
    const result = await publishRelease(sim.options)
    assert.equal(sim.state.sourceReads, 2)
    assert.equal(sim.state.beginArguments[0].length, 3)
    assert.ok(sim.calls.every(call => call.sourceSha === SOURCE_SHA))
    assert.deepEqual(sim.options.env, { CI: 'true', GITHUB_SHA: SOURCE_SHA })
    assert.deepEqual({ ...result, packages: [...result.packages].sort() }, { status: 'published', version: VERSION, sourceSha: SOURCE_SHA,
        submoduleSha: SUBMODULE_SHA, packages: files.manifest.packages.map(pkg => pkg.name).sort(), dryRun: false })
    files.restored()
})

test('prepareOnly 允许事件来源不同，完成全量 pack 和冻结而不查询上传或打标签', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    sim.options.env = { CI: 'true', GITHUB_SHA: 'b'.repeat(40) }
    const result = await publishRelease({ ...sim.options, prepareOnly: true })
    assert.deepEqual({ ...result, packages: [...result.packages].sort() }, { status: 'prepared', version: VERSION, sourceSha: SOURCE_SHA,
        submoduleSha: SUBMODULE_SHA, packages: files.manifest.packages.map(pkg => pkg.name).sort(), dryRun: false })
    assert.equal(sim.calls.length, 3)
    assert.ok(sim.calls.every(call => call.bin === 'npm' && call.args[0] === 'pack' && call.sourceSha === 'b'.repeat(40)))
    assert.equal(sim.state.begin, 1)
    assert.equal(sim.state.complete, 0)
    assert.equal(sim.state.uploads, 0)
    assert.equal(sim.registry.size, 0)
    assert.equal(sim.tags.size, 0)
    assert.equal(sim.state.clockReads, 0)
    assert.deepEqual(sim.state.waits, [])
    files.restored()
})

test('prepareOnly 打包失败时不冻结且恢复所有原始 manifest', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    sim.state.packError = true
    await assert.rejects(publishRelease({ ...sim.options, prepareOnly: true }), /EPACK/)
    assert.equal(sim.state.begin, 0)
    assert.equal(sim.state.complete, 0)
    assert.ok(sim.calls.every(call => call.args[0] === 'pack'))
    assert.equal(sim.state.uploads, 0)
    files.restored()
})

test('prepareOnly 只允许 CI，且不能与 dry-run 混用', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    await assert.rejects(publishRelease({ ...sim.options, env: {}, prepareOnly: true }), /只能在 CI/)
    await assert.rejects(publishRelease({ ...sim.options, prepareOnly: true, dryRun: true }), /不能同时使用/)
    assert.equal(sim.calls.length, 0)
    assert.equal(sim.state.begin, 0)
    assert.equal(sim.state.sourceReads, 0)
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

test('冻结过程中 HEAD 变化时禁止上传、准备或收尾成功', async t => {
    for (const mode of [{}, { prepareOnly: true }, { finalizeOnly: true }]) {
        const files = fixture(t)
        const sim = simulation(files)
        let reads = 0
        sim.options.sourceSha = () => ++reads === 1 ? SOURCE_SHA : 'd'.repeat(40)
        await assert.rejects(publishRelease({ ...sim.options, ...mode }), /HEAD 发生变化/)
        assert.equal(sim.state.uploads, 0)
        assert.equal(sim.latestChanges().length, 0)
        assert.equal(sim.state.complete, 0)
        assert.ok(sim.calls.every(call => call.args[0] === 'pack'))
        files.restored()
    }
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

const packageQuery = args => args[0] === 'view' && args[2] === '--json'
const packageName = args => args[1].slice(0, args[1].lastIndexOf('@'))

test('发布扫描期间暂时 E404 会等待可见，不重传或提前切换 latest', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const execute = sim.options.runCommand
    sim.options.runCommand = async (bin, args, options) => {
        const result = await execute(bin, args, options)
        if (packageQuery(args) && sim.state.uploads === 3 && sim.state.time < 20) return sim.failure('E404')
        return result
    }
    await publishRelease(sim.options)
    assert.deepEqual(sim.state.waits, [10, 10])
    assert.equal(sim.state.uploads, 3)
    assert.equal(sim.state.complete, 1)
    assert.ok(sim.latestChanges().every(call => call.time >= 20))
    assert.ok(sim.logs.some(message => message.includes('剩余包') && message.includes('秒后重试')))
    files.restored()
})

test('整批候选共享一个可见性窗口，持续 E404 超时不写标签或完成发布', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const execute = sim.options.runCommand
    sim.options.runCommand = async (bin, args, options) => {
        const result = await execute(bin, args, options)
        if (packageQuery(args) && sim.state.uploads === 3) {
            const delay = { '@fixture/base': 20, '@fixture/extra': Infinity, '@fixture/ui': 40 }[packageName(args)]
            if (sim.state.time < delay) return sim.failure('E404')
        }
        return result
    }
    await assert.rejects(publishRelease(sim.options), /@fixture\/extra@1\.0\.0: 等待 npm 发布扫描\/可见性超时.*冻结批次已保留/)
    assert.equal(sim.state.time, 40)
    assert.equal(sim.state.uploads, 3)
    assert.equal(sim.state.complete, 0)
    assert.ok(!sim.calls.some(call => call.args[0] === 'dist-tag'))
    files.restored()
})

test('可见性等待中的网络、鉴权、JSON、内容和精确引用错误立即停止', async t => {
    for (const fault of ['ETIMEDOUT', 'E401', 'json', 'integrity', 'dependencies']) {
        const files = fixture(t)
        const sim = simulation(files)
        const execute = sim.options.runCommand
        sim.options.runCommand = async (bin, args, options) => {
            const result = await execute(bin, args, options)
            if (!packageQuery(args) || sim.state.uploads !== 3) return result
            if (!sim.state.time) return sim.failure('E404')
            if (fault === 'ETIMEDOUT' || fault === 'E401') return sim.failure(fault)
            if (fault === 'json') return { status: 0, stdout: '{invalid-json', stderr: '' }
            const actual = JSON.parse(result.stdout)
            if (fault === 'integrity') actual.dist.integrity = 'sha512-wrong'
            else actual.peerDependencies = { '@fixture/base': '^1.0.0' }
            return sim.success(actual)
        }
        await assert.rejects(publishRelease(sim.options), /registry 查询失败|有效 JSON|integrity 不一致|内部精确引用/)
        assert.deepEqual(sim.state.waits, [10])
        assert.equal(sim.state.uploads, 3)
        assert.equal(sim.state.complete, 0)
        assert.ok(!sim.calls.some(call => call.args[0] === 'dist-tag'))
        files.restored()
    }
})

test('标签写入后读到旧值或空值会等待，每个标签只写入一次', async t => {
    for (const oldValue of [null, '0.9.0']) {
        const files = fixture(t)
        const sim = simulation(files)
        if (oldValue) sim.tags.set('@fixture/ui:latest', oldValue)
        const execute = sim.options.runCommand
        let staleReads = 0
        sim.options.runCommand = async (bin, args, options) => {
            const result = await execute(bin, args, options)
            if (args[0] === 'dist-tag' && args[2] === '@fixture/ui@1.0.0' && args[3] === 'latest') staleReads = 2
            if (args[0] === 'view' && args[1] === '@fixture/ui@1.0.0' && args[2] === 'dist-tags.latest' && staleReads-- > 0) {
                return sim.success(oldValue)
            }
            return result
        }
        await publishRelease(sim.options)
        assert.deepEqual(sim.state.waits, [10, 10])
        assert.equal(sim.latestChanges().filter(call => call.args[2] === '@fixture/ui@1.0.0').length, 1)
        assert.equal(sim.state.uploads, 3)
        assert.equal(sim.state.complete, 1)
        files.restored()
    }
})

test('整批标签共享等待窗口，其他标签收敛后只轮询持续旧值的标签', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const execute = sim.options.runCommand
    const stale = new Map()
    sim.options.runCommand = async (bin, args, options) => {
        const result = await execute(bin, args, options)
        if (args[0] === 'dist-tag' && args[3] === 'latest') stale.set(args[2], args[2] === '@fixture/ui@1.0.0' ? Infinity : 2)
        if (args[0] === 'view' && args[2] === 'dist-tags.latest' && stale.get(args[1]) > 0) {
            stale.set(args[1], stale.get(args[1]) - 1)
            return sim.success(null)
        }
        return result
    }
    await assert.rejects(publishRelease(sim.options), /latest 可见性等待超时.*冻结批次已保留/)
    assert.equal(sim.state.time, 30)
    const writes = sim.latestChanges().map(call => call.args[2])
    assert.equal(new Set(writes).size, writes.length)
    assert.equal(writes.length, 3)
    const lastRound = sim.calls.filter(call => call.time === 30 && call.args[0] === 'view')
    assert.deepEqual(lastRound.map(call => [call.args[1], call.args[2]]), [['@fixture/ui@1.0.0', 'dist-tags.latest']])
    assert.equal(sim.state.uploads, 3)
    assert.equal(sim.state.complete, 0)
    files.restored()
})

test('标签回读的鉴权错误立即停止，不反复写入或等待到超时', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const execute = sim.options.runCommand
    let added = false
    sim.options.runCommand = async (bin, args, options) => {
        const result = await execute(bin, args, options)
        if (args[0] === 'dist-tag' && args[3] === 'latest') added = true
        if (args[0] === 'view' && args[2] === 'dist-tags.latest' && added) {
            return sim.state.time ? sim.failure('E401') : sim.success(null)
        }
        return result
    }
    await assert.rejects(publishRelease(sim.options), /E401/)
    assert.deepEqual(sim.state.waits, [10])
    assert.equal(sim.latestChanges().length, 3)
    assert.equal(new Set(sim.latestChanges().map(call => call.args[2])).size, 3)
    assert.equal(sim.state.complete, 0)
    files.restored()
})

test('最终证据读取短暂 E404 和旧标签时只轮询，不重新上传或写标签', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const execute = sim.options.runCommand
    let metadataReads = 1, tagReads = 1, finalMetadataQueried = false
    sim.options.runCommand = async (bin, args, options) => {
        const result = await execute(bin, args, options)
        const allLatest = files.manifest.packages.every(pkg => sim.tags.get(`${pkg.name}:latest`) === VERSION)
        if (allLatest && packageQuery(args)) {
            finalMetadataQueried = true
            if (metadataReads-- > 0) return sim.failure('E404')
        }
        if (allLatest && finalMetadataQueried && args[0] === 'view' && args[1] === '@fixture/base@1.0.0' && args[2] === 'dist-tags.latest' && tagReads-- > 0) {
            return sim.success('0.9.0')
        }
        return result
    }
    await publishRelease(sim.options)
    assert.deepEqual(sim.state.waits, [10, 10])
    assert.equal(sim.state.uploads, 3)
    assert.equal(sim.latestChanges().length, 3)
    assert.equal(sim.state.complete, 1)
    files.restored()
})

test('最终候选核验沿用最初可见性截止时间，不获得第二个完整窗口', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    const execute = sim.options.runCommand
    sim.options.runCommand = async (bin, args, options) => {
        const result = await execute(bin, args, options)
        if (packageQuery(args) && sim.state.uploads === 3) {
            const allLatest = files.manifest.packages.every(pkg => sim.tags.get(`${pkg.name}:latest`) === VERSION)
            if (sim.state.time < 30 || allLatest) return sim.failure('E404')
        }
        return result
    }
    await assert.rejects(publishRelease(sim.options), /扫描\/可见性超时/)
    assert.equal(sim.state.time, 40)
    assert.equal(sim.state.uploads, 3)
    assert.equal(sim.state.complete, 0)
    files.restored()
})

test('仅收尾允许不同的有效事件 SHA，原样继承环境且零上传完成整批验证', async t => {
    assert.ok(RELEASE_PROTOCOL >= 3)
    const files = fixture(t)
    const sim = simulation(files)
    await sim.seedRegistry()
    sim.options.env = Object.freeze({ CI: 'true', GITHUB_SHA: 'b'.repeat(40) })
    const result = await publishRelease({ ...sim.options, finalizeOnly: true })
    assert.deepEqual({ ...result, packages: [...result.packages].sort() }, { status: 'finalized', version: VERSION,
        sourceSha: SOURCE_SHA, submoduleSha: SUBMODULE_SHA,
        packages: files.manifest.packages.map(pkg => pkg.name).sort(), dryRun: false })
    assert.deepEqual(sim.state.beginArguments, [[files.root, VERSION, SUBMODULE_SHA, { requirePending: true }]])
    assert.equal(sim.state.uploads, 0)
    assert.ok(!sim.calls.some(call => call.args[0] === 'publish'))
    assert.ok(sim.calls.every(call => call.sourceSha === 'b'.repeat(40)))
    assert.deepEqual(sim.options.env, { CI: 'true', GITHUB_SHA: 'b'.repeat(40) })
    assert.equal(sim.state.complete, 1)
    assert.ok(files.manifest.packages.every(pkg => sim.tags.get(`${pkg.name}:latest`) === VERSION))
    const firstTag = sim.calls.findIndex(call => call.args[0] === 'dist-tag')
    const verified = sim.calls.slice(0, firstTag).filter(call => packageQuery(call.args)).map(call => packageName(call.args))
    assert.deepEqual([...new Set(verified)].sort(), files.manifest.packages.map(pkg => pkg.name).sort())
    files.restored()
})

test('仅收尾遇缺包、内容冲突或查询错误时立即停止，不等待、不写标签、不补发', async t => {
    for (const fault of ['missing', 'integrity', 'dependencies', 'auth', 'invalid', 'json']) {
        const files = fixture(t)
        const sim = simulation(files)
        await sim.seedRegistry()
        if (fault === 'missing') sim.registry.delete('@fixture/extra')
        if (fault === 'integrity') sim.registry.get('@fixture/extra').dist.integrity = 'sha512-wrong'
        if (fault === 'dependencies') sim.registry.get('@fixture/ui').peerDependencies['@fixture/base'] = '^1.0.0'
        if (fault === 'auth') sim.state.queryError = 'E401'
        if (fault === 'invalid' || fault === 'json') {
            const execute = sim.options.runCommand
            sim.options.runCommand = async (bin, args, options) => {
                const result = await execute(bin, args, options)
                if (packageQuery(args)) return { status: 0, stdout: fault === 'json' ? '{invalid-json' : 'null', stderr: '' }
                return result
            }
        }
        await assert.rejects(publishRelease({ ...sim.options, finalizeOnly: true }),
            /收尾维修缺少已发布目标包|integrity 不一致|内部精确引用|registry 查询失败|有效包清单|有效 JSON/)
        assert.deepEqual(sim.state.waits, [])
        assert.equal(sim.state.uploads, 0)
        assert.equal(sim.state.complete, 0)
        assert.ok(!sim.calls.some(call => ['publish', 'dist-tag'].includes(call.args[0])))
        files.restored()
    }
})

test('仅收尾必须有有效事件 SHA 和 CI 环境，三种模式互斥', async t => {
    for (const eventSha of [undefined, 'invalid', 'g'.repeat(40)]) {
        const files = fixture(t)
        const sim = simulation(files)
        sim.options.env = { CI: 'true', ...(eventSha ? { GITHUB_SHA: eventSha } : {}) }
        await assert.rejects(publishRelease({ ...sim.options, finalizeOnly: true }), /有效的 40 位 GITHUB_SHA/)
        assert.equal(sim.calls.length, 0)
        assert.equal(sim.state.sourceReads, 0)
    }
    const files = fixture(t)
    const sim = simulation(files)
    await assert.rejects(publishRelease({ ...sim.options, env: { GITHUB_SHA: SOURCE_SHA }, finalizeOnly: true }), /只能在 CI/)
    for (const mode of [{ dryRun: true, finalizeOnly: true }, { prepareOnly: true, finalizeOnly: true },
        { dryRun: true, prepareOnly: true, finalizeOnly: true }]) {
        await assert.rejects(publishRelease({ ...sim.options, ...mode }), /不能同时使用/)
    }
    assert.equal(sim.calls.length, 0)
    assert.equal(sim.state.begin, 0)
    files.restored()
})

test('仅收尾的 requirePending 拒绝时不回退重建批次或操作 registry', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    sim.options.beginRelease = async (...args) => {
        assert.deepEqual(args, [files.root, VERSION, SUBMODULE_SHA, { requirePending: true }])
        throw new Error('冻结批次已取消，拒绝收尾')
    }
    await assert.rejects(publishRelease({ ...sim.options, finalizeOnly: true }), /冻结批次已取消/)
    assert.ok(sim.calls.every(call => call.args[0] === 'pack'))
    assert.equal(sim.state.uploads, 0)
    assert.equal(sim.state.complete, 0)
    files.restored()
})

test('仅收尾标签回读延迟仍只写一次，等待后完成且始终不上传', async t => {
    const files = fixture(t)
    const sim = simulation(files)
    await sim.seedRegistry()
    const execute = sim.options.runCommand
    let staleReads = 0
    sim.options.runCommand = async (bin, args, options) => {
        const result = await execute(bin, args, options)
        if (args[0] === 'dist-tag' && args[2] === '@fixture/ui@1.0.0' && args[3] === 'latest') staleReads = 2
        if (args[0] === 'view' && args[1] === '@fixture/ui@1.0.0' && args[2] === 'dist-tags.latest' && staleReads-- > 0) {
            return sim.success('0.9.0')
        }
        return result
    }
    const result = await publishRelease({ ...sim.options, finalizeOnly: true })
    assert.equal(result.status, 'finalized')
    assert.deepEqual(sim.state.waits, [10, 10])
    assert.equal(sim.latestChanges().filter(call => call.args[2] === '@fixture/ui@1.0.0').length, 1)
    assert.equal(sim.state.uploads, 0)
    assert.equal(sim.state.complete, 1)
    assert.ok(!sim.calls.some(call => call.args[0] === 'publish'))
    files.restored()
})

test('全部标签均延迟两轮时并行收敛，回读预算从最后一次写入后开始', async t => {
    for (const finalizeOnly of [false, true]) {
        const files = fixture(t)
        const sim = simulation(files)
        if (finalizeOnly) await sim.seedRegistry()
        const execute = sim.options.runCommand
        const stale = new Map()
        sim.options.runCommand = async (bin, args, options) => {
            const result = await execute(bin, args, options)
            if (args[0] === 'dist-tag') {
                assert.deepEqual(sim.state.waits, [])
                stale.set(`${args[2]}:${args[3]}`, 2)
                sim.state.time += 5
            }
            if (args[0] === 'view' && args[2].startsWith('dist-tags.')) {
                const key = `${args[1]}:${args[2].slice('dist-tags.'.length)}`
                if (!stale.has(key)) return sim.success('0.9.0')
                if (stale.get(key) > 0) {
                    stale.set(key, stale.get(key) - 1)
                    return sim.success('0.9.0')
                }
            }
            return result
        }
        const result = await publishRelease({ ...sim.options, finalizeOnly })
        assert.equal(result.status, finalizeOnly ? 'finalized' : 'published')
        assert.deepEqual(sim.state.waits, [10, 10])
        assert.equal(sim.state.time, 50)
        const writes = sim.calls.filter(call => call.args[0] === 'dist-tag')
        assert.equal(writes.length, 6)
        assert.equal(new Set(writes.map(call => `${call.args[2]}:${call.args[3]}`)).size, 6)
        assert.equal(sim.state.uploads, finalizeOnly ? 0 : 3)
        assert.equal(sim.state.complete, 1)
        files.restored()
    }
})
