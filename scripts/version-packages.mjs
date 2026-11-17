import applyReleasePlan from '@changesets/apply-release-plan'
import assembleReleasePlan from '@changesets/assemble-release-plan'
import { read as readConfig } from '@changesets/config'
import readChangesets from '@changesets/read'
import { getPackages } from '@manypkg/get-packages'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOT, getReleasePackages, validateReleasePackages } from './release-workspace.mjs'
import { assertNoPendingRelease, finalizeVersionCommit, prepareSubmoduleRelease } from './release-git.mjs'

/** 统一版本以 Changesets 明确选择的最高等级计算。 */
export async function planVersionPackages(root = ROOT) {
    if (existsSync(join(root, '.changeset/pre.json'))) {
        throw new Error('统一正式发布不支持 Changesets 预发布状态，请先退出预发布模式')
    }
    const workspace = await getPackages(root)
    const packages = workspace.packages.filter(({ packageJson }) => !packageJson.private)
    const currentVersion = validateReleasePackages(packages)
    const config = await readConfig(root, workspace)
    const names = new Set(packages.map(({ packageJson }) => packageJson.name))
    if (config.fixed.length !== 1 || config.fixed[0].length !== names.size ||
        config.fixed[0].some((name) => !names.has(name))) {
        throw new Error('Changesets fixed 必须用一个组覆盖所有公开 workspace 包，请同步发布范围配置')
    }

    const planningWorkspace = structuredClone(workspace)
    // 同一批次的精确 peer 随版本同步更新，不应额外抬高用户选择的升级等级。
    // 只修改内存中的规划副本；应用计划时仍使用真实 manifest。
    for (const { packageJson } of planningWorkspace.packages) {
        for (const name of Object.keys(packageJson.peerDependencies || {})) {
            if (names.has(name)) delete packageJson.peerDependencies[name]
        }
    }
    const changesets = await readChangesets(root)
    const plan = assembleReleasePlan(changesets, planningWorkspace, config, undefined)
    if (plan.releases.length && (plan.releases.length !== packages.length ||
        new Set(plan.releases.map(({ newVersion }) => newVersion)).size !== 1)) {
        throw new Error('版本计划未覆盖全部包或目标版本不一致')
    }
    const version = plan.releases[0]?.newVersion || currentVersion
    return { packages, workspace, config, plan, version }
}

/** 应用统一版本和日志，不提交或推送父仓库及子模块。 */
export async function versionPackages(root = ROOT) {
    const result = await planVersionPackages(root)
    if (result.plan.releases.length) {
        await applyReleasePlan(result.plan, result.workspace, result.config)
    }
    return result
}

async function main() {
    const args = process.argv.slice(2)
    if (args.some((arg) => arg !== '--status')) throw new Error(`未知参数：${args.join(' ')}`)
    const statusOnly = args.includes('--status')
    if (!statusOnly && process.env.CI === 'true') assertNoPendingRelease(ROOT)
    const result = await (statusOnly ? planVersionPackages(ROOT) : versionPackages(ROOT))
    if (!result.plan.releases.length) {
        if (!statusOnly && process.env.CI === 'true') throw new Error('没有待发布的 Changesets，无法生成统一发布版本')
        console.log('没有待发布的 Changesets')
        return
    }
    console.log(`统一发布版本：${result.version}`)
    for (const release of result.plan.releases) {
        console.log(`${release.name}: ${release.oldVersion} → ${release.newVersion} (${release.type})`)
    }
    if (!statusOnly) {
        const lock = spawnSync('pnpm', ['install', '--lockfile-only'], { cwd: ROOT, stdio: 'inherit' })
        if (lock.error) throw lock.error
        if (lock.status !== 0) throw new Error(`更新 pnpm 锁文件失败，退出码 ${lock.status}`)
        if (process.env.CI === 'true') {
            const packages = await getReleasePackages(ROOT)
            prepareSubmoduleRelease(ROOT, result.version, packages)
            finalizeVersionCommit(ROOT, result.version, packages)
        }
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error.message)
        process.exitCode = 1
    })
}
