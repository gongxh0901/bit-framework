import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmod, lstat, mkdir, mkdtemp, readFile, readlink, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import readChangesets from '@changesets/read'
import { preparePublishSources } from './prepare-publish.mjs'
import { MANIFEST, PENDING_REF, SUBMODULE } from './release-git.mjs'

const ENV = { ...process.env, CI: '', LC_ALL: 'C', GIT_ALLOW_PROTOCOL: 'file',
    GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: '源码发布测试', GIT_AUTHOR_EMAIL: 'prepare-test@example.invalid',
    GIT_COMMITTER_NAME: '源码发布测试', GIT_COMMITTER_EMAIL: 'prepare-test@example.invalid' }

async function write(path, contents) {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, contents)
}

async function json(path, value) { await write(path, JSON.stringify(value, null, 2) + '\n') }

function git(cwd, args) {
    const result = spawnSync('git', args, { cwd, env: ENV, encoding: 'utf8' })
    if (result.status !== 0) throw new Error(result.stderr)
    return result.stdout.trimEnd()
}

function commit(root, message) {
    git(root, ['add', '-A'])
    git(root, ['commit', '-m', message])
    return git(root, ['rev-parse', 'HEAD'])
}

async function record(root, name = 'new-change') {
    await write(join(root, `.changeset/${name}.md`), '---\n"@gongxh/alpha": patch\n---\n\n测试源码修改\n')
}

async function fixture(t, { changeset = false } = {}) {
    const temp = await mkdtemp(join(tmpdir(), 'bit-prepare-publish-'))
    t.after(() => rm(temp, { recursive: true, force: true }))
    const root = join(temp, 'parent'), childOrigin = join(temp, 'child.git'), parentOrigin = join(temp, 'parent.git')
    const seed = join(temp, 'child-seed')
    git(temp, ['init', '--bare', childOrigin])
    git(temp, ['init', '--bare', parentOrigin])
    git(temp, ['init', '-b', 'ccc3.0', seed])
    await json(join(seed, 'source/package.json'), { name: '@gongxh/fairygui-cc', version: '1.0.0' })
    await write(join(seed, 'source/index.ts'), 'export const value = 1\n')
    await write(join(seed, 'source/dist/fairygui.mjs'), 'export const value = 1\n')
    const childBase = commit(seed, '初始子模块')
    git(seed, ['remote', 'add', 'origin', childOrigin])
    git(seed, ['push', '-u', 'origin', 'ccc3.0'])
    git(temp, ['init', '-b', 'main', root])
    await json(join(root, 'alpha/package.json'), { name: '@gongxh/alpha', version: '1.0.0' })
    await json(join(root, 'beta/package.json'), { name: '@gongxh/beta', version: '1.0.0' })
    await write(join(root, 'alpha/index.ts'), 'export const value = 1\n')
    await write(join(root, '.changeset/README.md'), '# Changesets\n')
    if (changeset) await record(root, 'existing')
    git(root, ['submodule', 'add', '-b', 'ccc3.0', childOrigin, SUBMODULE])
    const base = commit(root, '初始主仓库')
    git(root, ['remote', 'add', 'origin', parentOrigin])
    git(root, ['push', '-u', 'origin', 'main'])
    const child = join(root, SUBMODULE)
    git(child, ['checkout', '--detach', childBase])
    const calls = [], logs = []
    const state = { interactive: 0, build: 0, pack: 0, cancelChangeset: false, packError: false, buildError: false,
        duringPack: undefined, duringBuild: undefined }
    const ok = { status: 0, stdout: '', stderr: '' }
    const options = { root, env: ENV, log: message => logs.push(message),
        async runCommand(command, args, config) {
            calls.push({ command, args, cwd: config.cwd })
            if (command === 'mise') {
                assert.deepEqual(args, ['run', 'build'])
                assert.equal(config.stdio, 'inherit')
                state.build++
                if (state.buildError) throw new Error('本地 build 失败')
                if (state.duringBuild) await state.duringBuild()
                return ok
            }
            if (command === 'pnpm') {
                assert.deepEqual(args, ['exec', 'changeset'])
                assert.equal(config.stdio, 'inherit')
                state.interactive++
                if (!state.cancelChangeset) await record(root)
                return ok
            }
            assert.equal(command, 'git')
            return spawnSync(command, args, { ...config, encoding: 'utf8' })
        },
        async planVersion(directory) {
            assert.equal(directory, root)
            const records = await readChangesets(root)
            const current = JSON.parse(await readFile(join(root, 'alpha/package.json'), 'utf8')).version
            const [major, minor, patch] = current.split('.').map(Number)
            return { version: records.some(change => change.releases.length) ? `${major}.${minor}.${patch + 1}` : current,
                plan: { releases: records.some(change => change.releases.length) ? [{ name: '@gongxh/alpha' }] : [] } }
        },
        async preflight(config) {
            assert.equal(config.root, root)
            assert.equal(config.dryRun, true)
            assert.ok(!calls.some(call => call.command === 'git' && ['add', 'commit', 'push'].includes(call.args[0])))
            state.pack++
            if (state.duringPack) await state.duringPack()
            if (state.packError) throw new Error('本地 pack 失败')
        },
    }
    return { root, child, temp, seed, base, childBase, parentOrigin, childOrigin, calls, logs, state, options }
}

async function advanceMain(f, change = directory => write(join(directory, 'remote.ts'), '远端源码\n')) {
    const other = join(f.temp, 'other-main')
    git(f.temp, ['clone', '--branch', 'main', f.parentOrigin, other])
    await change(other)
    const sha = commit(other, '远端 main 前进')
    git(other, ['push', 'origin', 'main'])
    return sha
}

async function advanceVersion(f, { advanceCcc = true } = {}) {
    await json(join(f.seed, 'source/package.json'), { name: '@gongxh/fairygui-cc', version: '1.0.1' })
    await write(join(f.seed, 'source/CHANGELOG.md'), '# 更新日志\n\n## 1.0.1\n')
    const childSha = commit(f.seed, 'CI 子模块版本提交')
    git(f.seed, ['push', 'origin', `HEAD:refs/heads/${advanceCcc ? 'ccc3.0' : 'release-candidate'}`])
    const parentSha = await advanceMain(f, async directory => {
        for (const name of ['alpha', 'beta']) {
            await json(join(directory, name, 'package.json'), { name: `@gongxh/${name}`, version: '1.0.1' })
            await write(join(directory, name, 'CHANGELOG.md'), '# 更新日志\n\n## 1.0.1\n')
        }
        git(directory, ['update-index', '--cacheinfo', `160000,${childSha},${SUBMODULE}`])
        await json(join(directory, MANIFEST), { version: '1.0.1', submoduleSha: childSha, packages: [] })
    })
    return { parentSha, childSha }
}

function mutations(f) { return f.calls.filter(call => call.command === 'git' && ['add', 'commit', 'push'].includes(call.args[0])) }
function remote(root, ref) { return git(root, ['ls-remote', 'origin', ref]).split(/\s/)[0] }

test('全部 staged、unstaged、untracked 修改先预检，再按子父顺序提交推送并复用 Changeset', async (t) => {
    const f = await fixture(t, { changeset: true })
    await write(join(f.root, 'alpha/index.ts'), '已暂存内容\n')
    git(f.root, ['add', 'alpha/index.ts'])
    await write(join(f.root, 'alpha/index.ts'), '最终未暂存内容\n')
    await write(join(f.root, 'new-parent.ts'), '主仓库新文件\n')
    await write(join(f.child, 'source/index.ts'), '子模块修改\n')
    await write(join(f.child, 'source/new.ts'), '子模块新文件\n')
    f.state.duringBuild = () => write(join(f.child, 'source/dist/fairygui.mjs'), '构建产物\n')
    const result = await preparePublishSources(f.options)
    assert.equal(f.state.build, 1)
    assert.equal(f.state.pack, 1)
    assert.equal(f.state.interactive, 0)
    assert.equal(result.hasNewRelease, true)
    assert.equal(result.plan.version, '1.0.1')
    assert.equal(remote(f.root, 'refs/heads/main'), result.requestedSha)
    const childSha = git(f.child, ['rev-parse', 'HEAD'])
    assert.equal(remote(f.child, 'refs/heads/ccc3.0'), childSha)
    assert.match(git(f.root, ['ls-tree', 'HEAD', '--', SUBMODULE]), new RegExp(childSha))
    assert.equal(git(f.root, ['show', 'HEAD:alpha/index.ts']), '最终未暂存内容')
    assert.equal(git(f.root, ['show', 'HEAD:new-parent.ts']), '主仓库新文件')
    assert.equal(git(f.child, ['show', 'HEAD:source/new.ts']), '子模块新文件')
    assert.equal(git(f.child, ['show', 'HEAD:source/dist/fairygui.mjs']), '构建产物')
    assert.equal(git(f.root, ['status', '--porcelain']), '')
    assert.equal(git(f.child, ['status', '--porcelain']), '')
    assert.deepEqual(mutations(f).filter(call => call.args[0] === 'push').map(call => call.cwd), [f.child, f.root])
})

test('没有记录时交互生成 Changeset，重复调用复用已有记录', async (t) => {
    const f = await fixture(t)
    await write(join(f.root, 'alpha/index.ts'), '准备发布的修改\n')
    await preparePublishSources(f.options)
    assert.equal(f.state.interactive, 1)
    f.calls.length = 0
    await preparePublishSources(f.options)
    assert.equal(f.state.interactive, 1)
    assert.equal((await readChangesets(f.root)).length, 1)
    assert.deepEqual(mutations(f), [])
})

test('build 或 pack 失败、源码漂移或交互未生成记录时不提交或推送', async (t) => {
    for (const mode of ['build', 'pack', 'drift', 'cancel']) {
        const f = await fixture(t)
        await write(join(f.root, 'alpha/index.ts'), '本地源码\n')
        f.state.packError = mode === 'pack'
        f.state.buildError = mode === 'build'
        f.state.cancelChangeset = mode === 'cancel'
        if (mode === 'drift') f.state.duringPack = () => write(join(f.root, 'alpha/index.ts'), '预检期间的新修改\n')
        await assert.rejects(preparePublishSources(f.options), /build 失败|pack 失败|预检期间|未创建有效/)
        assert.deepEqual(mutations(f), [])
        assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.base)
        assert.equal(remote(f.root, 'refs/heads/main'), f.base)
    }
})

test('错误分支及进行中的 Git 操作在构建前停止', async (t) => {
    for (const mode of ['parent-branch', 'child-branch', 'merge', 'rebase']) {
        const f = await fixture(t)
        if (mode === 'parent-branch') git(f.root, ['checkout', '-b', 'feature'])
        if (mode === 'child-branch') git(f.child, ['checkout', '-b', 'feature'])
        if (mode === 'merge') await write(join(f.root, '.git/MERGE_HEAD'), f.base + '\n')
        if (mode === 'rebase') await mkdir(join(f.root, '.git/rebase-merge'))
        await assert.rejects(preparePublishSources(f.options), /必须位于|进行中的 Git 操作/)
        assert.equal(f.state.build, 0)
        assert.deepEqual(mutations(f), [])
    }
})

test('main 仅领先版本元数据时安全携带 staged 与 unstaged TS，并保留已有 stash', async (t) => {
    const f = await fixture(t)
    const advanced = await advanceVersion(f)
    await write(join(f.root, 'alpha/index.ts'), '用户原有 stash 内容\n')
    git(f.root, ['stash', 'push', '-m', '用户原有 stash'])
    const stash = git(f.root, ['rev-parse', 'refs/stash'])
    await write(join(f.root, 'alpha/index.ts'), '已暂存修改\n')
    git(f.root, ['add', 'alpha/index.ts'])
    await write(join(f.root, 'alpha/index.ts'), '未暂存修改\n')
    f.state.duringBuild = async () => {
        assert.equal(JSON.parse(await readFile(join(f.root, 'alpha/package.json'))).version, '1.0.1')
        assert.equal(JSON.parse(await readFile(join(f.child, 'source/package.json'))).version, '1.0.1')
        assert.equal(await readFile(join(f.root, 'alpha/index.ts'), 'utf8'), '未暂存修改\n')
    }
    const result = await preparePublishSources(f.options)
    assert.equal(result.plan.version, '1.0.2')
    assert.equal(git(f.root, ['show', 'HEAD:alpha/index.ts']), '未暂存修改')
    assert.equal(git(f.root, ['rev-parse', 'HEAD^']), advanced.parentSha)
    assert.equal(git(f.root, ['rev-parse', 'refs/stash']), stash)
    assert.equal(f.state.build, 1)
    assert.equal(f.state.interactive, 1)
    assert.equal(remote(f.root, 'refs/heads/main'), result.requestedSha)
    assert.ok(!f.calls.some(call => call.args[0] === 'submodule' && call.args[1] === 'update'))
})

test('干净 main 落后时仅快进同步，再构建和规划', async (t) => {
    const f = await fixture(t)
    const advanced = await advanceMain(f, async directory => {
        await write(join(directory, 'remote.ts'), '远端新源码\n')
        await record(directory, 'remote-record')
    })
    f.state.duringBuild = async () => assert.equal(await readFile(join(f.root, 'remote.ts'), 'utf8'), '远端新源码\n')
    const result = await preparePublishSources(f.options)
    assert.equal(result.requestedSha, advanced)
    assert.equal(f.state.build, 1)
    assert.equal(f.state.interactive, 0)
    assert.deepEqual(mutations(f), [])
    assert.ok(f.calls.findIndex(call => call.args[0] === 'merge') < f.calls.findIndex(call => call.command === 'mise'))
})

test('main 或 ccc3.0 分叉时停止，不自动 rebase 或强推', async (t) => {
    for (const repo of ['main', 'child']) {
        const f = await fixture(t)
        const local = repo === 'main' ? f.root : f.child
        await write(join(local, 'local-only.ts'), '本地提交\n')
        const localSha = commit(local, '本地独立提交')
        if (repo === 'main') await advanceMain(f)
        else {
            await write(join(f.seed, 'remote-only.ts'), '远端独立提交\n')
            commit(f.seed, '子模块远端独立提交')
            git(f.seed, ['push', 'origin', 'ccc3.0'])
        }
        await write(join(local, 'local-only.ts'), '保留用户已暂存修改\n')
        git(local, ['add', 'local-only.ts'])
        await write(join(local, 'local-only.ts'), '保留用户未暂存修改\n')
        const indexPath = resolve(local, git(local, ['rev-parse', '--git-path', 'index']))
        const index = await readFile(indexPath)
        await assert.rejects(preparePublishSources(f.options), /分叉/)
        assert.equal(git(local, ['rev-parse', 'HEAD']), localSha)
        assert.equal(git(local, ['show', ':local-only.ts']), '保留用户已暂存修改')
        assert.equal(await readFile(join(local, 'local-only.ts'), 'utf8'), '保留用户未暂存修改\n')
        assert.deepEqual(await readFile(indexPath), index)
        assert.equal(f.state.build, 0)
        assert.deepEqual(mutations(f), [])
    }
})

test('子模块和 main 已有本地 ahead 提交时直接快进推送，不丢失提交', async (t) => {
    const f = await fixture(t, { changeset: true })
    await write(join(f.child, 'source/local.ts'), '子模块已有提交\n')
    const childSha = commit(f.child, '已有子模块提交')
    const mainSha = commit(f.root, '已有 gitlink 提交')
    const result = await preparePublishSources(f.options)
    assert.equal(result.requestedSha, mainSha)
    assert.equal(remote(f.root, 'refs/heads/main'), mainSha)
    assert.equal(remote(f.child, 'refs/heads/ccc3.0'), childSha)
    assert.ok(!mutations(f).some(call => call.args[0] === 'commit'))
})

test('纯 pending 恢复不创建新记录，有新修改时提交排队并返回新版本标记', async (t) => {
    for (const modified of [false, true]) {
        const f = await fixture(t)
        git(f.root, ['push', 'origin', `HEAD:${PENDING_REF}`])
        if (modified) await write(join(f.child, 'source/new.ts'), '等待下一批的修改\n')
        const result = await preparePublishSources(f.options)
        assert.equal(remote(f.root, PENDING_REF), f.base)
        assert.equal(result.hasNewRelease, modified)
        assert.equal(f.state.interactive, modified ? 1 : 0)
        assert.equal(result.requestedSha === f.base, !modified)
        assert.ok(f.logs.some(message => message.includes(`优先完成冻结批次 ${f.base}`)))
        assert.equal((await readChangesets(f.root)).length, modified ? 1 : 0)
        if (!modified) assert.deepEqual(mutations(f), [])
    }
})

test('没有 pending 但 manifest 对应双仓 tag 未完成时同样直接恢复', async (t) => {
    const f = await fixture(t)
    await json(join(f.root, MANIFEST), { version: '1.0.0', submoduleSha: f.childBase, packages: [] })
    const source = commit(f.root, '已生成的发布批次')
    git(f.root, ['push', 'origin', 'main'])
    const result = await preparePublishSources(f.options)
    assert.equal(result.requestedSha, source)
    assert.equal(result.hasNewRelease, false)
    assert.equal(f.state.interactive, 0)
    assert.ok(f.logs.some(message => message.includes(source)))
    assert.deepEqual(mutations(f), [])
})

test('预检期间远端 main 前进时停止，不覆盖其他人的提交', async (t) => {
    const f = await fixture(t, { changeset: true })
    await write(join(f.root, 'alpha/index.ts'), '本地待提交源码\n')
    let advanced
    f.state.duringPack = async () => { advanced = await advanceMain(f) }
    await assert.rejects(preparePublishSources(f.options), /远端在预检期间已推进/)
    assert.equal(remote(f.root, 'refs/heads/main'), advanced)
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.base)
    assert.deepEqual(mutations(f), [])
})

test('子模块干净落后时先快进再构建，并把新的 gitlink 提交到 main', async (t) => {
    const f = await fixture(t)
    await write(join(f.seed, 'source/index.ts'), '远端子模块新源码\n')
    const advanced = commit(f.seed, '子模块源码前进')
    git(f.seed, ['push', 'origin', 'ccc3.0'])
    f.state.duringBuild = async () => assert.equal(await readFile(join(f.child, 'source/index.ts'), 'utf8'), '远端子模块新源码\n')
    const result = await preparePublishSources(f.options)
    assert.equal(git(f.child, ['rev-parse', 'HEAD']), advanced)
    assert.match(git(f.root, ['ls-tree', result.requestedSha, '--', SUBMODULE]), new RegExp(advanced))
    assert.equal(f.state.build, 1)
    assert.equal(f.state.interactive, 1)
})

test('子模块同一源码冲突时保留自动 stash 和冲突现场，不构建或推送', async (t) => {
    const f = await fixture(t)
    await write(join(f.seed, 'source/index.ts'), '远端子模块新源码\n')
    const advanced = commit(f.seed, '子模块源码前进')
    git(f.seed, ['push', 'origin', 'ccc3.0'])
    await write(join(f.child, 'source/index.ts'), '子模块已暂存修改\n')
    git(f.child, ['add', 'source/index.ts'])
    await write(join(f.child, 'source/index.ts'), '子模块未暂存修改\n')
    await assert.rejects(preparePublishSources(f.options), /自动 stash 恢复未完成.*git stash list/)
    assert.equal(git(f.child, ['rev-parse', 'HEAD']), advanced)
    assert.ok(git(f.child, ['ls-files', '--unmerged']))
    assert.equal(git(f.child, ['show', 'refs/stash:source/index.ts']), '子模块未暂存修改')
    assert.equal(git(f.child, ['show', 'refs/stash^2:source/index.ts']), '子模块已暂存修改')
    assert.match(await readFile(join(f.child, 'source/index.ts'), 'utf8'), /子模块未暂存修改/)
    assert.equal(f.state.build, 0)
    assert.deepEqual(mutations(f), [])
})

test('真实未解决合并冲突在构建之前停止', async (t) => {
    const f = await fixture(t)
    git(f.root, ['checkout', '-b', 'conflicting-source'])
    await write(join(f.root, 'alpha/index.ts'), '分支源码\n')
    commit(f.root, '分支修改')
    git(f.root, ['checkout', 'main'])
    await write(join(f.root, 'alpha/index.ts'), '主线源码\n')
    commit(f.root, '主线修改')
    assert.notEqual(spawnSync('git', ['merge', 'conflicting-source'], { cwd: f.root, env: ENV }).status, 0)
    await assert.rejects(preparePublishSources(f.options), /未解决的 Git 冲突/)
    assert.equal(f.state.build, 0)
    assert.deepEqual(mutations(f), [])
})

for (const target of ['parent', 'child']) {
    test(`${target} 普通 push 期间远端并发前进时拒绝覆盖，不自动 rebase`, async (t) => {
        const f = await fixture(t, { changeset: true })
        const local = target === 'parent' ? f.root : f.child
        const origin = target === 'parent' ? f.parentOrigin : f.childOrigin
        const branch = target === 'parent' ? 'main' : 'ccc3.0'
        const source = target === 'parent' ? 'alpha/index.ts' : 'source/index.ts'
        await write(join(local, source), '本地要发布的源码\n')
        const competitor = join(f.temp, 'push-competitor')
        git(f.temp, ['clone', '--branch', branch, origin, competitor])
        await write(join(competitor, 'concurrent.ts'), '其他人的并发源码\n')
        const advanced = commit(competitor, '并发提交')
        const hook = resolve(local, git(local, ['rev-parse', '--git-path', 'hooks/pre-push']))
        await write(hook, `#!/bin/sh\nenv -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE git -C "${competitor}" push --no-verify origin HEAD:refs/heads/${branch}\n`)
        await chmod(hook, 0o755)
        await assert.rejects(preparePublishSources(f.options), /git push .*失败/)
        assert.equal(remote(local, `refs/heads/${branch}`), advanced)
        assert.equal(git(local, ['show', `HEAD:${source}`]), '本地要发布的源码')
        assert.ok(!f.calls.some(call => call.args.includes('--force') || call.args[0] === 'rebase'))
        if (target === 'child') assert.equal(remote(f.root, 'refs/heads/main'), f.base)
    })
}

for (const target of ['parent', 'child']) {
    for (const kind of ['changeset', 'binary']) {
        test(`${target} 同名未跟踪 ${kind} 与远端原始字节一致时自动接纳跟踪`, async (t) => {
            const f = await fixture(t, { changeset: target === 'child' || kind !== 'changeset' })
            const file = kind === 'changeset' ? '.changeset/fine-days-decide.md' : 'same-file.bin'
            const contents = kind === 'changeset' ? Buffer.from('---\n"@gongxh/alpha": patch\n---\n\n同一份变更记录\n') : Buffer.from([0, 255, 128, 10, 13, 0])
            const local = target === 'parent' ? f.root : f.child
            let advanced
            if (target === 'parent') advanced = await advanceMain(f, directory => write(join(directory, file), contents))
            else {
                await write(join(f.seed, file), contents)
                advanced = commit(f.seed, '远端新增同内容文件')
                git(f.seed, ['push', 'origin', 'ccc3.0'])
            }
            await write(join(local, file), contents)
            const dirtyPath = target === 'parent' ? 'alpha/index.ts' : 'source/index.ts'
            if (kind === 'changeset') await write(join(local, dirtyPath), '自动快进同时保留的 TS 修改\n')
            const result = await preparePublishSources(f.options)
            assert.deepEqual(await readFile(join(local, file)), contents)
            assert.equal(git(local, ['ls-files', '--error-unmatch', file]), file)
            assert.equal(git(local, ['stash', 'list']), '')
            assert.equal(f.state.interactive, 0)
            assert.equal(f.state.build, 1)
            assert.equal(f.calls.filter(call => call.command === 'git' && call.args[0] === 'update-index').length, 1)
            assert.equal(remote(f.root, 'refs/heads/main'), result.requestedSha)
            if (kind === 'changeset') assert.equal(git(local, ['show', `HEAD:${dirtyPath}`]), '自动快进同时保留的 TS 修改')
            else if (target === 'parent') assert.equal(result.requestedSha, advanced)
            else assert.equal(git(f.child, ['rev-parse', 'HEAD']), advanced)
        })
    }
}

test('同内容同类型的符号链接仍拒绝自动接纳，完整保留链接及目标', async (t) => {
    const f = await fixture(t, { changeset: true })
    await advanceMain(f, directory => symlink('alpha/index.ts', join(directory, 'same-link')))
    await symlink('alpha/index.ts', join(f.root, 'same-link'))
    await assert.rejects(preparePublishSources(f.options), /仅支持普通文件自动接纳/)
    assert.equal((await lstat(join(f.root, 'same-link'))).isSymbolicLink(), true)
    assert.equal(await readlink(join(f.root, 'same-link')), 'alpha/index.ts')
    assert.equal(await readFile(join(f.root, 'alpha/index.ts'), 'utf8'), 'export const value = 1\n')
    assert.ok(!f.calls.some(call => call.args[0] === 'update-index'))
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.base)
})

test('全部碰撞验证通过之前不写索引，任一不同内容均保留所有本地文件', async (t) => {
    const f = await fixture(t, { changeset: true })
    await advanceMain(f, async directory => {
        await write(join(directory, 'a-identical.txt'), '相同内容\n')
        await write(join(directory, 'z-different.txt'), '远端内容\n')
    })
    await write(join(f.root, 'a-identical.txt'), '相同内容\n')
    await write(join(f.root, 'z-different.txt'), '本地不同内容\n')
    const index = await readFile(join(f.root, '.git/index'))
    await assert.rejects(preparePublishSources(f.options), /原始内容、类型或可执行模式不一致/)
    assert.deepEqual(await readFile(join(f.root, '.git/index')), index)
    assert.equal(await readFile(join(f.root, 'a-identical.txt'), 'utf8'), '相同内容\n')
    assert.equal(await readFile(join(f.root, 'z-different.txt'), 'utf8'), '本地不同内容\n')
    assert.ok(!f.calls.some(call => call.args[0] === 'update-index'))
    assert.deepEqual(mutations(f), [])
})

test('相同碰撞与文件目录前缀冲突并存时，结构检查先于任何索引写入', async (t) => {
    const f = await fixture(t, { changeset: true })
    await advanceMain(f, async directory => {
        await write(join(directory, 'a-identical.txt'), '完全相同\n')
        await write(join(directory, 'z-collision'), '远端文件\n')
    })
    await write(join(f.root, 'a-identical.txt'), '完全相同\n')
    await write(join(f.root, 'z-collision/child.txt'), '本地目录中的源码\n')
    await assert.rejects(preparePublishSources(f.options), /文件\/目录结构冲突/)
    assert.equal(await readFile(join(f.root, 'a-identical.txt'), 'utf8'), '完全相同\n')
    assert.equal(await readFile(join(f.root, 'z-collision/child.txt'), 'utf8'), '本地目录中的源码\n')
    assert.ok(!f.calls.some(call => call.args[0] === 'update-index'))
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.base)
})

for (const replacement of ['unrelated-remote', 'mixed-remote-file']) {
    test(`HEAD 已跟踪目录被本地未跟踪文件替换时保护原字节：${replacement}`, async (t) => {
        const f = await fixture(t, { changeset: true })
        await write(join(f.root, 'collision/old.ts'), '原有跟踪源码\n')
        const base = commit(f.root, '跟踪目录源码')
        git(f.root, ['push', 'origin', 'main'])
        await advanceMain(f, async directory => {
            if (replacement === 'mixed-remote-file') {
                await rm(join(directory, 'collision'), { recursive: true })
                await write(join(directory, 'collision'), '远端目录替换文件\n')
                await write(join(directory, 'a-identical.txt'), '相同碰撞内容\n')
            } else await write(join(directory, 'elsewhere.ts'), '远端无关新增源码\n')
        })
        await rm(join(f.root, 'collision'), { recursive: true })
        await write(join(f.root, 'collision'), '绝不能丢失的未跟踪原始字节\n')
        if (replacement === 'mixed-remote-file') await write(join(f.root, 'a-identical.txt'), '相同碰撞内容\n')
        const index = await readFile(join(f.root, '.git/index'))
        await assert.rejects(preparePublishSources(f.options), /替换了已跟踪路径.*结构冲突/)
        assert.equal(await readFile(join(f.root, 'collision'), 'utf8'), '绝不能丢失的未跟踪原始字节\n')
        assert.equal(git(f.root, ['show', ':collision/old.ts']), '原有跟踪源码')
        assert.deepEqual(await readFile(join(f.root, '.git/index')), index)
        assert.equal(git(f.root, ['rev-parse', 'HEAD']), base)
        assert.ok(!f.calls.some(call => ['update-index', 'merge'].includes(call.args[0])))
        assert.equal(f.state.build, 0)
    })
}

for (const difference of ['executable', 'symlink', 'remote-directory', 'local-directory']) {
    test(`未跟踪碰撞 ${difference} 差异拒绝同步且不改工作文件`, async (t) => {
        const f = await fixture(t, { changeset: true })
        await advanceMain(f, async directory => {
            if (difference === 'symlink') await symlink('alpha/index.ts', join(directory, 'collision'))
            else if (difference === 'remote-directory') await write(join(directory, 'collision/nested.txt'), '远端目录内容\n')
            else await write(join(directory, 'collision'), 'alpha/index.ts')
        })
        if (difference === 'local-directory') await write(join(f.root, 'collision/nested.txt'), '用户目录内容\n')
        else {
            await write(join(f.root, 'collision'), 'alpha/index.ts')
            if (difference === 'executable') await chmod(join(f.root, 'collision'), 0o755)
        }
        await assert.rejects(preparePublishSources(f.options), /无法安全快进/)
        const file = difference === 'local-directory' ? 'collision/nested.txt' : 'collision'
        assert.equal(await readFile(join(f.root, file), 'utf8'), difference === 'local-directory' ? '用户目录内容\n' : 'alpha/index.ts')
        assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.base)
        assert.ok(!f.calls.some(call => call.args[0] === 'update-index'))
        assert.equal(f.state.build, 0)
    })
}

test('远端 filter 属性碰撞拒绝自动接纳，不执行过滤或改写文件', async (t) => {
    const f = await fixture(t, { changeset: true })
    await advanceMain(f, async directory => {
        await write(join(directory, '.gitattributes'), 'collision filter=custom\n')
        await write(join(directory, 'collision'), '同内容\n')
    })
    await write(join(f.root, 'collision'), '同内容\n')
    await assert.rejects(preparePublishSources(f.options), /设置了 filter 属性/)
    assert.equal(await readFile(join(f.root, 'collision'), 'utf8'), '同内容\n')
    assert.ok(!f.calls.some(call => call.args[0] === 'update-index'))
})

for (const conversion of ['target-eol', 'autocrlf']) {
    test(`${conversion} 可能改变相同碰撞文件字节时在索引写入前拒绝`, async (t) => {
        const f = await fixture(t, { changeset: true })
        await advanceMain(f, async directory => {
            await write(join(directory, 'collision'), '原始 LF 内容\n')
            if (conversion === 'target-eol') await write(join(directory, '.gitattributes'), 'collision text eol=crlf\n')
        })
        if (conversion === 'autocrlf') git(f.root, ['config', 'core.autocrlf', 'true'])
        await write(join(f.root, 'collision'), '原始 LF 内容\n')
        await assert.rejects(preparePublishSources(f.options), /设置了 (text|eol) 属性|core\.autocrlf=true/)
        assert.deepEqual(await readFile(join(f.root, 'collision')), Buffer.from('原始 LF 内容\n'))
        assert.ok(!f.calls.some(call => call.args[0] === 'update-index'))
        assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.base)
        assert.deepEqual(mutations(f), [])
    })
}

test('接纳同内容后 merge 遇索引锁失败时仍保留原文件，不提交或推送', async (t) => {
    const f = await fixture(t, { changeset: true })
    await advanceMain(f, directory => write(join(directory, 'same-file.txt'), '原始相同内容\n'))
    await write(join(f.root, 'same-file.txt'), '原始相同内容\n')
    const original = f.options.runCommand
    f.options.runCommand = async (command, args, options) => {
        if (command === 'git' && args[0] === 'merge') await write(join(f.root, '.git/index.lock'), '模拟并发索引锁\n')
        return original(command, args, options)
    }
    await assert.rejects(preparePublishSources(f.options), /无法安全快进/)
    assert.equal(await readFile(join(f.root, 'same-file.txt'), 'utf8'), '原始相同内容\n')
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.base)
    assert.ok(f.calls.some(call => call.args[0] === 'update-index'))
    assert.deepEqual(mutations(f), [])
    assert.equal(f.state.build, 0)
})

test('主子版本元数据领先时携带 dirty 子模块源码，包含 ccc 尚未推进的父 gitlink', async (t) => {
    for (const advanceCcc of [true, false]) {
        const f = await fixture(t)
        const advanced = await advanceVersion(f, { advanceCcc })
        await write(join(f.child, 'source/index.ts'), '子模块已暂存 TS\n')
        git(f.child, ['add', 'source/index.ts'])
        await write(join(f.child, 'source/index.ts'), '子模块最终 TS\n')
        f.state.duringBuild = async () => {
            assert.equal(JSON.parse(await readFile(join(f.child, 'source/package.json'))).version, '1.0.1')
            assert.equal(await readFile(join(f.child, 'source/index.ts'), 'utf8'), '子模块最终 TS\n')
        }
        const result = await preparePublishSources(f.options)
        assert.equal(result.plan.version, '1.0.2')
        assert.equal(result.hasNewRelease, true)
        assert.equal(git(f.child, ['show', 'HEAD:source/index.ts']), '子模块最终 TS')
        assert.equal(git(f.child, ['rev-parse', 'HEAD^']), advanced.childSha)
        assert.equal(remote(f.child, 'refs/heads/ccc3.0'), git(f.child, ['rev-parse', 'HEAD']))
        assert.equal(f.state.build, 1)
        assert.equal(f.state.interactive, 1)
        assert.ok(!f.calls.some(call => call.args[0] === 'submodule' && call.args[1] === 'update'))
    }
})

test('主仓库同文件自动恢复冲突时即使 merge 返回成功也停止且保留两份用户内容', async (t) => {
    const f = await fixture(t)
    const advanced = await advanceMain(f, directory => write(join(directory, 'alpha/index.ts'), '远端源码\n'))
    await write(join(f.root, 'alpha/index.ts'), '用户已暂存 TS\n')
    git(f.root, ['add', 'alpha/index.ts'])
    await write(join(f.root, 'alpha/index.ts'), '用户未暂存 TS\n')
    await assert.rejects(preparePublishSources(f.options), /自动 stash 恢复未完成.*git stash list/)
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), advanced)
    assert.ok(git(f.root, ['ls-files', '--unmerged']))
    assert.equal(git(f.root, ['show', 'refs/stash:alpha/index.ts']), '用户未暂存 TS')
    assert.equal(git(f.root, ['show', 'refs/stash^2:alpha/index.ts']), '用户已暂存 TS')
    assert.match(await readFile(join(f.root, 'alpha/index.ts'), 'utf8'), /远端源码[\s\S]*用户未暂存 TS/)
    assert.equal(f.state.build, 0)
    assert.deepEqual(mutations(f), [])
})

for (const target of ['parent', 'child']) {
    test(`${target} 未跟踪同名文件会被覆盖时拒绝快进并完整保留文件`, async (t) => {
        const f = await fixture(t)
        const local = target === 'parent' ? f.root : f.child
        const file = target === 'parent' ? 'collision.ts' : 'source/collision.ts'
        if (target === 'parent') await advanceMain(f, directory => write(join(directory, file), '远端新增文件\n'))
        else {
            await write(join(f.seed, file), '远端新增文件\n')
            commit(f.seed, '远端新增文件')
            git(f.seed, ['push', 'origin', 'ccc3.0'])
        }
        await write(join(local, file), '用户未跟踪文件\n')
        const before = git(local, ['rev-parse', 'HEAD'])
        await assert.rejects(preparePublishSources(f.options), /无法安全快进/)
        assert.equal(await readFile(join(local, file), 'utf8'), '用户未跟踪文件\n')
        assert.equal(git(local, ['rev-parse', 'HEAD']), before)
        assert.equal(f.state.build, 0)
        assert.deepEqual(mutations(f), [])
    })
}
