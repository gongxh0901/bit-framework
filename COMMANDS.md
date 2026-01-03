# Bit Framework 构建与发布指南

> 本文档提供完整的开发、构建和发布流程说明。

## 📋 目录

- [环境准备](#环境准备)
- [快速开始](#快速开始)
- [构建命令](#构建命令)
- [开发调试](#开发调试)
- [版本管理](#版本管理)
- [发布流程](#发布流程)
- [常见问题](#常见问题)

---

## 环境准备

### 必要环境

- **Node.js**: >= 16.0.0
- **pnpm**: >= 8.0.0

### 安装 pnpm

```bash
# 使用 npm 全局安装
npm install -g pnpm

# 或使用 homebrew (macOS)
brew install pnpm

# 或使用 npm（Windows）
npm install -g @pnpm/exe

# 验证安装
pnpm --version
```

### 配置 npm 镜像（可选）

如果 npm 官方源速度较慢，可以使用国内镜像：

```bash
# 淘宝镜像
npm config set registry https://registry.npmmirror.com/

# 恢复官方源
npm config set registry https://registry.npmjs.org/
```

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/gongxh0901/bit-framework.git
cd bit-framework
```

### 2. 安装依赖

```bash
# 安装所有模块的依赖
pnpm install

# pnpm 会自动：
# - 安装根目录的 devDependencies
# - 安装所有子模块的 dependencies
# - 建立模块间的 workspace 链接
```

### 3. 构建所有模块

```bash
# 按依赖顺序构建所有模块
pnpm build:all
```

### 4. 开始开发

```bash
# 开启监听模式，自动重新构建
pnpm dev:core

# 或同时监听多个模块（使用多个终端）
pnpm dev:ui
```

---

## 构建命令

### 构建所有模块

```bash
# 构建所有库模块（不包括 demo）
pnpm build

# 按依赖顺序构建所有模块（推荐）
pnpm build:all
```

### 构建单个模块

```bash
# 核心模块
pnpm build:core          # bit-core

# UI 相关
pnpm build:ui            # bit-ui
pnpm build:condition     # bit-condition

# 架构模块
pnpm build:ecs           # bit-ecs
pnpm build:ec            # bit-ec
pnpm build:event         # bit-event

# 网络与资源
pnpm build:net           # bit-net
pnpm build:assets        # bit-assets
pnpm build:hotupdate     # bit-hotupdate

# 工具模块
pnpm build:quadtree      # bit-quadtree
pnpm build:behaviortree  # bit-behaviortree
pnpm build:minigame      # bit-minigame
```

### 清理构建产物

```bash
# 清理所有模块的 dist 目录
pnpm clean

# 或手动清理单个模块
cd bit-core
rm -rf dist
```

### 构建产物说明

每个模块构建后会在 `dist/` 目录生成以下文件：

```
dist/
├── bit-xxx.mjs          # ES Module 格式（未压缩）
├── bit-xxx.cjs          # CommonJS 格式（未压缩）
├── bit-xxx.min.mjs      # ES Module 格式（压缩，生产环境）
├── bit-xxx.min.cjs      # CommonJS 格式（压缩，生产环境）
└── bit-xxx.d.ts         # TypeScript 类型定义
```

---

## 开发调试

### 监听模式

在开发过程中，可以使用监听模式自动重新构建：

```bash
# 监听 bit-core 的变化
pnpm dev:core

# 监听 bit-ui 的变化
pnpm dev:ui

# 监听其他模块（需要手动配置 watch 模式）
pnpm --filter @gongxh/bit-ecs build --watch
```

### 调试流程

#### 方式一：使用 demo 项目调试

1. **构建要调试的模块**
   ```bash
   pnpm build:core
   ```

2. **在 Cocos Creator 中打开 demo 项目**
   - demo 项目通过 workspace 链接到本地模块
   - 修改后重新构建即可立即生效

3. **运行 demo 项目测试**

#### 方式二：在其他项目中使用本地模块

使用 pnpm link 链接本地开发的模块：

```bash
# 1. 在 bit-framework 目录下
cd bit-core
pnpm link --global

# 2. 在你的项目目录下
cd /path/to/your/project
pnpm link --global @gongxh/bit-core

# 3. 取消链接
pnpm unlink --global @gongxh/bit-core
```

### 开发多个相互依赖的模块

当同时开发多个有依赖关系的模块时（例如 bit-ui 依赖 bit-core）：

```bash
# 终端 1：监听 bit-core
pnpm dev:core

# 终端 2：监听 bit-ui
pnpm dev:ui

# 这样 bit-core 的改动会自动触发 bit-ui 使用新版本
```

### 调试 TypeScript 源码

在 `tsconfig.json` 中启用 source map：

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "declarationMap": true
  }
}
```

---

## 版本管理

### 语义化版本

Bit Framework 遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)：

- **主版本号 (x.0.0)**: 不兼容的 API 修改
- **次版本号 (0.x.0)**: 向后兼容的功能新增
- **修订号 (0.0.x)**: 向后兼容的问题修正

### 批量升级版本

```bash
# 升级所有模块的修订号（0.0.5 -> 0.0.6）
pnpm version:patch

# 升级所有模块的次版本号（0.0.5 -> 0.1.0）
pnpm version:minor

# 升级所有模块的主版本号（0.0.5 -> 1.0.0）
pnpm version:major
```

### 单独升级模块版本

```bash
# 进入模块目录
cd bit-core

# 升级版本
npm version patch  # 0.0.5 -> 0.0.6
npm version minor  # 0.0.5 -> 0.1.0
npm version major  # 0.0.5 -> 1.0.0
```

### 版本升级最佳实践

1. **根据改动类型选择版本号**
   - Bug 修复 → patch
   - 新功能（向后兼容）→ minor
   - 破坏性变更 → major

2. **同步更新 CHANGELOG**
   ```markdown
   ## [0.0.6] - 2024-01-03
   
   ### Added
   - 新增 xxx 功能
   
   ### Fixed
   - 修复 xxx 问题
   ```

3. **提交前确保构建成功**
   ```bash
   pnpm build:all
   ```

---

## 发布流程

### 前置条件

1. **登录 npm**
   ```bash
   npm login
   
   # 输入 npm 账号信息
   # Username: your-username
   # Password: your-password
   # Email: your-email@example.com
   ```

2. **验证登录状态**
   ```bash
   npm whoami
   ```

### 发布单个模块

```bash
# 发布 bit-core
pnpm publish:core

# 发布其他模块
pnpm publish:ui
pnpm publish:ecs
pnpm publish:ec
pnpm publish:event
pnpm publish:net
pnpm publish:quadtree
pnpm publish:assets
pnpm publish:behaviortree
pnpm publish:condition
pnpm publish:minigame
pnpm publish:hotupdate
```

### 完整发版流程

#### 方式一：标准发版流程

```bash
# 1. 确保代码是最新的
git pull origin main

# 2. 升级版本号（所有模块）
pnpm version:patch

# 3. 构建所有模块
pnpm build:all

# 4. 提交版本变更
git add .
git commit -m "chore: bump version to 0.0.6"
git push

# 5. 依次发布模块（按依赖顺序）
pnpm publish:core        # 先发布核心模块
pnpm publish:event       # 独立模块
pnpm publish:net         # 独立模块
pnpm publish:ui          # 依赖 core
pnpm publish:condition   # 依赖 core
pnpm publish:ec          # 依赖 event
pnpm publish:hotupdate   # 依赖 core 和 net
pnpm publish:minigame    # 依赖 core
# ... 其他模块

# 6. 打 Git 标签（可选但推荐）
git tag v0.0.6
git push --tags
```

#### 方式二：单模块发版流程

如果只需要发布某个模块：

```bash
# 1. 进入模块目录
cd bit-core

# 2. 升级版本
npm version patch

# 3. 构建
pnpm build

# 4. 发布
npm publish

# 5. 提交版本变更
cd ..
git add bit-core/package.json
git commit -m "chore(bit-core): bump version to 0.0.6"
git push
```

### 发布检查清单

发布前请确认：

- [ ] 所有代码已提交
- [ ] 所有测试通过
- [ ] 版本号已正确更新
- [ ] CHANGELOG 已更新
- [ ] README 文档是最新的
- [ ] 构建产物正常（检查 dist 目录）
- [ ] 已登录 npm 账号
- [ ] 有发布权限（@gongxh scope）

### 发布后验证

```bash
# 验证包是否发布成功
npm info @gongxh/bit-core

# 在新项目中测试安装
mkdir test-project
cd test-project
npm init -y
npm install @gongxh/bit-core
```

---

## 常见问题

### 安装相关

#### Q: pnpm install 失败？

A: 常见原因和解决方案：

1. **网络问题**
   ```bash
   # 使用国内镜像
   npm config set registry https://registry.npmmirror.com/
   ```

2. **权限问题**
   ```bash
   # macOS/Linux 使用 sudo
   sudo pnpm install -g pnpm
   ```

3. **清理缓存重试**
   ```bash
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

#### Q: Cocos Creator 无法识别 pnpm 的 node_modules？

A: 已在 `.npmrc` 配置 `shamefully-hoist=true`，使 pnpm 使用扁平化结构。

### 构建相关

#### Q: 构建失败，提示找不到模块？

A: 确保先安装依赖：

```bash
pnpm install
```

#### Q: 修改代码后 demo 不生效？

A: 需要重新构建：

```bash
# 构建修改的模块
pnpm build:core

# demo 会自动使用新构建的文件
```

#### Q: 如何调试构建过程？

A: 在构建命令中添加 verbose 选项：

```bash
pnpm --filter @gongxh/bit-core build --verbose
```

### 发布相关

#### Q: npm publish 提示 403 权限错误？

A: 可能的原因：

1. **未登录**
   ```bash
   npm login
   ```

2. **没有发布权限**
   - 联系包的所有者添加你为协作者

3. **包名冲突**
   - 使用 scoped package (@gongxh/xxx)

#### Q: 如何撤销已发布的版本？

A: 使用 npm unpublish（24小时内）：

```bash
# 撤销特定版本
npm unpublish @gongxh/bit-core@0.0.6

# 撤销整个包（谨慎使用）
npm unpublish @gongxh/bit-core --force
```

**注意**: 
- 只能撤销 24 小时内发布的版本
- 被依赖的包不建议撤销
- 撤销后该版本号不能再次使用

#### Q: 如何发布 beta 版本？

A: 使用 npm 的 tag 功能：

```bash
# 1. 修改版本号
npm version 0.1.0-beta.0

# 2. 发布为 beta
npm publish --tag beta

# 3. 用户安装 beta 版本
npm install @gongxh/bit-core@beta
```

### 开发相关

#### Q: 如何添加新模块？

A: 参考现有模块的结构：

```bash
# 1. 创建模块目录
mkdir bit-xxx

# 2. 复制基础配置文件
cp bit-core/package.json bit-xxx/
cp bit-core/tsconfig.json bit-xxx/
cp bit-core/rollup.config.mjs bit-xxx/

# 3. 修改配置中的包名

# 4. 添加到 workspace
# 编辑 pnpm-workspace.yaml

# 5. 添加构建命令
# 编辑根目录 package.json
```

#### Q: 如何处理循环依赖？

A: Bit Framework 的架构设计避免循环依赖：

- 保持单向依赖流
- 如果需要双向通信，使用事件系统（bit-event）
- 通过接口定义解耦

#### Q: 如何在 CI/CD 中使用？

A: GitHub Actions 示例：

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build:all
      - run: pnpm test
```

---

## 有用的命令

```bash
# 查看 workspace 中的所有包
pnpm list -r --depth 0

# 更新所有依赖到最新版本
pnpm update -r

# 检查过时的依赖
pnpm outdated

# 检查依赖树
pnpm why <package-name>

# 运行所有包的指定脚本
pnpm -r run build

# 并行运行（更快）
pnpm -r --parallel run build

# 过滤特定包
pnpm --filter "@gongxh/*" build

# 查看 pnpm 配置
pnpm config list
```

---

## 参考资料

- [pnpm 官方文档](https://pnpm.io/zh/)
- [pnpm workspace](https://pnpm.io/zh/workspaces)
- [Rollup 文档](https://rollupjs.org/)
- [TypeScript 编译选项](https://www.typescriptlang.org/tsconfig)
- [npm 发布文档](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)

---

**需要帮助？**
- 查看 [架构文档](./ARCHITECTURE.md)
- 提交 [Issue](https://github.com/gongxh0901/bit-framework/issues)
- 发送邮件到 gong.xinhai@163.com

