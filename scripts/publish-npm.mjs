#!/usr/bin/env node
/**
 * 应急：本机把 @gongxh/* 逐包发布到 npmjs。
 *
 * 正常发版走 GitHub Actions（trusted publishing / OIDC），本脚本仅在
 * GitHub Actions 不可用时使用。手动发的包**不带 provenance**，
 * 因为 SLSA 证明只能由 CI 的 OIDC 流程生成。
 *
 * 用 npm CLI 而非 pnpm publish：pnpm 不做 OIDC 交换，且发布行为需与 CI 一致。
 *
 * 发布前会自动跑 workspace 协议转换，结束后还原 package.json。
 * 包含 @gongxh/fairygui-cc：它与 bit-* 版本号绑定，必须同步发布。
 * （CI 里 fgui 由 FGUI-cocoscreator 仓库自己的 workflow 发 —— trusted publishing
 *   要求包声明的仓库与签发 OIDC 的仓库一致。本机走 token 路径没有这个限制。）
 *
 * 用法：
 *   pnpm publish:npm            # 发布
 *   pnpm publish:npm --dry-run  # 只打包校验，不上传
 *
 * 需要 NPM_TOKEN（勾选 Bypass 2FA 的 granular token），或先 npm login。
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY = 'https://registry.npmjs.org/'
const DRY_RUN = process.argv.includes('--dry-run')

// 按依赖拓扑顺序，与 .github/workflows/publish.yml 保持一致。
// fgui 排最前：bit-ui / bit-condition 的 peer 指向它。
const PACKAGES = [
    'vendor/fairygui-cc/source',
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
]

/** 版本号必须全部一致，否则 peer 会指向不存在的版本 */
function assertVersionsAligned() {
    const versions = new Map()
    for (const dir of PACKAGES) {
        const pkg = JSON.parse(readFileSync(join(ROOT, dir, 'package.json'), 'utf8'))
        versions.set(pkg.name, pkg.version)
    }
    const distinct = [...new Set(versions.values())]
    if (distinct.length > 1) {
        console.error('版本号不一致，无法发布：')
        for (const [name, v] of versions) console.error(`  ${name} -> ${v}`)
        console.error('\n请先跑 pnpm version:patch|minor|major 对齐版本')
        process.exit(1)
    }
    return distinct[0]
}

/** 备份所有将被 prepare 脚本改动的 package.json */
function snapshot() {
    const saved = new Map()
    for (const dir of PACKAGES) {
        const p = join(ROOT, dir, 'package.json')
        saved.set(p, readFileSync(p, 'utf8'))
    }
    return saved
}

function restore(saved) {
    for (const [path, content] of saved) writeFileSync(path, content)
}

function run(cmd, args, cwd) {
    return spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env }).status
}

function main() {
    console.log(DRY_RUN ? '模式：dry-run（不上传）' : '模式：正式发布')
    console.log('注意：手动发布的包不带 provenance\n')

    const version = assertVersionsAligned()
    console.log(`版本: ${version}（${PACKAGES.length} 个包，含 fairygui-cc）\n`)

    const saved = snapshot()
    const failed = []

    try {
        if (run('node', [join(ROOT, 'scripts/prepare-npm-publish.mjs')], ROOT) !== 0) {
            console.error('workspace 协议转换失败')
            process.exit(1)
        }

        for (const dir of PACKAGES) {
            const pkg = JSON.parse(readFileSync(join(ROOT, dir, 'package.json'), 'utf8'))
            console.log(`\n>>> ${DRY_RUN ? '校验' : '发布'} ${pkg.name}@${pkg.version}`)

            const args = ['publish', '--registry', REGISTRY]
            if (DRY_RUN) args.push('--dry-run')
            if (run('npm', args, join(ROOT, dir)) !== 0) failed.push(pkg.name)
        }
    } finally {
        restore(saved)
        console.log('\npackage.json 已还原')
    }

    if (failed.length) {
        console.error(`\n以下包失败:\n${failed.map((n) => `  - ${n}`).join('\n')}`)
        process.exit(1)
    }
    console.log(DRY_RUN ? '\n校验完成（未上传）' : '\n全部发布完成 → npmjs')
    if (!DRY_RUN) {
        console.log('提醒：这些包没有 provenance，建议后续补发一个走 CI 的版本')
    }
}

main()
