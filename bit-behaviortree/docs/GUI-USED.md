# 行为树使用指南

本指南将详细介绍如何使用 kunpocc-behaviortree 库和行为树编辑器。

## 一、开发环境
- 引擎版本：Cocos Creator 3.8.6
- 编程语言：TypeScript


- 支持引擎版本：Cocos Creator 3.7 及之后的所有版本


## 二、安装
1. 安装 kunpocc-behaviortree 
   ```
   npm install kunpocc-behaviortree
   ```
   
2. 下载扩展插件(bt-editor)

3. 项目脚本中引入库文件
    ```typescript
    // 比如在项目代码目录下添加一个文件 header.ts
    // 写上如下代码
    import * as BT from "kunpocc-behaviortree";
    export { BT };
    ```
    
4. 重启creator

5. 启用插件
   * 在 Cocos Creator 中选择 `扩展` -> `扩展管理器` -> `已安装扩展`
   * 找到 `bt-editor` 并启用
   
6. 打开扩展面板
   * 在 Cocos Creator 顶部菜单栏中选择 `extension or 扩展` -> `kunpo` -> `行为树编辑器`  


## 三、编辑器介绍

#### 快捷键

- **打开编辑器**: `Ctrl+Shift+K` (Windows) / `Cmd+Shift+K` (Mac)
- **导出配置**: `Ctrl+Shift+L` (Windows) / `Cmd+Shift+L` (Mac)

#### 菜单访问

在 Cocos Creator 顶部菜单栏中选择 `extension or 扩展` -> `kunpo` -> `行为树编辑器`


### 编辑器功能介绍

行为树编辑器提供了一个直观的可视化界面，让你可以轻松创建和管理复杂的行为树结构。

#### 可视化节点编辑
- **拖拽创建**：从左侧节点库拖拽节点到画布中
- **分组管理**：节点按功能分组显示，便于查找
- **实时预览**：节点显示类型图标和描述信息

#### 属性参数配置
- **类型校验**：支持数字、字符串、布尔值、对象、数组等类型
- **默认值**：自动填充装饰器中定义的默认值
- **约束验证**：支持最小值、最大值、步长等约束条件

#### 连接线管理
- **可视连接**：通过拖拽连接点创建父子关系
- **自动布局**：连接线自动避让，保持界面整洁
- **连接验证**：防止创建非法的节点连接关系

#### 画布操作
- **缩放平移**：鼠标滚轮缩放，拖拽平移画布
- **多选操作**：支持框选多个节点进行批量操作

#### 节点管理
- **别名设置**：为节点设置有意义的别名，便于理解
- **复制粘贴**：快速复制节点及其子树结构
- **删除操作**：删除节点时自动清理相关连接

### 导出文件使用

#### 在项目中使用导出配置

##### 1. 导出文件格式

```json
{
    "boss1": [
        {
            "id": "1758206972710_bhxebhy7o",
            "className": "Sequence",
            "parameters": {},
            "children": [
                "1758090634327_mf36nwkdt"
            ]
        },
        {
            "id": "1758090634327_mf36nwkdt",
            "className": "Selector",
            "parameters": {},
            "children": [
                "1758206988178_55b7kk5va"
            ]
        },
        {
            "id": "1758206988178_55b7kk5va",
            "className": "BTAnimation",
            "parameters": {
                "_name": "",
                "_loop": false
            },
            "children": []
        }
    ]
}
```

##### 2. 配置文件放入项目资源目录
将从编辑器导出的JSON文件放入项目资源目录
自行加载配置数据

```
assets/
├── resources/
│   └── config/
│       ├── bt_config.json      // 所有行为树的信息都在这个里边
```

##### 3. 创建行为树实例

```typescript
// entity参数 可以是任意想要关联的类型
let btTree1: BT.INodeConfig[] = this.bt_config.json["bt-tree1"]
this._tree = BT.createBehaviorTree(btTree1, entity);
```

## 四、扩展编辑器节点池

### 节点装饰器

装饰器系统是连接自定义节点和编辑器的桥梁
只有通过装饰器装饰的节点，才能在编辑器中的节点池中显示

* 行为节点装饰器 ***ClassAction***
* 条件节点装饰器 ***ClassCondition***
* 组合节点装饰器 ***ClassComposite***
* 装饰节点装饰器 ***ClassDecorator***
* 属性装饰器 ***prop***

下面我们通过一段示例代码来展示一下装饰器的使用

```typescript
// BT.ClassAction 是行为节点装饰器
// MyNode参数需要和类名相同
@BT.ClassAction("MyNode", { name: "显示名称", group: "节点分组", desc: "节点描述" })
export class MyNode extends BT.LeafNode {

    // 基础类型参数装饰器
    // type: 参数类型
    // description: 参数描述
    // defaultValue: 参数默认值
    // min: 参数最小值
    // max: 参数最大值
    // step: 
    
    @BT.prop({  type: BT.ParamType.string,  description: "动画名称", defaultValue: "idle" })
    private animationName: string = "idle";

    @BT.prop({  type: BT.ParamType.float, description: "速度",  min: 0, max: 10, step: 0.1, defaultValue: 1.0 })
    private speed: number = 1.0;

    @BT.prop({  type: BT.ParamType.bool,  description: "是否循环" })
    private loop: boolean = false;

    // 对象参数
    @BT.prop({ 
        type: BT.ParamType.object, 
        description: "位置信息", 
        properties: {
            x: { type: BT.ParamType.int, min: 0 },
            y: { type: BT.ParamType.int, min: 0 }
        }
    })
    private position: { x: number, y: number };

    // 数组参数
    @BT.prop({
        type: BT.ParamType.array,
        description: "巡逻点列表",
        itemType: BT.ParamType.object,
        itemProperties: {
            x: { type: BT.ParamType.float },
            y: { type: BT.ParamType.float },
            name: { type: BT.ParamType.string }
        }
    })
    private patrolPoints: Array<{ x: number, y: number, name: string }>;
}
```


为节点添加可在编辑器中配置的参数。


#### 参数类型详解

| 类型 | BT.ParamType | 描述 | 支持属性 |
|------|--------------|------|----------|
| 整数 | `int` | 整数类型 | `min`, `max`, `step`, `defaultValue` |
| 浮点数 | `float` | 浮点数类型 | `min`, `max`, `step`, `defaultValue` |
| 字符串 | `string` | 字符串类型 | `defaultValue` |
| 布尔 | `bool` | 布尔类型 | `defaultValue` |
| 对象 | `object` | 对象类型 | `properties` |
| 数组 | `array` | 数组类型 | `itemType`, `itemProperties` |


## 五、更新声明

## 0.0.1 (2025-09-23)
- 首版本

## 六、联系作者

*  邮箱: gong.xinhai@163.com
*  微信:  G0900901
*  扫码加微信:


## 七、版权声明
此插件源代码可商业使用

商业授权范围仅限于在您自行开发的游戏作品中使用

不得进行任何形式的转售、租赁、传播等


## 八、购买须知
本产品为付费虚拟商品，一经购买成功概不退款，请在购买前谨慎确认购买内容。