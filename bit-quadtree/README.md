# bit-quadtree

高性能四叉树空间索引库，专为 2D 游戏碰撞检测优化。

## 简介

`bit-quadtree` 是一个使用 TypeScript 编写的四叉树空间数据结构库，通过空间划分优化碰撞检测性能。适用于需要大量碰撞检测的 2D 游戏和模拟场景。

**核心特性**：
- 🎯 支持多种形状：矩形 (Box)、圆形 (Circle)、凸多边形 (Polygon)
- ⚡ 高效空间查询和碰撞检测
- 🔄 内置对象池减少 GC 压力
- 📐 可配置树深度和节点容量
- 🛠️ 完整的 TypeScript 类型定义

## 安装

```bash
npm install @gongxh/bit-quadtree
```

## 使用说明

### 四叉树 (QuadTree)

空间索引的核心类，用于管理和查询空间对象。

**创建四叉树**：
- `new QuadTree(x, y, width, height, maxDepth, maxShapes)` - 创建四叉树
  - `x, y` - 四叉树根节点的位置
  - `width, height` - 四叉树覆盖的区域大小
  - `maxDepth` - 树的最大深度（建议 4-6）
  - `maxShapes` - 每个节点最大形状数（建议 10-20）

**主要方法**：
- `insert(shape)` - 插入形状到四叉树
- `query(shape, mask)` - 查询与指定形状碰撞的所有形状
- `update()` - 更新四叉树（在形状移动后调用）
- `clear()` - 清空四叉树

### 形状创建

提供便捷的形状创建函数：

- `createBox(x, y, width, height, group)` - 创建矩形
- `createCircle(radius, group)` - 创建圆形
- `createPolygon(vertices, group)` - 创建凸多边形

**参数说明**：
- `group` - 碰撞分组，用于过滤碰撞检测（相同分组的形状不会碰撞）

### 工具类

**Vec2** - 2D 向量类：
- `new Vec2(x, y)` - 创建向量
- 支持加减乘除等基本运算
- 提供距离、归一化等常用方法

**ObjectPool** - 对象池：
- 自动管理对象复用
- 减少内存分配和垃圾回收
- 内部使用，无需手动管理

### 典型使用流程

1. **初始化** - 创建四叉树并设置参数
2. **添加形状** - 使用 `insert()` 添加游戏对象
3. **更新位置** - 移动对象后调用 `update()` 更新四叉树
4. **碰撞检测** - 使用 `query()` 查询碰撞
5. **清理** - 退出场景时调用 `clear()` 清空四叉树

详细 API 请查看 `bit-quadtree.d.ts` 类型定义文件。

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-quadtree)