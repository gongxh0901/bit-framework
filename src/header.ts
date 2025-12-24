/**
 * @Author: Gongxh
 * @Date: 2024-12-08
 * @Description: 窗口的一些类型配置 
 */

/** 是否开启调试模式 */
export let KUNPO_DEBUG: boolean = false;

/**
 * 启用或禁用调试模式。
 * @param enable - 如果为 true，则启用调试模式；如果为 false，则禁用调试模式。不设置默认不开启
 */
export function enableDebugMode(enable: boolean): void {
    if (enable == true) {
        KUNPO_DEBUG = true;
        console.warn("调试模式已开启");
    } else {
        KUNPO_DEBUG = false;
    }
}

export interface Size {
    width: number;
    height: number;
}
