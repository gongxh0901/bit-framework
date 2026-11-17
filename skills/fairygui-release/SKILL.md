---
name: fairygui-release
description: Prepare and track a full-workspace bit-framework release including fairygui-cc, automatically preparing Changesets and committing all workspace changes before CI publishing and frozen-batch recovery.
---

# 包含 FairyGUI 的统一发版

用于执行或跟踪 bit-framework 全量发布。全部公开 workspace 包与 `@gongxh/fairygui-cc` 使用同一版本和精确内部依赖，由主仓库手动调度的 `.github/workflows/publish.yml` 发布。完整流程与凭证见 [构建与发布](../../docs/COMMANDS.md)。

## 开发入口

仅使用四个 mise task：

- `mise run setup`：安装固定的 Node.js、pnpm 和 GitHub CLI，按主仓库 gitlink 同步子模块并安装依赖；CI 冻结锁文件。
- `mise run build`：按依赖顺序全量构建，包含 FairyGUI。
- `mise run changeset`：可选的独立入口，交互记录真实受影响的包、升级级别和说明。
- `mise run publish`：自动构建、准备 Changeset、预检、提交推送父子仓库全部可提交修改，调度主仓库 CI 并等待本次结果。

## 一键发布

执行 `publish` 即授权提交并推送主仓库和 FairyGUI 子仓库全部可提交修改，包括已暂存、未暂存和未被 Git 忽略的未跟踪文件。不要求用户预先清理工作区或手动提交，不增加每次确认步骤。用户仅要求修改流程、检查代码或验证实现时，不执行实际发布。

先阅读相关源码、现有 Changeset 和父子仓库状态，核实本批次变更和最高 `patch` / `minor` / `major` 级别。发布范围是全部公开 workspace 包，当前共 13 个；所有包版本和内部依赖必须一致，源码内部依赖统一为 `workspace:*`。

发布入口按以下顺序执行：

1. 校验主仓库 `main` 和子仓库 `ccc3.0` 的状态，使用 Git 原生 `merge --ff-only --autostash` 携带已跟踪的暂存和未暂存修改做仅快进同步；主仓库同步后，先使子模块包含主仓库 gitlink，再同步 `ccc3.0`。分叉、自动恢复冲突或未跟踪文件覆盖保护等无法安全同步时停止并保留现场，不自动 rebase 或强推。
2. 全量构建所有包，包含 FairyGUI 实际变化的 `source/dist`。
3. 复用已有非空 Changeset；缺少可复用记录时，交互选择变更包、升级级别和说明。
4. 检查统一版本计划、完整清单、精确内部引用和本地打包内容。
5. 先将子仓库全部可提交修改提交推送到 `ccc3.0`，再将主仓库全部可提交修改和 gitlink 提交推送到 `main`。
6. 通过 GitHub CLI 调度发布工作流，关联本次请求并等待结果。

GitHub CLI 需要已登录且有权调度主仓库工作流。首次认证在 `setup` 后执行 `mise exec -- gh auth login`。`publish` 会产生提交、推送并触发 CI 发布，不将其作为纯本地预检命令。

同步需要核对冲突和自动 stash 恢复状态，不能只依据 Git 命令退出成功。失败时通过 `git status`、`git stash list` 检查恢复，不清理 Git 保留的 stash 或冲突现场；源码全部安全同步后才继续构建。

## CI 发布

CI 先全量构建，再消费 Changeset，生成统一版本、包级 CHANGELOG 和锁文件。FairyGUI 的版本、`source/CHANGELOG.md` 与实际变化的 dist 先提交推送到子仓库 `bit-framework-release/<主仓库源提交 SHA>/v<版本>` 分支，再将记录该 gitlink 和发布清单的版本提交推送到主仓库 `main`。

准备运行冻结主仓库版本提交，确保子仓库 `ccc3.0` 包含对应 gitlink，必要时快进；已经包含该提交的后代分支保持原位，真正分叉时停止，发布仍使用冻结 gitlink，不混入后代源码。准备运行返回 `prepared`，不上传 npm；本地入口核验 pending 仍指向该来源，再从 `bit-framework-release/pending` 启动新的发布运行。上传时 GitHub 事件 SHA 必须与冻结 HEAD 相同，保留原始 `GITHUB_SHA`，使 OIDC 与 npm provenance 来源一致。全部预检 tgz 上传到 `release-candidate` 并校验后，逐包提升 `latest`；两个仓库创建同名 `vX.Y.Z` tag，最后清除 pending。实际 npm 上传和 dist-tag 修改仅在主仓库 CI 中执行。

GitHub App 使用 `RELEASE_APP_CLIENT_ID` 和 `RELEASE_APP_PRIVATE_KEY`，需要两个仓库的 Contents 读写权限。全部 npm 包的 trusted publisher 授权主仓库 `publish.yml` 的 publish 与 dist-tag 操作，CI 使用 npm 11.21.2 和 OIDC。

## 跟踪与恢复

跟踪 `publish` 调度的本次运行，以全量目标版本、全部 `latest`、双仓库 tag 和 CI 结果确认整批完成。部分完成时列出实际完成和待恢复步骤。

失败后再次运行 `publish`，恢复 pending 固定的同一主仓库 SHA、子仓库 gitlink、版本和包内容。没有新改动时不生成 Changeset；有新改动时可以自动准备并推送入队，CI 优先完成旧批次。已存在的 npm 版本必须验证内容一致，内容冲突、子仓库分叉或 tag 冲突时停止，不通过增加版本号绕过未完成批次。

当本次准备了新版本计划且先完成旧 pending 版本时，入口确认远端 `main` 仍为本次队列提交，再处理目标版本。每批最多一次准备运行和一次发布运行，总共最多两批、四次运行；每次使用新请求标识，不重复准备或提交本地源码。发布运行必须返回 `published`，版本、主子来源和包集合必须与 `prepared` 清单一致；准备结果不代表发布成功。目标版本完成后整个命令才成功；旧批次失败、来源或冻结引用变化、结果不一致时报告未完成并停止。

也可从 GitHub Actions 手动运行 `Release packages`，分支选择 `main`。页面上的一次调度只运行一次 CI；返回 `prepared` 时，从 `bit-framework-release/pending` 手动启动发布运行。旧 pending 完成后，排队 Changeset 从 `main` 继续调度。

## 仅维护日志

用户只要求日志时，按真实提交补充对应包的 CHANGELOG，版本号使用已校验一致的公开包版本。仅维护日志文件，不运行 `publish` 或触发 CI。遵循 [changelog 技能](../changelog/SKILL.md)。
