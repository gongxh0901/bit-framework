# kunpocc-ec
基于 Cocos Creator 的一套ec框架

#### 版本支持
- creator 3.0+ 支持

## 安装kunpocc-ec

项目已发布到 `npm`, 安装方法如下：

```bash
npm install kunpocc-ec
```

> 如果连不上npm, 可使用国内镜像 比如: 淘宝、腾讯、华为

```bash
# 官方
npm set registry https://registry.npmjs.org
# 中国镜像站（用这个就行）
npm set registry https://registry.npmmirror.com/
#腾讯
npm set registry https://mirrors.cloud.tencent.com/npm/
# 华为
npm set registry https://repo.huaweicloud.com/repository/npm/
# 阿里
npm set registry https://npm.aliyun.com
```

## 实体组件系统
> 实体组件系统是一种用于游戏开发的架构模式，它将游戏对象（实体）的数据（组件）和行为分离。

### 特点
  *  不同实体上的组件更新顺序管理（`只根据注册的组件更新顺序更新，跟实体无关`）
  * 灵活的EC装饰器 （配合插件 `kunpocc-ec` 使用，配置实体组件信息，一键导出）
  * 支持多世界（多战斗场景，互不影响）
  * 区分数据组件和逻辑组件，只更新逻辑组件


### 插件链接

* **kunpocc-ec**:  [https://store.cocos.com/app/detail/7311](https://store.cocos.com/app/detail/7311)

### 使用

#### *creator插件`kunpocc-ec`*
> `kunpocc-ec`可以方便创建、配置、导出实体，操作界面如下图：

![image-entity-editor](image/image-entity-editor.png#pic_left)

#### *使用*

1. 组件类型声明

   ```typescript
   import { Enum } from "cc";
   
   /** 数据组件类型 */
   enum DataComponentType {
       Health,
       Transform,
       RootNode,
       LimitMove,
       Render,
   }
   
   /** 逻辑组件类型 (组件更新数据从上到下) */
   export enum SystemComponentType {
       Move = 100000,
       ScreenRebound,
   
       /** 位置更新系统 */
       PositionUpdateSystem = 120000,
   }
   
   export const ComponentType = {
       ...DataComponentType,
       ...SystemComponentType
   };
   export type ComponentType = DataComponentType | SystemComponentType;
   
   /** 组件更新顺序列表 */
   export const componentUpdateOrderList = Enum.getList(Enum(SystemComponentType)).map(item => item.value).sort((a, b) => a - b);
   ```
   
2. 编写组件脚本

   ```typescript
   import { AnimationClip, Asset, AudioClip, Color, Enum, JsonAsset, ParticleAsset, Prefab, Size, Skeleton, SpriteFrame, Vec2, Vec3 } from "cc";
   import { _ecdecorator, Component } from "kunpocc-ec";
   import { ComponentType } from "../../ComponentTypes";
   const { ecclass, ecprop } = _ecdecorator;
   
   enum HealthType {
       HP = 1,
       Max = 2,
       Current = 3
   }
   
   // 注册组件 (必须)
   @ecclass("Health", ComponentType.Health, { describe: "血量组件" })
   export class Health extends Component {
     	// 注册组件属性 (可选: 使用kunpocc-ec插件则必须注册)
       @ecprop({ type: "entity", defaultValue: "", displayName: "实体", tips: "实体" })
       private testentity: string = "";
     
       @ecprop({ type: "array", format: "entity", displayName: "实体数组", tips: "实体数组" })
       private testentityarray: string[] = [];
   
       @ecprop({ type: 'int', defaultValue: 0, displayName: "血量", tips: "当前血量提示" })
       private hp: number = 0;
   
       @ecprop({ type: 'float', defaultValue: 0, displayName: "最大血量", tips: "最大血量提示" })
       private maxHp: number = 0;
   
       @ecprop({ type: 'string', defaultValue: "", displayName: "字符串", tips: "字符串提示" })
       private string: string = "";
   
       @ecprop({ type: 'boolean', defaultValue: false, displayName: "布尔值", tips: "布尔值提示" })
       private bool: boolean = true;
   
       @ecprop({ type: "enum", format: Enum(HealthType), defaultValue: HealthType.Current, displayName: "枚举", tips: "枚举提示" })
       private hpeunm: HealthType = HealthType.Current;
   
       @ecprop({ type: "spriteframe", displayName: "精灵帧" })
       private spriteFrame: SpriteFrame;
   
       @ecprop({ type: "asset", displayName: "资源" })
       private asset: Asset;
   
       @ecprop({ type: "prefab", displayName: "预制体" })
       private prefab: Prefab;
   
       @ecprop({ type: "skeleton", displayName: "骨骼动画" })
       private skeleton: Skeleton;
   
       @ecprop({ type: "particle", displayName: "粒子" })
       private particle: ParticleAsset;
   
       @ecprop({ type: "animation", displayName: "动画" })
       private animation: AnimationClip;
   
       @ecprop({ type: "audio", displayName: "音频" })
       private audio: AudioClip;
   
       @ecprop({ type: "jsonAsset", displayName: "json资源" })
       private jsonAsset: JsonAsset;
   
       @ecprop({
           type: "object", format: {
               hp1: {
                   type: "object",
                   format: {
                       hp: "int",
                       max: "int"
                   }
               },
               hp2: {
                   type: "object",
                   format: {
                       hp: "int",
                       max: "int"
                   }
               },
           },
       })
       private obj: { hp1: { hp: number, max: number }, hp2: { hp: number, max: number } };
   
       @ecprop({
           type: "array", format: "int",
       })
       private arr: number[];
   
       @ecprop({
           type: "array", format: { type: "object", format: { hp: "int", max: "int" } }
       })
       private arrobj: { hp: number, max: number }[];
   
       @ecprop({ type: "vec2", displayName: "向量2" })
       private vec2: Vec2;
   
       @ecprop({ type: "vec3", displayName: "向量3" })
       private vec3: Vec3;
   
       @ecprop({ type: "color", defaultValue: Color.RED, displayName: "颜色" })
       private color: Color;
   
       @ecprop({ type: "size", displayName: "尺寸" })
       private size: Size;
   
       protected onAdd(): void {
           // 设置组件是否更新，只有需要更新的组件才设置
           this.needUpdate = true;
       }
     
       protected onEnter(): void {
            // 可在此获取同实体上的其他组件
            let transform = this.getComponent(ComponentType.Transform);
            /** 获取单例组件 */
            let signleton = this.entity.entityManager.getSingleton(ComponentType.XXXX);
       }
   
       protected onRemove(): void {
            // 清理组件数据
       }
   }
   ```

3. 创建ec世界，并设置更新

   ```typescript
   import { ECManager } from "kunpocc-ec";
   
   /**
    * 第一步
    * 初始化ec 只需调用一次
    * @param ecConfig 实体配置信息(可不传) 一般使用 kunpo-ec 插件导出的配置文件
    */
    ECManager.init(ecConfig);


    /**
     * 第二步
     * 创建ec世界
     * @param worldName 世界名称
     * @param node 世界节点 一般使用一个节点作为世界节点
     * @param componentUpdateOrderList 组件更新顺序列表 组件更新顺序列表
     * @param maxCapacityInPool 实体池最大容量
     * @param preloadEntityCount 预加载实体数量
     */
    const world = ECManager.createECWorld("world", this.node, componentUpdateOrderList, 300, 10);


    /** 
     * 更新ec世界 每帧调用
     * @param dt 时间差
     */
    world.update(dt);

    /**
     * 创建一个实体
     * @param worldName 世界名称
     * @param name 实体名字 配置表中配置的实体
     */
    const entity = ECManager.createEntity("world", "entity1");
   ```

## 类型支持

该库完全使用 TypeScript 编写，提供完整的类型定义文件。

## 许可证

ISC License

## 作者

gongxh

## 联系作者

*  邮箱: gong.xinhai@163.com