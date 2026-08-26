#!/usr/bin/env node
/**
 * 使用 Changesets 将需要发布的包发布到公司 GitLab Package Registry。
 *
 * Changesets 负责计算独立包发布清单；本脚本负责临时解析 workspace:、
 * 切换 registry 和提供 GitLab 认证，结束后恢复 package.json。
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const GITLAB_HOST = 'git.lanfeitech.com'
const PROJECT_ID = '901'
const REGISTRY_PATH = `/api/v4/projects/${PROJECT_ID}/packages/npm/`
const REGISTRY = `https://${GITLAB_HOST}${REGISTRY_PATH}`
const PACKAGE_DIRS = [
    'bit-core', 'bit-event', 'bit-net', 'bit-ecs', 'bit-assets',
    'bit-quadtree', 'bit-behaviortree', 'bit-ec', 'bit-ui',
    'bit-condition', 'bit-minigame', 'bit-hotupdate',
    'vendor/fairygui-cc/source',
]
const DRY_RUN = process.argv.includes('--dry-run')

function snapshot() {
    return new Map(PACKAGE_DIRS.map((dir) => {
        const path = join(ROOT, dir, 'package.json')
        return [path, readFileSync(path, 'utf8')]
    }))
}

function restore(saved) {
    for (const [path, content] of saved) writeFileSync(path, content)
}

function prepareRegistry(saved) {
    for (const [path] of saved) {
        const pkg = JSON.parse(readFileSync(path, 'utf8'))
        pkg.publishConfig = { ...pkg.publishConfig, registry: REGISTRY }
        writeFileSync(path, JSON.stringify(pkg, null, 4) + '\n')
    }
}

function writeNpmrc() {
    const jobToken = process.env.CI_JOB_TOKEN
    const personalToken = process.env.GITLAB_NPM_TOKEN
    const token = jobToken || personalToken
    if (!token) {
        console.error('缺少 CI_JOB_TOKEN 或 GITLAB_NPM_TOKEN，无法发布到 GitLab Package Registry')
        return null
    }
    const path = join(ROOT, '.npmrc.gitlab-publish')
    writeFileSync(path, [
        `@gongxh:registry=${REGISTRY}`,
        `//${GITLAB_HOST}${REGISTRY_PATH}:_authToken=${token}`,
        '',
    ].join('\n'))
    console.log(`认证：${jobToken ? 'CI_JOB_TOKEN' : 'GITLAB_NPM_TOKEN'}`)
    return path
}

function run(args, env = process.env) {
    return spawnSync('pnpm', args, { cwd: ROOT, stdio: 'inherit', env }).status
}

function main() {
    const saved = snapshot()
    let npmrcPath = null
    try {
        if (DRY_RUN) {
            console.log('模式：dry-run（只检查 Changesets 清单，不上传）')
            process.exitCode = run(['exec', 'changeset', 'status', '--verbose'])
            return
        }

        npmrcPath = writeNpmrc()
        if (!npmrcPath) {
            process.exitCode = 1
            return
        }
        prepareRegistry(saved)
        if (run(['exec', 'node', 'scripts/prepare-npm-publish.mjs']) !== 0) {
            console.error('workspace 协议转换失败')
            process.exitCode = 1
            return
        }
        process.env.NPM_CONFIG_USERCONFIG = npmrcPath
        // npmjs CI 负责创建包级 tag，GitLab CI 只负责发布到内部 registry。
        process.exitCode = run(['exec', 'changeset', 'publish', '--no-git-tag'], process.env)
    } finally {
        restore(saved)
        if (npmrcPath && existsSync(npmrcPath)) unlinkSync(npmrcPath)
        console.log('\npackage.json 已还原')
    }
}

main()
