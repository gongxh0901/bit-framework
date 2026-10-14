# 发包说明

正式发包由 CI 完成，本地不执行 `publish:npm` 或 `publish:gitlab`。

## 1. 手动发包

### 主仓库包

执行一次 Changeset 命令，选择要发布的包和版本级别：

```bash
mise run changeset
```

将代码和生成的 Changeset 一起提交、推送，并合并到 `main`：

1. GitHub Actions 自动创建或更新 `chore: release packages` Release PR。
2. 检查 Release PR 中的版本号和 CHANGELOG。
3. 合并 Release PR。
4. GitHub Actions 自动发布到 npmjs，并创建包级 tags。
5. 同一条 `chore: release packages` 提交进入 GitLab `main` 后，GitLab CI 自动发布到公司 Package Registry。

当前 GitLab CI 不会根据普通 Changeset 自动创建 Release MR。只使用 GitLab 发版时，需要先启用 `scripts/create-gitlab-release-mr.mjs` 对应的 CI job；否则应以 GitHub Release PR 作为版本提交来源。

### FairyGUI 子模块

FairyGUI 不使用主仓库 Changesets。
更新版本、CHANGELOG 和 `source/dist` 后，推送 `vX.Y.Z` tag；子模块自己的 GitHub Actions 会自动发布 `@gongxh/fairygui-cc`。

## 2. AI Agent 发包

### 主仓库包

```text
请为主仓库准备发版：
- 目标包：<包名列表>
- 版本级别：<patch | minor | major>

请检查改动、创建 Changeset、完成构建验证，并在得到我确认后提交和推送。
然后跟踪 Release PR；合并 Release PR 前再次让我确认，最后验证 npmjs 和 GitLab CI 的实际发布结果。
```

### FairyGUI 子模块

```text
请使用 fairygui-release skill 发布 FairyGUI，目标版本为 vX.Y.Z。
提交、推送分支和推送 tag 前必须先让我确认，并在最后验证 GitHub Actions 与 npmjs 的实际结果。
```
