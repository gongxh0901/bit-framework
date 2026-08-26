---
name: changelog
description: Use when generating package-specific CHANGELOG entries for bit-framework from git commits and Changesets, including vendor/fairygui-cc submodule commits when relevant.
---

# Changelog

正常发版由 Changesets 的 `@changesets/cli/changelog` 自动生成包级 `CHANGELOG.md`。本技能只用于补充或修复日志、整理历史版本，或在需要纳入 FairyGUI 子模块提交时手工生成条目；不应与 Changesets 自动生成的同一版本重复写入。

根据 Changesets 和 git log 为实际受影响的包生成 CHANGELOG 条目，写入对应包目录的 `CHANGELOG.md`。包含主仓库和相关的 `vendor/fairygui-cc` 提交；submodule 写成 `- 说明 (fairygui-cc hash)`。

## 用法

```
/changelog
```

## 步骤

### 1. 上一 tag

```bash
git describe --tags --abbrev=0
git -C vendor/fairygui-cc describe --tags --abbrev=0
```

没有 tag 时用该仓库第一个 commit：`git rev-list --max-parents=0 HEAD`。

### 2. commits

```bash
git log {parent_last_tag}..HEAD --oneline --no-merges
git -C vendor/fairygui-cc log {fgui_last_tag}..HEAD --oneline --no-merges
```

### 3. 分类

| 前缀 | 分类 |
|------|------|
| `feat` | Added |
| `fix` | Fixed |
| `refactor` / 其他 | Changed |
| `docs` | Documentation |
| `chore` | Chore |

过滤 `chore: bump version`、`chore: release`。只保留有内容的分类。

### 4. 版本号

读取实际发布包的 `package.json` 的 `version`，每个包独立处理；不要读取或修改根 private 包的版本作为所有包的统一版本。

### 5. 写入

```markdown
## [x.x.x] - YYYY-MM-DD

### Added
- feat: xxx (hash)
- feat: xxx (fairygui-cc hash)
```

日期用今天。已有包级 `CHANGELOG.md` 时，插入到第一个 `## [` 之前。若本次发版由 Changesets 生成日志，优先保留 Changesets 的包级结果，不再额外生成根级统一日志。

### 完成

展示写入的条目。
