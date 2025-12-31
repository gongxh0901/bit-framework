/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 四叉树的 形状基类
 */

import { IRecyclable } from "../utils/ObjectPool";
import { rect, Rect } from "../utils/Rect";
import { v2, Vec2 } from "../utils/Vec2";
import { IShape, ShapeType } from "./IShape";

export abstract class Shape implements IShape, IRecyclable {
    /**
     * 形状的掩码 用来过滤不需要检测的形状 通过&来匹配形状是否需要被检测 -1表示和所有物体碰撞
     * @internal 
     */
    private _binaryMask: number = 0xFFFFFFFF;

    /** 
     * 缩放比例
     * @internal 
     */
    protected _scale: number;

    /** 
     * 脏标记 用来重置包围盒
     * @internal 
     */
    protected _isDirty: boolean;

    /** 
     * 位置变化脏标记
     * @internal 
     */
    protected _isPositionDirty: boolean = true;

    /** 
     * 包围盒 (不包含位置变换)
     * @internal 
     */
    protected _boundingBox: Rect;

    /** 
     * 位置 
     * @internal 
     */
    protected _position: Vec2;

    /** 
     * 旋转角度 
     * @internal 
     */
    protected _rotation: number;

    /** 
     * 是否有效 下次更新时删除 
     * @internal 
     */
    private _valid: boolean = true;

    public abstract get shapeType(): ShapeType;

    public get mask(): number { return this._binaryMask; }
    public get position(): Vec2 { return this._position; }
    public get scale(): number { return this._scale; }
    public get rotation(): number { return this._rotation; }
    public get isValid(): boolean { return this._valid; }
    public get isPositionDirty(): boolean { return this._isPositionDirty; }

    /**
     * 构造函数
     * @internal
     */
    constructor(binaryMask: number = 0xFFFFFFFF) {
        this._binaryMask = binaryMask;
        this._scale = 1.0;
        this._rotation = 0;
        this._isDirty = true;
        this._boundingBox = rect();
        this._position = v2();
    }

    // 位置变化不会导致本地包围盒变脏
    public setPosition(x: number, y: number) {
        if (this._position.x === x && this._position.y === y) {
            return;
        }
        this._position.x = x;
        this._position.y = y;
        this._isPositionDirty = true;
    }

    public setRotation(angle: number): void {
        if (this._rotation !== angle) {
            this._rotation = angle;
            this._isDirty = true;
        }
    }

    public setScale(value: number): void {
        if (this._scale !== value) {
            this._scale = value;
            this._isDirty = true;
        }
    }

    /** 包围盒 子类重写 */
    public abstract getBoundingBox(): Rect;

    /** 
     * 清除位置变化脏标记
     */
    public clearPositionDirty(): void {
        this._isPositionDirty = false;
    }

    public destroy(): void {
        this._valid = false;
    }

    // IRecyclable 接口实现

    /**
     * 重置对象状态以供重用
     */
    public reset(): void {
        this._binaryMask = 0xFFFFFFFF;
        this._scale = 1.0;
        this._rotation = 0;
        this._isDirty = true;
        this._isPositionDirty = true;
        this._valid = true;

        // 重置位置
        this._position.x = 0;
        this._position.y = 0;

        // 重置包围盒
        this._boundingBox.x = 0;
        this._boundingBox.y = 0;
        this._boundingBox.width = 0;
        this._boundingBox.height = 0;

        // 调用子类特定的重置逻辑
        this.onReset();
    }

    /**
     * 子类可重写此方法来实现特定的重置逻辑
     */
    protected onReset(): void {
        // 默认实现为空，子类可重写
    }

    /**
     * 设置掩码
     */
    public setMask(mask: number): void {
        this._binaryMask = mask;
    }
}