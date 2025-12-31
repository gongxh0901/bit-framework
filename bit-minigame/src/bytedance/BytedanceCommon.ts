/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 字节跳动小游戏工具类
 */

import { warn } from "@gongxh/bit-core";
import { IMiniCommon } from "../interface/IMiniCommon";

export class BytedanceCommon implements IMiniCommon {
    private _launchOptions: BytedanceMiniprogram.LaunchParams = null;

    private _systemInfo: BytedanceMiniprogram.SystemInfo = null;
    private _envInfo: BytedanceMiniprogram.EnvInfo = null;

    /**
     * @internal
     */
    constructor() {
        this._launchOptions = tt.getLaunchOptionsSync();
    }

    /**
     * 获取冷启动参数
     */
    public getLaunchOptions(): BytedanceMiniprogram.LaunchParams {
        return this._launchOptions;
    }

    /**
     * 获取热启动参数
     */
    public getHotLaunchOptions(): BytedanceMiniprogram.LaunchParams {
        warn("字节跳动小游戏未提供热启动参数获取方式，请在 onShow 中获取");
        return null;
    }

    /**
     * 获取基础库版本号
     */
    public getLibVersion(): string {
        return this.getSystemInfo()?.SDKVersion || "0.0.1";
    }

    /** 
     * 宿主程序版本 (这里指今日头条、抖音等版本)
     */
    public getHostVersion(): string {
        return this.getSystemInfo()?.version || "0.0.1";
    }

    /**
     * 宿主 APP 名称。示例："Toutiao"
     * 见 [https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/system/system-information/tt-get-system-info-sync]
     */
    public getHostName(): string {
        return this.getSystemInfo()?.appName || "unknown";
    }

    /**
     * 获取运行平台
     */
    public getPlatform(): 'ios' | 'android' | 'ohos' | 'windows' | 'mac' | 'devtools' {
        return this.getSystemInfo().platform as ('ios' | 'android' | 'ohos' | 'windows' | 'mac' | 'devtools');
    }

    /**
     * 获取版本类型
     */
    public getEnvType(): 'release' | 'debug' {
        return this.getEnvInfo().microapp.envType == "production" ? "release" : "debug";
    }

    /**
     * 退出小程序
     */
    public exitMiniProgram(): void {
        tt.exitMiniProgram?.({});
    }

    public getScreenSize(): { width: number, height: number } {
        const systemInfo = this.getSystemInfo();
        return {
            width: systemInfo.screenWidth,
            height: systemInfo.screenHeight,
        };
    }

    /**
     * 复制到剪切板
     */
    public setClipboardData(text: string): void {
        tt.setClipboardData({
            data: text,
            fail: (res: { errMsg: string, errNo?: number }) => {
                warn(`复制到剪切板失败 errCode:${res.errNo} errMsg:${res.errMsg}`);
            }
        });
    }

    private getEnvInfo(): BytedanceMiniprogram.EnvInfo {
        if (this._envInfo) {
            return this._envInfo;
        }
        if (tt.getEnvInfoSync) {
            this._envInfo = tt.getEnvInfoSync();
            return this._envInfo;
        }
        warn("getEnvInfo 失败");
        return null;
    }

    private getSystemInfo(): BytedanceMiniprogram.SystemInfo {
        if (this._systemInfo) {
            return this._systemInfo;
        }
        if (tt.getSystemInfoSync) {
            this._systemInfo = tt.getSystemInfoSync();
            return this._systemInfo;
        }
        warn("getSystemInfo 失败");
        return null;
    }
}