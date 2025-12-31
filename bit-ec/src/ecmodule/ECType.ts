/**
 * @type {&} AND，按位与处理两个长度相同的二进制数，两个相应的二进位都为 1，该位的结果值才为 1，否则为 0
 * @type {|} OR，按位或处理两个长度相同的二进制数，两个相应的二进位中只要有一个为 1，该位的结果值为 1
 * @type {~} 取反，取反是一元运算符，对一个二进制数的每一位执行逻辑反操作。使数字 1 成为 0，0 成为 1
 * @type {^} 异或，按位异或运算，对等长二进制模式按位或二进制数的每一位执行逻辑异按位或操作。操作的结果是如果某位不同则该位为 1，否则该位为 0
 * @type {<<} 左移，把 << 左边的运算数的各二进位全部左移若干位，由 << 右边的数指定移动的位数，高位丢弃，低位补0; 将一个值左移一个位置相当于将其乘以2，移位两个位置相当于乘以4，依此类推。
 * @type {>>} 右移，把 >> 左边的运算数的各二进位全部右移若干位，>> 右边的数指定移动的位数
 * @type {>>>} 无符号右移，与有符号右移位类似，除了左边一律使用0 补位
 */

import { Stack } from "../tool/Stack";

/** 实体索引位数 @internal */
export const EntityIndexBits = 16;
/** 实体索引掩码 @internal */
export const EntityIndexMask = (1 << EntityIndexBits) - 1;
/** 最大实体数量 @internal */
export const MaxEntityCount = 1 << EntityIndexBits;
export type EntityId = number;

/**
 * 2进制转10进制 (不支持小数和负数)
 * @param {number} bitNumber 二进制数
 * @return {number} 十进制数
 * @internal
 */
export function bit2Decimal(bitNumber: number): number {
    let bitString = String(bitNumber);
    let len = bitString.length;
    let index = len - 1;
    let result: number = 0;
    do {
        result += Number(bitString[index]) * Math.pow(2, len - index - 1);
        index--;
    } while (index >= 0);
    return result;
}
/**
 * 10进制转2进制 (不支持小数和负数)
 * @param {number} num 十进制数
 * @return {number} 二进制数
 * @internal
 */
export function decimal2Bit(num: number): number {
    let stack = new Stack<number>();
    let dividend: number = Math.floor(num);
    let remainder: number;
    do {
        remainder = dividend % 2;
        stack.push(remainder);
        dividend = Math.floor(dividend / 2);
    } while (dividend > 0);
    let result = "";
    while (!stack.isEmpty()) {
        result += stack.pop().toString();
    }
    return Number(result);
}

/**
 * 通过实体id获取实体index
 * @param id 实体id
 * @return {number} 实体index
 * @internal
 */
export function getEntityIndex(id: EntityId): number {
    return id & EntityIndexMask;
}

/**
 * 通过实体id获取实体版本
 * @param id 实体id
 * @return {number} 实体版本
 * @internal
 */
export function getEntityVersion(id: EntityId): number {
    return id >>> EntityIndexBits;
}

/**
 * 实体描述
 * @param id 实体id
 * @return {string} 实体描述
 * @internal
 */
export function entityIdString(id: EntityId): string {
    return `${getEntityIndex(id)}:${getEntityVersion(id)}`;
}