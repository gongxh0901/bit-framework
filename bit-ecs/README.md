# bit-ecs

高性能 Entity-Component-System 框架，为游戏开发和大规模实时模拟提供优化解决方案。

## 简介

`bit-ecs` 是一个高性能的 ECS 框架，使用优化的数据结构和算法支持处理大量实体。采用稀疏集合 + 密集数组的数据布局方式，适合频繁添加删除实体和组件的场景。

**核心特性**：
- ⚡ 高性能设计，优化的数据结构
- 💾 内存高效，使用对象池减少 GC 压力
- 🔍 强大的实体查询系统
- 📊 完整的 TypeScript 类型支持
- 🎯 命令缓冲模式，避免迭代中修改
- 🖥️ 配套可视化编辑器（付费插件）

**版本支持**：
- Cocos Creator 3.7.0+ ✅

## 安装

```bash
npm install @gongxh/bit-ecs
```

## 可视化编辑器

提供专业的数据编辑器，支持可视化配置实体和组件。

**下载地址**：[Cocos Store - kunpoec](https://store.cocos.com/app/detail/7311)

**编辑器要求**：基于 Creator 3.8.6 开发，支持 3.7.0 及之后版本

## 使用说明

### 核心概念

- **实体 (Entity)** - 游戏对象的唯一标识符（纯数字 ID）
- **组件 (Component)** - 纯数据结构，描述实体特性
- **系统 (System)** - 包含游戏逻辑，处理特定组件组合的实体
- **世界 (World)** - 管理所有实体、组件和系统的容器

### 组件 (Component)

组件基类，所有组件必须继承。

**装饰器**：
- `@ecsclass(name)` - 注册组件类
- `@ecsprop(config)` - 注册组件属性（用于编辑器）

**必须实现**：
- `reset()` - 重置组件数据（用于对象池回收）

### 系统 (System)

系统基类，包含游戏逻辑。

**装饰器**：
- `@ecsystem(name, options?)` - 注册系统类

**生命周期**：
- `onInit()` - 系统初始化（配置查询规则）
- `update(dt)` - 每帧更新

**查询规则配置**：
- `this.matcher.allOf(...types)` - 必须包含所有指定组件
- `this.matcher.anyOf(...types)` - 包含任意一个指定组件
- `this.matcher.excludeOf(...types)` - 必须不包含指定组件
- `this.matcher.optionalOf(...types)` - 可选组件（查询时一并返回）

### 查询器 (Query)

提供高效的实体查询和迭代。

**查询方式**：
1. **直接获取实体集合**：
   - `this.query.entitys` - 获取所有匹配实体

2. **通用迭代器**（最多 8 个组件，极少 GC）：
   - `this.query.iterate(...types)` - 通用迭代

3. **特定数量迭代器**（零 GC）：
   - `this.query.iterate1(Type1)` - 1 个组件
   - `this.query.iterate2(Type1, Type2)` - 2 个组件
   - `this.query.iterate3(Type1, Type2, Type3)` - 3 个组件
   - `this.query.iterate4(Type1, Type2, Type3, Type4)` - 4 个组件

### 世界 (World)

ECS 世界实例，管理所有实体、组件和系统。

**创建世界**：
- `new World(name, maxEntityCount)` - 创建世界
  - `name` - 世界名称
  - `maxEntityCount` - 最大实体数（建议 2 的指数）

**系统管理**：
- `addSystem(system)` - 添加系统
- `SystemGroup(name, frameInterval?)` - 创建系统组
  - `frameInterval` - 帧间隔（可选，如 3 表示每 3 帧更新一次）

**实体管理**：
- `createEmptyEntity()` - 创建空实体
- `createEntity(entityName)` - 通过配置创建实体
- `removeEntity(entity)` - 删除实体（延迟到下一帧）

**组件管理**：
- `addComponent(entity, Type)` - 添加组件（延迟到下一帧）
- `removeComponent(entity, Type)` - 移除组件（延迟到下一帧）
- `getComponent<T>(entity, Type)` - 获取组件

**更新**：
- `initialize()` - 初始化世界（必须调用）
- `update(dt)` - 更新世界（每帧调用）

### 命令缓冲区

使用命令缓冲模式避免迭代中修改数据结构：

- 删除实体 - 延迟到下一帧 update 前处理
- 添加组件 - 延迟到下一帧 update 前处理
- 删除组件 - 延迟到下一帧 update 前处理

### 性能特点

**数据布局方式**（稀疏集合 + 密集数组）：
- ✅ 优秀：频繁添加删除实体
- ✅ 优秀：频繁添加删除组件
- ✅ 良好：系统遍历
- ⚠️ 较差：内存占用

**查询器优化**：
- 条件相同时自动复用
- 多次获取查询结果无额外消耗
- 使用掩码进行高效匹配

### 典型使用流程

1. **定义组件** - 继承 Component 并使用装饰器
2. **定义系统** - 继承 System 并配置查询规则
3. **创建世界** - 实例化 World 并设置最大实体数
4. **注册系统** - 添加系统和系统组
5. **初始化世界** - 调用 `world.initialize()`
6. **创建实体** - 创建实体并添加组件
7. **更新世界** - 在游戏循环中调用 `world.update(dt)`

详细 API 请查看 `bit-ecs.d.ts` 类型定义文件。

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-ecs)
