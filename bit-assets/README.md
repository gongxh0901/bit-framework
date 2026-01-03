# bit-assets

基于 Cocos Creator 的资源加载管理库，提供简单易用的资源加载和批量管理功能。

## 简介

`bit-assets` 是一个专为 Cocos Creator 设计的资源管理库，支持通过路径或 UUID 加载资源，提供批量加载、并行控制、失败重试等功能。资源加载采用手动管理模式，支持按批次卸载资源，适合需要精细控制资源生命周期的场景（如战斗场景切换）。

**核心特性**：
- 📦 支持路径和 UUID 两种方式获取资源
- 🔄 资源加载多次等同于加载一次，避免重复加载
- 🎯 按批次管理资源，支持批量卸载
- ⚡ 支持并行加载控制和失败重试
- 📊 提供加载进度、完成、失败回调

## 安装

```bash
npm install @gongxh/bit-assets
```

## 使用说明

### 资源加载器 (AssetLoader)

用于加载资源，支持配置加载参数和回调：

- `start(configs)` - 开始加载资源列表
- `retryDownLoadFailedAssets()` - 重试加载失败的资源
- `parallel` - 设置最大并行加载数量（默认：10）
- `retry` - 设置失败重试次数（默认：0）
- `setCallbacks()` - 设置加载进度、完成、失败回调

**资源配置 (IAssetConfig)**：
- `path` - 资源路径（必填）
- `type` - 资源类型（可选，默认 `cc.Asset`）
- `isFile` - 是否为单个文件（可选，默认 `false`）
- `bundle` - 资源 bundle 名称（可选，默认 `"resources"`）

### 资源池 (AssetPool)

全局资源管理，提供资源获取和释放功能：

**资源获取**：
- `has(path, bundlename?)` - 检查资源是否已加载
- `get<T>(path, bundlename?)` - 按路径获取资源
- `hasUUID(uuid)` - 按 UUID 检查资源
- `getByUUID<T>(uuid)` - 按 UUID 获取资源

**资源释放**：
- `releasePath(path, bundlename?)` - 按路径释放资源
- `releaseDir(dir, bundlename?, asset?)` - 按文件夹释放资源
- `releaseUUID(uuid)` - 按 UUID 释放资源
- `releaseBatchAssets(batchName)` - 按批次释放资源
- `releaseAll()` - 释放所有加载的资源

### 典型使用场景

**场景切换时批量加载和卸载**：
1. 进入战斗场景时，使用 `new AssetLoader("battle")` 加载所有战斗资源
2. 退出战斗场景时，调用 `AssetPool.releaseBatchAssets("battle")` 一键释放所有资源

详细 API 请查看 `bit-assets.d.ts` 类型定义文件。

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-assets)