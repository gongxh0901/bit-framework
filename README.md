# Bit Framework

> 基于 Cocos Creator 3.x 的游戏开发框架 Monorepo

一个模块化、类型安全、高性能的 Cocos Creator 游戏开发框架集合，提供从核心功能到高级特性的完整解决方案。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)

## ✨ 特性

- 🎯 **模块化设计** - 12 个独立模块，按需使用
- 📦 **Monorepo 架构** - 统一管理，独立发布
- 💪 **TypeScript** - 完整的类型定义和智能提示
- 🚀 **高性能** - 优化的数据结构和算法
- 🔧 **零配置** - 开箱即用，简单易用
- 📖 **完善文档** - 详细的 API 文档和示例

## 📦 模块总览

Bit Framework 包含 12 个核心模块，分为 5 大类别：

### 🏗️ 核心模块

| 模块 | npm 包名 | 描述 | 文档 |
|------|---------|------|------|
| **bit-core** | [@gongxh/bit-core](https://www.npmjs.com/package/@gongxh/bit-core) | 框架核心功能库，提供 Time、Platform、Module 等基础工具 | [README](./bit-core/README.md) |

### 🎨 UI 模块

| 模块 | npm 包名 | 描述 | 文档 |
|------|---------|------|------|
| **bit-ui** | [@gongxh/bit-ui](https://www.npmjs.com/package/@gongxh/bit-ui) | 基于 FairyGUI 的 UI 管理系统，支持窗口管理、装饰器等 | [README](./bit-ui/README.md) |
| **bit-condition** | [@gongxh/bit-condition](https://www.npmjs.com/package/@gongxh/bit-condition) | 条件显示系统，用于 UI 红点、解锁等场景 | [README](./bit-condition/README.md) |

### 🎮 游戏架构模块

| 模块 | npm 包名 | 描述 | 文档 |
|------|---------|------|------|
| **bit-ecs** | [@gongxh/bit-ecs](https://www.npmjs.com/package/@gongxh/bit-ecs) | 高性能 ECS（实体组件系统）架构实现 | [README](./bit-ecs/README.md) |
| **bit-ec** | [@gongxh/bit-ec](https://www.npmjs.com/package/@gongxh/bit-ec) | 基于 Cocos Creator 的 EC 框架实现 | [README](./bit-ec/README.md) |
| **bit-event** | [@gongxh/bit-event](https://www.npmjs.com/package/@gongxh/bit-event) | 全局事件系统，支持一次性监听、按名称或目标批量移除等 | [README](./bit-event/README.md) |

### 🌐 网络与资源模块

| 模块 | npm 包名 | 描述 | 文档 |
|------|---------|------|------|
| **bit-net** | [@gongxh/bit-net](https://www.npmjs.com/package/@gongxh/bit-net) | 网络通信库，封装 HTTP 和 WebSocket | [README](./bit-net/README.md) |
| **bit-assets** | [@gongxh/bit-assets](https://www.npmjs.com/package/@gongxh/bit-assets) | 资源加载管理，支持批量加载、进度跟踪等 | [README](./bit-assets/README.md) |
| **bit-hotupdate** | [@gongxh/bit-hotupdate](https://www.npmjs.com/package/@gongxh/bit-hotupdate) | 热更新系统，支持增量更新和版本管理 | [README](./bit-hotupdate/README.md) |

### 🛠️ 工具模块

| 模块 | npm 包名 | 描述 | 文档 |
|------|---------|------|------|
| **bit-quadtree** | [@gongxh/bit-quadtree](https://www.npmjs.com/package/@gongxh/bit-quadtree) | 四叉树实现，用于高效碰撞检测和空间查询 | [README](./bit-quadtree/README.md) |
| **bit-behaviortree** | [@gongxh/bit-behaviortree](https://www.npmjs.com/package/@gongxh/bit-behaviortree) | 行为树系统，用于 AI 逻辑实现 | [README](./bit-behaviortree/README.md) |
| **bit-minigame** | [@gongxh/bit-minigame](https://www.npmjs.com/package/@gongxh/bit-minigame) | 小游戏平台适配（微信、支付宝、字节跳动） | [README](./bit-minigame/README.md) |

## 📚 项目文档

- [架构设计](./docs/ARCHITECTURE.md)
- [构建与发布](./docs/COMMANDS.md)

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 16.0.0
- **pnpm**: >= 8.0.0
- **Cocos Creator**: 3.7.0+ （推荐 3.8.x）

### 方式一：在 Cocos Creator 项目中使用（推荐）

在你的 Cocos Creator 项目中直接安装需要的模块：

```bash
# 安装核心模块
npm install @gongxh/bit-core

# 安装 UI 模块（peer：bit-core、@gongxh/fairygui-cc）
npm install @gongxh/bit-ui @gongxh/bit-core @gongxh/fairygui-cc

# 安装 ECS 模块
npm install @gongxh/bit-ecs

# 或一次性安装多个模块
npm install @gongxh/bit-core @gongxh/bit-ui @gongxh/bit-event @gongxh/bit-net @gongxh/fairygui-cc
```

### 方式二：本地开发此框架

如果你想参与框架开发或查看源码：

#### 1. 安装 pnpm

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用 homebrew (macOS)
brew install pnpm

# 验证安装
pnpm --version
```

#### 2. 克隆、安装、构建

```bash
git clone --recurse-submodules https://github.com/gongxh0901/bit-framework.git
cd bit-framework
pnpm install
pnpm build
```

命令见 [COMMANDS.md](./docs/COMMANDS.md)，发版流程见该文档。

## 🔧 常见问题

### Q: 为什么使用 pnpm？

A: pnpm 相比 npm/yarn 有以下优势：
- 更快的安装速度
- 节省磁盘空间（使用硬链接）
- 更严格的依赖管理
- 原生支持 monorepo

### Q: 如何贡献代码？

A: 欢迎贡献！请按以下步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 🔗 相关资源

- [pnpm 官方文档](https://pnpm.io/zh/)
- [pnpm workspace 文档](https://pnpm.io/zh/workspaces)
- [Cocos Creator 文档](https://docs.cocos.com/creator/3.8/)
- [FairyGUI 文档](https://www.fairygui.com/docs/editor)
- [TypeScript 文档](https://www.typescriptlang.org/zh/)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👥 作者与贡献者

**作者**: bit老宫 (gongxh)

**联系方式**: gong.xinhai@163.com

## 🌟 支持项目

如果这个项目对你有帮助，请给个 Star ⭐️

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=gongxh0901/bit-framework&type=date&legend=top-left)](https://www.star-history.com/?repos=gongxh0901%2Fbit-framework&type=date&legend=bottom-right)
