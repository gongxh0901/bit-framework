# Changelog

## [0.5.0] - 2026-08-14

### Added
- feature: 安全区改为四边 inset 并支持配置 (bdf1305)

### Chore
- chore: submodule 改为相对路径，GitHub/GitLab 各自解析 (af85a2e)

## [0.4.1] - 2026-08-13

### Chore
- chore: 将 FairyGUI 以 submodule 纳入 workspace (99004e6)
- chore: 版本与 bit-framework 对齐为 0.4.0，发版改走主仓库 (fairygui-cc 175331a)

## [0.4.0] - 2026-08-13

### Changed
- addPackage方法支持bundle参数 (fairygui-cc 51c2447)
- 编译报错,添加类型断言 (fairygui-cc 05288b3)

### Fixed
- 修复 tsconfig 中的已弃用的值 (fairygui-cc 86cc1c9)

### Chore
- chore: 内部依赖改为 peer 避免重复安装 (0dcb88c)
- chore: 添加发版技能并透传 onUpdate dt (fairygui-cc fed1252)
- 添加忽略 (fairygui-cc 8c5008d)

## [0.3.2] - 2026-08-13

### Changed
- 修改fgui引用 (b7998d7)

## [0.3.1] - 2026-08-13

### Fixed
- fix: 修复异步错误堆栈被吞掉 (7006141)

## [0.2.3] - 2026-08-13

### Added
- feat(ec): createComponent 支持传入组件类 (9924ab6)

## [0.2.2] - 2026-08-12

### Added
- feature: 支持临时替换 version.manifest 便于线上热更测试 (5619f4a)

## [0.2.1] - 2026-08-05

### Changed
- 热更新调整：`HotUpdateCode` 新增解压错误码 `DecompressError`，与更新错误码 `UpdateError` 区分开 (735691a)

## [0.2.0] - 2026-08-05

### Changed
- refactor: 简化 `bit-hotupdate` 错误处理，`checkUpdate` 返回结构化结果 `{needUpdate, size}` 替代抛出异常载荷 (f8cd5ec)
- 热更新初始化注释修改 (e7cb685)

### Chore
- chore: 清理废弃的 `IPromiseResult`/`ICheckUpdatePromiseResult` 类型，同步 `bit-hotupdate` README (cde994a)

## [0.1.5] - 2026-08-03

### Added
- feature: bit-condition 导出 `ConditionBase` (5972986)

### Changed
- refactor: bit-condition API 重命名（`type` → `_type`，`init` → `conditionClass`）(23b826b)

## [0.1.4] - 2026-07-31

### Changed
- refactor: 清理残留的 kunpo 命名，统一改为 bit（`KUNPO_DEBUG` → `BIT_DEBUG`，文档与注释中的 `kunpocc-behaviortree`/`kunpo` 引用更新为 `bit-behaviortree`/`bit`）(9d6a005)

## [0.1.3] - 2026-07-30

### Changed
- refactor: 重写 `Binary` 二进制编解码（格式标记 0xF1），引入共享字符串表、对象 shape 去重与更紧凑的数值编码，体积与编解码性能显著提升；与旧格式 0xF0 不兼容，旧二进制需重新生成 (650f677)

## [0.1.2] - 2026-07-29

### Added
- feat: 新增 `WaitWindowManager` 通用等待窗管理，支持引用计数式的 `show`/`hide` 以及 `run` 包裹同步/异步任务 (ef838aa)
- feat: `IWindowOpenOptions` 新增 `beforeLoad` 打开窗口前的异步准备钩子，在 UI 包资源加载前执行，期间自动显示通用等待窗 (ef838aa)

## [0.1.1] - 2026-07-28

### Changed
- **Breaking**: `AssetPool.releaseDir` 返回类型由 `Promise<boolean>` 改为 `Promise<void>`，失败时 reject 的值由 `false` 改为真实的 `Error` 对象 (2cde224)
- refactor: `AssetPool.releaseDir`、`AssetUtils.loadBundle` 去掉 `new Promise` 嵌套，改为 async/await 写法 (2cde224)
- refactor: `HotUpdate` 的 `checkUpdate`、`readLocalManifest`、`loadRemoteVersionManifest`、`refreshLocalManifest` 由 Promise 链改为 async/await 顺序执行；`startCheckUpdate` 的回调清理逻辑抽取为 `finishCheckUpdate` (2cde224)
- refactor: `HotUpdateManager.checkUpdate` 改为 async/await，`_updating` 复位改用 `try/finally`，`new HotUpdate()` 构造失败时不再残留"更新中"状态 (2cde224)
- refactor: `ResLoader` 的 bundle 加载逻辑抽取为独立的 `loadBundle` 方法，`loadSingleUIPackage`、`loadWindowRes` 改为 async/await 写法 (2cde224)
- refactor: `version.manifest` 的请求超时由 5 秒变为 6 秒（改用 `ReadNetFile.read` 的默认超时）(2cde224)

### Added
- feat: `ReadNetFile.read<T>(res)` 新增静态 Promise 版网络文件读取接口，`timeout` 默认 6 秒、`responseType` 默认 `text` (2cde224)

## [0.1.0] - 2026-07-28

> ⚠️ 使用0.0.x 版本开发，不建议升级。

### Changed
- **Breaking**: UI 包默认路径调整 — `WindowManager.setPackageInfo` 的 `path` 参数默认值由 `"ui"` 改为 `""`，未显式设置路径时包直接从 bundle 根目录查找，不再自动拼接 `ui/` 前缀 (2638490)
- refactor: `InfoPool.getPackagePath` 只在注册过自定义路径时拼接前缀，否则直接返回包名 (2638490)

### Added
- feat: `AssetPool.getBundle(bundlename)` 新增获取已加载 bundle 的接口，未加载时抛出异常 (2638490)

## [0.0.14] - 2026-07-27

### Changed
- refactor: fairygui 依赖改为 npm 包 `@gongxh/fairygui-cc`，删除根目录手写声明文件 `types/fairygui.d.ts`
- refactor: bit-ui、bit-condition 新增 `src/types/header.ts` 统一转发 `fgui` 命名空间，源码内的 fairygui 类型引用改为 `fgui.XXX` 形式
- chore: bit-ui、bit-condition 添加 `@gongxh/fairygui-cc` 依赖；rollup external 与 `.npmrc` hoist 规则同步为新包名

## [0.0.13] - 2026-07-27

### Changed
- 删除fairygui-cc包，只添加声明文件放入项目内 (afa4c61)

## [0.0.12] - 2026-03-24

### Fixed
- fix: SystemGroup更新时检查子系统启用状态 (e1e61bb)

## [0.0.11] - 2026-03-24

### Added
- feature: 添加World名称唯一性校验和全局注册机制 (6a59e01)

### Documentation
- docs: 更新 Star History 图表链接 (bc959a6)
- docs: 在 README 添加 Star History 图表 (93b0f8b)
- docs: 更新发版技能防护规则，移除 bit-demo 引用 (7329827)

### Chore
- chore: 修复发版流程并补充 CHANGELOG (67539a6)

### Changed
- demo从Monorepo中移除 (b4a8c1b)

## [0.0.10] - 2026-03-19

### Added
- feature: ECS 组件属性自动转换为 Cocos Creator 对象 (6557532)

## [0.0.9] - 2026-03-18

### Added
- 四叉树添加自定义数据支持，升级版本到0.0.9 (370f0a4)
- feature: 添加 Claude AI 辅助开发配置 (01e76ae)

### Changed
- refactor: 移除模板文件，改用 skill 命令创建 (21f0d0e)
- 代码规范 (8a6b273)
- 添加框架图，调整 demo (cb36178)

### Documentation
- docs: 重构文档结构，迁移至 docs/ 目录并添加 AI skills (d2fb46b)
- docs: 添加工作流执行标准规范 (f6fe2c1)
