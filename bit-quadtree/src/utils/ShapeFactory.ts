/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 形状工厂，使用对象池管理形状的创建和回收
 */

import { Box } from "../quadtree/Box";
import { Circle } from "../quadtree/Circle";
import { IShape, ShapeType } from "../quadtree/IShape";
import { Polygon } from "../quadtree/Polygon";
import { ObjectPool, PoolManager } from "./ObjectPool";
import { Vec2 } from "./Vec2";

/**
 * 形状工厂类
 * 使用对象池管理形状的创建和回收，减少GC压力
 */
export class ShapeFactory {
    private static instance: ShapeFactory;

    // 各种形状的对象池
    private circlePool: ObjectPool<Circle>;
    private boxPool: ObjectPool<Box>;
    private polygonPool: ObjectPool<Polygon>;

    private poolManager: PoolManager;

    private constructor() {
        this.poolManager = PoolManager.getInstance();

        // 初始化各种形状的对象池
        this.circlePool = new ObjectPool<Circle>(
            () => new Circle(),
            20, // 初始大小
            200 // 最大大小
        );

        this.boxPool = new ObjectPool<Box>(
            () => new Box(),
            20,
            200
        );

        this.polygonPool = new ObjectPool<Polygon>(
            () => new Polygon(),
            10,
            100
        );

        // 注册到池管理器
        this.poolManager.registerPool('circle', this.circlePool);
        this.poolManager.registerPool('box', this.boxPool);
        this.poolManager.registerPool('polygon', this.polygonPool);
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): ShapeFactory {
        if (!ShapeFactory.instance) {
            ShapeFactory.instance = new ShapeFactory();
        }
        return ShapeFactory.instance;
    }

    /**
     * 创建圆形
     */
    public createCircle(radius: number = 10, mask: number = 0xFFFFFFFF): Circle {
        const circle = this.circlePool.get();
        circle.setRadius(radius);
        circle.setMask(mask);
        return circle;
    }

    /**
     * 创建矩形
     */
    public createBox(x: number = 0, y: number = 0, width: number = 50, height: number = 50, mask: number = 0xFFFFFFFF): Box {
        const box = this.boxPool.get();
        box.resetPoints(x, y, width, height);
        box.setMask(mask);
        return box;
    }

    /**
     * 创建多边形
     */
    public createPolygon(points: Vec2[] = [], mask: number = 0xFFFFFFFF): Polygon {
        const polygon = this.polygonPool.get();
        polygon.setPoints(points);
        polygon.setMask(mask);
        return polygon;
    }

    /**
     * 回收形状到对象池
     */
    public recycle(shape: IShape): void {
        // 根据形状类型回收到对应的池
        switch (shape.shapeType) {
            case ShapeType.CIRCLE:
                this.circlePool.recycle(shape as Circle);
                break;
            case ShapeType.BOX:
                this.boxPool.recycle(shape as Box);
                break;
            case ShapeType.POLYGON:
                this.polygonPool.recycle(shape as Polygon);
                break;
            default:
                console.warn('Unknown shape type, cannot recycle:', shape.shapeType);
                break;
        }
    }

    /**
     * 预热对象池 - 预先创建指定数量的对象
     */
    public warmUpPools(circleCount: number = 50, boxCount: number = 50, polygonCount: number = 20): void {
        this.circlePool.warmUp(circleCount);
        this.boxPool.warmUp(boxCount);
        this.polygonPool.warmUp(polygonCount);
    }

    /**
     * 获取对象池统计信息
     */
    public getStats() {
        return {
            circle: this.circlePool.getStats(),
            box: this.boxPool.getStats(),
            polygon: this.polygonPool.getStats()
        };
    }
} 