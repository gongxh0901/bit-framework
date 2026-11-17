import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

// 复用 Changesets 已安装的 YAML 解析器，不新增项目依赖。
const require = createRequire(import.meta.url)
const readRequire = createRequire(require.resolve('@changesets/read'))
const parseRequire = createRequire(readRequire.resolve('@changesets/parse'))
const { load } = parseRequire('js-yaml')
const workflow = load(readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8'))

function step(name) {
    const matches = workflow.jobs.release.steps.filter(candidate => candidate.name === name)
    assert.equal(matches.length, 1, `工作流必须保留唯一的步骤：${name}`)
    assert.equal(typeof matches[0].run, 'string')
    return matches[0].run
}

async function write(path, value) {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, value)
}

/** 所有 Git 提交、脚本和伪依赖均位于临时目录，不配置远端。 */
async function fixture(t, protocol = 3) {
    const directory = await realpath(await mkdtemp(join(tmpdir(), 'bit-publish-workflow-')))
    t.after(() => rm(directory, { recursive: true, force: true }))
    const root = join(directory, 'frozen workspace')
    const runnerTemp = join(directory, 'runner temp')
    const shims = join(directory, 'shims')
    await mkdir(root)
    await mkdir(runnerTemp)
    await mkdir(shims)
    const env = { ...process.env,
        PATH: `${shims}:${process.env.PATH}`,
        WORKFLOW_TEST_NODE: process.execPath,
        RUNNER_TEMP: runnerTemp,
        GITHUB_WORKSPACE: root,
        GITHUB_OUTPUT: join(directory, 'github-output'),
        CALL_LOG: join(directory, 'publisher-calls.jsonl'),
        FINALIZE_ONLY: 'false',
        GIT_ALLOW_PROTOCOL: 'file',
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_NAME: '工作流集成测试',
        GIT_AUTHOR_EMAIL: 'workflow-test@example.invalid',
        GIT_COMMITTER_NAME: '工作流集成测试',
        GIT_COMMITTER_EMAIL: 'workflow-test@example.invalid',
        BASH_ENV: '', ENV: '',
    }
    for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE']) delete env[key]
    function git(args) {
        const result = spawnSync('git', args, { cwd: root, env, encoding: 'utf8' })
        assert.equal(result.status, 0, result.stderr)
        return result.stdout.trim()
    }
    function commit(message) {
        git(['add', '-A'])
        git(['commit', '-m', message])
        return git(['rev-parse', 'HEAD'])
    }
    git(['init', '-b', 'main'])
    await write(join(root, '.gitignore'), 'node_modules/\n')
    await write(join(root, 'package.json'), '{"name":"workflow-fixture","private":true}\n')
    await write(join(root, 'scripts/publish-npm.mjs'), `
import { appendFileSync } from 'node:fs'
appendFileSync(process.env.CALL_LOG, JSON.stringify({ tool: 'old' }) + '\\n')
throw new Error('禁止执行冻结源码中的旧发布器')
export const RELEASE_PROTOCOL = 1
export async function publishRelease() {}
`)
    await write(join(root, 'scripts/release-git.mjs'), `
export function git() { throw new Error('禁止执行冻结源码中的旧 Git 工具') }
`)
    const frozenSha = commit('冻结源码 F')
    await write(join(root, 'scripts/publish-npm.mjs'), `
import { appendFileSync } from 'node:fs'
import { proof } from 'workflow-fake-dependency'
export const RELEASE_PROTOCOL = ${protocol}
export async function publishRelease(options) {
    const status = options.finalizeOnly ? 'finalized' : options.prepareOnly ? 'prepared' : 'published'
    appendFileSync(process.env.CALL_LOG, JSON.stringify({ tool: 'new', options, proof,
        eventSha: process.env.GITHUB_SHA, status }) + '\\n')
    return { status }
}
`)
    await write(join(root, 'scripts/release-git.mjs'), `
import { execFileSync } from 'node:child_process'
export function git(root, args) {
    return execFileSync('git', args, { cwd: root, env: process.env, encoding: 'utf8' }).trim()
}
`)
    const eventSha = commit('事件提交 T 中的新发布工具')
    await write(join(root, 'node_modules/workflow-fake-dependency/package.json'), JSON.stringify({
        name: 'workflow-fake-dependency', type: 'module', exports: './index.js',
    }))
    await write(join(root, 'node_modules/workflow-fake-dependency/index.js'), "export const proof = '保留工具通过 node_modules 链接读取伪依赖'\n")
    await write(join(shims, 'mise'), `#!/bin/sh
if [ "$1" != 'exec' ] || [ "$2" != '--' ] || [ "$3" != 'node' ]; then
  echo '集成测试禁止执行 node 以外的 mise 命令' >&2
  exit 97
fi
shift 3
exec "$WORKFLOW_TEST_NODE" "$@"
`)
    await chmod(join(shims, 'mise'), 0o755)
    env.GITHUB_SHA = eventSha
    function shell(name, overrides = {}) {
        return spawnSync('bash', ['-e', '-o', 'pipefail', '-c', step(name)], {
            cwd: root, env: { ...env, ...overrides }, encoding: 'utf8',
        })
    }
    function successful(name, overrides) {
        const result = shell(name, overrides)
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
        return result
    }
    async function calls() {
        if (!existsSync(env.CALL_LOG)) return []
        return (await readFile(env.CALL_LOG, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
    }
    return { root, runnerTemp, env, frozenSha, eventSha, git, shell, successful, calls }
}

const PUBLISH_STEP = 'Publish, prepare or finalize the frozen batch'

test('真实工作流保留事件工具及依赖，检出旧冻结源码后仍以新工具执行 finalize', async t => {
    const f = await fixture(t)
    f.successful('Preserve release tools')
    const preserved = join(f.runnerTemp, 'bit-release-tools')
    assert.equal(await realpath(join(preserved, 'node_modules')), await realpath(join(f.root, 'node_modules')))
    f.git(['checkout', '--detach', f.frozenSha])
    assert.match(await readFile(join(f.root, 'scripts/publish-npm.mjs'), 'utf8'), /禁止执行冻结源码中的旧发布器/)
    f.successful(PUBLISH_STEP, { FINALIZE_ONLY: 'true' })
    const calls = await f.calls()
    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0], { tool: 'new', options: { root: f.root, finalizeOnly: true },
        proof: '保留工具通过 node_modules 链接读取伪依赖', eventSha: f.eventSha, status: 'finalized' })
    assert.equal(f.git(['rev-parse', 'HEAD']), f.frozenSha)
    assert.equal(await readFile(f.env.GITHUB_OUTPUT, 'utf8'), 'status=finalized\n')
})

test('真实工作流事件与源码 SHA 相同时走普通 published，不添加 prepare/finalize 参数', async t => {
    const f = await fixture(t)
    f.successful('Preserve release tools')
    f.successful(PUBLISH_STEP)
    const calls = await f.calls()
    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0].options, { root: f.root })
    assert.equal(calls[0].status, 'published')
    assert.equal(await readFile(f.env.GITHUB_OUTPUT, 'utf8'), 'status=published\n')
})

test('真实工作流普通发布遇不同 SHA 时只准备，不调用冻结源码旧发布器', async t => {
    const f = await fixture(t)
    f.successful('Preserve release tools')
    f.git(['checkout', '--detach', f.frozenSha])
    f.successful(PUBLISH_STEP)
    const calls = await f.calls()
    assert.equal(calls.length, 1)
    assert.equal(calls[0].tool, 'new')
    assert.deepEqual(calls[0].options, { root: f.root, prepareOnly: true })
    assert.equal(calls[0].status, 'prepared')
    assert.equal(await readFile(f.env.GITHUB_OUTPUT, 'utf8'), 'status=prepared\n')
})

test('真实工作流对 protocol 2 的 finalize 在调用发布器之前拒绝', async t => {
    const f = await fixture(t, 2)
    f.successful('Preserve release tools')
    f.git(['checkout', '--detach', f.frozenSha])
    const result = f.shell(PUBLISH_STEP, { FINALIZE_ONLY: 'true' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /当前发布工具不支持仅收尾模式/)
    assert.deepEqual(await f.calls(), [])
    assert.equal(existsSync(f.env.GITHUB_OUTPUT), false)
})

test('真实 finalize 来源检查拒绝错误冻结 SHA 或非 publish 模式，不执行发布片段', async t => {
    const f = await fixture(t)
    f.git(['checkout', '--detach', f.frozenSha])
    for (const overrides of [
        { FROZEN_SHA: '', RELEASE_MODE: 'publish' },
        { FROZEN_SHA: 'invalid', RELEASE_MODE: 'publish' },
        { FROZEN_SHA: f.eventSha, RELEASE_MODE: 'publish' },
        { FROZEN_SHA: f.frozenSha, RELEASE_MODE: 'version' },
        { FROZEN_SHA: f.frozenSha, RELEASE_MODE: 'none' },
    ]) {
        const result = f.shell('Verify finalize-only source', overrides)
        assert.notEqual(result.status, 0)
        assert.match(result.stdout, /仅收尾必须指定并检出当前未完成批次的冻结提交/)
        assert.equal(f.git(['rev-parse', 'HEAD']), f.frozenSha)
        assert.deepEqual(await f.calls(), [])
    }
    f.successful('Verify finalize-only source', { FROZEN_SHA: f.frozenSha, RELEASE_MODE: 'publish' })
    assert.deepEqual(await f.calls(), [])
})
