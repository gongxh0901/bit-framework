import { getPackages } from '@manypkg/get-packages'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

/** 读取所有公开 workspace 包，子模块中的包也由 workspace 配置发现。 */
export async function getReleasePackages(root = ROOT) {
    const { packages } = await getPackages(root)
    return packages.filter(({ packageJson }) => !packageJson.private)
}

/** 发布批次只允许一个版本，所有内部依赖均使用精确 workspace 引用。 */
export function validateReleasePackages(packages) {
    if (!packages.length) throw new Error('没有可发布的 workspace 包')
    const names = new Set(packages.map(({ packageJson }) => packageJson.name))
    if (names.size !== packages.length) throw new Error('workspace 中存在重复包名')
    const version = packages[0].packageJson.version
    if (!version) throw new Error(`${packages[0].packageJson.name} 缺少版本号`)

    for (const { packageJson } of packages) {
        if (packageJson.version !== version) {
            throw new Error(`${packageJson.name} 版本 ${packageJson.version} 与统一版本 ${version} 不一致`)
        }
        for (const field of DEPENDENCY_FIELDS) {
            for (const [name, range] of Object.entries(packageJson[field] || {})) {
                if (names.has(name) && range !== 'workspace:*') {
                    throw new Error(`${packageJson.name} 的 ${field}.${name} 必须为 workspace:*，当前为 ${range}`)
                }
            }
        }
    }
    return version
}
