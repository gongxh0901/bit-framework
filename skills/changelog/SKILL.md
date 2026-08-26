---
name: changelog
description: Use when generating a CHANGELOG entry for bit-framework based on git commits since the last tag, including vendor/fairygui-cc submodule commits.
---

# Changelog

根据 git log 生成条目，插入 `CHANGELOG.md` 顶部。包含主仓库和 `vendor/fairygui-cc` 的提交；submodule 写成 `- 说明 (fairygui-cc hash)`。

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

读取根 `package.json` 的 `version`。

### 5. 写入

```markdown
## [x.x.x] - YYYY-MM-DD

### Added
- feat: xxx (hash)
- feat: xxx (fairygui-cc hash)
```

日期用今天。已有 `CHANGELOG.md` 时，插入到第一个 `## [` 之前。

### 完成

展示写入的条目。
