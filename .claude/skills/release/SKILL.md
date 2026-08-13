---
name: release
description: Use when publishing a new version of bit-framework to npm, including the vendor/fairygui-cc submodule.
---

# Release

```
/release [patch|minor|major]
```

- `patch`（默认）— 0.0.x → 0.0.x+1
- `minor` — 0.x.0 → 0.x+1.0
- `major` — x.0.0 → x+1.0.0

## 步骤

### 1. 确认类型

未指定则询问：patch / minor / major。

### 2. 检查状态

```bash
git status
git log --oneline -5
git -C vendor/fairygui-cc status
git -C vendor/fairygui-cc log --oneline -5
```

两边工作区都必须干净，否则提示先提交。

### 3. 确认版本

读取根 `package.json` 的 `version`，与 `vendor/fairygui-cc/source/package.json` 对齐。告知当前版本和目标版本，请用户确认。

### 4. 升版本

```bash
pnpm version:{type}
```

升级全部 workspace 包（含 fgui 和根 `package.json`），不自动 commit / tag。

### 5. CHANGELOG

调用 changelog 技能。

### 6. 构建

```bash
pnpm build
```

失败则停止。

### 7. 提交（先 submodule，再主仓库）

主仓库只记录 submodule 的 SHA，必须先 push submodule。

```bash
cd vendor/fairygui-cc
git add .
git commit -m "chore: release v{NEW_VERSION}"
git tag v{NEW_VERSION}
git push origin ccc3.0
git push origin v{NEW_VERSION}
git push gitlab ccc3.0
git push gitlab v{NEW_VERSION}
cd ../..

git add .
git commit -m "chore: release v{NEW_VERSION}"
git push origin
git push gitlab
```

### 8. 主仓库 tag

```bash
git tag v{NEW_VERSION}
git push origin --tags
git push gitlab --tags
```

### 9. 发布

提醒用户在终端执行 `pnpm publish:all`（OTP）。不要代为执行。

### 完成

汇报版本号、模块列表、两边的 tag。
