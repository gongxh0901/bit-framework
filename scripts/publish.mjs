#!/usr/bin/env node
/** 本地发布入口：准备 Changeset 并提交源码，实际版本生成和上传由 CI 完成。 */
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { ROOT } from './release-workspace.mjs'
import { planVersionPackages } from './version-packages.mjs'
import { publishRelease } from './publish-npm.mjs'

const REPOSITORY = 'gongxh0901/bit-framework'
const CHILD_REPOSITORY = 'gongxh0901/FGUI-cocoscreator'
const WORKFLOW = 'publish.yml'
const SHA = /^[0-9a-f]{40}$/
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function execute(command, args, options) {
    const result = spawnSync(command, args, { ...options, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
    if (result.error) throw result.error
    return result
}

function json(output, description) {
    try { return JSON.parse(output) }
    catch { throw new Error(`${description}没有返回有效 JSON`) }
}

async function prepareSourcesByDefault(options) {
    const { preparePublishSources } = await import('./prepare-publish.mjs')
    return preparePublishSources(options)
}

/** 源码准备、命令、规划、预检和等待均可注入；npm 上传始终由 CI 执行。 */
export async function requestPublish({ root = ROOT, env = process.env, runCommand = execute,
    planVersion = planVersionPackages, preflight = publishRelease, createRequestId = randomUUID,
    prepareSources = prepareSourcesByDefault,
    wait = sleep, now = Date.now, pollInterval = 2000, dispatchTimeout = 120000, log = console.log } = {}) {
    if (env.CI) throw new Error('publish 是本地调度入口，CI 必须直接调用内部发布脚本，禁止递归调度')
    const run = async (command, args, { cwd = root, ...options } = {}) => {
        const result = await runCommand(command, args, { cwd, env, ...options })
        if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} 失败\n${result.stderr || result.stdout || ''}`)
        return result.stdout || ''
    }
    const gh = args => run('gh', [...args, '--repo', REPOSITORY])
    const api = async path => json(await run('gh', ['api', path]), 'GitHub API ')
    await run('gh', ['--version'])
    await run('gh', ['auth', 'status', '--hostname', 'github.com'])
    const { requestedSha, plan, hasNewRelease = false } = await prepareSources({ root, env, runCommand, planVersion, preflight, log })
    if (!SHA.test(requestedSha || '') || !VERSION.test(plan?.version || '')) throw new Error('源码准备没有返回有效提交和统一版本计划，停止调度')
    const requestIds = new Set()
    async function dispatchAndWait() {
        const requestId = createRequestId()
        if (!/^[a-zA-Z0-9-]+$/.test(requestId || '') || requestIds.has(requestId)) throw new Error('发布请求标识无效或重复')
        requestIds.add(requestId)
        await gh(['workflow', 'run', WORKFLOW, '--ref', 'main', '-f', `request_id=${requestId}`, '-f', `requested_sha=${requestedSha}`])
        log(`已调度发布请求 ${requestId}；本地计划 ${plan.version}，CI 优先恢复未完成批次，实际版本以 CI 核验结果为准`)
        const title = `Unified release · ${requestId}`
        const deadline = now() + dispatchTimeout
        let selected
        do {
            const runs = json(await gh(['run', 'list', '--workflow', WORKFLOW, '--branch', 'main', '--event', 'workflow_dispatch',
                '--limit', '100', '--json', 'databaseId,displayTitle,headSha,status,conclusion,url']), '工作流列表')
            if (!Array.isArray(runs)) throw new Error('工作流列表格式无效')
            const matches = runs.filter(candidate => candidate.displayTitle === title)
            if (matches.length > 1) throw new Error(`发布请求 ${requestId} 匹配多个运行，停止猜测运行结果`)
            selected = matches[0]
            if (selected) break
            if (now() >= deadline) throw new Error(`未能关联发布请求 ${requestId}；请在 GitHub Actions 按该请求标识检查，不要据此判断发布失败或重复创建版本`)
            await wait(pollInterval)
        } while (true)
        if (!Number.isSafeInteger(selected.databaseId) || selected.databaseId <= 0 || !selected.url) throw new Error('发布工作流缺少有效运行 ID 或链接')
        const runId = String(selected.databaseId)
        const url = selected.url
        log(`跟踪本次发布工作流：${url}`)
        if (selected.headSha !== requestedSha) throw new Error(`调度期间 GitHub main 已变化，本次运行来源与请求提交不一致：${url}`)
        let scratch
        try {
            await run('gh', ['run', 'watch', runId, '--exit-status', '--compact', '--repo', REPOSITORY], { stdio: 'inherit' })
            const actualRun = json(await gh(['run', 'view', runId, '--json', 'databaseId,displayTitle,status,conclusion,url']), '工作流结果')
            if (actualRun.databaseId !== selected.databaseId || actualRun.displayTitle !== title ||
                actualRun.status !== 'completed' || actualRun.conclusion !== 'success') throw new Error('本次工作流尚未成功完成，不能报告发布成功')
            scratch = mkdtempSync(join(tmpdir(), 'bit-release-result-'))
            await gh(['run', 'download', runId, '--name', 'release-result', '--dir', scratch])
            const path = join(scratch, 'release-result.json')
            if (!existsSync(path)) throw new Error('CI 未提供 release-result.json，无法确认实际发布阶段')
            const result = json(readFileSync(path, 'utf8'), 'CI 发布结果')
            if (result.status === 'none') {
                log(`CI 没有待发布批次，本次未上传 npm：${url}`)
                return { status: 'none', runId, url }
            }
            if (result.status !== 'published' || !VERSION.test(result.version || '') ||
                !SHA.test(result.sourceSha || '') || !SHA.test(result.submoduleSha || '') ||
                !Array.isArray(result.packages) || !result.packages.length ||
                result.packages.some(name => typeof name !== 'string' || !name) ||
                new Set(result.packages).size !== result.packages.length) throw new Error('CI 发布结果缺少完整的版本、来源或包清单证据')
            async function tagCommit(repository) {
                let object = (await api(`repos/${repository}/git/ref/tags/v${result.version}`)).object
                for (let depth = 0; depth < 8; depth++) {
                    if (!object || !SHA.test(object.sha || '')) throw new Error(`${repository} 正式 tag 无效`)
                    if (object.type === 'commit') return object.sha
                    if (object.type !== 'tag') throw new Error(`${repository} 正式 tag 未指向提交`)
                    object = (await api(`repos/${repository}/git/tags/${object.sha}`)).object
                }
                throw new Error(`${repository} 正式 tag 嵌套层数异常`)
            }
            if (await tagCommit(REPOSITORY) !== result.sourceSha || await tagCommit(CHILD_REPOSITORY) !== result.submoduleSha) {
                throw new Error('双仓 vtag 与 CI 记录的实际发布提交不一致，不能报告发布成功')
            }
            log(`版本 ${result.version} 的 ${result.packages.length} 个包已完成发布，双仓 v${result.version} tag 核验通过：${url}`)
            return { ...result, runId, url }
        } catch (error) {
            throw new Error(`${error.message}\n本次发布工作流：${url}`)
        } finally {
            if (scratch) rmSync(scratch, { recursive: true, force: true })
        }
    }

    const first = await dispatchAndWait()
    if (!hasNewRelease) return first
    if (first.status !== 'published') throw new Error(`CI 未发布本次计划版本 ${plan.version}，本次队列尚未完成：${first.url}`)
    if (first.version === plan.version) return first
    let main
    try { main = await api(`repos/${REPOSITORY}/git/ref/heads/main`) }
    catch (error) {
        throw new Error(`旧批次 ${first.version} 已完成，但无法确认远端 main；本次排队版本 ${plan.version} 尚未发布：${error.message}\n旧批次工作流：${first.url}`)
    }
    if (main.object?.type !== 'commit' || main.object.sha !== requestedSha) {
        throw new Error(`旧批次 ${first.version} 已完成，但远端 main 已变化；本次排队版本 ${plan.version} 尚未发布，停止继续调度。旧批次：${first.url}`)
    }
    log(`旧批次 ${first.version} 已完成，继续发布本次排队版本 ${plan.version}；仍使用已推送源码 ${requestedSha}`)
    let second
    try { second = await dispatchAndWait() }
    catch (error) {
        throw new Error(`旧批次 ${first.version} 已完成，本次排队版本 ${plan.version} 尚未完成：${error.message}\n旧批次工作流：${first.url}`)
    }
    if (second.status !== 'published' || second.version !== plan.version) {
        throw new Error(`已执行两次发布，本次排队版本 ${plan.version} 仍未完成，停止自动跟进：${second.url}\n旧批次工作流：${first.url}`)
    }
    return { ...second, previousRelease: first }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        if (process.argv.length > 2) throw new Error('用法：mise run publish（创建或复用 Changeset，提交源码并发布）')
        await requestPublish()
    } catch (error) {
        console.error(error.message)
        process.exitCode = 1
    }
}
