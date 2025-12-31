/**
 * @Author: Gongxh
 * @Date: 2025-05-13
 * @Description: Uint32Array实现的掩码
 */

import { _ecsdecorator } from "../ECSDecorator";
import { IMask } from "./IMask";

export class ArrayMask implements IMask {
    /** 32位二进制数组 由于&操作符最大只能30位操作 故每个三十二位二进制保存30个组件 */
    private mask: Uint32Array;
    private length: number = 0;
    private _size: number = 0;
    private _values: Set<number> = new Set();

    public get size(): number {
        return this._size;
    }

    constructor() {
        // 计算32位掩码数量  (总组件数/31)
        let total = _ecsdecorator.getComponentMaps().size;
        this.length = Math.ceil(total / 31);
        this.mask = new Uint32Array(this.length);
    }

    /**
     * 设置掩码
     * @param num
     */
    public set(num: number): ArrayMask {
        /// >>> 无符号位移 高位补0
        this.mask[(num / 31) >>> 0] |= 1 << num % 31;
        this._size++;
        this._values.add(num);
        return this;
    }

    /**
     * 移除掩码
     * @param num
     */
    public delete(num: number): ArrayMask {
        this.mask[(num / 31) >>> 0] &= ~(1 << num % 31);
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
        // !!取布尔值 0或1
        return !!(this.mask[(num / 31) >>> 0] & (1 << num % 31));
    }

    /**
     * 检查两个掩码是否有交集
     * @param other 
     * @returns 
     */
    public any(other: ArrayMask): boolean {
        for (let i = 0; i < this.length; i++) {
            if (this.mask[i] & other.mask[i]) {
                return true;
            }
        }
        return false;
    }

    /**
     * this是否包含other
     * @param other 
     * @returns 
     */
    public include(other: ArrayMask): boolean {
        for (let i = 0; i < this.length; i++) {
            if ((this.mask[i] & other.mask[i]) != other.mask[i]) {
                return false;
            }
        }
        return true;
    }

    public clear(): ArrayMask {
        for (let i = 0; i < this.length; i++) {
            this.mask[i] = 0;
        }
        this._values.clear();
        this._size = 0;
        return this;
    }

    public isEmpty(): boolean {
        return this._size == 0;
    }

    public values(): Set<number> {
        return this._values;
    }
}