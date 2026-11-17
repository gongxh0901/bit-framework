import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { requestPublish } from './publish.mjs'

const HEAD = 'a'.repeat(40)
const PUBLISHED_HEAD = 'b'.repeat(40)
const CHILD_HEAD = 'c'.repeat(40)
const REQUEST_ID = 'test-request-123'
const TITLE = `Unified release · ${REQUEST_ID}`
const URL = 'https://github.com/gongxh0901/bit-framework/actions/runs/42'

function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'bit-publish-entry-test-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const calls = [], logs = []
    const state = { newChangesets: true, hasNewRelease: false, prepareError: '', prepareFinished: false, preparedSha: HEAD,
        watchFailure: false, runFailure: false,
        visibleAfter: 1, lists: 0, duplicates: false, noArtifact: false, badTag: false,
        actualVersion: '1.0.0', none: false, malformedResult: false,
        dispatchedHead: HEAD, followupHead: HEAD, followupQueryError: false, authFailure: false, batchVersions: undefined,
        secondWatchFailure: false, secondNone: false, dispatchCount: 0, requestCount: 0, activeRequestId: REQUEST_ID,
        prepareCalls: 0, planCalls: 0, packCalls: 0, ticks: 0 }
    const ok = value => ({ status: 0, stdout: typeof value === 'string' ? value : JSON.stringify(value), stderr: '' })
    async function runCommand(bin, args, options) {
        calls.push({ bin, args, options })
        if (bin === 'gh') {
            if (args[0] === '--version') return ok('gh version 2.85.0')
            if (args[0] === 'auth') {
                assert.deepEqual(args, ['auth', 'status', '--hostname', 'github.com'])
                return state.authFailure ? { status: 1, stdout: '', stderr: 'gh 未登录' } : ok('')
            }
            if (args[0] === 'api') {
                if (args[1].endsWith('/git/ref/heads/main')) return state.followupQueryError
                    ? { status: 1, stdout: '', stderr: 'GitHub 查询失败' }
                    : ok({ object: { type: 'commit', sha: state.followupHead } })
                if (args[1].includes('/git/ref/tags/')) {
                    const sha = args[1].includes('/bit-framework/') ? PUBLISHED_HEAD : CHILD_HEAD
                    return ok({ object: { type: 'commit', sha: state.badTag ? HEAD : sha } })
                }
            }
            if (args[0] === 'workflow') {
                state.dispatchCount++
                state.activeRequestId = state.dispatchCount === 1 ? REQUEST_ID : `${REQUEST_ID}-${state.dispatchCount}`
                assert.deepEqual(args, ['workflow', 'run', 'publish.yml', '--ref', 'main', '-f', `request_id=${state.activeRequestId}`, '-f', `requested_sha=${state.preparedSha}`, '--repo', 'gongxh0901/bit-framework'])
                assert.equal(state.packCalls, 1)
                assert.equal(state.prepareFinished, true)
                return ok('')
            }
            if (args[0] === 'run' && args[1] === 'list') {
                state.lists++
                const unrelated = { databaseId: 99, displayTitle: 'Unified release · unrelated', headSha: HEAD, url: 'unrelated' }
                const selected = { databaseId: 41 + state.dispatchCount, displayTitle: `Unified release · ${state.activeRequestId}`,
                    headSha: state.dispatchedHead, url: URL.replace('/42', `/${41 + state.dispatchCount}`) }
                return ok(state.lists < state.visibleAfter ? [unrelated] : [unrelated, selected, ...(state.duplicates ? [selected] : [])])
            }
            if (args[0] === 'run' && args[1] === 'watch') {
                assert.equal(args[2], String(41 + state.dispatchCount))
                return state.watchFailure || (state.secondWatchFailure && state.dispatchCount === 2)
                    ? { status: 1, stdout: '', stderr: 'workflow failed' } : ok('')
            }
            if (args[0] === 'run' && args[1] === 'view') {
                assert.equal(args[2], String(41 + state.dispatchCount))
                return ok({ databaseId: 41 + state.dispatchCount, displayTitle: `Unified release · ${state.activeRequestId}`,
                    status: 'completed', conclusion: state.runFailure ? 'failure' : 'success', url: URL.replace('/42', `/${41 + state.dispatchCount}`) })
            }
            if (args[0] === 'run' && args[1] === 'download') {
                assert.equal(args[2], String(41 + state.dispatchCount))
                assert.equal(args[args.indexOf('--name') + 1], 'release-result')
                if (!state.noArtifact) {
                    const result = state.none || (state.secondNone && state.dispatchCount === 2) ? { status: 'none' }
                        : { status: 'published', version: state.batchVersions?.[state.dispatchCount - 1] || state.actualVersion,
                        sourceSha: PUBLISHED_HEAD, submoduleSha: CHILD_HEAD, packages: ['@fixture/a', '@fixture/b'] }
                    if (state.malformedResult) delete result.submoduleSha
                    writeFileSync(join(args[args.indexOf('--dir') + 1], 'release-result.json'), JSON.stringify(result))
                }
                return ok('')
            }
        }
        assert.fail(`不允许的命令：${bin} ${args.join(' ')}`)
    }
    const options = { root, env: {}, runCommand,
        async prepareSources(preparation) {
            state.prepareCalls++
            assert.equal(preparation.root, root)
            assert.equal(preparation.env, options.env)
            assert.equal(preparation.runCommand, runCommand)
            assert.equal(preparation.planVersion, options.planVersion)
            assert.equal(preparation.preflight, options.preflight)
            if (state.prepareError) throw new Error(state.prepareError)
            const plan = await preparation.planVersion(root)
            await preparation.preflight({ root, dryRun: true, log: preparation.log })
            state.prepareFinished = true
            return { requestedSha: state.preparedSha, plan, hasNewRelease: state.hasNewRelease }
        },
        async planVersion(directory) {
            assert.equal(directory, root)
            state.planCalls++
            return { version: '2.0.0', plan: { releases: state.newChangesets ? [{ name: '@fixture/a' }] : [] } }
        },
        async preflight(options) {
            assert.equal(options.root, root)
            assert.equal(options.dryRun, true)
            state.packCalls++
        },
        createRequestId() { state.requestCount++; return state.requestCount === 1 ? REQUEST_ID : `${REQUEST_ID}-${state.requestCount}` },
        now: () => state.ticks,
        async wait(milliseconds) { state.ticks += milliseconds },
        dispatchTimeout: 20, pollInterval: 5,
        log(message) { logs.push(message) } }
    const dispatches = () => calls.filter(({ bin, args }) => bin === 'gh' && args[0] === 'workflow')
    return { state, calls, logs, options, dispatches }
}

test('按请求标识关联精确 run，并报告 CI 实际旧批次版本和双仓 tag', async t => {
    const f = fixture(t)
    f.state.visibleAfter = 3
    const result = await requestPublish(f.options)
    assert.equal(result.version, '1.0.0')
    assert.equal(result.runId, '42')
    assert.equal(f.state.planCalls, 1)
    assert.equal(f.dispatches().length, 1)
    assert.equal(f.state.lists, 3)
    assert.match(f.logs.at(-1), /版本 1.0.0 的 2 个包已完成发布/)
    assert.ok(!f.calls.some(({ bin, args }) => bin === 'git' && ['add', 'commit', 'push'].includes(args[0])))
    assert.ok(!f.calls.some(({ bin }) => bin === 'npm' || bin === 'pnpm' || bin === 'mise'))
})

test('CI 不能递归调用本地入口', async t => {
    const f = fixture(t)
    await assert.rejects(requestPublish({ ...f.options, env: { CI: 'true' } }), /禁止递归/)
    assert.equal(f.calls.length, 0)
})

test('gh 未登录时在任何源码准备或提交之前停止', async t => {
    const f = fixture(t)
    f.state.authFailure = true
    await assert.rejects(requestPublish(f.options), /gh 未登录/)
    assert.equal(f.state.prepareCalls, 0)
    assert.equal(f.dispatches().length, 0)
})

test('工作流使用源码准备提交推送后的新 SHA，不读取准备前的旧 HEAD', async t => {
    const f = fixture(t)
    f.state.preparedSha = 'd'.repeat(40)
    f.state.dispatchedHead = f.state.preparedSha
    await requestPublish(f.options)
    assert.equal(f.dispatches().length, 1)
    assert.ok(f.dispatches()[0].args.includes(`requested_sha=${f.state.preparedSha}`))
})

test('源码准备的检查、Changeset、提交或推送失败时均不调度 CI', async t => {
    for (const message of ['主仓库必须在 main', 'Changeset 交互已取消', '源码预检失败', '子仓库提交失败', '主仓库推送失败']) {
        const f = fixture(t)
        f.state.prepareError = message
        await assert.rejects(requestPublish(f.options), error => error.message === message)
        assert.equal(f.dispatches().length, 0)
        assert.equal(f.state.packCalls, 0)
    }
})

test('源码准备返回无效提交时拒绝调度', async t => {
    const f = fixture(t)
    f.state.preparedSha = 'invalid'
    await assert.rejects(requestPublish(f.options), /没有返回有效提交和统一版本计划/)
    assert.equal(f.dispatches().length, 0)
})

test('没有新 Changeset 仍调度 CI 检查 pending，none 结果不能报告发布成功', async t => {
    const f = fixture(t)
    f.state.newChangesets = false
    f.state.none = true
    const result = await requestPublish(f.options)
    assert.equal(result.status, 'none')
    assert.equal(f.dispatches().length, 1)
    assert.match(f.logs.at(-1), /本次未上传 npm/)
    assert.ok(!f.logs.some(message => /已完成发布/.test(message)))
})

test('只能等待本请求 run，关联超时或重复匹配不猜测最新运行', async t => {
    for (const change of [{ visibleAfter: 100 }, { duplicates: true }]) {
        const f = fixture(t)
        Object.assign(f.state, change)
        await assert.rejects(requestPublish(f.options), /未能关联发布请求|匹配多个运行/)
        assert.ok(!f.calls.some(({ args }) => args[0] === 'run' && args[1] === 'watch'))
    }
})

test('调度期间 main 前进时，不把其他来源的同请求运行视为本次成功', async t => {
    const f = fixture(t)
    f.state.dispatchedHead = 'd'.repeat(40)
    await assert.rejects(requestPublish(f.options), error => /main 已变化/.test(error.message) && error.message.includes(URL))
    assert.ok(!f.calls.some(({ args }) => args[0] === 'run' && args[1] === 'watch'))
})

test('watch 或最终工作流状态失败时返回准确 run 链接', async t => {
    for (const change of [{ watchFailure: true }, { runFailure: true }]) {
        const f = fixture(t)
        Object.assign(f.state, change)
        await assert.rejects(requestPublish(f.options), error => error.message.includes(URL))
        assert.ok(!f.logs.some(message => /已完成发布/.test(message)))
    }
})

test('CI 成功但结果 artifact 缺失、字段不完整或双仓 tag 错误均不报告发布成功', async t => {
    for (const change of [{ noArtifact: true }, { malformedResult: true }, { badTag: true }]) {
        const f = fixture(t)
        Object.assign(f.state, change)
        await assert.rejects(requestPublish(f.options), error => error.message.includes(URL))
        assert.ok(!f.logs.some(message => /已完成发布/.test(message)))
    }
})

test('旧批次完成后自动发布本次新队列，只准备一次源码并使用同 SHA 和新请求标识', async t => {
    const f = fixture(t)
    f.state.hasNewRelease = true
    f.state.batchVersions = ['1.0.0', '2.0.0']
    const result = await requestPublish(f.options)
    assert.equal(result.version, '2.0.0')
    assert.equal(result.previousRelease.version, '1.0.0')
    assert.equal(result.runId, '43')
    assert.equal(f.dispatches().length, 2)
    assert.equal(f.state.prepareCalls, 1)
    assert.equal(f.state.planCalls, 1)
    assert.equal(f.state.packCalls, 1)
    assert.ok(f.dispatches().every(({ args }) => args.includes(`requested_sha=${HEAD}`)))
    assert.ok(f.dispatches()[0].args.includes(`request_id=${REQUEST_ID}`))
    assert.ok(f.dispatches()[1].args.includes(`request_id=${REQUEST_ID}-2`))
})

test('首次已经完成计划版本时不再调度', async t => {
    const f = fixture(t)
    f.state.hasNewRelease = true
    f.state.actualVersion = '2.0.0'
    const result = await requestPublish(f.options)
    assert.equal(result.version, '2.0.0')
    assert.equal(f.dispatches().length, 1)
})

test('旧批次失败时不发布下一版本', async t => {
    const f = fixture(t)
    f.state.hasNewRelease = true
    f.state.watchFailure = true
    await assert.rejects(requestPublish(f.options), /workflow failed/)
    assert.equal(f.dispatches().length, 1)
})

test('旧批次完成但远端 main 变化时保留队列待发，禁止盲目跟进', async t => {
    const f = fixture(t)
    f.state.hasNewRelease = true
    f.state.followupHead = 'f'.repeat(40)
    await assert.rejects(requestPublish(f.options), error => /旧批次 1.0.0 已完成/.test(error.message) && /2.0.0 尚未发布/.test(error.message) && error.message.includes(URL))
    assert.equal(f.dispatches().length, 1)
})

test('旧批次完成后无法确认远端 main 时明确报告队列未发布', async t => {
    const f = fixture(t)
    f.state.hasNewRelease = true
    f.state.followupQueryError = true
    await assert.rejects(requestPublish(f.options), error => /旧批次 1.0.0 已完成/.test(error.message)
        && /无法确认远端 main/.test(error.message) && /2.0.0 尚未发布/.test(error.message) && error.message.includes(URL))
    assert.equal(f.dispatches().length, 1)
})

test('第二批失败会报告新队列未完成及两次运行链接', async t => {
    const f = fixture(t)
    f.state.hasNewRelease = true
    f.state.secondWatchFailure = true
    await assert.rejects(requestPublish(f.options), error => /排队版本 2.0.0 尚未完成/.test(error.message)
        && error.message.includes(URL) && error.message.includes(URL.replace('/42', '/43')))
    assert.equal(f.dispatches().length, 2)
})

test('第二次仍未发布目标版本时最多跟进一次，不重复创建 Changeset 或第三次调度', async t => {
    for (const change of [{ batchVersions: ['1.0.0', '1.0.0'] }, { secondNone: true }]) {
        const f = fixture(t)
        f.state.hasNewRelease = true
        Object.assign(f.state, change)
        await assert.rejects(requestPublish(f.options), /已执行两次发布.*2.0.0 仍未完成/)
        assert.equal(f.dispatches().length, 2)
        assert.equal(f.state.prepareCalls, 1)
    }
})

test('本次有新队列但 CI 返回 none 时不假报完成', async t => {
    const f = fixture(t)
    f.state.hasNewRelease = true
    f.state.none = true
    await assert.rejects(requestPublish(f.options), /本次队列尚未完成/)
    assert.equal(f.dispatches().length, 1)
})
