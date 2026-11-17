import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import {
    MANIFEST, PENDING_REF, SUBMODULE, assertNoPendingRelease, beginRelease, completeRelease,
    finalizeVersionCommit, git, prepareSubmoduleRelease, readManifest, releaseSelection, remoteCommit, selectReleaseSource,
} from './release-git.mjs'

// 测试仅允许本地文件协议，身份只在当前测试进程中指定。
process.env.GIT_ALLOW_PROTOCOL = 'file'
process.env.GIT_CONFIG_GLOBAL = '/dev/null'
process.env.GIT_CONFIG_NOSYSTEM = '1'
process.env.GIT_AUTHOR_NAME = '发布测试'
process.env.GIT_AUTHOR_EMAIL = 'release-test@example.invalid'
process.env.GIT_COMMITTER_NAME = process.env.GIT_AUTHOR_NAME
process.env.GIT_COMMITTER_EMAIL = process.env.GIT_AUTHOR_EMAIL
delete process.env.GITHUB_OUTPUT

async function write(path, value) {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, value)
}

async function json(path, value) {
    await write(path, JSON.stringify(value, null, 2) + '\n')
}

function init(path, branch = 'main', bare = false) {
    const result = spawnSync('git', ['init', ...(bare ? ['--bare'] : ['-b', branch]), path], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
}

function commit(root, message) {
    git(root, ['add', '-A'])
    git(root, ['commit', '-m', message])
    return git(root, ['rev-parse', 'HEAD'])
}

/** 独立的主仓库、子模块及两个 bare origin，不使用真实仓库的配置或远端。 */
async function fixture(t) {
    const temp = await mkdtemp(join(tmpdir(), 'bit-release-git-'))
    t.after(() => rm(temp, { recursive: true, force: true }))
    const root = join(temp, 'main')
    const parentOrigin = join(temp, 'parent.git')
    const childOrigin = join(temp, 'child.git')
    const seed = join(temp, 'child-seed')
    init(parentOrigin, 'main', true)
    init(childOrigin, 'ccc3.0', true)
    init(seed, 'ccc3.0')
    await json(join(seed, 'source/package.json'), { name: '@gongxh/fairygui-cc', version: '0.5.6' })
    await write(join(seed, 'source/CHANGELOG.md'), '# CHANGELOG\n')
    await write(join(seed, 'source/dist/fairygui.mjs'), 'export const value = 1\n')
    const childBase = commit(seed, '初始子模块')
    git(seed, ['remote', 'add', 'origin', childOrigin])
    git(seed, ['push', '-u', 'origin', 'ccc3.0'])
    init(root)
    await json(join(root, 'alpha/package.json'), { name: '@gongxh/alpha', version: '0.5.6' })
    await json(join(root, 'beta/package.json'), { name: '@gongxh/beta', version: '0.5.6' })
    await write(join(root, '.changeset/README.md'), '# Changesets\n')
    git(root, ['submodule', 'add', '-b', 'ccc3.0', childOrigin, SUBMODULE])
    const base = commit(root, '初始主仓库')
    git(root, ['remote', 'add', 'origin', parentOrigin])
    git(root, ['push', '-u', 'origin', 'main'])
    const child = join(root, SUBMODULE)
    const paths = ['alpha', 'beta', `${SUBMODULE}/source`]
    const packages = []
    for (const dir of paths) {
        packages.push({ dir: join(root, dir), packageJson: JSON.parse(await readFile(join(root, dir, 'package.json'))) })
    }
    return { temp, root, parentOrigin, childOrigin, child, seed, base, childBase, packages }
}

async function prepare(f, version = '0.5.7') {
    for (const pkg of f.packages) {
        pkg.packageJson.version = version
        await json(join(pkg.dir, 'package.json'), pkg.packageJson)
    }
    await write(join(f.child, 'source/CHANGELOG.md'), `# CHANGELOG\n\n## ${version}\n\n- 测试发布\n`)
    await write(join(f.child, 'source/dist/fairygui.mjs'), 'export const value = 2\n')
    return prepareSubmoduleRelease(f.root, version, f.packages)
}

async function releasedFixture(t) {
    const f = await fixture(t)
    const manifest = await prepare(f)
    const sha = finalizeVersionCommit(f.root, manifest.version, f.packages)
    return { ...f, manifest, sha }
}

async function nextMain(f, withChangeset = false) {
    await write(join(f.root, 'next-source.txt'), '后续 main 提交\n')
    if (withChangeset) await write(join(f.root, '.changeset/next.md'), '---\n"@gongxh/alpha": patch\n---\n\n后续版本\n')
    const sha = commit(f.root, '下一批源码')
    git(f.root, ['push', 'origin', 'main'])
    return sha
}

test('prepare 先推子候选提交，主提交同时记录 gitlink 与 manifest', async (t) => {
    const f = await fixture(t)
    const manifest = await prepare(f)
    const candidate = `refs/heads/bit-framework-release/${f.base}/v0.5.7`
    assert.equal(remoteCommit(f.child, candidate), manifest.submoduleSha)
    assert.equal(remoteCommit(f.child, 'refs/heads/ccc3.0'), f.childBase)
    assert.deepEqual(readManifest(f.root), manifest)
    assert.equal(manifest.packages.length, 3)
    assert.deepEqual(manifest.packages.map(pkg => pkg.dir), ['alpha', 'beta', `${SUBMODULE}/source`])
    const source = commit(f.root, '记录发布候选')
    assert.match(git(f.root, ['ls-tree', source, '--', SUBMODULE]), new RegExp(manifest.submoduleSha))
    assert.equal(JSON.parse(git(f.root, ['show', `${source}:${MANIFEST}`])).submoduleSha, manifest.submoduleSha)
})

test('prepare 相同来源及文件树重试复用已推送 SHA', async (t) => {
    const f = await fixture(t)
    const first = await prepare(f)
    const second = prepareSubmoduleRelease(f.root, '0.5.7', f.packages)
    assert.equal(second.submoduleSha, first.submoduleSha)
    assert.equal(git(f.child, ['rev-list', '--count', 'HEAD']), '2')
})

test('prepare 同来源已有不同候选内容时拒绝覆盖远端', async (t) => {
    const f = await fixture(t)
    const first = await prepare(f)
    await write(join(f.child, 'source/dist/fairygui.mjs'), 'export const value = 3\n')
    assert.throws(() => prepareSubmoduleRelease(f.root, '0.5.7', f.packages), /内容不同的 FairyGUI 候选提交/)
    assert.equal(remoteCommit(f.child, `refs/heads/bit-framework-release/${f.base}/v0.5.7`), first.submoduleSha)
})

test('prepare 拒绝子模块中的无关改动', async (t) => {
    const f = await fixture(t)
    await write(join(f.child, 'unrelated.txt'), '不属于发布内容\n')
    assert.throws(() => prepareSubmoduleRelease(f.root, '0.5.7', f.packages), /发布范围外的修改/)
    assert.equal(remoteCommit(f.child, `refs/heads/bit-framework-release/${f.base}/v0.5.7`), undefined)
    await assert.rejects(access(join(f.root, MANIFEST)), { code: 'ENOENT' })
})

test('begin 将 ccc3.0 快进到候选并冻结主提交', async (t) => {
    const f = await releasedFixture(t)
    beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    assert.equal(remoteCommit(f.child, 'refs/heads/ccc3.0'), f.manifest.submoduleSha)
    assert.equal(remoteCommit(f.root, PENDING_REF), f.sha)
    assert.throws(() => assertNoPendingRelease(f.root), /必须先完成冻结批次/)
})

test('首次 begin 遇子模块分叉时停止且不创建 pending', async (t) => {
    const f = await releasedFixture(t)
    await write(join(f.seed, 'unrelated-code.txt'), '正式分支独立前进\n')
    const divergent = commit(f.seed, '正式分支分叉')
    git(f.seed, ['push', 'origin', 'ccc3.0'])
    assert.throws(() => beginRelease(f.root, '0.5.7', f.manifest.submoduleSha), /无法快进/)
    assert.equal(remoteCommit(f.root, PENDING_REF), undefined)
    assert.equal(remoteCommit(f.child, 'refs/heads/ccc3.0'), divergent)
})

test('begin 拒绝与远端冻结来源不同的主提交', async (t) => {
    const f = await releasedFixture(t)
    beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    await nextMain(f)
    assert.throws(() => beginRelease(f.root, '0.5.7', f.manifest.submoduleSha), /必须使用冻结提交/)
    assert.equal(remoteCommit(f.root, PENDING_REF), f.sha)
})

test('部分发布失败后从新 main 恢复冻结主提交和子模块提交', async (t) => {
    const f = await releasedFixture(t)
    beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    const next = await nextMain(f, true)
    assert.notEqual(next, f.sha)
    const selection = selectReleaseSource(f.root)
    assert.equal(selection.mode, 'publish')
    assert.equal(selection.sha, f.sha)
    assert.equal(selection.resumed, true)
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.sha)
    assert.equal(git(f.child, ['rev-parse', 'HEAD']), f.manifest.submoduleSha)
    assert.equal(git(f.root, ['status', '--porcelain']), '')
    beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
})

test('无 pending 时优先恢复最初 manifest 来源，后续 changeset 不抢占未完成批次', async (t) => {
    const f = await releasedFixture(t)
    await nextMain(f, true)
    const selection = selectReleaseSource(f.root)
    assert.deepEqual(selection, { mode: 'publish', sha: f.sha, resumed: true })
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.sha)
})

test('主线合并后以首次引入 manifest 的合并提交为发布来源', async (t) => {
    const f = await fixture(t)
    await prepare(f)
    git(f.root, ['checkout', '-b', 'generated-release'])
    const generated = commit(f.root, '统一版本结果')
    git(f.root, ['checkout', 'main'])
    git(f.root, ['submodule', 'update', '--init'])
    await write(join(f.root, 'parallel-source.txt'), 'main 独立前进\n')
    commit(f.root, '其他功能')
    git(f.root, ['merge', '--no-ff', 'generated-release', '-m', '合并统一版本结果'])
    git(f.root, ['submodule', 'update', '--init'])
    const merged = git(f.root, ['rev-parse', 'HEAD'])
    git(f.root, ['push', 'origin', 'main'])
    await nextMain(f, true)
    assert.notEqual(merged, generated)
    assert.deepEqual(selectReleaseSource(f.root), { mode: 'publish', sha: merged, resumed: true })
})

test('冻结批次重试时 ccc3.0 可以已包含本批次并继续前进', async (t) => {
    const f = await releasedFixture(t)
    beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    git(f.seed, ['fetch', 'origin', 'ccc3.0'])
    git(f.seed, ['reset', '--hard', 'origin/ccc3.0'])
    await write(join(f.seed, 'next-child-source.txt'), '下一批子模块源码\n')
    const next = commit(f.seed, '子模块正式分支继续前进')
    git(f.seed, ['push', 'origin', 'ccc3.0'])
    beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    assert.equal(remoteCommit(f.child, 'refs/heads/ccc3.0'), next)
    assert.equal(remoteCommit(f.root, PENDING_REF), f.sha)
})

test('尚无 pending 但 ccc3.0 已包含发布提交及排队后代时首次恢复仍固定原来源', async (t) => {
    const f = await releasedFixture(t)
    git(f.seed, ['fetch', 'origin', f.manifest.submoduleSha])
    git(f.seed, ['checkout', '--detach', f.manifest.submoduleSha])
    await write(join(f.seed, 'queued-source.ts'), '排队的后代源码\n')
    const next = commit(f.seed, '后代源码提交')
    git(f.seed, ['push', 'origin', `HEAD:refs/heads/ccc3.0`])
    assert.equal(remoteCommit(f.root, PENDING_REF), undefined)
    beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    assert.equal(remoteCommit(f.child, 'refs/heads/ccc3.0'), next)
    assert.equal(remoteCommit(f.root, PENDING_REF), f.sha)
    assert.equal(git(f.child, ['rev-parse', 'HEAD']), f.manifest.submoduleSha)
})

for (const target of ['parent', 'child']) {
    test(`${target} tag 推送失败后保留 pending，重试补齐标签并解除冻结`, async (t) => {
        const f = await releasedFixture(t)
        beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
        const origin = target === 'parent' ? f.parentOrigin : f.childOrigin
        const hook = join(origin, 'hooks/pre-receive')
        await write(hook, '#!/bin/sh\nwhile read old new ref; do\n  case "$ref" in refs/tags/*) exit 1 ;; esac\ndone\nexit 0\n')
        await chmod(hook, 0o755)
        assert.throws(() => completeRelease(f.root, '0.5.7', f.manifest.submoduleSha), /失败/)
        assert.equal(remoteCommit(f.child, 'refs/tags/v0.5.7'), target === 'parent' ? f.manifest.submoduleSha : undefined)
        assert.equal(remoteCommit(f.root, 'refs/tags/v0.5.7'), undefined)
        assert.equal(remoteCommit(f.root, PENDING_REF), f.sha)
        await rm(hook)
        completeRelease(f.root, '0.5.7', f.manifest.submoduleSha)
        assert.equal(remoteCommit(f.child, 'refs/tags/v0.5.7'), f.manifest.submoduleSha)
        assert.equal(remoteCommit(f.root, 'refs/tags/v0.5.7'), f.sha)
        assert.equal(remoteCommit(f.root, PENDING_REF), undefined)
    })
}

for (const target of ['parent', 'child']) {
    test(`${target} 已存在冲突 tag 时禁止覆盖，修复冲突后可重试完成`, async (t) => {
        const f = await releasedFixture(t)
        beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
        const repo = target === 'parent' ? f.root : f.child
        const wrong = target === 'parent' ? f.base : f.childBase
        git(repo, ['push', 'origin', `${wrong}:refs/tags/v0.5.7`])
        assert.throws(() => completeRelease(f.root, '0.5.7', f.manifest.submoduleSha), /已存在且指向其他提交/)
        assert.equal(remoteCommit(repo, 'refs/tags/v0.5.7'), wrong)
        assert.equal(remoteCommit(f.root, PENDING_REF), f.sha)
        // 在临时远端模拟维护者修复错误标签，发布逻辑自身不覆盖标签。
        git(repo, ['push', 'origin', ':refs/tags/v0.5.7'])
        completeRelease(f.root, '0.5.7', f.manifest.submoduleSha)
        assert.equal(remoteCommit(f.root, PENDING_REF), undefined)
    })
}

test('完成批次无新变化时 none，有新 changeset 时才进入 version', async (t) => {
    const f = await releasedFixture(t)
    beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    completeRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    assert.deepEqual(releaseSelection(f.root), { mode: 'none', sha: f.sha, resumed: false })
    const next = await nextMain(f, true)
    assert.deepEqual(releaseSelection(f.root), { mode: 'version', sha: next, resumed: false })
    assert.doesNotThrow(() => assertNoPendingRelease(f.root))
})

test('双仓标签完成但删除 pending 失败时仍可重试解除门禁', async (t) => {
    const f = await releasedFixture(t)
    beginRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    const hook = join(f.parentOrigin, 'hooks/pre-receive')
    await write(hook, `#!/bin/sh\nwhile read old new ref; do\n  if [ "$ref" = "${PENDING_REF}" ] && [ "$new" = "0000000000000000000000000000000000000000" ]; then exit 1; fi\ndone\nexit 0\n`)
    await chmod(hook, 0o755)
    assert.throws(() => completeRelease(f.root, '0.5.7', f.manifest.submoduleSha), /失败/)
    assert.equal(remoteCommit(f.child, 'refs/tags/v0.5.7'), f.manifest.submoduleSha)
    assert.equal(remoteCommit(f.root, 'refs/tags/v0.5.7'), f.sha)
    assert.equal(remoteCommit(f.root, PENDING_REF), f.sha)
    assert.throws(() => assertNoPendingRelease(f.root), /必须先完成冻结批次/)
    await rm(hook)
    completeRelease(f.root, '0.5.7', f.manifest.submoduleSha)
    assert.equal(remoteCommit(f.root, PENDING_REF), undefined)
})

test('正式主版本提交先推 main 可供获取，只提交发布文件并保留无关暂存改动', async (t) => {
    const f = await fixture(t)
    await write(join(f.root, 'pnpm-lock.yaml'), '发布前锁文件\n')
    await write(join(f.root, '.changeset/consume.md'), '---\n"@gongxh/alpha": patch\n---\n\n测试变更\n')
    f.base = commit(f.root, '待发布 changeset')
    git(f.root, ['push', 'origin', 'main'])
    git(f.root, ['checkout', '--detach', f.base])
    await write(join(f.root, 'unrelated-staged.txt'), '用户已有暂存内容\n')
    git(f.root, ['add', 'unrelated-staged.txt'])
    await write(join(f.root, 'unrelated-working.txt'), '用户已有工作文件\n')
    const manifest = await prepare(f)
    await write(join(f.root, 'alpha/CHANGELOG.md'), '# 更新日志\n\n## 0.5.7\n')
    await write(join(f.root, 'pnpm-lock.yaml'), '发布后锁文件\n')
    await rm(join(f.root, '.changeset/consume.md'))
    const sha = finalizeVersionCommit(f.root, manifest.version, f.packages)
    assert.equal(remoteCommit(f.root, 'refs/heads/main'), sha)
    assert.equal(remoteCommit(f.root, PENDING_REF), undefined)
    assert.equal(remoteCommit(f.child, 'refs/heads/ccc3.0'), f.childBase)
    assert.equal(git(f.root, ['diff', '--cached', '--name-only']), 'unrelated-staged.txt')
    assert.equal(git(f.root, ['show', ':unrelated-staged.txt']), '用户已有暂存内容')
    assert.equal(await readFile(join(f.root, 'unrelated-working.txt'), 'utf8'), '用户已有工作文件\n')
    assert.equal(git(f.root, ['cat-file', '-e', 'HEAD:unrelated-staged.txt'], { allowFailure: true }).status, 128)
    const consumer = join(f.temp, 'consumer')
    git(f.temp, ['clone', '--no-checkout', '--branch', 'main', f.parentOrigin, consumer])
    assert.equal(JSON.parse(git(consumer, ['show', `HEAD:${MANIFEST}`])).submoduleSha, manifest.submoduleSha)
    assert.equal(JSON.parse(git(consumer, ['show', 'HEAD:alpha/package.json'])).version, '0.5.7')
    assert.match(git(consumer, ['show', 'HEAD:alpha/CHANGELOG.md']), /0\.5\.7/)
    assert.equal(git(consumer, ['show', 'HEAD:pnpm-lock.yaml']), '发布后锁文件')
    assert.equal(git(consumer, ['cat-file', '-e', 'HEAD:.changeset/consume.md'], { allowFailure: true }).status, 128)
    beginRelease(f.root, manifest.version, manifest.submoduleSha)
    assert.equal(remoteCommit(f.root, PENDING_REF), sha)
})

test('origin main 已推进时拒绝生成版本提交，不冻结或改写正式分支', async (t) => {
    const f = await fixture(t)
    const manifest = await prepare(f)
    const competitor = join(f.temp, 'competitor')
    git(f.temp, ['clone', '--branch', 'main', f.parentOrigin, competitor])
    await write(join(competitor, 'concurrent.txt'), '并发 main 提交\n')
    const concurrent = commit(competitor, 'main 并发推进')
    git(competitor, ['push', 'origin', 'main'])
    assert.throws(() => finalizeVersionCommit(f.root, manifest.version, f.packages), /origin\/main 已推进/)
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), f.base)
    assert.equal(remoteCommit(f.root, 'refs/heads/main'), concurrent)
    assert.equal(remoteCommit(f.root, PENDING_REF), undefined)
    assert.equal(remoteCommit(f.child, 'refs/heads/ccc3.0'), f.childBase)
})

test('主版本提交期间 main 并发前进时普通 push 拒绝覆盖且不冻结批次', async (t) => {
    const f = await fixture(t)
    const manifest = await prepare(f)
    const competitor = join(f.temp, 'competitor')
    git(f.temp, ['clone', '--branch', 'main', f.parentOrigin, competitor])
    await write(join(competitor, 'concurrent.txt'), '并发 main 提交\n')
    const concurrent = commit(competitor, 'main 并发推进')
    const hook = join(f.root, '.git/hooks/pre-push')
    await write(hook, `#!/bin/sh\nenv -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE git -C "${competitor}" push --no-verify origin HEAD:refs/heads/main\n`)
    await chmod(hook, 0o755)
    assert.throws(() => finalizeVersionCommit(f.root, manifest.version, f.packages), /失败/)
    assert.notEqual(git(f.root, ['rev-parse', 'HEAD']), f.base)
    assert.equal(remoteCommit(f.root, 'refs/heads/main'), concurrent)
    assert.equal(remoteCommit(f.root, PENDING_REF), undefined)
    assert.equal(remoteCommit(f.child, 'refs/heads/ccc3.0'), f.childBase)
})
