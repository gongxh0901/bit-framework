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

项目使用 Changesets 管理独立包版本，不使用统一版本号，也不通过 `v*` tag 触发主仓库发包。

```bash
# 1. 为面向用户的包创建变更集
pnpm changeset

# 2. 本地校验
pnpm changeset status
pnpm install --frozen-lockfile
pnpm build

# 3. 仅测试发布清单，不上传
pnpm publish:npm --dry-run
pnpm publish:gitlab --dry-run
```

推送包含 changeset 的 PR 到 `main` 后，GitHub Actions 使用 `changesets/action` 创建或更新 `chore: release packages` PR，并自动生成版本、依赖范围和包级 CHANGELOG。GitLab 提供 `scripts/create-gitlab-release-mr.mjs` 创建 Release MR；当前 `.gitlab-ci.yml` 未直接调用该脚本，需要外部 CI 配置启用。

审核并合并 Release PR/MR 后：

- GitHub Actions 执行 `pnpm publish:npm`，发布受影响包到 npmjs；
- GitLab CI 在 `main` 上匹配 `chore: release packages` 提交后执行 `pnpm publish:gitlab`，发布到内部 registry；
- 根包 `@gongxh/bit-framework` 为 private，不发布；
- FairyGUI 的 npmjs 发布由其独立仓库负责。

正常流程不需要手动执行 `pnpm version:packages`。该命令只用于模拟或由 Release PR/MR 自动化调用。

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
脚本会处理配置中的 FairyGUI 子模块包目录，但 FairyGUI 的 npmjs 正式发布由其独立仓库负责；主仓库 GitLab 发布脚本按 Changesets 清单处理内部 registry 发布。
发布只处理 Changesets 计算出的包，不要求所有包版本一致，也不要求所有包同步发布。

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
