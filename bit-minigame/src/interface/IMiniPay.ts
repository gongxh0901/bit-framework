/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 小游戏支付接口
 */

export interface IMiniPayParams {
    /**
     * 支付金额 (元)
     */
    rmb: number;
    /**
     * 订单号
     */
    orderId: string;
    /**
     * 是否为沙盒环境 0: 正式环境 1: 沙盒环境
     */
    sandbox?: 0 | 1;
    /**
     * 商品ID
     */
    shopId: string;

    /**
     * 商品名
     */
    shopName: string;

    /**
     * 额外信息
     */
    extraInfo?: Record<string, any>;

    /**
     * 接口调用成功的回调函数
     * @param res.code 支付结果码
     * @param res.message 支付结果信息
     */
    success: (res: { code: number, message: string }) => void;

    /**
     * 接口调用失败的回调函数
     * @param res.errCode 错误码
     * @param res.errMsg 错误信息
     */
    fail: (res: { errCode: number, errMsg: string }) => void;
}

export interface IMiniPay {
    /**
     * 初始化 (不需要的参数传null)
     * @param offerId 商户号
     * @param unitPriceQuantity 单价数量  1元 / 后台设置的价格单位
     */
    init(offerId: string, unitPriceQuantity: number): void;

    /** 
     * 是否满足限定的价格等级
     * @param rmb 价格 (元)
     * @returns 是否满足限定的价格等级
     */
    isPayable(rmb: number): boolean;

    /**
     * 支付
     */
    pay(res: IMiniPayParams): void;
}