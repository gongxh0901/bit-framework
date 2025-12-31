# 行为树

[![npm version](https://badge.fury.io/js/kunpocc-behaviortree.svg)](https://badge.fury.io/js/kunpocc-behaviortree)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

一个简洁、高效的 TypeScript 行为树库。
该库无任何依赖，理论上可用于所有js、ts项目。
作者主要使用此库作为游戏AI的实现。

## 什么是行为树
行为树（Behavior Tree）是一种用于描述和控制复杂行为逻辑的数据结构，最初在游戏AI领域大放异彩，现在已经广泛应用于机器人控制、自动化系统等领域。它简单、直观、可扩展，是真正解决实际问题的好工具。

行为树本质上是一个**有向无环图**，用树状结构来组织和执行行为逻辑。每个节点代表一个行为或决策，通过父子关系形成层次化的控制流。

* 如果你从来没接触过行为树，可以看下这篇文章

  [行为树逻辑详解](./docs/BehaviorTree.md)


## 可视化编辑器

[下载地址:https://store.cocos.com/app/detail/8201](https://store.cocos.com/app/detail/8201)


查看详情: [编辑器文档](./docs/USED.md)

![image](./image/bt-gui.png)

## 特性

- 🔧 **类型安全**: 完整 TypeScript 支持
- 📦 **零依赖**: 纯净实现，无第三方依赖
- 🔄 **状态管理**: 分层黑板系统，数据隔离清晰

## 快速开始

#### 安装

```bash
npm install kunpocc-behaviortree
```

#### 内置demo (基于cocos creator 3.8.6)

项目根目录下的 `bt-demo`文件夹

## 核心概念

#### 状态类型
```typescript
enum Status {
    SUCCESS,    // 成功
    FAILURE,    // 失败  
    RUNNING     // 运行中
}
```

#### 节点类型
- **组合节点**: 包含多个子节点  (Composite)
- **装饰节点**: 有且只有一个子节点（Decorator） 
- **叶子节点**: 不能包含子节点 (LeafNode)
- **条件节点**: 特殊的叶子节点 (Condition)


## 内置节点

### 组合节点 (Composite)

##### Selector - 选择节点  
* 选择第一个成功的子节点

##### Sequence - 顺序节点
* 按顺序执行子节点，执行过程中子节点返回非SUCCESS，则返回子节点状态，全部成功返回SUCCESS

##### Parallel - 并行节点
* 依次执行所有子节点（从左到右），全部成功才成功
* 注意：这里的"并行"是逻辑概念，实际是顺序执行

##### RandomSelector - 随机选择节点
* 随机选择一个子节点执行

##### ParallelAnySuccess - 并行任一成功
* 依次执行所有子节点（从左到右），任一成功就成功



### 装饰节点 (Decorator)

##### ConditionDecorator - 条件装饰节点

* 子类需实现

  ```typescript
  /**
   * 判断是否满足条件
   * @returns 是否满足条件
   */
  protected abstract isEligible(): boolean;
  ```

##### Inverter - 反转节点
* 反转子节点的成功/失败状态

##### LimitTime - 时间限制

* 规定时间内,  向父节点返回子节点的结果，超时后返回失败

##### LimitTicks - 次数限制

* 执行次数(子节点非RUNNNG状态)内，向父节点返回子节点的结果，超过次数后返回失败

##### Repeat - 重复节点
* 重复执行指定次数

##### RepeatUntilSuccess - 重复直到成功

* 设置最大重试次数

##### RepeatUntilFailure - 重复直到失败  

* 设置最大重试次数

##### WeightDecorator - 权重装饰节点

* 用于随机选择节点的子节点的按权重随机



### 叶子节点 (LeafNode)

##### LeafNode - 叶子节点基类

##### WaitTicks - 次数等待节点

##### WaitTime - 时间等待节点



### 条件节点 (Condition)

##### Condition - 条件节点基类

* 特殊的叶子节点，子类需实现

  ```typescript
  /**
   * 判断是否满足条件
   * @returns 是否满足条件
   */
  protected abstract isEligible(): boolean;
  ```

  

## 黑板系统

### 黑板系统的作用

黑板系统（Blackboard System）是行为树中的数据共享中心，类似于传统 AI 系统中的黑板概念。它解决了行为树中节点间数据传递和状态共享的核心问题：

- **数据传递**：在不同节点间传递运行时数据
- **状态管理**：维护游戏对象的状态信息
- **解耦设计**：避免节点间直接依赖，提高代码可维护性
- **上下文感知**：让节点能够感知周围环境和历史状态

### 数据隔离层次

黑板系统采用三层数据隔离设计，形成清晰的数据作用域：

#### 1. 本地数据（Node Level）
- **作用域**：当前节点可见
- **生命周期**：随节点创建和销毁
- **用途**：节点内部状态、临时变量、私有数据

#### 2. 树级数据（Tree Level）
- **作用域**：整棵行为树内所有节点可见
- **生命周期**：随行为树创建和销毁
- **用途**：树内节点间共享的状态、任务进度、策略参数

#### 3. 全局数据（Global Level）
- **作用域**：所有行为树实例可见
- **生命周期**：应用程序生命周期
- **用途**：全局配置、静态数据、跨树共享状态


### 黑板的使用
```typescript
import * as BT from "kunpocc-behaviortree";

// 设置全局数据 所有行为树实例可见
BT.globalBlackboard.set("playerPosition", {x: 100, y: 100});

// 在节点中使用黑板数据
export class BTAction extends BT.LeafNode {
    public tick(): BT.Status {
        // 获取全局数据
        const playerPosition = this.getGlobal<{x: number, y: number}>("playerPosition");
        console.log(playerPosition);

        // 设置树级数据
        this.setRoot("isDead", true);

        // 获取树级数据
        const isDead = this.getRoot<boolean>("isDead");
        console.log(isDead);

        // 设置节点数据
        this.set<boolean>("finished", true);

        // 获取节点数据
        const finished = this.get<boolean>("finished");
        console.log(finished);

        return BT.Status.SUCCESS;
    }
}
```

## 贡献

欢迎提交 Issue 和 Pull Request。请确保：
1. 代码风格一致
2. 添加适当的测试
3. 更新相关文档

---

*"好的程序员关心数据结构，而不是代码。"* - 这个库遵循简洁设计原则，专注于解决实际问题。