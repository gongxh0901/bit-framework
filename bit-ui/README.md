# bit-ui

基于 FairyGUI 的 UI 管理系统，提供灵活的窗口管理和装饰器支持。

## 简介

`bit-ui` 是基于 FairyGUI 的 UI 管理库，提供窗口生命周期管理、资源自动加载、多窗口组管理等功能。支持配套的可视化编辑器一键导出界面配置。

**核心特性**：
- 🎨 灵活的 UI 装饰器
- 🪟 完整的窗口生命周期管理
- 📦 自动资源加载和卸载
- 🎯 窗口间关系控制（隐藏/关闭前一个界面）
- 🎪 多窗口组管理
- 📊 Header 资源栏复用
- 🖥️ 配套可视化编辑器（付费插件）

**依赖**：
- FairyGUI - [官方文档](https://www.fairygui.com/docs/editor)

## 安装

```bash
npm install @gongxh/bit-ui
```

## 可视化编辑器

提供专业的 FairyGUI 配置编辑器，支持快速配置和导出。

**下载地址**：[Cocos Store - kunpo-fgui](https://store.cocos.com/app/detail/7213)

## 使用说明

### UI 装饰器

使用装饰器简化 UI 组件定义和配置。

**窗口装饰器**：
- `@uiclass(groupName, pkgName, name, inlinePkgs?)` - 注册窗口类
  - `groupName` - 窗口组名称
  - `pkgName` - FairyGUI 包名
  - `name` - 组件名（必须和类名相同）
  - `inlinePkgs` - 内联的包名（可选，当前界面引用其他包资源时使用）

**Header 装饰器**：
- `@uiheader(pkgName, name)` - 注册 Header 类
  - 用于定义窗口顶部资源栏

**UI 组件装饰器**：
- `@uicom(pkgName, name)` - 注册自定义 UI 组件类

**属性装饰器**：
- `@uiprop` - 标记 FairyGUI 组件属性（按钮、文本、列表等）
- `@uicontrol` - 标记 FairyGUI 控制器
- `@uitransition` - 标记 FairyGUI 动画

**事件装饰器**：
- `@uiclick` - 标记点击事件处理函数

### 窗口基类 (Window)

所有窗口的基类，提供完整的生命周期。

**生命周期方法**：
- `onInit()` - 窗口初始化
- `onShow(userdata?)` - 窗口显示
- `onHide()` - 窗口隐藏
- `onClose()` - 窗口关闭
- `onShowFromHide()` - 从隐藏状态恢复
- `onToTop()` - 窗口到顶层
- `onToBottom()` - 窗口到底层
- `onEmptyAreaClick()` - 点击空白区域
- `onAdapted()` - 窗口适配完成

### Header 基类 (Header)

窗口顶部资源栏基类，支持多窗口复用。

**生命周期方法**：
- `onInit()` - Header 初始化
- `onShow(userdata?)` - Header 显示
- `onHide()` - Header 隐藏
- `onClose()` - Header 关闭
- `onShowFromHide()` - 从隐藏状态恢复
- `onAdapted()` - 适配完成

### 窗口管理器 (WindowManager)

全局窗口管理器，负责窗口的创建、显示、关闭等。

**配置方法**：
- `setPackageCallbacks(callbacks)` - 设置 UI 包加载回调
  - `callbacks.showWaitWindow` - 显示加载等待窗口
  - `callbacks.hideWaitWindow` - 隐藏加载等待窗口
  - `callbacks.fail` - 加载失败回调
- `addManualPackage(pkgName)` - 添加手动管理资源的包
- `setPackageInfo(pkgName, bundleName?, path?)` - 设置包所在的 bundle 和路径
- `setUIConfig(config)` - 设置 UI 导出数据

**窗口操作**：
- `showWindow<T>(windowClass, userdata?)` - 异步打开窗口（自动加载资源）
  - 参数是窗口类（构造函数），非窗口名称
- `closeWindow<T>(windowClass)` - 关闭窗口（通过窗口类）
- `closeWindowByName(name)` - 关闭窗口（通过窗口名称）
- `getWindow<T>(name)` - 获取窗口实例
- `getTopWindow<T>(isAll?)` - 获取最顶层窗口
- `hasWindow(name)` - 检查窗口是否存在

**其他方法**：
- `getGroupNames()` - 获取所有窗口组名称
- `getWindowGroup(name)` - 获取指定窗口组
- `closeAllWindow(ignores?)` - 关闭所有窗口
- `releaseUnusedRes()` - 释放不再使用的 UI 资源

### 窗口类型 (WindowType)

定义窗口显示时对其他窗口的处理方式：

- `Normal` - 不做任何处理
- `CloseAll` - 关闭所有窗口
- `CloseOne` - 关闭上一个窗口
- `HideAll` - 隐藏所有窗口
- `HideOne` - 隐藏上一个窗口

### 适配类型 (AdapterType)

窗口适配类型：

- `Full` - 全屏适配（默认）
- `Bang` - 空出刘海区域
- `Fixed` - 固定尺寸，不适配

### 典型使用流程

1. **FairyGUI 设计** - 使用 FairyGUI 编辑器设计界面
2. **定义窗口类** - 继承 Window 并使用 @uiclass 装饰器注册
3. **配置属性和事件** - 使用 @uiprop 和 @uiclick 标记
4. **配置加载回调** - 调用 `WindowManager.setPackageCallbacks()`（可选）
5. **打开窗口** - 调用 `WindowManager.showWindow(MyWindow, userdata)`
6. **管理生命周期** - 实现窗口生命周期方法

详细 API 请查看 `bit-ui.d.ts` 类型定义文件和 FairyGUI 官方文档。

## 依赖

- [FairyGUI](https://www.fairygui.com/) - UI 编辑器和运行时库

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-ui)
