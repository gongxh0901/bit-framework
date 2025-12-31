# 命令速查表

## 📦 安装
```bash
pnpm install
```

## 🔨 构建
```bash
pnpm build              # 构建所有
pnpm build:core         # 构建 bit-core
pnpm build:ui           # 构建 bit-ui
pnpm clean              # 清理构建产物
```

## 🔄 开发
```bash
pnpm dev:core           # 监听 core 变化
pnpm dev:ui             # 监听 ui 变化
```

## 📦 版本升级
```bash
pnpm version:patch      # 0.0.1 -> 0.0.2
pnpm version:minor      # 0.0.1 -> 0.1.0
pnpm version:major      # 0.0.1 -> 1.0.0
```

## 🚀 发布到 npm
```bash
npm login               # 首次需要登录
pnpm publish:core       # 发布 bit-core
pnpm publish:ui         # 发布 bit-ui
```

## 🎯 完整发版流程
```bash
# 1. 更新版本
pnpm version:patch

# 2. 构建
pnpm build:all

# 3. 提交
git add .
git commit -m "chore: bump version"
git push

# 4. 发布
pnpm publish:core
pnpm publish:ui

# 5. 打标签（可选）
git tag v0.0.x
git push --tags
```

