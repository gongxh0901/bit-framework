/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 小游戏辅助类
 */

import { Platform } from "@gongxh/bit-core";
import { AlipayAds } from "./alipay/AlipayAds";
import { AlipayCommon } from "./alipay/AlipayCommon";
import { AlipayPay } from "./alipay/AlipayPay";
import { BytedanceAds } from "./bytedance/BytedanceAds";
import { BytedanceCommon } from "./bytedance/BytedanceCommon";
import { BytedancePay } from "./bytedance/BytedancePay";
import { IMiniRewardAds } from "./interface/IMiniAds";
import { IMiniCommon } from "./interface/IMiniCommon";
import { IMiniPay } from "./interface/IMiniPay";
import { WechatAds } from "./wechat/WechatAds";
import { WechatCommon } from "./wechat/WechatCommon";
import { WechatPay } from "./wechat/WechatPay";

export class MiniHelper {
    /** 基础数据 */
    private static _common: IMiniCommon = null;
    /** 广告 */
    private static _ad: IMiniRewardAds = null;
    /** 支付 */
    private static _pay: IMiniPay = null;

    public static common<T extends IMiniCommon>(): T {
        if (!this._common) {
            if (Platform.isWX) {
                this._common = new WechatCommon();
            } else if (Platform.isAlipay) {
                this._common = new AlipayCommon();
                this._ad = new AlipayAds();
            } else if (Platform.isBytedance) {
                this._common = new BytedanceCommon();
            }
        }
        return this._common as T;
    }

    public static ad<T extends IMiniRewardAds>(): T {
        if (!this._ad) {
            if (Platform.isWX) {
                this._ad = new WechatAds();
            } else if (Platform.isAlipay) {
                this._ad = new AlipayAds();
            } else if (Platform.isBytedance) {
                this._ad = new BytedanceAds();
            }
        }
        return this._ad as T;
    }

    public static pay<T extends IMiniPay>(): T {
        if (!this._pay) {
            if (Platform.isWX) {
                this._pay = new WechatPay();
            } else if (Platform.isAlipay) {
                this._pay = new AlipayPay();
            } else if (Platform.isBytedance) {
                this._pay = new BytedancePay();
            }
        }
        return this._pay as T;
    }
}