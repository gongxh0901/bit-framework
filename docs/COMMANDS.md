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

fgui 的 `source/dist` 入库。三条 CI 对它的处理不同：

- **FGUI 仓库的 workflow**（实际发 `@gongxh/fairygui-cc` 的那条）不跑 gulp，
  只校验 dist 文件存在，直接发**入库的 dist**
- 主仓库 GitHub workflow 和 GitLab CI 会跑 `pnpm build`（含 gulp），
  但前者不发 fgui（构建只为 bit-ui / bit-condition 提供依赖），后者是现场产出

**所以发版时跳过 `pnpm build` 会让 npmjs 上的 fgui 停留在旧 dist。**

## 版本与发布

发布由 CI 完成：推送 `v*` tag 后两侧自动发包，本机不再手动发。

| 目标 | 触发 | 配置 | 认证 |
|------|------|------|------|
| npmjs `@gongxh/bit-*` | GitHub `v*` tag | `.github/workflows/publish.yml` | trusted publishing（OIDC） |
| npmjs `@gongxh/fairygui-cc` | GitHub `v*` tag | FGUI-cocoscreator 仓库自己的 workflow | trusted publishing（OIDC） |
| GitLab 901 `@gongxh/*`（含 fgui） | GitLab `v*` tag | `.gitlab-ci.yml` | `CI_JOB_TOKEN` |

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

## 应急：本机手动发包

CI 不可用时的回退路径。

GitLab（需 `GITLAB_NPM_TOKEN`）：

```bash
pnpm publish:gitlab --dry-run   # 只打包校验，不上传
pnpm publish:gitlab
```

npmjs（需 `NPM_TOKEN`，且该 token 勾选了 Bypass 2FA）：

```bash
pnpm publish:npm --dry-run   # 只打包校验，不上传
pnpm publish:npm             # 逐包发到 npmjs
```

脚本内部会自动跑 `prepare:npm` 转换 workspace 协议，并在结束后还原 `package.json`。
含 `@gongxh/fairygui-cc`（13 个包）—— 它与 bit-* 版本号绑定，必须同步发布。
发布前会校验所有包版本一致，不一致直接中止。

> CI 里 fgui 由 FGUI-cocoscreator 仓库自己的 workflow 发布，因为 trusted publishing
> 要求包声明的仓库与签发 OIDC 的仓库一致。本机走 token 路径没有这个限制。

⚠️ 手动发 npmjs 的包**不带 provenance** —— SLSA 证明只能由 CI 的 OIDC 流程生成。
仅在 GitHub Actions 不可用时使用，事后建议补发一个走 CI 的版本。

## 内网安装（GitLab 901）

包名与 npmjs 完全一致（都是 `@gongxh/*`），只需把 scope 的 registry 指向内网：

```
@gongxh:registry=https://git.lanfeitech.com/api/v4/projects/901/packages/npm/
//git.lanfeitech.com/api/v4/projects/901/packages/npm/:_authToken=${GITLAB_NPM_TOKEN}
```

```bash
pnpm add @gongxh/bit-core @gongxh/bit-ui
```

> 该配置会让项目里**所有** `@gongxh/*` 都从 901 解析。若某个包只在 npmjs 上，
> 单独覆盖：`@gongxh/xxx:registry=https://registry.npmjs.org/`。
>
> 旧的 `@bit-cc/*` 已废弃：包名 remap 后，dist 产物里的 `import ... from '@gongxh/bit-core'`
> 仍指向原 scope，装到 `@bit-cc` 下解析不到依赖。

## Workspace

```bash
pnpm list -r --depth 0
pnpm update -r
pnpm outdated
```
