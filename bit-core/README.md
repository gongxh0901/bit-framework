# bit-core

Bit Framework 的核心库，为 Cocos Creator 3.x 游戏开发提供基础功能支持。

## 简介

`bit-core` 是 Bit Framework 的核心库，包含平台检测、时间工具、定时器系统、数据结构、日志工具等核心功能。需要 Cocos 集成能力的模块可将其作为 peer 依赖；独立模块可按需单独使用。

**核心特性**：
- ⏰ 完整的时间处理系统（网络时间同步、格式化、时长计算）
- ⏲️ 高性能全局定时器（延迟、循环、暂停/恢复）
- 🖥️ 自动平台检测（Android、iOS、HarmonyOS、小游戏、浏览器）
- 📐 屏幕适配信息（屏幕尺寸、安全区）
- 🧩 模块系统基类
- 🛠️ 实用工具集（版本比较、URL 处理、JSON 校验）
- 📊 高效数据结构（二叉堆、链表、栈）
- 📝 统一日志系统
- 🔧 完整的 TypeScript 类型定义

**版本支持**：
- Cocos Creator 3.7+ ✅
- Cocos Creator 3.8+ ✅

## 安装

```bash
npm install @gongxh/bit-core
```

## 使用说明

### 时间工具 (Time)

完整的时间处理工具类，支持网络时间同步。

**基础方法**：
- `now()` - 获取当前时间戳（毫秒）
- `setNetTime(netTime)` - 设置网络时间用于同步
- `msTos(ms)` / `sToMs(s)` - 毫秒秒互转

**时间字段**：
- `getYear()` / `getMonth()` / `getDay()` - 获取年月日
- `getHour()` / `getMinute()` / `getSecond()` - 获取时分秒
- `getWeekDay()` - 获取星期几 (1-7)

**时间范围**：
- `getDayStartTime()` / `getDayEndTime()` - 当天起止时间
- `getWeekStartTime()` / `getWeekEndTime()` - 本周起止时间
- `getMonthStartTime()` / `getMonthEndTime()` - 本月起止时间
- `getYearStartTime()` / `getYearEndTime()` - 本年起止时间
- `getMonthDays()` - 获取当月天数

**时间比较**：
- `isSameDay()` / `isSameWeek()` / `isSameMonth()` / `isSameYear()` - 时间比较

**时间格式化**：
- `format(timestamp, pattern)` - 通用时间格式化
  - 支持 YYYY/YY, MM/M, DD/D, hh/h, mm/m, ss/s 等占位符
- `formatTime(timestamp)` - 格式化为 `YYYY-MM-DD hh:mm:ss`
- `formatTimeChinese(timestamp)` - 格式化为中文
- `formatDuration(seconds, pattern, options?)` - 时长格式化
  - 支持 DD/D, HH/H, hh/h, MM/M, mm/m, ss/s 等占位符
- `formatSmart(seconds)` - 智能时长格式化（自动隐藏为0的单位）
- `formatSmartSimple(seconds)` - 简化智能时长格式化（只显示最大两个单位）

### 全局定时器 (GlobalTimer)

全局定时器系统，支持延迟执行和循环执行。

**主要方法**：
- `startTimer(callback, interval, loop?)` - 启动定时器
  - `callback` - 回调函数
  - `interval` - 时间间隔（秒）
  - `loop` - 循环次数（0:一次, 1~n:n次, -1:无限）
  - 返回定时器 ID
- `stopTimer(timerId)` - 停止定时器
- `pauseTimer(timerId)` - 暂停定时器
- `resumeTimer(timerId)` - 恢复定时器
- `clearAllTimer()` - 清除所有定时器

### 平台检测 (Platform)

自动识别运行平台，提供平台信息。

**平台类型枚举 (PlatformType)**：
- `Android` / `IOS` / `HarmonyOS` - 原生平台
- `WX` / `Alipay` / `Bytedance` / `HuaweiQuick` - 小游戏平台
- `Browser` - 浏览器

**平台属性**：
- `platform` - 当前平台类型
- `isNative` / `isMobile` / `isNativeMobile` - 平台分类
- `isAndroid` / `isIOS` / `isHarmonyOS` - 原生平台判断
- `isWX` / `isAlipay` / `isBytedance` / `isHuaweiQuick` - 小游戏判断
- `isBrowser` - 浏览器判断
- `deviceId` - 设备 ID

### 屏幕信息 (Screen)

提供屏幕尺寸和安全区信息。

**属性**：
- `ScreenWidth` / `ScreenHeight` - 屏幕宽高
- `DesignWidth` / `DesignHeight` - 设计分辨率宽高
- `SafeAreaTop` / `SafeAreaBottom` / `SafeAreaLeft` / `SafeAreaRight` - 四边安全区 inset
- `SafeWidth` / `SafeHeight` - 安全区宽高
- `SafeCenterX` / `SafeCenterY` - 安全区中心（FairyGUI 坐标）

**配置**（`CocosEntry` Inspector）：
- `safeAreaTop` - 顶部安全区。竖屏用作上侧 inset；横屏因无法区分左/右朝向，左右对称都用此值
- `safeAreaBottom` - 底部安全区，仅竖屏生效

长边/短边 ≤ 16:9 时四边 inset 清零，安全区等于全屏。

### 模块基类 (Module)

组织游戏系统的抽象基类。

**使用方式**：
- 继承 `Module` 类
- 实现 `onInit()` 方法
- `moduleName` - 模块名称属性

### 工具类 (Utils)

实用工具函数集。

**主要方法**：
- `compareVersion(v1, v2)` - 版本号比较
  - 返回值：>0 表示 v1>v2，=0 表示相等，<0 表示 v1<v2
- `isJsonString(str)` - 判断是否为 JSON 字符串
- `getUrlParam(url)` - 解析 URL 参数
  - 返回 `{url: string, params: {...}}`
- `addUrlParam(url, key, value)` - 给 URL 添加参数

### 日志系统

统一的日志输出接口。

**日志函数**：
- `enableDebugMode(enabled)` - 启用/禁用调试模式
- `debug(...args)` - 调试日志
- `log(...args)` - 普通日志
- `info(...args)` - 信息日志
- `warn(...args)` - 警告日志
- `error(...args)` - 错误日志

### 数据结构

内置高效的数据结构。

**BinaryHeap（二叉堆）**：
- `new BinaryHeap<T>(compareFn)` - 创建堆
- `push(value)` / `pop()` / `peek()` - 入堆/出堆/查看堆顶
- `size()` / `clear()` - 获取大小/清空

**LinkedList（链表）**：
- `append(value)` / `prepend(value)` - 尾部/头部添加
- `remove(value)` / `find(value)` - 移除/查找
- `clear()` - 清空

**DoublyLinkedList（双向链表）**：
- 支持双向遍历的链表

**Stack（栈）**：
- `push(value)` / `pop()` / `peek()` - 入栈/出栈/查看栈顶
- `size()` / `clear()` - 获取大小/清空

详细 API 请查看 `bit-core.d.ts` 类型定义文件。

## 相关模块

`bit-core` 是下列模块的直接 peer 依赖：

- **bit-ui** - UI 系统
- **bit-condition** - 条件显示系统
- **bit-minigame** - 小游戏适配
- **bit-hotupdate** - 热更新

其他模块没有 `bit-core` 依赖，可独立安装。更多信息请参考 [根目录 README](../README.md) 和 [架构文档](../docs/ARCHITECTURE.md)。

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-core)
