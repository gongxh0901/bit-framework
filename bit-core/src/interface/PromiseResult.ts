/**
 * @Author: Gongxh
 * @Date: 2025-04-18
 * @Description: 通用的 Promise 结果
 */

export interface IPromiseResult {
    /** 0:成功 其他:失败 */
    code: number;
    /** 失败信息 */
    message: string;
}

export interface ICheckUpdatePromiseResult extends IPromiseResult {
    /** 需要更新的资源大小 (KB) */
    size?: number;
}