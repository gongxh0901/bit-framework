# Bit Framework — AI 开发指令

> 基于 Cocos Creator 3.x 的游戏框架 Monorepo，pnpm workspace + Rollup。架构见 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

## 目录结构

```
bit-framework/
├── bit-core/           # Time, Platform, Timer, Utils
├── bit-ui/             # FairyGUI 窗口、装饰器
├── bit-ecs/            # ECS
├── bit-ec/             # Cocos EC
├── bit-event/          # 全局事件
├── bit-net/            # HTTP + WebSocket
├── bit-assets/         # 资源加载
├── bit-quadtree/       # 四叉树
├── bit-behaviortree/   # 行为树
├── bit-condition/      # 条件显示（红点）
├── bit-minigame/       # 小游戏适配
├── bit-hotupdate/      # 热更新
├── vendor/fairygui-cc/ # FairyGUI fork（git submodule）
├── scripts/            # 发布辅助脚本
├── docs/
├── .github/workflows/  # tag v* → npmjs（trusted publishing）
├── .gitlab-ci.yml      # tag v* → GitLab 901 registry
└── rollup.config.base.mjs
```

## 关键文件

| 任务 | 位置 |
|------|------|
| 构建配置 | `rollup.config.base.mjs` |
| pnpm 脚本 | 根 `package.json` |
| 模块依赖 | `docs/ARCHITECTURE.md` |
| 构建/发布命令 | `docs/COMMANDS.md` |
| npmjs 发布 | `.github/workflows/publish.yml` |
| GitLab 发布 | `.gitlab-ci.yml` + `scripts/publish-gitlab.mjs` |
| fgui 仓库的 workflow | `vendor/fairygui-cc/.github/workflows/publish.yml` |
| 各模块入口 | `bit-xxx/src/index.ts` |
| UI 窗口基类 | `bit-ui/src/window/` |
| ECS | `bit-ecs/src/` |
| 装饰器 | 各模块 `*Decorator.ts` |

## 约定

- npm scope: `@gongxh/bit-*`（npmjs）；GitLab 内网发布时 remap 成 `@bit-cc/*`
- workspace 依赖: `"@gongxh/bit-core": "workspace:*"`
- 只改 `src/`，不要改 `dist/`
- 禁止循环依赖、`as any`、空 catch
- commit: `feat` / `fix` / `refactor` / `docs` / `chore`
- 发包由 CI 完成，本机不手动 publish（推 `v*` tag 触发）

## 开发

```bash
pnpm build:core    # 单模块
pnpm build         # 全部
```

## Skills

| 命令 | 用途 |
|------|------|
| `/release` | 发版 |
| `/changelog` | 生成 CHANGELOG |
