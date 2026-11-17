# 构建与发布

项目提供四个 mise task，在主仓库根目录执行：

| 命令 | 用途 |
|------|------|
| `mise run setup` | 安装固定工具版本、同步 Git 子模块并安装 workspace 依赖 |
| `mise run build` | 按 workspace 依赖顺序构建全部包，包含 FairyGUI |
| `mise run changeset` | 可选的独立入口，交互记录变更包、升级级别和说明 |
| `mise run publish` | 自动构建、准备 Changeset、预检、提交推送父子仓库全部可提交修改，调度 CI 全量发布并等待结果 |

## 初始化与构建

`setup` 依次执行工具安装、子模块 URL 同步、按主仓库 gitlink 检出子模块和依赖安装。Node.js、pnpm 和 GitHub CLI 的版本由根目录 `mise.toml` 管理；CI 使用冻结锁文件安装依赖。

```bash
mise run setup
mise run build
```

`build` 包含 `vendor/fairygui-cc/source`。FairyGUI 的 `source/dist` 由子仓库跟踪，`publish` 会构建并将实际变化的产物纳入自动提交。

首次发布前，在 `setup` 完成后登录 GitHub CLI：

```bash
mise exec -- gh auth login
```

## 一键发布

```bash
mise run publish
```

执行该命令即授权自动提交并推送主仓库与 FairyGUI 子仓库内全部可提交修改，包含已暂存、未暂存和未被 Git 忽略的未跟踪文件。发布入口按以下顺序准备本次发布：

1. 检查主仓库 `main` 和子仓库正式分支 `ccc3.0` 的本地、远端状态。通过 Git 原生 `merge --ff-only --autostash` 携带已跟踪的暂存和未暂存修改做仅快进同步；主仓库同步后，先使子模块包含主仓库 gitlink，再同步 `ccc3.0`。分叉、自动恢复冲突或未跟踪文件覆盖保护等无法安全同步时停止，保留现场，不自动 rebase 或强推。
2. 全量构建所有包，包含 FairyGUI。
3. 复用已有非空 Changeset；没有可复用的记录时，交互选择实际受影响的包、`patch` / `minor` / `major` 级别，并填写变更说明。
4. 检查统一版本计划、完整发布清单、精确内部引用和本地打包内容。
5. 将 FairyGUI 全部可提交修改纳入提交并推送到 `ccc3.0`。
6. 将主仓库全部可提交修改及子模块 gitlink 纳入提交并推送到 `main`。
7. 通过已登录的 GitHub CLI 调度主仓库 `.github/workflows/publish.yml`，关联本次请求并等待结果。

已有未提交修改是自动提交的输入；规划与打包预检成功后才执行提交推送。`changeset` 可提前单独使用，发布时会复用已有的有效记录。恢复 pending 且没有新改动时直接恢复已有批次，不生成新的 Changeset；有新改动时可自动准备并推送入队，CI 优先完成被冻结的批次。

同步会检查自动 stash 是否完整恢复；即使 Git 命令返回成功，仍存在冲突或保留了待恢复的自动 stash 时也停止。失败后在对应仓库使用 `git status`、`git stash list` 检查修改和 stash，解决冲突后重试；发布入口保留这些恢复依据。

本地未跟踪普通文件与远端新增文件同路径，且原始内容和 Git 文件模式完全一致时，同步会自动接纳远端的跟踪状态。内容或模式不同、涉及符号链接、未跟踪路径替换了已跟踪的文件或目录、文件和目录结构冲突，或 Git 属性及自动换行配置可能转换文件内容时，保留原文件并停止，不删除或改名 Changeset。

## 统一版本与 CI 发布

所有公开 workspace 包属于同一固定版本组，以本批次最高变更级别统一升级并全量发布。当前范围是 12 个 `@gongxh/bit-*` 包和 `@gongxh/fairygui-cc`，共 13 个包；新增公开 workspace 包自动纳入统一版本组和发布校验。

源码中的包间依赖使用 `workspace:*`，发布时解析为本批次精确版本。消费项目中已安装的框架包和 FairyGUI 应同步升级。

普通 PR 执行校验，正式发布由本地 `publish` 或 GitHub Actions 的手动调度触发。CI 按以下顺序处理新批次：

1. 按选定的主仓库提交和锁文件安装依赖、校验并全量构建。
2. 消费 Changeset，生成全部包的统一版本、包级 CHANGELOG 和锁文件。
3. 将 FairyGUI 的版本、日志和实际变化的 dist 提交并推送到子仓库 `bit-framework-release/<主仓库源提交 SHA>/v<版本>` 分支。
4. 将记录该子仓库 gitlink 和完整发布清单的版本提交推送到主仓库 `main`。
5. 冻结本批次主仓库版本提交，确保子仓库 `ccc3.0` 包含对应 gitlink，必要时快进。若正式分支已包含该版本提交并继续前进，保留其位置；真正分叉时停止，发布仍使用冻结 gitlink 的源码。
6. 准备运行输出 `prepared` 结果；本地入口核验 pending 仍指向该版本提交，再从 `bit-framework-release/pending` 启动新的发布运行。发布运行的 GitHub 事件 SHA 必须与冻结版本提交一致。
7. 发布运行重新构建和预检，将全部 tgz 上传到 npm `release-candidate`，验证整批目标版本、内容 hash 和精确内部引用后，逐包提升 `latest`。
8. 验证全部 `latest`，在两个仓库创建相同的 `vX.Y.Z` tag，最后解除冻结。

日志按包记录真实变化，没有实际变化的包保留统一版本条目。FairyGUI 的日志位于 `vendor/fairygui-cc/source/CHANGELOG.md`。本地自动提交准备发布的源码和 Changeset，CI 自动提交版本、日志、锁文件和 gitlink；实际 npm 上传和 dist-tag 变更只在 CI 中执行。

OIDC 身份与工作流事件提交绑定，npm provenance 的来源提交必须与其一致。准备运行只生成并冻结版本，不上传 npm；发布运行保留 GitHub 提供的原始 `GITHUB_SHA`。`prepared` 表示准备完成，只有 `published` 并通过双仓 tag 核验才表示发布完成。

npm 在上传后扫描包，通常约五分钟，部分情况可能超过十五分钟才可用，详见 [npm 发布时扫描说明](https://github.blog/changelog/2026-07-28-npm-publish-time-malware-scanning-and-dual-use-metadata/)。发布脚本每十五秒轮询仍未可见的候选包，整批共享二十分钟等待窗口；全部包可见并通过内容校验后才更新 `latest`。标签写入后的回读共享五分钟等待窗口，等待期间不重复上传或重复写入标签。只有明确的版本不存在或标签尚未更新会等待，鉴权、网络、无效响应和内容不一致立即停止；超时保留冻结批次，之后按同一版本恢复。

每次 CI 将事件提交中的发布工具保存在 runner 临时目录，再检出和构建冻结包源码。工具显式使用冻结工作区作为根目录，依赖由该工作区的锁文件安装；npm 包内容和正式标签始终对应冻结提交。

## 失败恢复

主仓库 `refs/heads/bit-framework-release/pending` 指向被冻结的发布提交。任一步失败后保留该批次状态，恢复时使用同一主仓库 SHA、子仓库 gitlink、版本和包内容；已存在的 npm 版本通过内容校验后跳过上传。内容冲突、子仓库分叉或 tag 冲突时停止处理。

已上传整批包而只需完成标签时，可从包含发布工具修复的 `main` 手动调度同一个 `publish.yml`，设置 `finalize_only=true`，并用 `frozen_sha` 指定当前 pending 的完整提交 SHA。仅收尾模式不会创建 Changeset、生成版本或上传包；所有目标版本必须已经存在并通过精确依赖和产物 hash 校验，缺包或内容冲突立即停止。该模式要求 pending 已存在且匹配，不能重建已取消的批次。它允许工具事件提交与包源码提交不同，仅维护 npm 标签、双仓库 Git tag 和 pending，成功结果为 `finalized`。

再次运行 `mise run publish` 恢复批次。入口会携带本地修改做仅快进同步；分叉或无法安全恢复修改时保留现场并停止，可通过 `git status`、`git stash list` 检查恢复。CI 优先处理被冻结的批次，完成前阻止生成下一版本。事件来源与冻结来源不一致时，准备运行只返回冻结批次，再由入口核验 pending 并调度该引用。

如果本次入口已经准备了新版本计划，而先完成的是旧 pending 版本，命令会确认远端 `main` 仍为本次已经推送的队列提交，再处理本次目标版本。每批最多进行一次准备运行和一次发布运行；一个命令最多处理旧批次及本次新批次，共四次运行，每次使用新的请求标识，不重复准备或提交本地源码。只有目标版本完成，整个命令才成功。旧批次失败、来源变化、冻结引用变化、发布运行仍返回 `prepared` 或结果与准备清单不一致时，报告未完成并停止。

也可在 GitHub Actions 的 `Release packages` 工作流选择 `Run workflow`，分支选择 `main`。从页面单独调度只运行一次 CI；若结果为 `prepared`，从 `bit-framework-release/pending` 再手动启动发布运行。旧 pending 完成后，排队的新批次从 `main` 继续调度。

npm 上传和 `latest` 更新按包执行，过程中可能短暂出现部分包已完成的状态。发布完成的依据是全量目标版本、全部 `latest`、双仓库 tag 和 CI 结果。失败恢复时不要提高版本号，也不要覆盖已经发布的版本或已有 tag。

## CI 凭证

| 配置 | 位置 | 用途 |
|------|------|------|
| `RELEASE_APP_CLIENT_ID` | 主仓库 Actions variable | 发布 GitHub App 的 Client ID |
| `RELEASE_APP_PRIVATE_KEY` | 主仓库 Actions secret | 生成发布 App installation token |

GitHub App 安装到 `bit-framework` 和 `FGUI-cocoscreator`，对两个仓库具有 Contents 读写权限，用于维护版本提交、子仓库发布分支、`ccc3.0`、双仓库 tag 和 pending 引用。

全部 npm 包的 trusted publisher 指向 `gongxh0901/bit-framework` 仓库的 `publish.yml`，授权 npm publish 和 dist-tag 操作。CI 使用 npm 11.21.2 及 OIDC；包的 `repository` 指向执行发布的主仓库，FairyGUI 的目录为 `vendor/fairygui-cc/source`。
