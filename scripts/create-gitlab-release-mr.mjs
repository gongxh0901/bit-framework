#!/usr/bin/env node
/**
 * 在 GitLab 上生成或更新 Changesets Release MR。
 *
 * 需要项目 CI/CD 变量 GITLAB_NPM_TOKEN，权限至少包含 api 和 write_repository。
 */
import { spawnSync } from 'node:child_process'

const token = process.env.GITLAB_NPM_TOKEN
const projectId = process.env.CI_PROJECT_ID
const apiUrl = process.env.CI_API_V4_URL
const serverHost = process.env.CI_SERVER_HOST
const projectPath = process.env.CI_PROJECT_PATH
const sourceBranch = `changeset-release/${process.env.CI_COMMIT_REF_NAME || 'main'}`
const targetBranch = process.env.CI_COMMIT_REF_NAME || 'main'

if (!token || !projectId || !apiUrl || !serverHost || !projectPath) {
    console.error('缺少 GITLAB_NPM_TOKEN 或 GitLab CI 项目变量')
    process.exit(1)
}

function run(command, args, env = process.env) {
    const result = spawnSync(command, args, { stdio: 'inherit', env })
    if (result.status !== 0) process.exit(result.status ?? 1)
}

function hasChangesets() {
    const result = spawnSync('find', ['.changeset', '-maxdepth', '1', '-type', 'f', '-name', '*.md'], {
        encoding: 'utf8',
    })
    return result.stdout.trim().length > 0
}

async function request(path, options = {}) {
    const response = await fetch(`${apiUrl}${path}`, {
        ...options,
        headers: {
            'PRIVATE-TOKEN': token,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    })
    if (!response.ok) {
        console.error(`GitLab API ${response.status}: ${await response.text()}`)
        process.exit(1)
    }
    return response.json()
}

async function main() {
    if (!hasChangesets()) {
        console.log('没有待处理的 changeset，不创建 Release MR')
        return
    }

    run('git', ['config', 'user.name', 'gitlab-release-bot'])
    run('git', ['config', 'user.email', 'gitlab-release-bot@noreply.local'])

    const remoteUrl = `https://oauth2:${encodeURIComponent(token)}@${serverHost}/${projectPath}.git`
    run('git', ['remote', 'set-url', 'origin', remoteUrl])
    run('git', ['fetch', 'origin', targetBranch])
    run('git', ['checkout', '-B', sourceBranch])
    run('pnpm', ['version:packages'])

    const status = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).stdout.trim()
    if (!status) {
        console.log('没有版本变更，不创建 Release MR')
        return
    }

    run('git', ['add', '.'])
    run('git', ['commit', '-m', 'chore: release packages'])
    run('git', ['push', 'origin', `HEAD:${sourceBranch}`, '--force'])

    const encodedProject = encodeURIComponent(projectId)
    const query = `?state=opened&source_branch=${encodeURIComponent(sourceBranch)}&target_branch=${encodeURIComponent(targetBranch)}`
    const mergeRequests = await request(`/projects/${encodedProject}/merge_requests${query}`)
    if (mergeRequests.length) {
        console.log(`Release MR 已存在：!${mergeRequests[0].iid}`)
        return
    }

    const mr = await request(`/projects/${encodedProject}/merge_requests`, {
        method: 'POST',
        body: JSON.stringify({
            source_branch: sourceBranch,
            target_branch: targetBranch,
            title: 'chore: release packages',
            description: 'Changesets 自动生成的 Release MR，请审核版本号、CHANGELOG 和构建结果后合并。',
            remove_source_branch: true,
        }),
    })
    console.log(`Release MR 已创建：${mr.web_url}`)
}

main()
