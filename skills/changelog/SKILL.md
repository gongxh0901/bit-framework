---
name: changelog
description: Generate or repair package-specific CHANGELOG entries for unified bit-framework releases from Changesets and git commits, including the fairygui-cc submodule.
---

# Changelog

正常发版通过 `mise run publish` 自动构建，复用或交互生成 Changeset，预检后提交推送父子仓库全部可提交修改，再调度主仓库 CI 消费 Changeset，生成全部公开包的统一版本和 `CHANGELOG.md`。`mise run changeset` 可单独记录变更级别和说明。本技能用于补充或修复日志、整理真实提交，不重复生成已经存在的同版本条目。发布流程见 [构建与发布](../../docs/COMMANDS.md)。

## 依据

读取现有 Changeset、相关源码差异、主仓库和 FairyGUI 子仓库提交。用两个仓库已经完成的同版本 `vX.Y.Z` tag 确定范围；存在未完成 pending 批次时，先识别该批次，避免把重试当作下一次版本。

```bash
git describe --tags --match 'v[0-9]*' --abbrev=0
git -C vendor/fairygui-cc describe --tags --match 'v[0-9]*' --abbrev=0
git log <主仓库上次发布tag>..HEAD --oneline --no-merges
git -C vendor/fairygui-cc log <子仓库上次发布tag>..HEAD --oneline --no-merges
```

没有对应 tag 时，从该仓库首个提交核对范围。不要把仅包含版本、生成产物或 gitlink 更新的提交写成功能变更。

## 版本与位置

读取所有公开 workspace 包的 `package.json`，校验版本完全一致，使用该统一版本。根 private 包不作为版本来源。日志位于各公开包目录的 `CHANGELOG.md`，FairyGUI 使用 `vendor/fairygui-cc/source/CHANGELOG.md`。

只将提交归到真实受影响的包。全量发版中没有实际变化的包保留统一版本条目，不复制其他包的功能说明。

## 写入

按 `feat`、`fix`、`refactor` / 其他、`docs`、`chore` 分到 Added、Fixed、Changed、Documentation、Chore。过滤 `chore: bump version`、`chore: release` 和纯版本提交，只保留有内容的分类。

```markdown
## [x.y.z] - YYYY-MM-DD

### Fixed

- 实际变更说明 (commit-hash)
- FairyGUI 实际变更说明 (fairygui-cc commit-hash)
```

日期使用当天日期。新版本插入第一个版本标题之前；同版本已有条目时直接补充或修正该条目。保留其他版本的日志，不额外生成根目录统一日志。

用户只要求日志时，仅更新目标日志，不修改包版本、构建、提交、推送或触发发布。完成后展示写入条目及对应提交依据。
