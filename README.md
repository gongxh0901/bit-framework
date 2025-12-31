# Bit Framework

> 基于 Cocos Creator 3.x 的游戏开发框架 Monorepo

## 📦 项目结构

```
bit-framework/
├── bit-core/          # 核心库 - 提供基础功能（Time, Platform, Module 等）
├── bit-ui/            # UI 库 - 基于 FairyGUI 的 UI 管理系统
├── demo/              # 演示项目 - Cocos Creator 示例项目
├── package.json       # Monorepo 根配置
└── pnpm-workspace.yaml  # pnpm workspace 配置
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 16.0.0
- **pnpm**: >= 8.0.0
- **Cocos Creator**: 3.8.x

### 安装 pnpm

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用 homebrew (macOS)
brew install pnpm

# 验证安装
pnpm --version
```

### 安装依赖

```bash
# 在项目根目录执行
pnpm install

# 这会安装所有子项目的依赖
```

## 🛠️ 开发指南

### 构建项目

```bash
# 构建所有库项目（不包括 demo）
pnpm build

# 构建特定项目
pnpm build:core    # 只构建 bit-core
pnpm build:ui      # 只构建 bit-ui
pnpm build:all     # 按顺序构建 core 和 ui

# 清理所有构建产物
pnpm clean
```

### 开发模式（监听文件变化）

```bash
# 监听 bit-core 变化并自动构建
pnpm dev:core

# 监听 bit-ui 变化并自动构建
pnpm dev:ui
```

### 在 demo 中测试

由于使用了 pnpm workspace，demo 项目会自动链接到本地的 `bit-core` 和 `bit-ui`：

```bash
# 1. 构建库
pnpm build:all

# 2. 在 Cocos Creator 中打开 demo 项目
# 项目路径: demo/
# demo 会自动使用本地构建的库文件
```

## 📝 版本管理

### 升级版本

```bash
# 升级补丁版本 (0.0.1 -> 0.0.2)
pnpm version:patch

# 升级次版本 (0.0.1 -> 0.1.0)
pnpm version:minor

# 升级主版本 (0.0.1 -> 1.0.0)
pnpm version:major
```

### 发布到 npm

```bash
# 发布 bit-core
pnpm publish:core

# 发布 bit-ui
pnpm publish:ui

# 注意：发布前需要：
# 1. 确保已登录 npm: npm login
# 2. 确保代码已提交
# 3. 确保版本号已更新
```

### 完整发版流程

```bash
# 1. 确保代码是最新的
git pull origin main

# 2. 升级版本号
pnpm version:patch  # 或 minor/major

# 3. 构建所有项目
pnpm build:all

# 4. 提交版本变更
git add .
git commit -m "chore: bump version to x.x.x"
git push

# 5. 发布到 npm
pnpm publish:core
pnpm publish:ui

# 6. 创建 Git tag（可选）
git tag v0.0.5
git push --tags
```

## 📚 子项目说明

### bit-core

核心功能库，提供：
- **Time**: 时间工具类（格式化、时长计算等）
- **Platform**: 平台检测和适配
- **Module**: 模块管理系统
- **Adapter**: 引擎适配器
- **Binary**: 二进制数据处理
- **Log**: 日志工具

```typescript
// 使用示例
import { Time, Platform } from '@gongxh/bit-core';

// 时间格式化
const formatted = Time.format(Date.now(), 'YYYY-MM-DD hh:mm:ss');

// 平台检测
if (Platform.isWechat) {
  console.log('运行在微信小游戏');
}
```

### bit-ui

UI 管理库，基于 FairyGUI，提供：
- **WindowManager**: 窗口管理器
- **HeaderManager**: 顶部栏管理
- **ResLoader**: 资源加载管理
- **PropsHelper**: 属性辅助工具

```typescript
// 使用示例
import { WindowManager } from '@gongxh/bit-ui';

// 打开窗口
WindowManager.open('MyWindow', { data: 'test' });
```

### demo

Cocos Creator 3.8.x 示例项目，展示如何使用 bit-core 和 bit-ui。

## 🔧 常见问题

### Q: 为什么使用 pnpm？

A: pnpm 相比 npm/yarn 有以下优势：
- 更快的安装速度
- 节省磁盘空间（使用硬链接）
- 更严格的依赖管理
- 原生支持 monorepo

### Q: 修改 bit-core 后，demo 不生效？

A: 需要重新构建：

```bash
pnpm build:core
```

由于使用了 workspace 链接，demo 会立即使用新构建的文件。

### Q: Cocos Creator 无法识别 pnpm 的 node_modules？

A: 已配置 `shamefully-hoist=true`，这会让 pnpm 使用类似 npm 的扁平化结构，Cocos Creator 可以正常识别。

### Q: 如何在其他项目中使用这些库？

A: 有两种方式：

1. **从 npm 安装**（推荐用于生产）：
```bash
npm install @gongxh/bit-core @gongxh/bit-ui
```

2. **使用本地链接**（推荐用于开发）：
```bash
# 在库项目中
cd bit-framework/bit-core
pnpm link --global

# 在你的项目中
cd your-project
pnpm link --global @gongxh/bit-core
```

## 📖 更多资源

- [pnpm 官方文档](https://pnpm.io/zh/)
- [pnpm workspace 文档](https://pnpm.io/zh/workspaces)
- [Cocos Creator 文档](https://docs.cocos.com/creator/3.8/)

## 📄 许可证

ISC

## 👤 作者

gongxh

---

**提示**: 如果你是第一次使用这个项目，建议先执行 `pnpm install` 然后 `pnpm build:all` 来构建所有库。

