/**
 * @Author: Gongxh
 * @Date: 2025-05-15
 * @Description: 检测当前环境是否支持BigInt 并提供Mask的接口
 */

import { ArrayMask } from "./ArrayMask";
import { BigIntMask } from "./BigIntMask";

function isBigIntSupported(): boolean {
    try {
        const a = BigInt(1);
        const b = BigInt(2);
        const c = a | b;
        const d = a & b;
        const e = a << b;
        return true;
    } catch (e) {
        console.log('当前环境不支持BigInt，将使用Uint32Array实现');
        return false;
    }
}

// 保存检测结果
const BIGINT_SUPPORTED = isBigIntSupported();

/**
 * 掩码基类接口
 */
export interface IMask {
    size: number;
    set(num: number): IMask;
    delete(num: number): IMask;
    has(num: number): boolean;
    any(other: IMask): boolean;
    include(other: IMask): boolean;
    clear(): IMask;
    isEmpty(): boolean;
    values(): Set<number>;
}

/**
 * 创建与当前环境兼容的掩码
 * @returns 掩码实例
 */
export function createMask(): IMask {
    return BIGINT_SUPPORTED ? new BigIntMask() : new ArrayMask();
}