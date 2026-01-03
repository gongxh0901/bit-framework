# bit-behaviortree

简洁、高效的 TypeScript 行为树库，适用于游戏 AI 开发。

## 简介

`bit-behaviortree` 是一个零依赖的行为树实现，使用有向无环图的树状结构组织和执行行为逻辑。行为树广泛应用于游戏 AI、机器人控制、自动化系统等领域，是解决复杂行为逻辑的优秀工具。

**核心特性**：
- 🔧 完整的 TypeScript 类型支持
- 📦 零依赖，纯净实现
- 🔄 分层黑板系统，数据隔离清晰
- 🎯 内置丰富的节点类型
- 🖥️ 配套可视化编辑器（付费插件）

**行为树资料**：
- [行为树逻辑详解](./docs/BehaviorTree.md)

## 安装

```bash
npm install @gongxh/bit-behaviortree
```

## 可视化编辑器

提供专业的可视化编辑器，支持拖拽式设计行为树。

**下载地址**：[Cocos Store](https://store.cocos.com/app/detail/8201)

**编辑器文档**：[编辑器使用文档](./docs/GUI-USED.md)

![编辑器截图](./image/bt-gui.png)

## 使用说明

### 状态类型 (Status)

行为树节点的执行结果：

- `SUCCESS` - 成功
- `FAILURE` - 失败
- `RUNNING` - 运行中

### 节点类型

**组合节点 (Composite)**：
- `Selector` - 选择第一个成功的子节点
- `Sequence` - 按顺序执行子节点，全部成功才成功
- `Parallel` - 并行执行所有子节点（逻辑并行，实际顺序执行）
- `RandomSelector` - 随机选择一个子节点执行
- `ParallelAnySuccess` - 任一子节点成功即成功

**装饰节点 (Decorator)**：
- `ConditionDecorator` - 条件装饰，需实现 `isEligible()` 方法
- `Inverter` - 反转子节点的成功/失败状态
- `LimitTime` - 时间限制，超时返回失败
- `LimitTicks` - 次数限制，超过次数返回失败
- `Repeat` - 重复执行指定次数
- `RepeatUntilSuccess` - 重复直到成功（可设置最大次数）
- `RepeatUntilFailure` - 重复直到失败（可设置最大次数）
- `WeightDecorator` - 权重装饰，用于随机选择

**叶子节点 (LeafNode)**：
- `LeafNode` - 叶子节点基类，需实现 `tick()` 方法
- `WaitTicks` - 等待指定帧数
- `WaitTime` - 等待指定时间

**条件节点 (Condition)**：
- `Condition` - 条件节点基类，需实现 `isEligible()` 方法

### 黑板系统 (Blackboard)

黑板系统是行为树的数据共享中心，提供三层数据隔离：

**1. 全局数据 (Global Level)**：
- 作用域：所有行为树实例可见
- 生命周期：应用程序生命周期
- 用途：全局配置、静态数据、跨树共享状态

**2. 树级数据 (Tree Level)**：
- 作用域：整棵行为树内所有节点可见
- 生命周期：随行为树创建和销毁
- 用途：树内节点间共享的状态、任务进度

**3. 本地数据 (Node Level)**：
- 作用域：当前节点可见
- 生命周期：随节点创建和销毁
- 用途：节点内部状态、临时变量

**黑板 API**：
- `globalBlackboard.set(key, value)` - 设置全局数据
- `this.getGlobal<T>(key)` - 获取全局数据
- `this.setRoot(key, value)` - 设置树级数据
- `this.getRoot<T>(key)` - 获取树级数据
- `this.set(key, value)` - 设置节点数据
- `this.get<T>(key)` - 获取节点数据

### 典型使用流程

1. **定义节点类型** - 创建自定义叶子节点和条件节点
2. **构建行为树** - 组合节点构建树结构
3. **设置黑板数据** - 配置初始数据
4. **更新行为树** - 在游戏循环中调用 `tick()` 方法
5. **响应结果** - 根据返回的状态处理逻辑

详细 API 请查看 `bit-behaviortree.d.ts` 类型定义文件和编辑器文档。

## 内置示例

项目根目录下的 `bt-demo` 文件夹提供完整示例（基于 Cocos Creator 3.8.6）。

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-behaviortree)
