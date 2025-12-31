/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 支付宝支付
 */

import { log, Utils, warn } from "@gongxh/bit-core";
import { MiniErrorCode, PriceLimitList } from "../header";
import { IMiniPay, IMiniPayParams } from "../interface/IMiniPay";
import { MiniHelper } from "../MiniHelper";

export class AlipayPay implements IMiniPay {
    private _unitPriceQuantity: number = 0;
    public init(offerId: string, unitPriceQuantity: number): void {
        this._unitPriceQuantity = unitPriceQuantity;
    }

    public isPayable(rmb: number): boolean {
        return PriceLimitList.includes(rmb);
    }

    public pay(res: IMiniPayParams): void {
        if (this._unitPriceQuantity === 0) {
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
        if (platform === "iPad") {
            res.fail({ errCode: MiniErrorCode.IOS_FORBIDDEN.code, errMsg: "iPad禁止支付" });
            return;
        }

        if (Utils.compareVersion(MiniHelper.common().getHostVersion(), "10.3.90") < 0) {
            res.fail({ errCode: MiniErrorCode.IOS_FORBIDDEN.code, errMsg: "支付宝版本过低, 请升级支付宝" });
            return;
        }

        log(`AlipayPay rmb:${res.rmb}元 orderId:${res.orderId} sandbox:${res.sandbox || 0} shopId:${res.shopId} shopName:${res.shopName}`);
        let extraInfo = {
            shopId: res.shopId,
            shopName: res.shopName,
            sandbox: res.sandbox || 0,
        }
        if (res.extraInfo) {
            // 合并extraInfo和res.extraInfo
            extraInfo = { ...extraInfo, ...res.extraInfo };
        }
        my.requestGamePayment({
            customId: res.orderId,
            buyQuantity: res.rmb * this._unitPriceQuantity,
            extraInfo: extraInfo,
            success: (param: { resultCode: number }) => {
                res.success({ code: param.resultCode, message: "success" });
            },
            fail: (param: AliyMiniprogram.CallBack.Fail) => {
                warn(`WechatPay fail code:${param.error} msg:${param.errorMessage}`);
                res.fail({ errCode: param.error, errMsg: param.errorMessage });
            }
        });
    }
}