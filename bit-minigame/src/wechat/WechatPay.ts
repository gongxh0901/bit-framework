/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 微信支付
 */

import { log, warn } from "@gongxh/bit-core";
import { MiniErrorCode, PriceLimitList } from "../header";
import { IMiniPay, IMiniPayParams } from "../interface/IMiniPay";
import { MiniHelper } from "../MiniHelper";

export class WechatPay implements IMiniPay {
    private _offerId: string = "";
    private _unitPriceQuantity: number = 1;
    public init(offerId: string, unitPriceQuantity: number): void {
        this._offerId = offerId;
        this._unitPriceQuantity = unitPriceQuantity;
    }

    public isPayable(rmb: number): boolean {
        return PriceLimitList.includes(rmb);
    }

    public pay(res: IMiniPayParams): void {
        if (this._offerId === "") {
            warn("请先调用 init 方法初始化");
            res.fail({ errCode: MiniErrorCode.PAY_NOT_INIT.code, errMsg: MiniErrorCode.PAY_NOT_INIT.msg });
            return;
        }
        if (!this.isPayable(res.rmb)) {
            res.fail({ errCode: -15016, errMsg: "传入价格不满足限定条件" });
            return;
        }
        let platform = MiniHelper.common().getPlatform();
        if (platform === "ios") {
            res.fail({ errCode: MiniErrorCode.IOS_FORBIDDEN.code, errMsg: MiniErrorCode.IOS_FORBIDDEN.msg });
            return;
        }

        if (platform === "windows" || platform === "mac") {
            platform = "windows";
        } else {
            platform = "android";
        }
        log(`WechatPay rmb:${res.rmb}元 orderId:${res.orderId} sandbox:${res.sandbox || 0} shopId:${res.shopId} shopName:${res.shopName}`);

        wx.requestMidasPayment({
            mode: "game",
            /** 沙箱环境 */
            env: res.sandbox || 0,
            offerId: this._offerId,
            currencyType: "CNY",
            platform: platform,
            buyQuantity: res.rmb * this._unitPriceQuantity,
            zoneId: "1",
            /** 游戏唯一订单号 */
            outTradeNo: res.orderId,
            success: (param: { errMsg: string }) => {
                res.success({ code: 0, message: param.errMsg });
            },
            fail: (param: { errCode: number, errMsg: string, errno: number }) => {
                warn(`WechatPay fail code:${param.errCode} msg:${param.errMsg} errno:${param.errno}`);
                res.fail({ errCode: param.errCode, errMsg: param.errMsg });
            }
        });
    }
}