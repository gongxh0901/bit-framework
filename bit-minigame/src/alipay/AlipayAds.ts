/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 支付宝广告
 */

import { warn } from "@gongxh/bit-core";
import { MiniErrorCode } from "../header";
import { IMiniRewardAds } from "../interface/IMiniAds";

export class AlipayAds implements IMiniRewardAds {
    private _adUnitId: string = "";
    private _video_ad: AliyMiniprogram.RewardedAd = null;

    /**
     * 广告成功回调
     */
    private _success: () => void;
    /**
     * 广告失败回调
     */
    private _fail: (errCode: number, errMsg: string) => void;

    public init(adUnitId: string): void {
        this._adUnitId = adUnitId;
    }

    public showAds(res: { success: () => void, fail: (errCode: number, errMsg: string) => void }): void {
        if (this._adUnitId === "") {
            warn(MiniErrorCode.AD_NOT_INIT.msg);
            res.fail(MiniErrorCode.AD_NOT_INIT.code, MiniErrorCode.AD_NOT_INIT.msg);
            return;
        }
        this._success = res.success;
        this._fail = res.fail;

        if (!this._video_ad) {
            this._video_ad = this.createVideoAd();
        }
        this._video_ad.load().then(() => {
            this._video_ad.show();
        }).catch((res: { errorMessage: string; error: number }) => {
            this._fail(res.error, res.errorMessage);
            this.reset();
        });
    }

    private createVideoAd(): AliyMiniprogram.RewardedAd {
        let videoAd = my.createRewardedAd({ adUnitId: this._adUnitId, multiton: false });
        /** 广告加载失败 */
        videoAd.onError((res: AliyMiniprogram.CallBack.Fail) => {
            this._fail?.(res.error, res.errorMessage);
            this.reset();
        });

        videoAd.onClose((res: { isEnded: boolean }) => {
            if ((res && res.isEnded) || res === undefined) {
                /** 广告播放完成 */
                this?._success();
                this.reset();
            } else {
                /** 中途退出，不发放奖励 */
                this?._fail(MiniErrorCode.AD_EXIT.code, MiniErrorCode.AD_EXIT.msg);
                this.reset();
            }
        });
        return videoAd;
    }

    /** 防止多次回调 */
    private reset(): void {
        this._success = null;
        this._fail = null;
    }
}
