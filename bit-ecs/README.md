# kunpocc-ecs

高性能实体组件系统 (Entity-Component-System) 框架，为游戏开发和大规模实时模拟提供优化解决方案。

## 特性

- **提供数据编辑器**: https://store.cocos.com/app/detail/7311 

  > 编辑器基于creator3.8.6开发
  >
  > 支持creator3.7.0及之后的版本

- **高性能设计**：优化的数据结构和算法，支持处理大量实体

- **内存高效**：使用对象池和密集数据结构减少内存开销和GC压力

- **简洁API**：直观易用的接口设计，降低学习成本

- **完整类型支持**：使用TypeScript构建，提供全面的类型安全

- **灵活查询系统**：强大的实体查询功能

## 安装

```bash
npm install kunpocc-esc
```

## 核心概念

- **实体(Entity)**：游戏对象的唯一标识符，本质上是一个纯数字的ID
- **组件(Component)**：纯数据结构，附加到实体上，描述实体特性
- **系统(System)**：包含游戏逻辑，处理拥有特定组件组合的实体
- **世界(World)**：管理所有实体、组件和系统的容器

## 基本使用

### 1. 定义组件

* 使用装饰器标记的属性 才能被 ***kunpo-ec*** 插件检测到

```typescript
import { _ecsdecorator, Component } from 'kunpocc-esc';
const { ecsclass, ecsprop } = _ecsdecorator;

// 定义位置组件
@ecsclass("Position")
class Position extends Component {
  	// 使用装饰器标记的属性 才能被 kunpoec 插件检测到
    @ecsprop({ type: "int", defaultValue: 0 })
    public x: number = 0;

    @ecsprop({ type: "int", defaultValue: 0 })
    public y: number = 0;
    
    // 必须实现reset方法用于对象池回收时重置数据
    public reset(): void {
        this.x = 0;
        this.y = 0;
    }
}

// 定义速度组件
@ecsclass("Velocity")
class Velocity extends Component {
    vx: number = 0;
    vy: number = 0;
    
    reset(): void {
        this.vx = 0;
        this.vy = 0;
    }
}
```

### 2. 定义系统

* 系统也需要使用装饰器标记

```typescript
import { System, _ecsdecorator } from 'kunpo-esc';
const { ecsystem } = _ecsdecorator;

@ecsystem("MovementSystem", { describe: "处理实体移动的系统" })
class MovementSystem extends System {
  	// 配置查询规则
    protected onInit(): void {
      	// 这个规则的含义是
      	// 必须包含 Position、Speed和Direction 三种实体
      	// 并且包含 Component1和Component2中的任意一个
      	// 并且必须不包含Component3
      	// Component4是可选的 筛选组件时会把匹配到的实体上的Component4组件也查出来
      	// 如果没有就给个null值
        this.matcher.allOf(Position, Speed, Direction)
          					.anyOf(Component1, Component2);
      							.excludeOf(Component3);
      							.optionalOf(Component4);
    }
  
    // 更新
    update(dt: number): void {
        const query = this.query;
        for (const [entity, position, speed, direction] of query.iterate3(Position, Speed, Direction)) {
            position.x += direction.x * speed.speed * dt;
            position.y += direction.y * speed.speed * dt;
        }
    }
}
```


### 3. 创建世界和配置系统

```typescript
import { World } from 'kunpo-esc';

// 第1步
// 创建世界实例
// 参数1: 世界名称
// 参数2: 最大实体数量 根据游戏规模分配一个尽量小的值 (最好是2的指数)
const world = new World("GameWorld", 2 >> 16);

// 第2步
// 注册系统

// 系统组
// 参数1: 组名
// 参数2: 帧间隔（可对不需要每帧更新的系统组添加帧间隔 3表示每3帧更新一次）
let group1 = new ecs.SystemGroup("系统组1", 3);
defGroup
    .addSystem(new System1())
    .addSystem(new System2())
    .addSystem(new System3());

// 添加系统和系统组
world.addSystem(new System4())
  	 .addSystem(group1)
  	 .addSystem(new System5());


// 第3步
// 初始化世界 (必须调用)
world.initialize();

// 第4步 在游戏循环中更新世界 并传入帧间隔
world.update(dt);
```

### 4. 添加组件

* 方式1: 创建空实体，手动添加组件

  ```typescript
  // 创建实体 - 空实体只有ID
  const entity = world.createEmptyEntity();
  
  // 添加组件
  const position = world.addComponent(entity, Position);
  position.x = 10;
  position.y = 20;
  
  const velocity = world.addComponent(entity, Velocity);
  velocity.vx = 1;
  velocity.vy = 2;
  ```

* 方式2: 通过配置数据创建实体 

  >数据配置使用creator商店中的插件 ***kunpoec*** 配置
  >
  >插件版本1.0.3开始支持导出 ecs使用的数据
  
  ```typescript
  // 通过配置创建实体
  world.createEntity("Entity1");
  ```

### 5. 查询器

* 查询结果提供3种方式获取

  1. 直接获取匹配实体的集合 entitys

     ```typescript
     this.query.entitys
     ```

  2. 通用迭代器，最多同时获取8种类型的组件，极少量GC

     ```typescript
     for (const [entity, position, speed, direction] of query.iterate(Position, Speed, Direction)) {
         position.x += speed.speed * dt;
         position.y += speed.speed * dt;
         kunpo.log("direction", direction);
     }
     ```

  3. 特定数量迭代器（1/2/3/4），零GC

     ```typescript
     for (const [entity, position] of query.iterate1(Position)) {
     		log(position.x, position.y)
     }
     
     for (const [entity, position, speed] of query.iterate2(Position, Speed, Direction)) {
     
     }
     
     for (const [entity, position, speed, direction] of query.iterate3(Position, Speed, Direction)) {
     
     }
     
     for (const [entity, position, speed, direction, scale] of query.iterate3(Position, Speed, Direction, Scale)) {
     
     }
     ```

     



## 注意事项

### 命令缓冲区

kunpocc-ecs使用命令缓冲模式管理实体和组件变更，避免迭代过程中修改数据结构，导致出错，删除实体、删除组件、添加组件等操作会延迟到下一帧的update前处理

```typescript
// 删除实体(会延迟到下一帧的update前处理)
world.removeEntity(entity);

// 添加组件(会延迟到下一帧的update前处理)
world.addComponent(entity, Position);

// 删除组件(会延迟到下一帧的update前处理)
world.removeComponent(entity, Position);
```



### 分析

#### 1. 数据布局方式：稀疏集合 + 密集数组

* 优秀：频繁添加删除实体
* 优秀：频繁添加和删除组件
* 良好：系统遍历
* 较差：内存占用

#### 2. 数据布局

* 密集存储：按组件类型存储组件数据
* 稀疏集合：实体到组件索引

#### 3. 查询器

* 条件相同时复用
* 多次获取查询结果无消耗

#### 4. 掩码高效匹配



## 贡献

欢迎提交问题和合并请求。对于重大更改，请先开issue讨论您想更改的内容。
