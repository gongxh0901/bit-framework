# Changesets

`mise run publish` 自动全量构建，复用已有非空 Changeset；没有可复用记录时，交互选择实际受影响的包、`patch` / `minor` / `major` 级别和变更说明。`mise run changeset` 也可作为独立入口提前记录变更。

所有公开 workspace 包属于同一固定版本组，包含 12 个 bit 包和 `@gongxh/fairygui-cc`，新增公开 workspace 包自动纳入。每批按最高变更级别统一升级并全量发布；源码中的内部依赖使用 `workspace:*`，发布包中解析为统一精确版本。

运行 `publish` 即授权自动提交并推送父子仓库全部可提交修改，包括已暂存、未暂存和未被 Git 忽略的未跟踪文件。入口先检查分支和远端状态，通过 Git 原生自动 stash 携带已跟踪的本地修改做仅快进同步；主仓库同步后先确保子模块包含主仓库 gitlink，再同步 `ccc3.0`，最后构建、准备 Changeset 和预检。成功后先提交推送 FairyGUI 到 `ccc3.0`，再将主仓库修改、Changeset 和 gitlink 提交推送到 `main`，通过已登录的 GitHub CLI 调度 CI 并等待结果。分叉、自动恢复冲突或未跟踪文件覆盖保护等无法安全同步时停止并保留现场，通过 `git status`、`git stash list` 检查恢复。

CI 消费 Changeset，生成全部包的统一版本、包级 CHANGELOG 和锁文件，将 FairyGUI 版本提交推到子仓库专用发布分支，再将记录该 gitlink 的版本提交推到主仓库 `main`。FairyGUI 的包日志位于 `vendor/fairygui-cc/source/CHANGELOG.md`。

准备运行冻结主仓库版本提交，确保子仓库 `ccc3.0` 包含对应 gitlink，必要时快进；正式分支已包含该提交的后代时保持原位，真正分叉时停止，发布源码仍固定为本批次 gitlink。准备运行返回 `prepared`，本地入口核验 pending 后从该引用启动新的发布运行，确保 GitHub 事件 SHA、冻结 HEAD、OIDC 与 npm provenance 来源一致。全部包上传到 `release-candidate` 并校验后提升 `latest`，完成双仓库同版本 tag 验证后删除本批次子仓库临时分支，最后清除主 pending；本地入口成功后刷新两仓库远端跟踪引用。失败后恢复同一批次，完成前阻止下一版本。恢复 pending 且没有新改动时不生成 Changeset；有新改动可先准备入队，CI 优先恢复旧批次。

本地 `publish` 已准备新版本计划且先完成旧批次时，会确认远端 `main` 仍为本次队列提交，再处理目标版本。每批最多一次准备运行和一次发布运行，总共最多两批、四次运行，每次使用新请求标识。只有目标版本完成才返回成功；旧批次失败、来源或冻结引用变化、发布结果与准备清单不一致时停止并报告未完成。GitHub 页面单独 `Run workflow` 只运行一次 CI，返回 `prepared` 时需从 pending 引用手动启动发布运行。

项目只提供 `setup`、`build`、`changeset`、`publish` 四个 mise task。实际 npm 操作由主仓库手动调度的 `.github/workflows/publish.yml` 执行。凭证和完整流程见 [构建与发布](../docs/COMMANDS.md)。
