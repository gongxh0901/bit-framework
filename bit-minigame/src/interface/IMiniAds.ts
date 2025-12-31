/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 小游戏广告接口
 */

/** 激励视频广告 */
export interface IMiniRewardAds {
    /**
     * 广告初始化
     * @param adUnitId 广告位ID
     * 不启用多广告实例
     */
    init(adUnitId: string): void;

    /**
     * 显示广告
     */
    showAds(res: { success: () => void, fail: (errCode: number, errMsg: string) => void }): void;
}