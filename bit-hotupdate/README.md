# bit-hotupdate

Cocos Creator 热更新系统封装，提供简单易用的热更新接口。

## 简介

`bit-hotupdate` 是基于 Cocos Creator 的热更新系统封装，提供增量更新和版本管理功能。支持 Android 和 iOS 原生平台，简化了热更新的使用流程。

**核心特性**：
- 🔄 增量更新，只下载变化的文件
- 📦 自动版本管理和对比
- ⚡ 实时下载进度跟踪
- 🛡️ 完善的错误码和重试机制
- 🎯 简洁的 API 设计
- 📱 支持 Android 和 iOS 原生平台

## 安装

`bit-core` 和 `bit-net` 是 peer 依赖，需由项目自行安装，保证全项目只有一份：

```bash
npm install @gongxh/bit-hotupdate @gongxh/bit-core @gongxh/bit-net
```

## 使用说明

### 热更新管理器 (HotUpdateManager)

全局单例，是推荐使用的入口，内部会自动创建和管理 `HotUpdate` 实例。

**初始化**：
- `getInstance()` - 获取单例实例
- `init(manifestUrl, version)` - 初始化热更新系统，游戏启动时调用一次
  - `manifestUrl` - 本地 project.manifest 文件地址（`assets.nativeUrl`）
  - `version` - 带 build 号的游戏版本号，如 `1.0.0.23`

**检查更新**：
- `checkUpdate()` - 检查是否有新版本
  - 返回 `Promise<{ needUpdate: boolean, size?: number }>`
  - `needUpdate` - 是否需要更新
  - `size` - 需要下载的资源大小（KB），仅 `needUpdate` 为 `true` 时有效
  - 失败（未初始化 / 正在更新或检查中）会 `throw Error`，需自行 `try/catch`

**开始更新**：
- `startUpdate(options)` - 开始下载更新
  - `options.skipCheck` - 是否跳过检查更新（默认 `false`）
  - `options.progress` - 进度回调 `(downloadedKB, totalKB) => void`
  - `options.complete` - 结束回调 `(code: HotUpdateCode, message: string) => void`，见下方状态码说明
  - 平台不支持 / 未初始化 / 正在更新中 会通过 `complete` 回调（未初始化除外，会 `throw Error`）通知，不会开始下载

**重试更新**：
- `retryUpdate()` - 重试失败的资源下载，必须在调用过 `startUpdate()` 之后使用，否则 `throw Error`

**属性**：
- `writablePath` - 热更新资源存储的可写路径
- `manifestUrl` - 本地 manifest 路径
- `version` - 初始化时传入的游戏版本号
- `resVersion` - 当前资源版本号（get/set），须初始化成功后再读取

### 典型使用流程

1. **初始化** - 游戏启动时调用 `HotUpdateManager.getInstance().init(manifestUrl, version)`
2. **检查更新** - 调用 `checkUpdate()`，根据 `needUpdate` 和 `size` 决定是否提示用户
3. **提示用户** - 显示更新对话框（如果需要更新）
4. **开始更新** - 用户确认后调用 `startUpdate({ progress, complete })`
5. **显示进度** - 在 `progress` 回调里更新进度条
6. **处理结果** - 根据 `complete` 回调的 `code` 判断跳过还是重试；更新成功会自动重启游戏，不会触发 `complete`

### 状态码 (HotUpdateCode)

`complete` 回调收到的错误码，成功更新不会走这个回调（会直接重启游戏）：

- `LatestVersion` (-1001) - 已是最新版本，或当前平台不需要热更新
- `Updating` (-1002) - 正在更新或正在检查更新中
- `WaitRetry` (-1003) - 单次下载失败，可调用 `retryUpdate()` 重试
- `UpdateError` (-1004) - 更新过程出现不可恢复的错误（含解压失败），一般需要重启游戏重新走一次流程
- `CheckError` (-1005) - 检查更新阶段出错（读取本地/远程 manifest 失败等），具体原因见 `message`

### Manifest 文件

热更新需要两个 manifest 文件：

1. **project.manifest** - 完整的资源清单
   - 包含所有资源的 MD5 和大小
   - 用于计算需要下载的文件

2. **version.manifest** - 轻量级版本文件
   - 只包含版本信息
   - 用于快速检查版本

### 服务端配置

**目录结构**：
```
hotupdate/
├── version.manifest
├── project.manifest
├── assets/
└── src/
```

**Nginx 配置要点**：
- 允许跨域请求
- manifest 文件禁止缓存
- 支持 Range 请求（断点续传）

详细 API 请查看 `bit-hotupdate.d.ts` 类型定义文件。

## 依赖

- [@gongxh/bit-core](https://www.npmjs.com/package/@gongxh/bit-core) - 核心功能

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-hotupdate)
