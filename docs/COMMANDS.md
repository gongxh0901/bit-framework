# Bit Framework 命令速查

## 安装

```bash
git clone --recurse-submodules <url>
pnpm install
```

## 构建

```bash
pnpm build            # 全部模块
pnpm clean            # 清理 bit-* 的 dist（fgui dist 入库，不清理）

pnpm build:fgui
pnpm build:core | build:ui | build:ecs | build:ec | build:event
pnpm build:net | build:assets | build:quadtree | build:behaviortree
pnpm build:condition | build:minigame | build:hotupdate
```

## 版本与发布

发布由 CI 完成：推送 `v*` tag 后两侧自动发包，本机不再手动发。

| 目标 | 触发 | 配置 | 认证 |
|------|------|------|------|
| npmjs `@gongxh/bit-*` | GitHub `v*` tag | `.github/workflows/publish.yml` | trusted publishing（OIDC） |
| npmjs `@gongxh/fairygui-cc` | GitHub `v*` tag | FGUI-cocoscreator 仓库自己的 workflow | trusted publishing（OIDC） |
| GitLab 901 `@bit-cc/*`（含 fgui） | GitLab `v*` tag | `.gitlab-ci.yml` | `CI_JOB_TOKEN` |

```bash
pnpm version:patch | version:minor | version:major
```

AI 发版：`/release [patch|minor|major]`

手动发版：

```bash
# 1. 升版本（含 fgui 和根 package.json，不自动 commit/tag）
pnpm version:patch            # 或 version:minor / version:major

# 2. 按 git log 更新根目录 CHANGELOG.md
#    主仓库：git log {上一tag}..HEAD --oneline --no-merges
#    fgui：  git -C vendor/fairygui-cc log {上一tag}..HEAD --oneline --no-merges
#    submodule 条目写成 `- 说明 (fairygui-cc hash)`

# 3. 构建
pnpm build

# 4. 先提交 submodule 并打同一版本 tag
#    fgui 的 tag 会触发 FGUI-cocoscreator 仓库的 workflow 发布 @gongxh/fairygui-cc
cd vendor/fairygui-cc
git add .
git commit -m "chore: release vx.x.x"
git tag vx.x.x
git push origin ccc3.0
git push origin vx.x.x
git push gitlab ccc3.0
git push gitlab vx.x.x
cd ../..

# 5. 再提交主仓库（含 CHANGELOG 和 submodule 指针）
git add .
git commit -m "chore: release vx.x.x"
git push origin
git push gitlab

# 6. 打 tag 触发两侧 CI 发布
git tag vx.x.x
git push origin vx.x.x
git push gitlab vx.x.x
```

查看发布结果：

- GitHub Actions: https://github.com/gongxh0901/bit-framework/actions
- FGUI Actions: https://github.com/gongxh0901/FGUI-cocoscreator/actions
- GitLab Pipelines: https://git.lanfeitech.com/bit-cc/bit-framework/-/pipelines

## 应急：本机手动发 GitLab

```bash
pnpm publish:gitlab --dry-run   # 只打包校验，不上传
pnpm publish:gitlab             # 需 GITLAB_TOKEN
```

npmjs 侧无本机回退路径：`provenance` 与 trusted publishing 都要求在 CI 中执行。

## 内网安装 @bit-cc/*

消费项目的 `.npmrc`：

```
@bit-cc:registry=https://git.lanfeitech.com/api/v4/projects/901/packages/npm/
//git.lanfeitech.com/api/v4/projects/901/packages/npm/:_authToken=${GITLAB_TOKEN}
```

```bash
pnpm add @bit-cc/bit-core @bit-cc/bit-ui
```

## Workspace

```bash
pnpm list -r --depth 0
pnpm update -r
pnpm outdated
```
