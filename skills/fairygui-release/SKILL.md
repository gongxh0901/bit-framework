---
name: fairygui-release
description: Prepare and publish the fairygui-cc git submodule release, including version bump, CHANGELOG, dist build, npm tag, and parent-repository pointer update.
---

# FairyGUI 子模块发版

用于 `vendor/fairygui-cc` 独立仓库的发版。不要把它当作主仓库 Changesets 发版：子模块没有 Changesets，npmjs 发布由子模块自己的 GitHub Actions 在推送 `v*` tag 后完成。

## 发版流程

从主仓库根目录执行。先检查两个工作区：

```bash
git status --short
git -C vendor/fairygui-cc status --short
git -C vendor/fairygui-cc branch --show-current
git -C vendor/fairygui-cc describe --tags --abbrev=0
```

如果主仓库或子模块有无关的未提交修改，先停止并说明；不要覆盖用户修改。默认目标分支是 `ccc3.0`，如果当前分支不是该分支，先确认是否要发到当前分支。

### 1. 确定版本和提交范围

- 用户明确给出版本时使用用户版本；否则读取最新 `v*` tag，提出下一个 patch 版本并等待确认。
- 使用 `git -C vendor/fairygui-cc log <last-tag>..HEAD --oneline --no-merges` 查看提交。
- 过滤 `chore: release`、纯版本提交和其他不代表本次内容的提交，不要凭空编写变更。
- 按 `feat`、`fix`、`refactor`/其他、`docs`、`chore` 分到 Added、Fixed、Changed、Documentation、Chore。

### 2. 更新版本和 CHANGELOG

只修改子模块中的 `source/package.json` 和根目录 `CHANGELOG.md`：

```text
vendor/fairygui-cc/source/package.json
vendor/fairygui-cc/CHANGELOG.md
```

CHANGELOG 格式：

```markdown
# @gongxh/fairygui-cc Changelog

## [x.y.z] - YYYY-MM-DD

### Fixed
- fix: xxx (commit-hash)
```

新版本插入第一个版本标题之前，保留已有历史记录。没有面向用户的提交时保留版本标题，但不要虚构变更；需要时写明“无面向用户的变更”。

### 3. 构建和检查

修改版本与 CHANGELOG 后构建：

```bash
pnpm --filter @gongxh/fairygui-cc build
test -f vendor/fairygui-cc/source/dist/fairygui.mjs
test -f vendor/fairygui-cc/source/dist/fairygui.d.ts
test -f vendor/fairygui-cc/source/dist/fairygui.min.mjs
git -C vendor/fairygui-cc diff --check
git -C vendor/fairygui-cc diff -- source/package.json CHANGELOG.md
```

`source/dist` 必须随子模块提交，因为子模块的发布 workflow 只检查已入库的 dist，不重新构建。

### 4. 提交、tag 和发布

展示待提交 diff 和拟使用的版本后，得到用户明确确认才能执行推送。提交和 tag 只使用子模块命令：

```bash
git -C vendor/fairygui-cc add source/package.json CHANGELOG.md source/dist
git -C vendor/fairygui-cc commit -m "chore: release vX.Y.Z"
git -C vendor/fairygui-cc push origin ccc3.0
git -C vendor/fairygui-cc tag vX.Y.Z
git -C vendor/fairygui-cc push origin vX.Y.Z
```

推送 tag 后，子模块 `.github/workflows/publish.yml` 会在 npmjs 发布 `@gongxh/fairygui-cc`。发布结果以 GitHub Actions 成功和 npm registry 可查询为准，不能只凭 tag 推送宣称发布成功。

### 5. 更新主仓库子模块指针

子模块 tag 推送成功后，在主仓库更新 gitlink：

```bash
git add vendor/fairygui-cc
git commit -m "chore: update fairygui-cc to vX.Y.Z"
```

根据本次 FairyGUI API 变化，必要时在主仓库为 `bit-ui` / `bit-condition` 添加 Changeset。主仓库指针提交和推送仍需用户确认。

## CHANGELOG 单独维护

用户只要求写日志、不发版时，只读取子模块 tag 和提交，更新 `vendor/fairygui-cc/CHANGELOG.md`，不要修改版本、构建 dist、提交或推送。
