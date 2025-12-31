# kunpocc-quadtree

![NPM Version](https://img.shields.io/npm/v/kunpocc-quadtree)
![License](https://img.shields.io/npm/l/kunpocc-quadtree)

一个使用 TypeScript 编写的高性能、易于使用的四叉树库，专为 2D 游戏和模拟中的高效碰撞检测而设计。

## ✨ 特性

- **TypeScript 支持**: 使用 TypeScript 编写，提供完整的类型定义。
- **多种形状**: 支持矩形 (`Box`)、圆形 (`Circle`) 和凸多边形 (`Polygon`)。
- **高效查询**: 通过空间划分优化查询，实现高效的碰撞检测。
- **性能优化**: 内置对象池 (`ObjectPool`) 以减少垃圾回收，提升性能。
- **简洁的 API**: 易于集成到现有项目中。

## 📦 安装

```bash
npm install kunpocc-quadtree
```

## 🚀 使用示例

### 创建四叉树
```typescript
import { QuadTree, createCircle, createBox, createPolygon } from 'kunpocc-quadtree';

// 1. 创建四叉树
const maxDepth = 4;  // 树的最大深度
const maxShapes = 20; // 每个节点的最大形状数
const tree = new QuadTree(0, 0, 750, 1334, maxDepth, maxShapes);
```

### 创建圆形
```typescript
const circle = createCircle(10, 1);
```

### 创建矩形
```typescript
const box = createBox(0, 0, 100, 100, 1);
```

### 创建多边形
```typescript
const polygon = createPolygon([new Vec2(0, 0), new Vec2(100, 0), new Vec2(100, 100), new Vec2(0, 100)], 1);
```

### 插入形状
```typescript
tree.insert(circle);
tree.insert(box);
tree.insert(polygon);
```

### 碰撞检测
```typescript
const shapes = tree.collide(shape, 1);
```

### 更新四叉树
```typescript
tree.update();
```

## 🔧 开发构建

如果你想从源码构建本项目，请按以下步骤操作：

1.  克隆仓库
2.  安装依赖
    ```bash
    npm install
    ```
3.  执行构建
    ```bash
    npm run build
    ```
    构建产物将生成在 `dist` 目录下。
