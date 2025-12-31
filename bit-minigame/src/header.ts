/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description:
 */

/** 记录一些错误码 */
export const MiniErrorCode = {
    /** 支付未初始化 */
    PAY_NOT_INIT: { code: -96001, msg: "支付未初始化" },
    /** ios禁止支付 */
    IOS_FORBIDDEN: { code: -96002, msg: "ios禁止支付" },
    /** 当前平台未实现支付 */
    PAY_NOT_IMPLEMENTED: { code: -96003, msg: "当前平台未实现支付" },
    /** 版本号低 */
    VERSION_LOW: { code: -96004, msg: "版本号过低" },


    /** 广告未初始化 */
    AD_NOT_INIT: { code: -97001, msg: "广告未初始化, 需要先调用init方法初始化" },
    /** 广告中途退出*/
    AD_EXIT: { code: -97002, msg: "广告中途退出" },
    /** 广告正在播放中 不允许重复调用 */
    AD_PLAYING: { code: -97003, msg: "广告正在播放中 不允许重复调用" },
}

/** 统一价格限制列表 (微信、支付宝和字节 取交集) */
export const PriceLimitList = [1, 3, 6, 8, 12, 18, 25, 30, 40, 45, 50, 60, 68, 73, 78, 88, 98, 108, 118, 128, 148, 168, 188, 198, 328, 648, 998, 1998, 2998];