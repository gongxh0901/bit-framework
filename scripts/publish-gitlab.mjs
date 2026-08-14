#!/usr/bin/env node
/**
 * 将 workspace 包发布到公司 GitLab Package Registry
 * （bit-cc/bit-framework，project 901 的项目级 registry）。
 *
 * 包名与 npmjs 保持一致，都是 @gongxh/*：项目级 endpoint 不要求 scope 和
 * GitLab namespace 同名（只有实例级 endpoint 才要求），所以不需要改 scope。
 * 早期发的 @bit-cc/* 曾要求把包名 remap，但 dist 产物里的 import 仍写着
 * @gongxh/*，装到 @bit-cc 下解析不到依赖——同名发布正是为了避免这个问题。
 *
 * 不改动仓库里的 package.json：发布前临时把 workspace: 协议替换成真实版本号
 * （npm CLI 不认识该协议），结束后还原。
 *
 * 认证方式（二者其一）：
 *   - CI：GitLab 流水线自动注入 CI_JOB_TOKEN
 *   - 本机：环境变量 GITLAB_TOKEN（需 write_package_registry 权限）
 *
 * 用法：pnpm publish:gitlab            # 发布
 *       pnpm publish:gitlab --dry-run  # 只打包校验，不上传
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const GITLAB_HOST = 'git.lanfeitech.com'
const PROJECT_ID = '901'
const REGISTRY_PATH = `/api/v4/projects/${PROJECT_ID}/packages/npm/`
const GITLAB_NPM = `https://${GITLAB_HOST}${REGISTRY_PATH}`
const SCOPE = '@gongxh'

const DEP_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies']
const DRY_RUN = process.argv.includes('--dry-run')

const PACKAGES = [
    'bit-core',
    'bit-event',
    'bit-net',
    'bit-ecs',
    'bit-assets',
    'bit-quadtree',
    'bit-behaviortree',
    'bit-ec',
    'bit-ui',
    'bit-condition',
    'bit-minigame',
    'bit-hotupdate',
    'vendor/fairygui-cc/source',
]

/** workspace:^ → ^1.2.3 / workspace:~ → ~1.2.3 / workspace:* → 1.2.3 */
function resolveRange(spec, version) {
    const rest = spec.slice('workspace:'.length)
    if (rest === '^' || rest === '') return `^${version}`
    if (rest === '~') return `~${version}`
    if (rest === '*') return version
    return rest
}

/** 收集 workspace 内所有包的真实版本 */
function collectVersions() {
    const versions = new Map()
    for (const dir of PACKAGES) {
        const pkg = JSON.parse(readFileSync(join(ROOT, dir, 'package.json'), 'utf8'))
        versions.set(pkg.name, pkg.version)
    }
    return versions
}

function resolveWorkspaceDeps(deps, versions, dir, field) {
    if (!deps || typeof deps !== 'object') return
    for (const [depName, spec] of Object.entries(deps)) {
        if (typeof spec !== 'string' || !spec.startsWith('workspace:')) continue

        const version = versions.get(depName)
        if (!version) {
            console.error(`${dir}: ${field}.${depName} 使用 workspace: 协议，但不在 workspace 内`)
            process.exit(1)
        }
        deps[depName] = resolveRange(spec, version)
    }
}

function preparePkg(pkg, versions, dir) {
    for (const field of DEP_FIELDS) {
        resolveWorkspaceDeps(pkg[field], versions, dir, field)
    }
    // devDependencies 不影响消费者，但 workspace: 协议会让 npm 校验失败
    if (pkg.devDependencies) {
        for (const depName of Object.keys(pkg.devDependencies)) {
            if (String(pkg.devDependencies[depName]).startsWith('workspace:')) {
                delete pkg.devDependencies[depName]
            }
        }
    }
    // GitLab Package Registry 不支持 provenance / access
    pkg.publishConfig = { registry: GITLAB_NPM }
}

/** 写一个临时 .npmrc 供 npm publish 读取认证信息 */
function writeNpmrc() {
    const npmrcPath = join(ROOT, '.npmrc.gitlab-publish')
    const jobToken = process.env.CI_JOB_TOKEN
    const personalToken = process.env.GITLAB_TOKEN

    const lines = [`${SCOPE}:registry=${GITLAB_NPM}`]
    if (jobToken) {
        // CI：job token 必须用 Job-Token header 语义，npm 侧等价于 _authToken
        lines.push(`//${GITLAB_HOST}${REGISTRY_PATH}:_authToken=${jobToken}`)
        console.log('认证：CI_JOB_TOKEN')
    } else if (personalToken) {
        lines.push(`//${GITLAB_HOST}${REGISTRY_PATH}:_authToken=${personalToken}`)
        console.log('认证：GITLAB_TOKEN')
    } else {
        console.error('缺少 CI_JOB_TOKEN 或 GITLAB_TOKEN，无法发布到 GitLab Package Registry')
        process.exit(1)
    }

    writeFileSync(npmrcPath, lines.join('\n') + '\n')
    return npmrcPath
}

function publishOne(relDir, versions, npmrcPath) {
    const pkgPath = join(ROOT, relDir, 'package.json')
    const original = readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(original)

    if (pkg.private) {
        console.log(`跳过 private: ${pkg.name}`)
        return true
    }

    preparePkg(pkg, versions, relDir)
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

    console.log(`\n>>> ${DRY_RUN ? '校验' : '发布'} ${pkg.name}@${pkg.version}`)
    const args = ['publish', '--userconfig', npmrcPath, '--registry', GITLAB_NPM]
    if (DRY_RUN) args.push('--dry-run')
    const result = spawnSync('npm', args, {
        cwd: join(ROOT, relDir),
        stdio: 'inherit',
        env: process.env,
    })

    writeFileSync(pkgPath, original)

    if (result.status !== 0) {
        console.error(`失败: ${pkg.name}`)
        return false
    }
    return true
}

function main() {
    const versions = collectVersions()
    const npmrcPath = writeNpmrc()
    const failed = []

    try {
        for (const dir of PACKAGES) {
            if (!publishOne(dir, versions, npmrcPath)) failed.push(dir)
        }
    } finally {
        if (existsSync(npmrcPath)) unlinkSync(npmrcPath)
    }

    if (failed.length) {
        console.error(`\n以下包发布失败:\n${failed.map((d) => `  - ${d}`).join('\n')}`)
        process.exit(1)
    }
    console.log(`\n${DRY_RUN ? '校验完成（未上传）' : '全部发布完成'} → ${SCOPE}/* @ ${GITLAB_NPM}`)
}

main()
