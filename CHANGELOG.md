# Changelog

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
