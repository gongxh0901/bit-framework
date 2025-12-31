/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 多边形
 */

import { Rect } from "../utils/Rect";
import { v2, Vec2 } from "../utils/Vec2";
import { ShapeType } from "./IShape";
import { Shape } from "./Shape";

export class Polygon extends Shape {
    // 多边形原始的点
    protected _points: Vec2[] = [];
    // 缩放旋转后变换的点 (不包含位置变换)
    protected _transformPoints: Vec2[] = [];
    // 包含位置变换的实际的点
    protected _realPoints: Vec2[] = [];
    // 位置是否需要重新计算
    private _isPosDirty: boolean = true;
    // 是否需要重新计算包围盒
    private _isBoxDirty: boolean = true;

    public get shapeType(): ShapeType {
        return ShapeType.POLYGON;
    }

    /**
     * 构造函数
     * @internal
     */
    constructor(points: Vec2[] = [], binaryMask: number = 0xFFFFFFFF) {
        super(binaryMask);
        this.setPoints(points);
    }

    /**
     * 设置多边形的点
     */
    public setPoints(points: Vec2[]): void {
        let length = points.length;
        this._points = points;
        this._realPoints.length = length;
        this._transformPoints.length = length;

        for (let i = 0; i < length; i++) {
            if (this._realPoints[i]) {
                this._realPoints[i].x = points[i].x;
                this._realPoints[i].y = points[i].y;
            } else {
                this._realPoints[i] = v2(points[i].x, points[i].y);
            }

            if (this._transformPoints[i]) {
                this._transformPoints[i].x = points[i].x;
                this._transformPoints[i].y = points[i].y;
            } else {
                this._transformPoints[i] = v2(points[i].x, points[i].y);
            }
        }
        this._isPosDirty = true;
        this._isBoxDirty = true;
        this._isDirty = true;
    }

    public setPosition(x: number, y: number): void {
        super.setPosition(x, y);
        this._isPosDirty = true;
    }

    /**
     * 获取包围盒
     */
    public getBoundingBox(): Rect {
        this.updateTransformPoints();
        if (!this._isBoxDirty) {
            return this._boundingBox;
        }

        let points = this._transformPoints;
        let point = points[0];

        let minX = point.x;
        let maxX = point.x;
        let minY = point.y;
        let maxY = point.y;

        for (let i = 1; i < points.length; i++) {
            point = points[i];
            let x = point.x;
            let y = point.y;
            if (x < minX) {
                minX = x;
            }
            if (x > maxX) {
                maxX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (y > maxY) {
                maxY = y;
            }
        }
        this._boundingBox.x = minX;
        this._boundingBox.y = minY;
        this._boundingBox.width = (maxX - minX);
        this._boundingBox.height = (maxY - minY);

        this._isBoxDirty = false;
        return this._boundingBox;
    }

    /** 
     * 获取经过所有变换之后的实际的点
     */
    public getRealPoints(): Vec2[] {
        this.updateTransformPoints();

        if (!this._isPosDirty) {
            return this._realPoints;
        }

        let points = this._transformPoints;
        let len = points.length;

        for (let i = 0; i < len; i++) {
            let m = points[i];
            let a = this._realPoints[i];
            a.x = m.x + this.position.x;
            a.y = m.y + this.position.y;
        }
        this._isPosDirty = false;
        return this._realPoints;
    }

    /**
     * 更新变换后的点
     * @internal
     */
    protected updateTransformPoints(): void {
        if (!this._isDirty) {
            return;
        }
        let points = this._points;
        let len = points.length;
        // 确保 _transformPoints 数组长度正确
        if (!this._transformPoints) {
            this._transformPoints = new Array(len);
            this._realPoints = new Array(len);
            for (let i = 0; i < len; i++) {
                this._transformPoints[i] = v2(0, 0);
                this._realPoints[i] = v2(0, 0);
            }
        }
        // 确保_transformPoints数组长度正确
        if (this._transformPoints.length !== len) {
            this._transformPoints.length = len;
            this._realPoints.length = len;
            for (let i = 0; i < len; i++) {
                if (this._transformPoints[i]) {
                    this._transformPoints[i].x = points[i].x;
                    this._transformPoints[i].y = points[i].y;
                } else {
                    this._transformPoints[i] = v2(points[i].x, points[i].y);
                    this._realPoints[i] = v2(points[i].x, points[i].y);
                }
            }
        }

        // 优化：当旋转角度为0时，避免调用rotate函数
        if (this._rotation === 0) {
            for (let i = 0; i < len; i++) {
                let m = points[i];
                let a = this._transformPoints[i];
                a.x = m.x * this.scale;
                a.y = m.y * this.scale;
            }
        } else {
            let radians = Math.PI / 180 * this._rotation;
            let sin = Math.sin(radians);
            let cos = Math.cos(radians);

            for (let i = 0; i < len; i++) {
                let m = points[i];
                let a = this._transformPoints[i];
                a.x = (m.x * cos - m.y * sin) * this.scale;
                a.y = (m.y * cos + m.x * sin) * this.scale;
            }
        }
        this._isDirty = false;
        this._isPosDirty = true;
        this._isBoxDirty = true;
    }
}