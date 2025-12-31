/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 主入口文件
 */


import { Box } from './quadtree/Box';
import { Circle } from './quadtree/Circle';
import { Polygon } from './quadtree/Polygon';
import { ShapeFactory } from './utils/ShapeFactory';
import { Vec2 } from './utils/Vec2';

// 核心四叉树
export { QuadTree } from './quadtree/QuadTree';
// 形状相关
export { Box } from './quadtree/Box';
export { Circle } from './quadtree/Circle';
export { IShape, ShapeType } from './quadtree/IShape';
export { Polygon } from './quadtree/Polygon';

export function createCircle(radius: number, binaryMask: number = 0xFFFFFFFF): Circle {
    return ShapeFactory.getInstance().createCircle(radius, binaryMask);
}

export function createBox(x: number, y: number, width: number, height: number, binaryMask: number = 0xFFFFFFFF): Box {
    return ShapeFactory.getInstance().createBox(x, y, width, height, binaryMask);
}

export function createPolygon(points: Vec2[] = [], binaryMask: number = 0xFFFFFFFF): Polygon {
    return ShapeFactory.getInstance().createPolygon(points, binaryMask);
}
