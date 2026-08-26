#!/usr/bin/env node
/**
 * 使用 Changesets 将需要发布的包发布到 npmjs。
 *
 * Changesets 根据包版本和 git tag 判断发布清单，不要求所有包版本一致。
 * 发布前临时解析 workspace: 协议，结束后恢复 package.json。
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
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

function run(args) {
    return spawnSync('pnpm', args, { cwd: ROOT, stdio: 'inherit', env: process.env }).status
}

function main() {
    const saved = snapshot()
    try {
        if (DRY_RUN) {
            console.log('模式：dry-run（只检查 Changesets 清单，不上传）')
            process.exitCode = run(['exec', 'changeset', 'status', '--verbose'])
            return
        }

        if (run(['exec', 'node', 'scripts/prepare-npm-publish.mjs']) !== 0) {
            console.error('workspace 协议转换失败')
            process.exitCode = 1
            return
        }
        process.exitCode = run(['exec', 'changeset', 'publish'])
    } finally {
        restore(saved)
        console.log('\npackage.json 已还原')
    }
}

main()
