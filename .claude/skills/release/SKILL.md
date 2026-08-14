---
name: release
description: Use when publishing a new version of bit-framework. Bumps versions, generates CHANGELOG, builds, commits, and pushes v* tags to GitHub and GitLab — CI on both sides then publishes the packages.
---

# Release

```
/release [patch|minor|major]
```

- `patch`（默认）— 0.0.x → 0.0.x+1
- `minor` — 0.x.0 → 0.x+1.0
- `major` — x.0.0 → x+1.0.0

## 发布模型

**本技能不发包**，只负责升版本、写 CHANGELOG、构建校验、提交、推 tag。
推送 `v*` tag 后由两侧 CI 自动发布：

| 目标 | 触发 | 由谁发 | 认证 |
|------|------|--------|------|
| npmjs `@gongxh/bit-*` | GitHub `v*` tag | 主仓库 `.github/workflows/publish.yml` | trusted publishing（OIDC，无 token） |
| npmjs `@gongxh/fairygui-cc` | GitHub `v*` tag | **FGUI-cocoscreator 仓库**自己的 workflow | trusted publishing（OIDC） |
| GitLab 901 `@gongxh/*`（含 fgui） | GitLab `v*` tag | 主仓库 `.gitlab-ci.yml` | `CI_JOB_TOKEN` |

`@gongxh/fairygui-cc` 必须由 FGUI-cocoscreator 仓库发布：trusted publishing 要求包
`repository.url` 与签发 OIDC 的仓库一致。GitLab 侧无此限制，fgui 跟主仓库一起发。

FGUI 仓库的 workflow 不跑 gulp，只校验 dist 存在后直接发**入库的 `source/dist`**。
那份 dist 由第 6 步的 `pnpm build` 在本机产出、随 submodule 一起提交。
**跳过第 6 步会让 npmjs 上的 fgui 停留在旧 dist。**

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

读取根 `package.json` 的 `version`，与 `vendor/fairygui-cc/source/package.json` 对齐。
告知当前版本和目标版本，请用户确认。

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

### 7. 提交并打 tag（先 submodule，再主仓库）

主仓库只记录 submodule 的 SHA，必须先 push submodule。
fgui 的 tag 会触发它自己的 GitHub workflow 发布 `@gongxh/fairygui-cc`。

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

### 8. 主仓库 tag（触发两侧 CI 发布）

```bash
git tag v{NEW_VERSION}
git push origin v{NEW_VERSION}
git push gitlab v{NEW_VERSION}
```

### 9. 汇报

告知用户：

- 版本号、模块列表、两边的 tag
- CI 地址，让用户自行确认发布结果：
  - GitHub Actions: https://github.com/gongxh0901/bit-framework/actions
  - FGUI Actions: https://github.com/gongxh0901/FGUI-cocoscreator/actions
  - GitLab Pipelines: https://git.lanfeitech.com/bit-cc/bit-framework/-/pipelines

不要声称"已发布成功"——发布由 CI 完成，需用户查看流水线结果。

## 应急：CI 不可用时

**流程不变**，仍然走上面的第 1–8 步（升版本、CHANGELOG、构建、提交、推 tag）——
版本管理和变更日志与发布渠道无关，不能省。

差异只在第 9 步：不等 CI，改为本机发包。

```bash
# 第 9 步替换为：
pnpm publish:gitlab --dry-run && pnpm publish:gitlab   # GitLab 901，需 GITLAB_TOKEN
pnpm publish:npm --dry-run && pnpm publish:npm         # npmjs 13 个包，需 NPM_TOKEN
```

`publish:npm` 含 `@gongxh/fairygui-cc`（本机走 token 路径，不受 trusted publishing
的仓库归属限制），发布前会校验 13 个包版本一致。

⚠️ 手动发 npmjs 的包**不带 provenance**（SLSA 证明只能由 CI 的 OIDC 流程生成）。
CI 恢复后建议补发一个走 CI 的版本。

只有某一侧 CI 挂了就只跑对应那条命令，另一侧照旧由 tag 触发。
