/**
 * @Author: Gongxh
 * @Date: 2024-12-05
 * @Description: log相关的api
 */

import { KUNPO_DEBUG } from "./header";

function log(...args: any[]): void {
    console.log("bit-framework:", ...args);
}

/**
 * 开启debug模式后 输出调试信息 
 * @param args 
 */
function debug(...args: any[]): void {
    KUNPO_DEBUG && console.log("bit-framework:", ...args);
}

/**
 * 信息性消息 某些浏览器中会带有小图标，但颜色通常与 log 相同
 * @param args 
 */
function info(...args: any[]): void {
    KUNPO_DEBUG && console.info("bit-framework:", ...args);
}

/**
 * 警告信息 黄色背景，通常带有警告图标
 * @param args 
 */
function warn(...args: any[]): void {
    KUNPO_DEBUG && console.warn("bit-framework:", ...args);
}

/**
 * 错误消息 红色背景，通常带有错误图标
 * @param args 
 */
function error(...args: any[]): void {
    KUNPO_DEBUG && console.error("bit-framework:", ...args);
}
export { debug, error, info, log, warn };
