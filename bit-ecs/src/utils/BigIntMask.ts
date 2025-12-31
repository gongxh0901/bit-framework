/**
 * @Author: Gongxh
 * @Date: 2025-05-15
 * @Description: BigInt实现的掩码
 */

import { IMask } from "./IMask";

export class BigIntMask implements IMask {
    private mask: bigint = BigInt(0);
    private _size: number = 0;
    private _values: Set<number> = new Set();
    public get size(): number {
        return this._size;
    }

    /**
     * 设置掩码
     * @param num
     */
    public set(num: number): IMask {
        this.mask |= BigInt(1) << BigInt(num);
        this._size++;
        this._values.add(num);
        return this;
    }

    /**
     * 移除掩码
     * @param num
     */
    public delete(num: number): IMask {
        this.mask &= ~(BigInt(1) << BigInt(num));
        this._size--;
        this._values.delete(num);
        return this;
    }

    /**
     * 查找是否存在
     * @param num
     * @returns
     */
    public has(num: number): boolean {
        return (this.mask & (BigInt(1) << BigInt(num))) !== BigInt(0);
    }

    /**
     * 检查两个掩码是否有交集
     * @param other 
     * @returns 
     */
    public any(other: BigIntMask): boolean {
        return (this.mask & other.mask) !== BigInt(0);
    }

    /**
     * this是否包含other
     * @param other 
     * @returns 
     */
    public include(other: BigIntMask): boolean {
        return (this.mask & other.mask) === other.mask;
    }

    public clear(): BigIntMask {
        this.mask = BigInt(0);
        this._values.clear();
        this._size = 0;
        return this;
    }

    public isEmpty(): boolean {
        return this.size == 0;
    }

    public values(): Set<number> {
        return this._values;
    }
}