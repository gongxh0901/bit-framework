---
name: release
description: Use when planning or performing an independent-package release of bit-framework with Changesets. Only changed packages and required internal dependency updates are versioned and published.
---

# Release：独立版本发版

使用 Changesets 管理版本，不再使用根 `package.json` 的 `version:patch|minor|major`。每个包拥有独立版本号；根包 `@gongxh/bit-framework` 为 private，不参与发布。

## 发布原则

- 修改包时在 `.changeset/*.md` 声明包名和 `patch` / `minor` / `major`。
- `changeset version` 计算每个包的最高升级级别，更新包版本和 CHANGELOG。
- 只升级有变更或因内部依赖范围变化而必须升级的包，不再统一升级所有包。
- 包间依赖在源码中保留 `workspace:^` / `workspace:~`；发布前转换为 `^x.y.z` / `~x.y.z`。
- 不使用 `fixed` 或 `linked`，除非未来明确要求某组包共享版本。

## 流程

### 1. 开发提交变更集

```bash
pnpm changeset
```

规则：

- 只改实现但不改变 API：`patch`。
- 新增向后兼容 API：`minor`。
- 删除、重命名或改变现有 API：`major`。
- 只修改文档、测试或不进入发布包的构建脚本：不添加 changeset。
- 修改公共底层包时，确认直接依赖它的包是否也有 API 变化；Changesets 不替代 API 判断。

### 2. 校验

```bash
pnpm changeset status
pnpm install --frozen-lockfile
pnpm build
```

主仓库和 `vendor/fairygui-cc` 子模块工作区都必须干净。若子模块有独立变更，先按其仓库流程处理。

### 3. Release PR 自动生成版本和日志

```bash
此步骤由 GitHub `changesets/action` 自动完成，不再手动执行。Action 在 `main` 上检测到未消费的 changeset 后，会创建或更新 `chore: release packages` PR。

Release PR 包含：

- 受影响包的版本升级。
- 内部依赖范围更新。
- 各包 CHANGELOG 更新。
- 删除已消费的 changeset 文件。

Release PR 的 CI 必须通过：

```bash
pnpm changeset status
pnpm install --frozen-lockfile
pnpm build
```

合并 Release PR 后，GitHub Action 生成 `chore: release packages` 提交并执行 npmjs 发布；GitLab 检测到同一版本提交后执行内部 registry 发布。

### 4. 合并 Release PR

```bash
不再手动执行 `pnpm version:packages` 或提交 `chore: version packages`。只需审核并合并机器人创建的 `chore: release packages` PR。
```

不要提交 `dist/`，除非外部发布仓库明确要求构建产物入库。子模块按独立仓库提交，主仓库只更新其 SHA。

### 5. CI 发布

CI 读取 Changesets 计算出的清单，只发布这些包：

```bash
pnpm changeset publish
```

发布前必须构建受影响包及其构建依赖，将发布包中的 `workspace:` 依赖转换为真实 semver 范围，并按依赖拓扑顺序发布。已存在的 `name@version` 应视为已发布，以保证 CI 重试幂等。

不再使用一个 `v0.6.0` 表示整个 monorepo 的统一版本；各包使用自己的 `name@version` 标识版本。

## 包依赖约定

源码示例：

```json
{
  "peerDependencies": {
    "@gongxh/bit-core": "workspace:^"
  },
  "devDependencies": {
    "@gongxh/bit-core": "workspace:*"
  }
}
```

发布后的依赖必须是合法范围，例如 `"@gongxh/bit-core": "^0.6.0"`。`workspace:*` 仅用于本地开发，不能出现在发布包的依赖字段中。

## FairyGUI 子模块

`@gongxh/fairygui-cc` 位于独立 git 子模块：

1. FairyGUI 变更在子模块仓库创建并消费 changeset。
2. 在子模块仓库发布对应版本并推送其 tag。
3. 主仓库更新子模块 SHA，并在需要时更新 `bit-ui` / `bit-condition` 的依赖范围。
4. 主仓库创建对应 changeset，只发布主仓库受影响的包。

操作子模块一律使用 `git -C vendor/fairygui-cc`，不得用主仓库命令误操作子模块。

## 应急发布

CI 不可用时仍使用同一份 Changesets 清单，不得退回“所有包统一升版本”：

```bash
pnpm changeset status
pnpm build
pnpm changeset publish --dry-run
```

确认清单后使用对应 registry 的 token 正式发布。手动 npm 发布不带 provenance；完成后记录已发布包和版本。

## 完成汇报

报告本次发布的包及各自版本、因依赖范围变化而升级的包、未发布包（如有）以及 npmjs / GitLab CI 地址和结果。CI 只触发或通过时，不得声称“已发布成功”。
