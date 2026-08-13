# bit-condition

条件显示系统，用于实现 UI 红点、解锁提示等动态显示功能。

## 简介

`bit-condition` 是基于 Cocos Creator 的条件显示系统，提供灵活的条件判断和自动更新机制。适用于需要根据游戏数据动态控制 UI 显示的场景，如红点系统、功能解锁、任务提示等。

**核心特性**：
- 🎯 条件变化自动通知关联节点
- 🔄 支持 Any（任一）和 All（全部）条件组合模式
- 🎨 装饰器注册条件类型
- ⚡ 定时批量更新，性能优化
- 🔌 继承基类轻松扩展自定义条件

## 安装

`bit-core` 和 `@gongxh/fairygui-cc` 是 peer 依赖，需由项目自行安装，保证全项目只有一份：

```bash
npm install @gongxh/bit-condition @gongxh/bit-core @gongxh/fairygui-cc
```

## 使用说明

### 条件模块 (ConditionModule)

场景中的条件系统管理组件，负责定时更新所有条件。

**配置属性**：
- `updateDeltaTime` - 条件更新间隔（秒，默认 0.3）

**使用方式**：
- 在场景根节点或管理节点上添加 `ConditionModule` 组件
- 组件会自动初始化所有注册的条件

### 条件基类 (ConditionBase)

所有条件的抽象基类，需要继承并实现。

**必须实现的方法**：
- `onInit()` - 条件初始化，注册监听等
- `evaluate()` - 判断条件是否满足，返回 boolean

**可调用的方法**：
- `tryUpdate()` - 手动触发条件更新

**属性**：
- `type` - 条件类型（自动设置）

### 条件节点 (ConditionNode)

UI 节点上的组件，用于响应条件变化。

**配置属性**：
- `conditionTypes` - 需要监听的条件类型列表
- `modeType` - 条件模式（Any 或 All）
- `onNotify` - 条件变化回调函数 `(canShow: boolean) => void`

**使用方式**：
- 在需要动态显示的 UI 节点上添加 `ConditionNode` 组件
- 配置条件类型和模式
- 设置回调函数处理显示逻辑

### 条件模式 (ConditionMode)

- `ConditionMode.Any` (0) - 任意一个条件满足即可
- `ConditionMode.All` (1) - 所有条件都必须满足

### 条件管理器 (ConditionManager)

全局条件管理，提供静态方法。

**主要方法**：
- `initCondition()` - 初始化所有条件（由 ConditionModule 自动调用）
- `_addUpdateCondition(conditionType)` - 手动标记条件需要更新
- `_nowUpdateConditionNode(node)` - 立即更新指定节点

### 装饰器

使用 `@condition(conditionType)` 装饰器注册条件类：

```typescript
import { condition, ConditionBase } from '@gongxh/bit-condition';

@condition(ConditionType.NewMail)
export class NewMailCondition extends ConditionBase {
    protected onInit(): void {
        // 初始化逻辑
    }
    
    protected evaluate(): boolean {
        // 条件判断逻辑
        return MailSystem.hasUnreadMail();
    }
}
```

### 典型使用流程

1. **添加模块** - 在场景中添加 `ConditionModule` 组件
2. **定义条件类型** - 使用枚举定义条件类型
3. **实现条件类** - 继承 `ConditionBase` 并使用装饰器注册
4. **添加条件节点** - 在 UI 节点上添加 `ConditionNode` 组件
5. **触发更新** - 数据变化时调用 `ConditionManager._addUpdateCondition()`

详细 API 请查看 `bit-condition.d.ts` 类型定义文件。

## 依赖

- [@gongxh/bit-core](https://www.npmjs.com/package/@gongxh/bit-core) - 核心功能

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-condition)
