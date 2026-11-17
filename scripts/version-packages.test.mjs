import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import test from 'node:test'
import { ROOT, getReleasePackages, validateReleasePackages } from './release-workspace.mjs'
import { planVersionPackages, versionPackages } from './version-packages.mjs'

const actualPackages = await getReleasePackages(ROOT)
const actualConfig = JSON.parse(await readFile(join(ROOT, '.changeset/config.json'), 'utf8'))
const actualWorkspace = await readFile(join(ROOT, 'pnpm-workspace.yaml'), 'utf8')

async function writeJson(path, value) {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(value, null, 2) + '\n')
}

/** 所有版本应用都在临时 workspace 中进行，保留实际工作区的待发布 changeset。 */
async function fixture(t, version = '0.5.6', releases = []) {
    const root = await mkdtemp(join(tmpdir(), 'bit-release-version-'))
    t.after(() => rm(root, { recursive: true, force: true }))
    await writeJson(join(root, 'package.json'), { name: 'release-test', version, private: true })
    await writeFile(join(root, 'pnpm-workspace.yaml'), actualWorkspace)
    await writeJson(join(root, '.changeset/config.json'), {
        ...actualConfig,
        changelog: './test-changelog.cjs',
    })
    await writeFile(join(root, '.changeset/test-changelog.cjs'), `module.exports = {
    getReleaseLine: async (changeset) => '- ' + changeset.summary,
    getDependencyReleaseLine: async () => '',
}\n`)
    for (const { dir, packageJson } of actualPackages) {
        await writeJson(join(root, relative(ROOT, dir), 'package.json'), { ...packageJson, version })
    }
    if (releases.length) {
        const entries = releases.map(({ name, type }) => `"${name}": ${type}`).join('\n')
        await writeFile(join(root, '.changeset/test-change.md'), `---\n${entries}\n---\n\n测试发布变更\n`)
    }
    return root
}

for (const [base, type, expected] of [
    ['0.5.6', 'patch', '0.5.7'],
    ['0.5.6', 'minor', '0.6.0'],
    ['0.5.6', 'major', '1.0.0'],
    ['1.2.3', 'patch', '1.2.4'],
    ['1.2.3', 'minor', '1.3.0'],
    ['1.2.3', 'major', '2.0.0'],
]) {
    test(`${base} 的 ${type} 计划覆盖所有包且不会被精确 peer 抬高`, async (t) => {
        const root = await fixture(t, base, [{ name: '@gongxh/bit-core', type }])
        const before = await readFile(join(root, 'bit-ui/package.json'), 'utf8')
        const result = await planVersionPackages(root)
        assert.equal(result.version, expected)
        assert.equal(result.plan.releases.length, 13)
        assert.ok(result.plan.releases.every((release) => release.type === type && release.newVersion === expected))
        assert.equal(await readFile(join(root, 'bit-ui/package.json'), 'utf8'), before)
        await access(join(root, '.changeset/test-change.md'))
    })
}

test('混合 changeset 采用最高等级，应用后保留全部精确内部依赖', async (t) => {
    const root = await fixture(t, '0.5.6', [
        { name: '@gongxh/bit-core', type: 'patch' },
        { name: '@gongxh/bit-ui', type: 'minor' },
    ])
    const result = await versionPackages(root)
    assert.equal(result.version, '0.6.0')
    const packages = await getReleasePackages(root)
    assert.equal(packages.length, 13)
    assert.equal(validateReleasePackages(packages), '0.6.0')
    assert.ok(packages.some(({ packageJson }) => packageJson.name === '@gongxh/fairygui-cc'))
    const ui = packages.find(({ packageJson }) => packageJson.name === '@gongxh/bit-ui').packageJson
    assert.equal(ui.peerDependencies['@gongxh/bit-core'], 'workspace:*')
    assert.equal(ui.peerDependencies['@gongxh/fairygui-cc'], 'workspace:*')
    assert.equal(ui.devDependencies['@gongxh/bit-core'], 'workspace:*')
    assert.match(await readFile(join(root, 'bit-core/CHANGELOG.md'), 'utf8'), /0\.6\.0/)
    await assert.rejects(access(join(root, '.changeset/test-change.md')), { code: 'ENOENT' })
})

test('版本漂移在应用前失败且不消费 changeset', async (t) => {
    const root = await fixture(t, '0.5.6', [{ name: '@gongxh/bit-core', type: 'patch' }])
    const path = join(root, 'bit-ui/package.json')
    const pkg = JSON.parse(await readFile(path, 'utf8'))
    await writeJson(path, { ...pkg, version: '0.5.5' })
    await assert.rejects(versionPackages(root), /版本 .* 与统一版本 .* 不一致/)
    await access(join(root, '.changeset/test-change.md'))
})

for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    test(`${field} 的内部范围漂移会被拒绝`, async (t) => {
        const root = await fixture(t)
        const path = join(root, 'bit-ui/package.json')
        const pkg = JSON.parse(await readFile(path, 'utf8'))
        pkg[field] = { ...pkg[field], '@gongxh/bit-core': 'workspace:^' }
        await writeJson(path, pkg)
        await assert.rejects(planVersionPackages(root), /必须为 workspace:\*/)
    })
}

test('无待发布变更时不产生版本计划', async (t) => {
    const root = await fixture(t)
    const result = await versionPackages(root)
    assert.equal(result.version, '0.5.6')
    assert.deepEqual(result.plan.releases, [])
})

test('新增同 scope 的公共 workspace 包自动进入全量发布', async (t) => {
    const root = await fixture(t, '0.5.6', [{ name: '@gongxh/bit-core', type: 'patch' }])
    await writeFile(join(root, 'pnpm-workspace.yaml'), actualWorkspace + "  - 'bit-future'\n")
    await writeJson(join(root, 'bit-future/package.json'), { name: '@gongxh/bit-future', version: '0.5.6' })
    const result = await planVersionPackages(root)
    assert.equal(result.plan.releases.length, 14)
    assert.ok(result.plan.releases.every(({ newVersion }) => newVersion === '0.5.7'))
})

test('固定组遗漏公共包时拒绝部分发布', async (t) => {
    const root = await fixture(t, '0.5.6', [{ name: '@gongxh/bit-core', type: 'patch' }])
    await writeFile(join(root, 'pnpm-workspace.yaml'), actualWorkspace + "  - 'external-package'\n")
    await writeJson(join(root, 'external-package/package.json'), { name: '@other/new-package', version: '0.5.6' })
    await assert.rejects(planVersionPackages(root), /fixed 必须用一个组覆盖所有公开 workspace 包/)
})
