/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 矩形
 * 
 * 3|2
 * --
 * 0|1
 * 矩形的四个点
 */

import { Rect } from "../utils/Rect";
import { v2, Vec2 } from "../utils/Vec2";
import { ShapeType } from "./IShape";
import { Polygon } from "./Polygon";


export class Box extends Polygon {

    /**
     * 形状类型
     */
    public get shapeType(): ShapeType {
        return ShapeType.BOX;
    }

    /**
     * 构造函数
     * @internal
     */
    constructor(x: number = 0, y: number = 0, width: number = 50, height: number = 50, binaryMask: number = 0xFFFFFFFF) {
        let points: Vec2[] = new Array(4);
        points[0] = v2(x, y);
        points[1] = v2(x + width, y);
        points[2] = v2(x + width, y + height);
        points[3] = v2(x, y + height);
        super(points, binaryMask);
    }

    public resetPoints(x: number, y: number, width: number, height: number): void {
        // 直接复用 this._points，避免产生新的数组，减少GC
        let points = this._points;

        points[0].x = x;
        points[0].y = y;

        points[1].x = x + width;
        points[1].y = y;

        points[2].x = x + width;
        points[2].y = y + height;

        points[3].x = x;
        points[3].y = y + height;
        this._isDirty = true;
    }

    /**
     * 设置矩形尺寸
     */
    public setSize(width: number, height: number): void {
        this.resetPoints(this._points[0].x, this._points[0].y, width, height);
    }

    /**
     * 检查当前矩形是否为轴对齐矩形（未旋转）
     * @internal
     */
    public isAxisAligned(): boolean {
        return this._rotation === 0;
    }

    /**
     * 重写包围盒计算，针对矩形进行优化
     */
    public getBoundingBox(): Rect {
        if (!this._isDirty) {
            return this._boundingBox;
        }
        return this._rotation === 0 ? this.getUnrotatedBoundingBox() : super.getBoundingBox();
    }

    /** 
     * 无旋转的矩形 计算包围盒
     * @internal
     */
    private getUnrotatedBoundingBox(): Rect {
        this.updateTransformPoints();
        // 无旋转情况：直接计算轴对齐的包围盒，性能更好
        const points = this._points;

        // points[0]是左下角，points[2]是右上角
        const minX = points[0].x;
        const maxX = points[2].x;
        const minY = points[0].y;
        const maxY = points[2].y;

        this._boundingBox.x = minX * this._scale;
        this._boundingBox.y = minY * this._scale;
        this._boundingBox.width = (maxX - minX) * this._scale;
        this._boundingBox.height = (maxY - minY) * this._scale;
        return this._boundingBox;
    }
}