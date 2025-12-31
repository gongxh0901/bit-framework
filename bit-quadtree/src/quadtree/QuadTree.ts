/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 树节点
 */

import { Intersection2D } from "../utils/Intersection2D";
import { rect, Rect } from "../utils/Rect";
import { ShapeFactory } from "../utils/ShapeFactory";
import { Box } from "./Box";
import { Circle } from "./Circle";
import { IShape, ShapeType } from "./IShape";
import { Polygon } from "./Polygon";

// 1|0
// ---
// 2|3
const enum Quadrant {
    ONE = 0,
    TWO,
    THREE,
    FOUR,
    MORE, // 多个象限
}

/** 两个形状是否碰撞 */
function isCollide(shape1: IShape, shape2: IShape): boolean {
    // 快速类型检查 - 最快的碰撞检测
    const shapeType1 = shape1.shapeType;
    const shapeType2 = shape2.shapeType;

    // 圆和圆的碰撞检测（最快）
    if (shapeType1 === ShapeType.CIRCLE && shapeType2 === ShapeType.CIRCLE) {
        const circle1 = shape1 as Circle;
        const circle2 = shape2 as Circle;
        const radius1 = circle1.radius * shape1.scale;
        const radius2 = circle2.radius * shape2.scale;
        return Intersection2D.circleCircle(shape1.position, radius1, shape2.position, radius2);
    }

    // 轴对齐矩形的碰撞检测（第二快）
    if (shapeType1 === ShapeType.BOX && shapeType2 === ShapeType.BOX) {
        const box1 = shape1 as Box;
        const box2 = shape2 as Box;
        if (box1.isAxisAligned() && box2.isAxisAligned()) {
            return Intersection2D.rectRect(box1.getBoundingBox(), box1.position, box2.getBoundingBox(), box2.position);
        }
    }

    // 包围盒快速筛选 - 在复杂检测之前进行
    if (!Intersection2D.rectRect(shape1.getBoundingBox(), shape1.position, shape2.getBoundingBox(), shape2.position)) {
        return false;
    }

    // 圆形与多边形的碰撞检测 
    if (shapeType1 === ShapeType.CIRCLE || shapeType2 === ShapeType.CIRCLE) {
        const circle = (shapeType1 === ShapeType.CIRCLE) ? shape1 as Circle : shape2 as Circle;
        const other = (shapeType1 === ShapeType.CIRCLE) ? shape2 as Polygon : shape1 as Polygon;
        return Intersection2D.polygonCircle(other.getRealPoints(), circle.position, circle.radius * circle.scale);
    }

    // 多边形与多边形的碰撞检测（最慢，放在最后）
    return Intersection2D.polygonPolygon((shape1 as Polygon).getRealPoints(), (shape2 as Polygon).getRealPoints());
}

const QTConfig = {
    /** 每个节点（象限）所能包含物体的最大数量 */
    MAX_SHAPES: 20,
    /** 四叉树的最大深度 */
    MAX_LEVELS: 4,
}

export class QuadTree {
    /** 
     * 根据类型存储形状对象
     * @internal 
     */
    private _shapes_map: Map<number, IShape[]>;
    /** 
     * 存储四个子节点
     * @internal
     */
    private _trees: QuadTree[] = [];
    /** 
     * 树的深度
     * @internal
     */
    private _level: number;
    /** 
     * 树的外框
     * @internal
     */
    private _bounds: Rect; // 树的外框
    /** 
     * 不在树中的形状
     * @internal
     */
    private _ignore_shapes: IShape[] = [];

    /** 
     * 更新计数器，用于判断是否需要清理子树
     * @internal
     */
    private _updateCounter: number = 0;

    /** 
     * 父节点引用
     * @internal
     */
    private _parent: QuadTree | null = null;

    /** 
     * 形状工厂实例，用于回收形状
     * @internal
     */
    private _shapeFactory: ShapeFactory;

    /**
     * 创建一个四叉树
     * @param x 该节点对应的象限在屏幕上的范围的x坐标
     * @param y 该节点对应的象限在屏幕上的范围的y坐标
     * @param width 该节点对应的象限在屏幕上的范围的宽度
     * @param height 该节点对应的象限在屏幕上的范围的高度
     * @param depth 该节点的深度，根节点的默认深度为0
     * @param maxDepth 树的最大深度
     * @param maximum 每个节点（象限）所能包含物体的最大数量
     */
    constructor(x: number, y: number, width: number, height: number, maxDepth: number = 4, maximum: number = 20, parent: QuadTree = null, depth: number = 0) {
        this._shapes_map = new Map();
        this._trees = [];
        this._level = depth || 0;
        this._bounds = rect(x, y, width, height);
        // 设置父节点
        this._parent = parent;
        this._shapeFactory = ShapeFactory.getInstance();

        if (depth === 0) {
            QTConfig.MAX_LEVELS = maxDepth;
            QTConfig.MAX_SHAPES = maximum;
            // 预热对象池
            this._shapeFactory.warmUpPools();
        }
    }

    /**
     * 插入形状
     * @param shape 形状数据
     * 如果不在框内，则向上传递
     * 如果在框内，没有子节点 或者 有子节点但是不再子节点中，则直接插入
     * 
     * 如果当前节点存在子节点，则检查物体到底属于哪个子节点，如果能匹配到子节点，则将该物体插入到该子节点中
     * 如果当前节点不存在子节点，将该物体存储在当前节点。
     * 随后，检查当前节点的存储数量，如果超过了最大存储数量，则对当前节点进行划分，划分完成后，将当前节点存储的物体重新分配到四个子节点中。
     */
    public insert(shape: IShape): void {
        // 如果不在框内并且有父节点，则向上传递 没有父节点则添加到忽略的形状中
        if (!this._isInner(shape, this._bounds)) {
            if (this._parent) {
                // 非根节点且形状不在范围内，向上传递
                this._parent.insert(shape);
            } else {
                // 根节点且形状不在范围内
                this._ignore_shapes.push(shape);
            }
            return;
        }
        // 在框内
        if (this._trees.length === 0) {
            // 没有子节点，直接插入
            this._insert(shape);
            // 分裂
            if (this._size() > QTConfig.MAX_SHAPES && this._level < QTConfig.MAX_LEVELS) {
                this._split();
                this._splitResetShapes();
            }
        } else {
            // 有子节点，但是不在子节点中，则直接插入
            let quadrant = this._getQuadrant(shape);
            if (quadrant !== Quadrant.MORE) {
                this._trees[quadrant].insert(shape);
                return;
            }
            this._insert(shape);
        }
    }

    /** @internal */
    private _insert(shape: IShape): void {
        let shapes = this._shapes_map.get(shape.mask);
        if (!shapes) {
            shapes = new Array(QTConfig.MAX_SHAPES);
            shapes.length = 0;
            this._shapes_map.set(shape.mask, shapes);
        }
        shapes[shapes.length] = shape;
    }

    /**
     * 检索功能：
     * 给出一个物体对象，该函数负责将该物体可能发生碰撞的所有物体选取出来。该函数先查找物体所属的象限，该象限下的物体都是有可能发生碰撞的，然后再递归地查找子象限...
     */
    public collide(shape: IShape, binaryMask: number = -1, result: IShape[] = null): IShape[] {
        if (!result) {
            result = [];
            result.length = 0;
        }

        // 预检查：如果形状包围盒与当前节点不相交，直接返回
        if (!this.intersectsWith(shape)) {
            return result;
        }

        // 检查子象限
        if (this._trees.length > 0) {
            const quadrant = this._getQuadrant(shape);
            if (quadrant === Quadrant.MORE) {
                // 遍历所有子象限
                for (let i = this._trees.length - 1; i >= 0; i--) {
                    this._trees[i].collide(shape, binaryMask, result);
                }
            } else {
                this._trees[quadrant].collide(shape, binaryMask, result);
            }
        }

        // 检查当前节点的形状
        for (const [mask, shapes] of this._shapes_map) {
            if (!(binaryMask & mask)) {
                continue;
            }

            const len = shapes.length;
            for (let j = 0; j < len; j++) {
                const other_shape = shapes[j];
                if (other_shape.isValid && shape !== other_shape && isCollide(shape, other_shape)) {
                    result[result.length] = other_shape;
                }
            }
        }

        return result;
    }

    /**
     * 动态更新（对外接口）
     */
    public update() {
        this._innerUpdate(this);
    }

    /** @internal */
    private _innerUpdate(root: QuadTree): void {
        this._updateIgnoreShapes(root);
        this._updateShapes();
        // 递归刷新子象限
        for (const tree of this._trees) {
            tree._innerUpdate(root);
        }

        this._updateCounter++;
        // 针对动态物体优化：延长清理间隔，减少不必要的树重构
        if (this._updateCounter > 20) {
            this._updateCounter = 0;
            this._removeChildTree();
        }
    }

    public clear(): void {
        // 回收所有形状到对象池
        this._recycleAllShapes();

        this._level = 0;
        this._ignore_shapes.length = 0;
        this._shapes_map.clear();

        for (const tree of this._trees) {
            tree.clear();
        }
        this._trees.length = 0;
    }

    /**
     * 回收所有形状到对象池
     * @internal
     */
    private _recycleAllShapes(): void {
        // 回收忽略的形状
        for (const shape of this._ignore_shapes) {
            this._shapeFactory.recycle(shape);
        }

        // 回收映射中的形状
        for (const shapes of this._shapes_map.values()) {
            for (const shape of shapes) {
                this._shapeFactory.recycle(shape);
            }
        }
    }

    /** 当前形状是否包含在象限内 @internal */
    private _isInner(shape: IShape, bounds: Rect): boolean {
        let rect = shape.getBoundingBox();
        return (
            rect.xMin + shape.position.x > bounds.xMin &&
            rect.xMax + shape.position.x < bounds.xMax &&
            rect.yMin + shape.position.y > bounds.yMin &&
            rect.yMax + shape.position.y < bounds.yMax
        );
    }

    /**
     * 检查形状是否与当前四叉树节点是否相交
     * @internal
     */
    private intersectsWith(shape: IShape): boolean {
        const shapeBounds = shape.getBoundingBox();
        const shapePos = shape.position;
        const nodeBounds = this._bounds;

        // 形状的实际边界
        const shapeLeft = shapeBounds.xMin + shapePos.x;
        const shapeRight = shapeBounds.xMax + shapePos.x;
        const shapeTop = shapeBounds.yMin + shapePos.y;
        const shapeBottom = shapeBounds.yMax + shapePos.y;

        // 检查是否相交（非包含）
        return !(shapeRight < nodeBounds.xMin ||  // 形状在节点左侧
            shapeLeft > nodeBounds.xMax ||   // 形状在节点右侧
            shapeBottom < nodeBounds.yMin || // 形状在节点上方
            shapeTop > nodeBounds.yMax);     // 形状在节点下方
    }

    /**
     * 获取形状对应的象限序号，以中心为界限切割:
     * @param {Shape} shape 形状
     * 右上：象限一
     * 左上：象限二
     * 左下：象限三
     * 右下：象限四
     * @internal
     */
    private _getQuadrant(shape: IShape): Quadrant {
        let bounds = this._bounds;
        let rect = shape.getBoundingBox();
        // let center = bounds.center;

        let onTop = rect.yMin + shape.position.y > bounds.centerY;
        let onBottom = rect.yMax + shape.position.y < bounds.centerY;
        let onLeft = rect.xMax + shape.position.x < bounds.centerX;
        let onRight = rect.xMin + shape.position.x > bounds.centerX;
        if (onTop) {
            if (onRight) {
                return Quadrant.ONE;
            } else if (onLeft) {
                return Quadrant.TWO;
            }
        } else if (onBottom) {
            if (onLeft) {
                return Quadrant.THREE;
            } else if (onRight) {
                return Quadrant.FOUR;
            }
        }
        return Quadrant.MORE; // 跨越多个象限
    }

    /**
     * 划分函数
     * 如果某一个象限（节点）内存储的物体数量超过了MAX_OBJECTS最大数量
     * 则需要对这个节点进行划分
     * 它的工作就是将一个象限看作一个屏幕，将其划分为四个子象限
     * @internal
     */
    private _split(): void {
        let bounds = this._bounds;
        let x = bounds.x;
        let y = bounds.y;
        let halfwidth = bounds.width * 0.5;
        let halfheight = bounds.height * 0.5;
        let nextLevel = this._level + 1;
        this._trees.push(
            new QuadTree(bounds.centerX, bounds.centerY, halfwidth, halfheight, QTConfig.MAX_LEVELS, QTConfig.MAX_SHAPES, this, nextLevel),
            new QuadTree(x, bounds.centerY, halfwidth, halfheight, QTConfig.MAX_LEVELS, QTConfig.MAX_SHAPES, this, nextLevel),
            new QuadTree(x, y, halfwidth, halfheight, QTConfig.MAX_LEVELS, QTConfig.MAX_SHAPES, this, nextLevel),
            new QuadTree(bounds.centerX, y, halfwidth, halfheight, QTConfig.MAX_LEVELS, QTConfig.MAX_SHAPES, this, nextLevel)
        );
    }

    /**
     * 分裂后，将当前节点存储的物体重新分配到四个子节点中
     * @internal
     */
    private _splitResetShapes(): void {
        for (const shapes of this._shapes_map.values()) {
            let writePos = 0;
            const originalLength = shapes.length;

            for (let readPos = 0; readPos < originalLength; readPos++) {
                const shape = shapes[readPos];
                const quadrant = this._getQuadrant(shape);

                if (quadrant !== Quadrant.MORE) {
                    this._trees[quadrant].insert(shape);
                } else {
                    // 原地压缩，避免额外分配
                    shapes[writePos] = shape;
                    writePos++;
                }
            }
            // 一次性截断，避免多次pop
            shapes.length = writePos;
        }
    }

    /** 
     * 删除子树 
     * @internal 
     */
    private _removeChildTree(): void {
        if (this._trees.length <= 0) {
            return;
        }
        if (this._totalSize() > 0) {
            return;
        }
        this._trees.length = 0;
    }

    /** 
     * 更新忽略掉的形状 
     * @internal 
     */
    private _updateIgnoreShapes(root: QuadTree): void {
        let shapes = this._ignore_shapes;
        let lastIndex = shapes.length - 1;
        let index = 0;
        while (index <= lastIndex) {
            let shape = shapes[index];
            if (!shape.isValid) {
                if (index !== lastIndex) {
                    shapes[index] = shapes[lastIndex];
                }
                const removedShape = shapes.pop()!;
                // 回收到对象池
                this._shapeFactory.recycle(removedShape);
                lastIndex--;
                continue;
            }
            if (this._isInner(shape, this._bounds)) {
                if (index !== lastIndex) {
                    [shapes[index], shapes[lastIndex]] = [shapes[lastIndex], shapes[index]];
                }
                root.insert(shapes.pop()!);
                lastIndex--;
            } else {
                index++;
            }
        }
    }

    /** 
     * 更新有效的形状 
     * @internal 
     */
    private _updateShapes(): void {
        for (const shapes of this._shapes_map.values()) {
            let lastIndex = shapes.length - 1;
            let index = 0;
            while (index <= lastIndex) {
                let shape = shapes[index];
                if (!shape.isValid) {
                    if (index !== lastIndex) {
                        shapes[index] = shapes[lastIndex];
                    }
                    const removedShape = shapes.pop()!;
                    // 回收到对象池
                    this._shapeFactory.recycle(removedShape);
                    lastIndex--;
                    continue;
                }

                if (!shape.isPositionDirty) {
                    // 未移动的对象直接跳过
                    index++;
                    continue;
                }

                if (!this._isInner(shape, this._bounds)) {
                    // 如果矩形不属于该象限，则将该矩形重新插入根节点
                    if (index !== lastIndex) {
                        const temp = shapes[index];
                        shapes[index] = shapes[lastIndex];
                        shapes[lastIndex] = temp;
                    }
                    if (this._parent) {
                        this._parent.insert(shapes.pop()!);
                    } else {
                        this._ignore_shapes[this._ignore_shapes.length++] = shapes.pop()!;
                    }
                    lastIndex--;
                } else if (this._trees.length > 0) {
                    // 如果矩形属于该象限且该象限具有子象限，则将该矩形安插到子象限中
                    let quadrant = this._getQuadrant(shape);
                    if (quadrant !== Quadrant.MORE) {
                        if (index !== lastIndex) {
                            const temp = shapes[index];
                            shapes[index] = shapes[lastIndex];
                            shapes[lastIndex] = temp;
                        }
                        this._trees[quadrant].insert(shapes.pop()!);
                        lastIndex--;
                    } else {
                        shape.clearPositionDirty();
                        index++;
                    }
                } else {
                    shape.clearPositionDirty();
                    index++;
                }
            }
        }
    }

    /** 当前树以及子树中所有的形状数量 @internal */
    private _totalSize(): number {
        let size = this._size();
        for (const tree of this._trees) {
            size += tree._totalSize();
        }
        return size;
    }

    /** 当前树中所有的形状数量 @internal */
    private _size(): number {
        let size = 0;
        for (const shapes of this._shapes_map.values()) {
            size += shapes.length;
        }
        return size + this._ignore_shapes.length;
    }

    //#region ================================ 调试接口 ================================
    /**
     * 获取四叉树所有节点的边界信息
     * @returns 包含所有边界矩形数据的数组
     */
    public getTreeBounds(): Array<{ x: number, y: number, width: number, height: number }> {
        const bounds: Array<{ x: number, y: number, width: number, height: number }> = [];
        this._collectBounds(bounds);
        return bounds;
    }

    /**
     * 递归收集所有节点的边界信息
     * @internal
     */
    private _collectBounds(bounds: Array<{ x: number, y: number, width: number, height: number }>): void {
        bounds.push({
            x: this._bounds.x,
            y: this._bounds.y,
            width: this._bounds.width,
            height: this._bounds.height
        });

        for (const tree of this._trees) {
            tree._collectBounds(bounds);
        }
    }

    /**
     * 获取性能统计信息
     * @internal
     */
    public getPerformanceStats(): any {
        if (this._level !== 0) {
            return this._parent?.getPerformanceStats() || {};
        }

        return {
            objectPool: this._shapeFactory ? this._shapeFactory.getStats() : null,
            quadTree: {
                totalNodes: this._getTotalNodes(),
                maxDepth: this._getMaxDepth(),
                totalShapes: this._totalSize()
            }
        };
    }

    /**
     * 获取四叉树总节点数
     * @internal
     */
    private _getTotalNodes(): number {
        let count = 1;
        for (const tree of this._trees) {
            count += tree._getTotalNodes();
        }
        return count;
    }

    /**
     * 获取四叉树最大深度
     * @internal
     */
    private _getMaxDepth(): number {
        if (this._trees.length === 0) {
            return this._level;
        }
        let maxDepth = this._level;
        for (const tree of this._trees) {
            maxDepth = Math.max(maxDepth, tree._getMaxDepth());
        }
        return maxDepth;
    }
    //#endregion ================================ 调试接口 ================================
}