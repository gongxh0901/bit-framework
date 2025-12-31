/**
 * @Author: Gongxh
 * @Date: 2025-04-12
 * @Description: 抖音支付
 * https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/payment/tt-request-game-payment
 */

import { log, Utils, warn } from "@gongxh/bit-core";
import { MiniErrorCode, PriceLimitList } from "../header";
import { IMiniPay, IMiniPayParams } from "../interface/IMiniPay";
import { MiniHelper } from "../MiniHelper";
import { BytedanceCommon } from "./BytedanceCommon";


enum DouyinMiniAppName {
    Toutiao = "Toutiao",                // 今日头条
    Douyin = "Douyin",                  // 抖音
    ToutiaoLite = "news_article_lite",  // 今日头条极速版
    LiveStream = "live_stream",         // 火山小视频
    XiGua = "XiGua",                    // 西瓜
    PPX = "PPX",                        // 皮皮虾
    DouyinLite = "DouyinLite",          // 抖音极速版
    LiveStreamLite = "live_stream_lite",// 火山小视频极速版
    NovelFm = "novel_fm",               // 番茄畅听
    NovelApp = "novelapp",              // 番茄小说
}

export class BytedancePay implements IMiniPay {
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
        log(`BytedancePay rmb:${res.rmb}元 orderId:${res.orderId} sandbox:${res.sandbox || 0} shopId:${res.shopId} shopName:${res.shopName}`);
        if (platform === "android") {
            this.payAndroid(res);
        } else if (platform === "ios") {
            this.payIos(res);
        } else {
            res.fail({ errCode: MiniErrorCode.PAY_NOT_IMPLEMENTED.code, errMsg: `${MiniErrorCode.IOS_FORBIDDEN.msg} platform:${platform}` });
        }
    }

    private payAndroid(res: IMiniPayParams): void {
        let extraInfo: Record<string, any> = {
            shopId: res.shopId,
            shopName: res.shopName,
            sandbox: res.sandbox || 0,
        }
        for (let key in res.extraInfo) {
            extraInfo[key] = res.extraInfo[key];
        }
        log("扩展参数:", JSON.stringify(extraInfo));;
        tt.requestGamePayment({
            mode: 'game',
            env: 0,
            currencyType: 'CNY',
            platform: 'android',
            buyQuantity: Math.floor(res.rmb * this._unitPriceQuantity),
            zoneId: '1',
            customId: res.orderId,
            extraInfo: JSON.stringify(extraInfo),
            success: (param: BytedanceMiniprogram.GeneralSuccessResult) => {
                res.success({ code: 0, message: param.errMsg });
            },
            fail: (param: BytedanceMiniprogram.GeneralFailCodeResult) => {
                warn(`BytedancePay fail code:${param.errCode} msg:${param.errMsg}`);
                res.fail({ errCode: param.errCode, errMsg: param.errMsg });
            }
        });
    }

    private payIos(res: IMiniPayParams): void {
        let appname = MiniHelper.common<BytedanceCommon>().getHostName();
        if (appname != DouyinMiniAppName.Douyin && appname != DouyinMiniAppName.DouyinLite) {
            res.fail({ errCode: MiniErrorCode.PAY_NOT_IMPLEMENTED.code, errMsg: `${MiniErrorCode.PAY_NOT_IMPLEMENTED.msg} 宿主:${appname}` });
            return;
        }
        if (!tt.openAwemeCustomerService || Utils.compareVersion(MiniHelper.common().getLibVersion(), "2.64.0") < 0) {
            res.fail({ errCode: MiniErrorCode.VERSION_LOW.code, errMsg: "抖音版本号过低，请升级后再试" });
            return;
        }
        let extraInfo = {
            shopId: res.shopId,
            shopName: res.shopName,
            sandbox: res.sandbox || 0,
        }
        if (res.extraInfo) {
            // 合并extraInfo和res.extraInfo
            extraInfo = { ...extraInfo, ...res.extraInfo };
        }
        tt.openAwemeCustomerService({
            currencyType: "CNY",
            buyQuantity: Math.floor(res.rmb * this._unitPriceQuantity),
            zoneId: '1',
            /** 游戏唯一订单号 */
            customId: res.orderId,
            /** 游戏开发者自定义的其他信息 字符串长度最大不能超过 256。*/
            extraInfo: JSON.stringify(extraInfo),
            success: (params: BytedanceMiniprogram.GeneralSuccessResult) => {
                res.success({ code: 0, message: params.errMsg });
            },
            fail: (params: BytedanceMiniprogram.GeneralFailResult) => {
                warn(`BytedancePay fail code:${params.errNo} msg:${params.errMsg}`);
                res.fail({ errCode: params.errNo, errMsg: params.errMsg });
            }
        });
    }
}