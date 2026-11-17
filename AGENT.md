# Bit Framework — AI 开发指令

> 基于 Cocos Creator 3.x 的游戏框架 Monorepo，mise tasks + pnpm workspace + Rollup。架构见 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

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
├── bit-minigame/       # 小游戏平台适配
├── bit-hotupdate/      # 热更新
├── vendor/fairygui-cc/ # FairyGUI fork（git submodule）
├── scripts/            # 发布辅助脚本
├── docs/
├── .github/workflows/  # npmjs 发布（trusted publishing）
└── rollup.config.base.mjs
```

## 关键文件

| 任务 | 位置 |
|------|------|
| 构建配置 | `rollup.config.base.mjs` |
| 开发任务 | 根 `mise.toml` |
| 模块依赖 | `docs/ARCHITECTURE.md` |
| 构建/发布命令 | `docs/COMMANDS.md` |
| npmjs 发布 | `.github/workflows/publish.yml` |
| 本地发布入口 | `scripts/publish.mjs` |
| workspace 协议转换 | `scripts/prepare-npm-publish.mjs`（npm CLI 不认 `workspace:`） |
| 全量发布与失败重试 | `scripts/publish-npm.mjs` |
| 各模块入口 | `bit-xxx/src/index.ts` |
| UI 窗口基类 | `bit-ui/src/window/` |
| ECS | `bit-ecs/src/` |
| 装饰器 | 各模块 `*Decorator.ts` |

## 约定

- npm 包：`@gongxh/bit-*` 和 `@gongxh/fairygui-cc`，发布到 npmjs。
- 所有公开 workspace 包使用同一版本，每次发版全部发布；新增公开包自动纳入统一版本组和发布校验。
- 包间依赖统一使用 `workspace:*`；发布时转换为本批次精确版本，移除开发依赖中的 workspace 条目。
- 修改源码后由构建生成 `dist/`；FairyGUI 的 `source/dist` 由子仓库跟踪，发版提交包含实际变化的产物。
- 禁止循环依赖、`as any`、空 catch
- commit: `feat` / `fix` / `refactor` / `docs` / `chore`
- npm 上传由 CI 执行，本地通过 `mise run publish` 调度并等待结果。

## 开发

```bash
mise run setup
mise run build
mise run changeset
mise run publish
```

只提供以上四个 mise task。`setup` 安装固定的 Node.js、pnpm 和 GitHub CLI 版本，同步子模块到主仓库记录的 gitlink 并安装依赖；CI 安装使用冻结锁文件。`changeset` 可单独记录变更。`publish` 携带本地修改进行仅快进同步、全量构建、准备 Changeset、预检并提交推送父子仓库全部可提交修改，再通过 GitHub CLI 调度发布并等待结果。

## Skills

| 命令 | 用途 |
|------|------|
| `$fairygui-release` | 准备包含 FairyGUI 的全量统一发版 |
| `/changelog` | 生成 CHANGELOG |

## AI 技能规则

技能实际存放在根目录 `skills/`，`.codex/skills` 是指向它的软链接。修改技能时只修改 `skills/` 下的源文件。

### changelog

- 根据 git log 生成 CHANGELOG 条目，包含主仓库和 `vendor/fairygui-cc` 子模块的提交。
- 按 `feat`、`fix`、`refactor`/其他、`docs`、`chore` 分类。
- 过滤 `chore: bump version` 和 `chore: release`。
- 版本号读取并校验所有公开包的 `package.json`，全部一致后使用该统一版本；日期使用当天日期。
- 已有 CHANGELOG 时插入到第一个 `## [` 之前，完成后展示写入条目。
- 包日志只记录该包的真实变化；没有实际变化的包保留统一版本条目，不虚构变更说明。

### release

- 执行 `mise run publish` 即授权自动提交并推送主仓库和 `vendor/fairygui-cc` 内全部可提交修改，包含已暂存、未暂存及未被 Git 忽略的未跟踪文件；不增加逐次确认步骤。
- Changesets 按本批次最高 `patch` / `minor` / `major` 级别统一升级全部公开包，当前范围是 12 个 bit 包和 FairyGUI，共 13 个包。
- 主仓库发布分支是 `main`，子仓库正式分支是 `ccc3.0`。使用 Git 原生 `merge --ff-only --autostash` 携带已跟踪的暂存和未暂存修改做仅快进同步；主仓库同步后，先使子模块包含主仓库 gitlink，再同步 `ccc3.0`，全部源码同步后才构建。
- 检查 Git 冲突和自动 stash 恢复结果；分叉、恢复冲突或未跟踪文件覆盖保护等无法安全同步时停止，保留 stash 和冲突现场，通过 `git status`、`git stash list` 检查恢复，不自动 rebase、强推或清理现场。
- `publish` 完成全量构建后复用已有非空 Changeset，没有可复用记录时交互填写；规划和打包检查成功后先将子仓库全部修改提交推送到 `ccc3.0`，再将主仓库全部修改和 gitlink 提交推送到 `main`。
- `publish` 使用已登录的 `gh` 调度主仓库 `publish.yml` 并等待本次运行；正式发布由手动调度触发，普通 PR 执行校验。
- CI 先全量构建，再消费 Changeset，统一更新版本、包级 CHANGELOG 和锁文件；FairyGUI 的版本提交先推到子仓库专用发布分支，主仓库版本提交记录该 gitlink 并推送到 `main`。
- 生成版本的运行仅预检、冻结并返回 `prepared`；入口核验 pending 后从 `bit-framework-release/pending` 启动发布运行。npm 上传前要求 GitHub 事件 SHA 与冻结 HEAD 一致，不改写 `GITHUB_SHA`，保持 OIDC 与 provenance 来源一致。
- CI 在上传 npm 前冻结主仓库版本提交，确保子仓库 `ccc3.0` 包含本批次 gitlink，必要时快进；已包含该提交的后代分支保持原位，真正分叉时停止。发布仍使用冻结 gitlink，不混入后代源码。
- 主仓库 `refs/heads/bit-framework-release/pending` 冻结正在发布的主仓库 SHA；失败后按同一 SHA、版本和产物重试，完成前阻止下一版本。
- 发布前统一构建并检查所有包。全部上传到 npm `release-candidate` 标签并验证后，逐包提升 `latest`；双仓库同名 `vX.Y.Z` tag 完成后清除 pending 引用。
- npm 上传和 `dist-tag` 变更只在主仓库 `.github/workflows/publish.yml` 执行，本地入口负责构建、Changeset、预检、父子仓库提交推送、调度和结果核验。
- 恢复 pending 且没有新改动时不生成 Changeset；有新改动时可先准备入队，CI 优先完成旧批次。若本次有新版本计划且先完成旧批次，入口确认远端 `main` 仍为本次队列提交后，再处理目标版本。每批最多一次准备运行和一次发布运行，总共最多两批、四次运行，请求标识各不相同。目标版本完成后整个命令才成功，失败、来源或冻结引用变化、发布结果与准备清单不一致时停止并报告未完成。
- 发布凭证使用 GitHub App 的 `RELEASE_APP_CLIENT_ID` 仓库变量和 `RELEASE_APP_PRIVATE_KEY` 仓库 secret；App 需要两个仓库的 Contents 读写权限。
- npm trusted publisher 对全部包授权主仓库 `publish.yml` 的 publish 和 dist-tag 操作；发布环境使用 npm 11.21.0 或以上版本。
- 以全量包版本、`latest`、双仓库 tag 和 CI 结果为发布完成证据；部分成功必须报告未完成的包和步骤。
