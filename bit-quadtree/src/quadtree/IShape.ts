/**
 * @Author: Gongxh
 * @Date: 2025-05-27
 * @Description: 
 */

import { Rect } from "../utils/Rect";
import { Vec2 } from "../utils/Vec2";


export enum ShapeType {
    CIRCLE = 1,
    BOX = 2,
    POLYGON = 3,
}

export interface IShape {
    /** 形状类型 */
    get shapeType(): ShapeType;
    /** 形状掩码 @internal */
    get mask(): number;
    /** 是否有效 @internal */

    get isValid(): boolean;
    get position(): Vec2;
    get scale(): number;
    get rotation(): number;
    get isPositionDirty(): boolean;

    /** 获取包围盒 */
    getBoundingBox(): Rect;
    setPosition(x: number, y: number): void;
    setScale(value: number): void;
    setRotation(angle: number): void;
    clearPositionDirty(): void;
    destroy(): void;

    // 对象池相关方法
    /** 重置对象状态以供重用 */
    reset(): void;
    /** 设置掩码 */
    setMask(mask: number): void;
}