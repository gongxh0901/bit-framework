# bit-event

轻量级事件系统，提供全局事件管理和模块间通信。

## 简介

`bit-event` 是一个轻量级、高性能的事件系统，提供全局事件管理和模块间松耦合通信能力。支持事件的添加、移除、发送、批量管理等操作，适用于游戏各系统之间的解耦通信。

**核心特性**：
- 🚀 零依赖，轻量级实现
- 📡 全局事件管理器
- 🎯 支持按 ID、名称、目标对象移除事件
- 🔥 支持一次性事件（addOnce）
- 🎨 完整的 TypeScript 类型定义
- ⚡ 高性能事件分发机制

## 安装

```bash
npm install @gongxh/bit-event
```

## 使用说明

### 全局事件 (GlobalEvent)

全局单例事件管理器，用于模块间通信。

**添加事件**：
- `add(name, callback, target?)` - 添加事件监听，返回事件 ID
- `addOnce(name, callback, target?)` - 添加一次性事件监听（触发后自动移除）

**发送事件**：
- `send(name, ...args)` - 发送事件给所有监听者
- `sendToTarget(name, target, ...args)` - 发送事件给指定目标

**移除事件**：
- `remove(eventId)` - 按 ID 移除事件
- `removeByName(name)` - 移除指定名称的所有事件
- `removeByTarget(target)` - 移除指定目标的所有事件
- `removeByNameAndTarget(name, target)` - 移除指定名称和目标的事件
- `clearAll()` - 清空所有事件

**参数说明**：
- `name` - 事件名称（建议使用常量管理）
- `callback` - 回调函数 `(...args: any[]) => void`
- `target` - 目标对象（用于批量移除）
- `eventId` - 事件 ID（add 方法返回）

### 事件管理器 (EventManager)

可创建独立的事件管理器实例，用于特定模块或系统。

**使用方式**：
- `new EventManager()` - 创建独立的事件管理器
- API 与 `GlobalEvent` 完全相同

**适用场景**：
- 需要隔离的事件系统
- 模块内部事件管理
- 可以整体清空的事件组

### 最佳实践

1. **使用事件名称常量** - 避免字符串拼写错误

2. **及时移除事件** - 在对象销毁时移除监听，避免内存泄漏

3. **使用 target 参数** - 方便批量移除事件

4. **避免事件循环** - 不要在事件 A 中触发事件 B，再在事件 B 中触发事件 A

5. **事件分组管理** - 对于复杂系统，使用独立的 EventManager 实例

详细 API 请查看 `bit-event.d.ts` 类型定义文件。

## 依赖

无外部依赖

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-event)
