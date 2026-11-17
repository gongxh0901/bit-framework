#!/usr/bin/env node
/** 发布前把内部 workspace:* 引用转换为统一精确版本。 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getReleasePackages, validateReleasePackages } from './release-workspace.mjs'

const DEP_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies']

/** checkOnly 只返回待发布清单，不修改 package.json。 */
export function prepareNpmPackages(packages, { checkOnly = false } = {}) {
    const version = validateReleasePackages(packages)
    const names = new Set(packages.map(({ packageJson }) => packageJson.name))
    const prepared = packages.map(({ dir, packageJson }) => {
        const pkg = structuredClone(packageJson)
        for (const field of [...DEP_FIELDS, 'devDependencies']) {
            for (const [name, spec] of Object.entries(pkg[field] || {})) {
                if (typeof spec !== 'string' || !spec.startsWith('workspace:')) continue
                if (!names.has(name) || spec !== 'workspace:*') {
                    throw new Error(`${pkg.name}: ${field}.${name} 必须引用发布清单内的 workspace:*`)
                }
                if (field === 'devDependencies') delete pkg[field][name]
                else pkg[field][name] = version
            }
        }
        return { dir, packageJson: pkg }
    })

    // 全部清单校验通过后再写入，避免失败时留下部分转换结果。
    if (!checkOnly) {
        for (const { dir, packageJson } of prepared) {
            const path = join(dir, 'package.json')
            const raw = readFileSync(path, 'utf8')
            const indent = raw.match(/\n(\s+)"/)?.[1] || '    '
            writeFileSync(path, JSON.stringify(packageJson, null, indent) + '\n')
        }
    }
    return prepared
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const checkOnly = process.argv.includes('--check')
        const packages = prepareNpmPackages(await getReleasePackages(), { checkOnly })
        console.log(`${checkOnly ? '已检查' : '已转换'} ${packages.length} 个包的精确内部引用`)
    } catch (error) {
        console.error(error.message)
        process.exitCode = 1
    }
}
