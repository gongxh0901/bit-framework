#!/usr/bin/env node
/**
 * 把 peerDependencies / dependencies 里的 workspace: 协议替换成真实版本号。
 *
 * npm CLI 不认识 pnpm 的 workspace: 协议，直接 npm publish 会把 "workspace:^"
 * 原样发到 registry，消费者安装时报 invalid version。CI 里用 npm publish
 * （trusted publishing 需要 npm CLI）之前必须先跑这个脚本。
 *
 * 用法：
 *   node scripts/prepare-npm-publish.mjs           # 就地替换
 *   node scripts/prepare-npm-publish.mjs --check    # 只检查，不写入
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK_ONLY = process.argv.includes('--check')

const PACKAGES = [
    'bit-core',
    'bit-event',
    'bit-ecs',
    'bit-ec',
    'bit-net',
    'bit-assets',
    'bit-quadtree',
    'bit-behaviortree',
    'bit-ui',
    'bit-condition',
    'bit-minigame',
    'bit-hotupdate',
    'vendor/fairygui-cc/source',
]

const DEP_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies']

/** 收集 workspace 内所有包的真实版本 */
function collectVersions() {
    const versions = new Map()
    for (const dir of PACKAGES) {
        const pkg = JSON.parse(readFileSync(join(ROOT, dir, 'package.json'), 'utf8'))
        versions.set(pkg.name, pkg.version)
    }
    return versions
}

/**
 * workspace:^  → ^1.2.3
 * workspace:~  → ~1.2.3
 * workspace:*  → 1.2.3
 * workspace:1.2.3 → 1.2.3
 */
function resolveRange(spec, version, depName) {
    const rest = spec.slice('workspace:'.length)
    if (rest === '^' || rest === '') return `^${version}`
    if (rest === '~') return `~${version}`
    if (rest === '*') return version
    return rest
}

function main() {
    const versions = collectVersions()
    const changes = []

    for (const dir of PACKAGES) {
        const pkgPath = join(ROOT, dir, 'package.json')
        const raw = readFileSync(pkgPath, 'utf8')
        const pkg = JSON.parse(raw)
        let touched = false

        for (const field of DEP_FIELDS) {
            const deps = pkg[field]
            if (!deps) continue
            for (const [depName, spec] of Object.entries(deps)) {
                if (typeof spec !== 'string' || !spec.startsWith('workspace:')) continue

                const version = versions.get(depName)
                if (!version) {
                    console.error(`${dir}: ${field}.${depName} 使用 workspace: 协议，但不在 workspace 内`)
                    process.exit(1)
                }

                const resolved = resolveRange(spec, version, depName)
                deps[depName] = resolved
                touched = true
                changes.push(`${dir}: ${field}.${depName}  ${spec} → ${resolved}`)
            }
        }

        // devDependencies 不影响消费者安装，但 workspace: 协议会让解析
        // package.json 的工具（审计、Renovate、镜像同步）报 invalid version。
        // 直接删掉，与 publish-gitlab.mjs 的处理保持一致。
        if (pkg.devDependencies) {
            for (const [depName, spec] of Object.entries(pkg.devDependencies)) {
                if (typeof spec === 'string' && spec.startsWith('workspace:')) {
                    delete pkg.devDependencies[depName]
                    touched = true
                    changes.push(`${dir}: devDependencies.${depName}  ${spec} → 移除`)
                }
            }
        }

        if (touched && !CHECK_ONLY) {
            // 保持原文件缩进风格（bit-* 用 4 空格，fgui 用 2 空格）
            const indent = /^\s{2}"/m.test(raw) && !/^\s{4}"/m.test(raw) ? 2 : 4
            writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + '\n')
        }
    }

    if (!changes.length) {
        console.log('没有 workspace: 协议需要替换')
        return
    }

    console.log(CHECK_ONLY ? '待替换：' : '已替换：')
    for (const line of changes) console.log(`  ${line}`)
}

main()
