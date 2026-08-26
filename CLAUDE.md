# Bit Framework — AI 开发指令

> 基于 Cocos Creator 3.x 的游戏框架 Monorepo，pnpm workspace + Rollup。架构见 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

## 目录结构

```
bit-framework/
├── bit-core/           # Time, Platform, Timer, Utils
├── bit-ui/             # FairyGUI 窗口、装饰器
├── bit-ecs/            # ECS
├── bit-ec/             # Cocos EC
├── bit-event/          # 全局事件
├── bit-net/            # HTTP + WebSocket
├── bit-assets/         # 资源加载
├── bit-quadtree/       # 四叉树
├── bit-behaviortree/   # 行为树
├── bit-condition/      # 条件显示（红点）
├── bit-minigame/       # 小游戏适配
├── bit-hotupdate/      # 热更新
├── vendor/fairygui-cc/ # FairyGUI fork（git submodule）
├── scripts/            # 发布辅助脚本
├── docs/
├── .github/workflows/  # tag v* → npmjs（trusted publishing）
├── .gitlab-ci.yml      # tag v* → GitLab 901 registry
└── rollup.config.base.mjs
```

## 关键文件

| 任务 | 位置 |
|------|------|
| 构建配置 | `rollup.config.base.mjs` |
| pnpm 脚本 | 根 `package.json` |
| 模块依赖 | `docs/ARCHITECTURE.md` |
| 构建/发布命令 | `docs/COMMANDS.md` |
| npmjs 发布 | `.github/workflows/publish.yml` |
| GitLab 发布 | `.gitlab-ci.yml` + `scripts/publish-gitlab.mjs` |
| workspace 协议转换 | `scripts/prepare-npm-publish.mjs`（npm CLI 不认 `workspace:`） |
| 应急手动发包 | `scripts/publish-npm.mjs` / `scripts/publish-gitlab.mjs` |
| fgui 仓库的 workflow | `vendor/fairygui-cc/.github/workflows/publish.yml` |
| 各模块入口 | `bit-xxx/src/index.ts` |
| UI 窗口基类 | `bit-ui/src/window/` |
| ECS | `bit-ecs/src/` |
| 装饰器 | 各模块 `*Decorator.ts` |

## 约定

- npm scope: `@gongxh/bit-*`，npmjs 和 GitLab 901 用同一套包名（不再 remap 成 `@bit-cc/*`）
- workspace 依赖: `peerDependencies` 用 `workspace:^`，`devDependencies` 用 `workspace:*`
  （发布时由 `scripts/prepare-npm-publish.mjs` 把 peer 转成 `^x.y.z`、删掉 devDeps 的 workspace 条目）
- 只改 `src/`，不要改 `dist/`
- 禁止循环依赖、`as any`、空 catch
- commit: `feat` / `fix` / `refactor` / `docs` / `chore`
- 发包由 CI 完成，本机不手动 publish（推 `v*` tag 触发）

## 开发

```bash
pnpm build:core    # 单模块
pnpm build         # 全部
```

## Skills

| 命令 | 用途 |
|------|------|
| `/release` | 发版 |
| `/changelog` | 生成 CHANGELOG |

## AI 技能规则

技能实际存放在根目录 `skills/`，`.claude/skills` 和 `.codex/skills` 都是指向它的软链接。修改技能时只修改 `skills/` 下的源文件。

### changelog

- 根据 git log 生成 CHANGELOG 条目，包含主仓库和 `vendor/fairygui-cc` 子模块的提交。
- 按 `feat`、`fix`、`refactor`/其他、`docs`、`chore` 分类。
- 过滤 `chore: bump version` 和 `chore: release`。
- 版本号读取实际发布包的 `package.json`，日期使用当天日期。
- 已有 CHANGELOG 时插入到第一个 `## [` 之前，完成后展示写入条目。

### release

- 发版前确认目标包、版本变更级别和工作区状态；主仓库及 `vendor/fairygui-cc` 子模块都必须干净。
- 使用 Changesets 管理独立版本：只升级有变更或因内部依赖范围变化而必须升级的包，不再统一升级所有包。
- 合并代码后由 GitHub Changesets Action 和 GitLab Release MR job 创建或更新 Release PR/MR；不要手动提交 `chore: version packages`。
- 包间依赖在源码中使用 `workspace:^` 或 `workspace:~`；发布前解析为真实 semver 范围，禁止发布 `workspace:` 协议。
- 发布前按依赖拓扑构建和校验，只发布本次变更集计算出的包。
- npmjs 和 GitLab 使用同一组包名；CI 负责发布，本机默认不直接 publish。
- `vendor/fairygui-cc` 是独立子模块，涉及它的版本和发布必须先在子模块完成，再更新主仓库记录的 SHA。
- 不得声称“已发布成功”，只能报告版本、包列表和 CI 流水线结果。
