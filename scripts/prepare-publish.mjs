/** 本地准备发布源码；版本生成和 npm 上传仍由 CI 执行。 */
import readChangesets from '@changesets/read'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ROOT } from './release-workspace.mjs'
import { MANIFEST, PENDING_REF, SUBMODULE, readManifest } from './release-git.mjs'
import { planVersionPackages } from './version-packages.mjs'
import { publishRelease, runCommand as execute } from './publish-npm.mjs'

function localFile(path) {
    let stat
    try { stat = lstatSync(path) }
    catch (error) { if (error.code === 'ENOENT') return undefined; throw error }
    if (stat.isSymbolicLink()) return { mode: '120000', data: readlinkSync(path, { encoding: 'buffer' }) }
    if (stat.isFile()) return { mode: stat.mode & 0o111 ? '100755' : '100644', data: readFileSync(path) }
    return { mode: 'unsupported' }
}

const sameFile = (first, second) => first?.data && second?.data && first.mode === second.mode && first.data.equals(second.data)

/** 同步、预检之后，按子仓库、主仓库顺序提交并推送全部修改。 */
export async function preparePublishSources({ root = ROOT, env = process.env, runCommand = execute,
    planVersion = planVersionPackages, preflight = publishRelease, log = console.log } = {}) {
    const child = join(root, SUBMODULE)
    const invoke = (command, args, cwd = root, options = {}) => runCommand(command, args, {
        cwd, env: command === 'git' ? { ...env, GIT_OPTIONAL_LOCKS: '0' } : env, ...options,
    })
    const run = async (command, args, cwd = root, options) => {
        const result = await invoke(command, args, cwd, options)
        if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} 失败\n${result.stderr || result.stdout || ''}`)
        return result.stdout || ''
    }
    const git = (args, cwd = root) => run('git', args, cwd)
    const head = async cwd => (await git(['rev-parse', 'HEAD'], cwd)).trim()
    const status = (cwd, ignoreChild = false) => git(['status', '--porcelain=v1', '-z', '--untracked-files=all',
        ...(ignoreChild ? ['--ignore-submodules=all'] : [])], cwd)
    const dirty = async () => Boolean(await status(root) || await status(child))
    const ancestor = async (first, second, cwd) => {
        const result = await invoke('git', ['merge-base', '--is-ancestor', first, second], cwd)
        if (result.status > 1) throw new Error(`无法判断 ${cwd} 的提交关系：${result.stderr || ''}`)
        return result.status === 0
    }
    const refs = async (cwd, names) => {
        const output = await git(['ls-remote', 'origin', ...names.flatMap(name => [name, `${name}^{}`])], cwd)
        const found = new Map(output.split('\n').filter(Boolean).map(line => {
            const [sha, name] = line.split(/\s+/)
            return [name, sha]
        }))
        return new Map(names.map(name => [name, found.get(`${name}^{}`) || found.get(name)]))
    }
    const remoteHead = async (cwd, branch) => {
        await git(['fetch', '--no-tags', 'origin', `refs/heads/${branch}`], cwd)
        return (await git(['rev-parse', 'FETCH_HEAD'], cwd)).trim()
    }
    async function assertReady(cwd, branch, detachedAllowed) {
        const symbolic = await invoke('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'], cwd)
        if ((symbolic.status === 0 && symbolic.stdout.trim() !== branch) ||
            (symbolic.status !== 0 && !(symbolic.status === 1 && detachedAllowed))) {
            throw new Error(`${cwd} 必须位于 ${branch}${detachedAllowed ? ' 或 detached HEAD' : ''}`)
        }
        if (await git(['ls-files', '--unmerged', '-z'], cwd)) throw new Error(`${cwd} 存在未解决的 Git 冲突`)
        for (const marker of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply']) {
            const path = (await git(['rev-parse', '--git-path', marker], cwd)).trim()
            if (existsSync(resolve(cwd, path))) throw new Error(`${cwd} 存在进行中的 Git 操作：${marker}`)
        }
    }
    async function snapshot(cwd, ignoreChild = false) {
        const untracked = (await git(['ls-files', '--others', '--exclude-standard', '-z'], cwd)).split('\0').filter(Boolean)
        const contents = untracked.map(path => {
            const file = join(cwd, path)
            const stat = lstatSync(file)
            const value = stat.isSymbolicLink() ? readlinkSync(file) : readFileSync(file)
            return [path, stat.mode, createHash('sha256').update(value).digest('hex')]
        })
        const options = ignoreChild ? ['--ignore-submodules=all'] : []
        return JSON.stringify([await head(cwd), await status(cwd, ignoreChild),
            await git(['diff', '--no-ext-diff', '--binary', ...options, 'HEAD'], cwd),
            await git(['diff', '--cached', '--no-ext-diff', '--binary', ...options], cwd), contents])
    }
    async function stashHead(cwd) {
        const result = await invoke('git', ['rev-parse', '--quiet', '--verify', 'refs/stash'], cwd)
        if (result.status !== 0 && result.status !== 1) throw new Error(`无法检查 ${cwd} 的自动 stash 状态`)
        return result.status === 0 ? result.stdout.trim() : ''
    }
    async function acceptIdenticalCollisions(cwd, label, sha) {
        const untracked = (await git(['ls-files', '--others', '--exclude-standard', '-z'], cwd)).split('\0').filter(Boolean)
        if (!untracked.length) return undefined
        const tree = async ref => new Map((await git(['ls-tree', '-r', '-t', '-z', ref], cwd)).split('\0').filter(Boolean).map(entry => {
            const tab = entry.indexOf('\t')
            const [mode, type, hash] = entry.slice(0, tab).split(' ')
            return [entry.slice(tab + 1), { mode, type, hash }]
        }))
        const target = await tree(sha), current = await tree('HEAD')
        for (const path of untracked) {
            if (current.has(path)) {
                throw new Error(`${label} 无法安全快进：未跟踪路径 ${path} 替换了已跟踪路径，存在文件/目录结构冲突；已保留全部本地文件`)
            }
            const parts = path.split('/')
            for (let i = 1; i < parts.length; i++) {
                const prefix = parts.slice(0, i).join('/')
                if (current.has(prefix) && current.get(prefix).type !== 'tree') {
                    throw new Error(`${label} 无法安全快进：未跟踪路径 ${path} 替换了已跟踪文件 ${prefix}，存在文件/目录结构冲突；已保留全部本地文件`)
                }
                if (target.has(prefix) && target.get(prefix).type !== 'tree') {
                    throw new Error(`${label} 无法安全快进：未跟踪路径 ${path} 与远端 ${prefix} 存在文件/目录结构冲突；已保留全部本地文件`)
                }
            }
        }
        for (const [path, entry] of target) {
            if (entry.type === 'tree' || current.has(path)) continue
            try {
                if (lstatSync(join(cwd, path)).isDirectory()) throw new Error(`${label} 无法安全快进：本地目录 ${path} 与远端文件存在结构冲突；已保留全部本地文件`)
            } catch (error) { if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error }
        }
        const entries = untracked.filter(path => target.has(path) && !current.has(path)).map(path => ({
            path, original: join(cwd, path), target: target.get(path), state: localFile(join(cwd, path)),
        }))
        if (!entries.length) return undefined
        const autocrlf = await invoke('git', ['config', '--get', '--type=bool-or-str', 'core.autocrlf'], cwd)
        if (autocrlf.status !== 0 && autocrlf.status !== 1) throw new Error(`${label} 无法检查 core.autocrlf，停止快进`)
        if ((autocrlf.stdout || '').trim() === 'true') throw new Error(`${label} 无法安全快进：core.autocrlf=true 可能改写碰撞文件的原始字节，请先手工处理；本地文件未改动`)
        for (const source of [undefined, sha]) {
            const attributes = (await git(['check-attr', '-z', ...(source ? [`--source=${source}`] : []),
                'filter', 'text', 'eol', 'working-tree-encoding', 'ident', 'crlf', '--', ...entries.map(entry => entry.path)], cwd)).split('\0')
            for (let i = 0; i + 2 < attributes.length; i += 3) {
                if (attributes[i + 2] !== 'unspecified') throw new Error(`${label} 无法安全快进：碰撞文件 ${attributes[i]} 设置了 ${attributes[i + 1]} 属性，请先手工处理；本地文件未改动`)
            }
        }
        // 全部碰撞都通过原始字节和 Git 文件模式校验后，才写入任何一个索引条目。
        for (const entry of entries) {
            if (!['100644', '100755'].includes(entry.target.mode)) {
                throw new Error(`${label} 无法安全快进：碰撞路径 ${entry.path} 仅支持普通文件自动接纳；已保留全部本地文件`)
            }
            const hash = entry.state?.data && (await run('git', ['hash-object', '--no-filters', '--stdin'], cwd, { input: entry.state.data })).trim()
            if (entry.target.type !== 'blob' || entry.state?.mode !== entry.target.mode || hash !== entry.target.hash) {
                throw new Error(`${label} 无法安全快进：未跟踪文件 ${entry.path} 与远端的原始内容、类型或可执行模式不一致；已保留全部本地文件`)
            }
        }
        for (const entry of entries) {
            if (!sameFile(localFile(entry.original), entry.state)) throw new Error(`${entry.path} 在碰撞检查后发生变化，停止快进`)
        }
        // 只接纳这些同内容文件，不经 clean filter，也不移动工作文件或暂存其他路径。
        for (const entry of entries) {
            await git(['update-index', '--add', '--cacheinfo', `${entry.target.mode},${entry.target.hash},${entry.path}`], cwd)
        }
        return entries
    }
    async function fastForward(cwd, label, sha) {
        const before = await stashHead(cwd)
        const accepted = await acceptIdenticalCollisions(cwd, label, sha)
        const result = await invoke('git', ['merge', '--ff-only', '--autostash', sha], cwd)
        // Git 完成快进但自动 stash 恢复冲突时也可能返回 0，必须额外检查现场。
        const unmerged = await git(['ls-files', '--unmerged', '-z'], cwd)
        const savedStash = await stashHead(cwd)
        if (unmerged || savedStash !== before) {
            throw new Error(`${label} 快进后的自动 stash 恢复未完成；Git 自动 stash 和冲突现场已保留。请在 ${cwd} 查看 git status、git stash list，解决冲突后重试`)
        }
        if (result.status !== 0) {
            throw new Error(`${label} 无法安全快进，已停止且不会提交或推送。请在 ${cwd} 检查 git status、git stash list 后处理\n${result.stderr || result.stdout || ''}`)
        }
        for (const entry of accepted || []) {
            const index = await git(['ls-files', '--stage', '-z', '--', entry.path], cwd)
            if (index !== `${entry.target.mode} ${entry.target.hash} 0\t${entry.path}\0` ||
                !sameFile(localFile(entry.original), entry.state)) throw new Error(`${entry.path} 快进后的文件或跟踪记录与目标提交不一致`)
        }
        log(`${label} 已快进同步到 ${sha}，本地修改由 Git 自动恢复`)
    }

    await assertReady(root, 'main', false)
    await assertReady(child, 'ccc3.0', true)
    let mainRemote = await remoteHead(root, 'main')
    let childRemote = await remoteHead(child, 'ccc3.0')
    const localMain = await head(root)
    if (!await ancestor(mainRemote, localMain, root)) {
        if (!await ancestor(localMain, mainRemote, root)) throw new Error('本地 main 与远端分叉，请先协调提交；发布不会自动 rebase')
        await fastForward(root, '主仓库 main', mainRemote)
    }
    await git(['submodule', 'sync', '--recursive'])
    // 先对齐父仓库的记录点，再处理 ccc3.0；不直接 checkout 含用户修改的子模块。
    const gitlink = /^160000 commit ([0-9a-f]+)\t/.exec(await git(['ls-tree', 'HEAD', '--', SUBMODULE]))?.[1]
    if (!gitlink) throw new Error('主仓库没有有效的 FairyGUI gitlink')
    if ((await invoke('git', ['cat-file', '-e', `${gitlink}^{commit}`], child)).status !== 0) {
        await git(['fetch', '--no-tags', 'origin', gitlink], child)
    }
    const checkedChild = await head(child)
    if (!await ancestor(gitlink, checkedChild, child)) {
        if (!await ancestor(checkedChild, gitlink, child)) throw new Error('FairyGUI 本地提交与主仓库 gitlink 分叉，请先协调源码；发布不会自动 rebase')
        await fastForward(child, 'FairyGUI gitlink', gitlink)
    }
    childRemote = await remoteHead(child, 'ccc3.0')
    const localChild = await head(child)
    if (!await ancestor(childRemote, localChild, child)) {
        if (!await ancestor(localChild, childRemote, child)) throw new Error('FairyGUI 与远端 ccc3.0 分叉，请先协调提交；发布不会自动 rebase')
        await fastForward(child, 'FairyGUI ccc3.0', childRemote)
    }

    const pending = (await refs(root, [PENDING_REF])).get(PENDING_REF)
    let frozenSha = pending
    const manifest = readManifest(root)
    if (!frozenSha && manifest) {
        const tag = `refs/tags/v${manifest.version}`
        const parentTag = (await refs(root, [tag])).get(tag)
        const childTag = (await refs(child, [tag])).get(tag)
        const source = (await git(['log', '--first-parent', '-1', '--format=%H', '--', MANIFEST])).trim()
        if (!source) throw new Error('本地发布清单尚未提交，无法确定未完成批次的来源')
        if (parentTag && parentTag !== source) throw new Error('主仓库正式 tag 与发布清单来源不一致')
        if (childTag && childTag !== manifest.submoduleSha) throw new Error('FairyGUI 正式 tag 与发布清单来源不一致')
        if (!parentTag || !childTag) frozenSha = source
    }
    if (frozenSha) log(`本次优先完成冻结批次 ${frozenSha}；新的源码和 Changeset 将提交排队`)

    // 同步发生在构建之前，确保本地 pack 使用当前将要提交的源码产物。
    await run('mise', ['run', 'build'], root, { stdio: 'inherit' })
    const changesets = await readChangesets(root)
    const hasRecordedRelease = changesets.some(change => change.releases.some(release => ['patch', 'minor', 'major'].includes(release.type)))
    const hasNewSources = await dirty() ||
        (await head(root) !== mainRemote && await head(root) !== frozenSha) ||
        (await head(child) !== childRemote && await head(child) !== manifest?.submoduleSha)
    if (!hasRecordedRelease && (!frozenSha || hasNewSources)) {
        await run('pnpm', ['exec', 'changeset'], root, { stdio: 'inherit' })
        if (!(await readChangesets(root)).some(change => change.releases.some(release => ['patch', 'minor', 'major'].includes(release.type)))) {
            throw new Error('未创建有效的 Changeset，停止提交和发布')
        }
    }
    const plan = await planVersion(root)
    const hasNewRelease = Boolean(plan.plan.releases.length)
    if (!frozenSha && !hasNewRelease) throw new Error('没有可发布的 Changeset，停止提交和发布')
    log(hasNewRelease ? `统一目标版本：${plan.version}` : `恢复已有发布批次；当前工作区版本：${plan.version}`)
    const parentSnapshot = await snapshot(root, true)
    const childSnapshot = await snapshot(child)
    await preflight({ root, dryRun: true, env, runCommand, log })
    if (await snapshot(root, true) !== parentSnapshot || await snapshot(child) !== childSnapshot) {
        throw new Error('本地预检期间源码或暂存内容发生变化，停止提交和推送')
    }

    async function commitAndPush(cwd, branch, remote) {
        if ((await refs(cwd, [`refs/heads/${branch}`])).get(`refs/heads/${branch}`) !== remote) {
            throw new Error(`${branch} 远端在预检期间已推进，停止推送；请先同步后重试`)
        }
        if (await status(cwd)) {
            log(`${branch === 'main' ? '主仓库' : 'FairyGUI'}：提交全部已暂存、未暂存和未跟踪修改`)
            await git(['add', '-A'], cwd)
            const staged = await invoke('git', ['diff', '--cached', '--quiet'], cwd)
            if (staged.status === 1) await git(['commit', '-m', 'chore: prepare unified release sources'], cwd)
            else if (staged.status !== 0) throw new Error(`无法检查 ${cwd} 的暂存内容`)
        }
        if (await status(cwd)) throw new Error(`${cwd} 提交后仍有修改，停止推送`)
        const sha = await head(cwd)
        if (sha !== remote) await git(['push', 'origin', `HEAD:refs/heads/${branch}`], cwd)
        if ((await refs(cwd, [`refs/heads/${branch}`])).get(`refs/heads/${branch}`) !== sha) {
            throw new Error(`${branch} 推送后远端来源不一致，停止调度`)
        }
        log(`已核验 ${branch} 远端提交：${sha}`)
        return sha
    }
    await commitAndPush(child, 'ccc3.0', childRemote)
    if (await snapshot(root, true) !== parentSnapshot) throw new Error('提交子模块期间主仓库源码发生变化，停止提交主仓库')
    const requestedSha = await commitAndPush(root, 'main', mainRemote)
    if (await dirty()) throw new Error('调度前父子仓库再次出现修改，停止调度')
    return { requestedSha, plan, hasNewRelease }
}
