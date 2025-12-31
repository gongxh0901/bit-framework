/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 原型
 */

import { Rect } from "../utils/Rect";
import { ShapeType } from "./IShape";
import { Shape } from "./Shape";

export class Circle extends Shape {
    private _radius: number; // 半径

    /**
     * 形状类型
     */
    public get shapeType(): ShapeType {
        return ShapeType.CIRCLE;
    }

    /**
     * 构造函数
     * @internal
     */
    constructor(radius: number = 10, binaryMask: number = 0xFFFFFFFF) {
        super(binaryMask);
        this._radius = radius;
        this.updateBoundingBox();
    }

    /**
     * 获取包围盒
     */
    public getBoundingBox(): Rect {
        if (this._isDirty) {
            this.updateBoundingBox();
            this._isDirty = false;
        }
        return this._boundingBox;
    }

    public get radius(): number {
        return this._radius;
    }

    public set radius(value: number) {
        this._radius = value;
        this._isDirty = true;
    }

    /**
     * 设置半径
     */
    public setRadius(radius: number): void {
        this._radius = radius;
        this._isDirty = true;
    }

    /**
     * 设置旋转角度
     * @param angle 旋转角度
     * @internal
     */
    public setRotation(angle: number): void {
        this._rotation = angle;
    }

    private updateBoundingBox(): void {
        const radius = this._radius * this._scale;
        this._boundingBox.x = -radius;
        this._boundingBox.y = -radius;
        this._boundingBox.width = radius * 2;
        this._boundingBox.height = radius * 2;
    }
}