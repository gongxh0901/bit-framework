/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 微信小游戏工具类
 */

import { warn } from "@gongxh/bit-core";
import { IMiniCommon } from "../interface/IMiniCommon";

export class WechatCommon implements IMiniCommon {
    private _launchOptions: WechatMiniprogram.LaunchOptionsApp = null;
    private _accountInfo: WechatMiniprogram.AccountInfo = null;

    /** 基础库 2.25.3 开始支持的信息 */
    private _appBaseInfo: WechatMiniprogram.AppBaseInfo = null;
    private _deviceInfo: WechatMiniprogram.DeviceInfo = null;
    private _windowInfo: WechatMiniprogram.WindowInfo = null;

    /** 从基础库 2.20.1 开始，本接口停止维护 */
    private _systemInfo: WechatMiniprogram.SystemInfo = null;

    /**
     * @internal
     */
    constructor() {
        // 获取冷启动参数
        this._launchOptions = wx.getLaunchOptionsSync();
    }

    /**
     * 获取冷启动参数
     */
    public getLaunchOptions(): WechatMiniprogram.LaunchOptionsApp {
        return this._launchOptions;
    }

    /**
     * 获取热启动参数
     */
    public getHotLaunchOptions(): WechatMiniprogram.LaunchOptionsApp {
        return wx.getEnterOptionsSync();
    }

    /**
     * 获取基础库版本号
     */
    public getLibVersion(): string {
        return this.getAppBaseInfo()?.SDKVersion || "0.0.1";
    }

    /** 
     * 宿主程序版本 (这里指微信版本)
     */
    public getHostVersion(): string {
        return this.getAppBaseInfo()?.version || "0.0.1";
    }

    /**
     * 获取运行平台
     */
    public getPlatform(): 'ios' | 'android' | 'ohos' | 'windows' | 'mac' | 'devtools' {
        return this.getDeviceInfo().platform as ('ios' | 'android' | 'ohos' | 'windows' | 'mac' | 'devtools');
    }

    /**
     * 获取版本类型
     */
    public getEnvType(): 'release' | 'debug' {
        return this.getVersionInfo().miniProgram.envVersion == "release" ? "release" : "debug";
    }

    /**
     * 退出小程序
     */
    public exitMiniProgram(): void {
        wx.exitMiniProgram?.();
    }

    public getScreenSize(): { width: number, height: number } {
        const windowInfo = this.getWindowInfo();
        return {
            width: windowInfo.screenWidth,
            height: windowInfo.screenHeight,
        };
    }

    /**
     * 复制到剪切板
     */
    public setClipboardData(text: string): void {
        wx.setClipboardData({
            data: text,
            fail: (res: WechatMiniprogram.GeneralCallbackResult) => {
                warn("复制到剪切板失败", res.errMsg);
            }
        });
    }

    private getAppBaseInfo(): WechatMiniprogram.AppBaseInfo {
        if (this._appBaseInfo) {
            return this._appBaseInfo;
        }
        if (wx.getAppBaseInfo) {
            this._appBaseInfo = wx.getAppBaseInfo();
            return this._appBaseInfo;
        }
        const systemInfo = this.getSystemInfo();
        if (systemInfo) {
            this._appBaseInfo = {
                SDKVersion: systemInfo.SDKVersion,
                enableDebug: systemInfo.enableDebug,
                host: systemInfo.host,
                language: systemInfo.language,
                version: systemInfo.version,
                theme: systemInfo.theme,
            }
            return this._appBaseInfo;
        }
        warn("getAppBaseInfo 失败");
        return null;
    }

    private getVersionInfo(): WechatMiniprogram.AccountInfo {
        if (this._accountInfo) {
            return this._accountInfo;
        }
        if (wx.getAccountInfoSync) {
            this._accountInfo = wx.getAccountInfoSync();
            return this._accountInfo;
        }
        warn("getVersionInfo 失败");
        return {
            miniProgram: {
                envVersion: "release",
                appId: "unknown",
                version: "0.0.1",
            },
            plugin: {
                appId: "unknown",
                version: "0.0.1",
            },
        };
    }

    public getDeviceInfo(): WechatMiniprogram.DeviceInfo {
        if (this._deviceInfo) {
            return this._deviceInfo;
        }
        if (wx.getDeviceInfo) {
            this._deviceInfo = wx.getDeviceInfo();
            return this._deviceInfo;
        }
        const systemInfo = this.getSystemInfo();
        if (systemInfo) {
            this._deviceInfo = {
                abi: "unknown",
                benchmarkLevel: systemInfo.benchmarkLevel,
                brand: systemInfo.brand,
                cpuType: "unknown",
                deviceAbi: "unknown",
                memorySize: "unknown",
                model: systemInfo.model,
                platform: systemInfo.platform,
                system: systemInfo.system,
            }
            return this._deviceInfo;
        }
        warn("getDeviceInfo 失败");
        return null;
    }

    public getWindowInfo(): WechatMiniprogram.WindowInfo {
        if (this._windowInfo) {
            return this._windowInfo;
        }
        if (wx.getWindowInfo) {
            this._windowInfo = wx.getWindowInfo();
            return this._windowInfo;
        }
        const systemInfo = this.getSystemInfo();
        if (systemInfo) {
            this._windowInfo = {
                pixelRatio: systemInfo.pixelRatio,
                safeArea: systemInfo.safeArea,
                screenHeight: systemInfo.screenHeight,
                screenTop: 0,
                screenWidth: systemInfo.screenWidth,
                statusBarHeight: systemInfo.statusBarHeight,
                windowHeight: systemInfo.windowHeight,
                windowWidth: systemInfo.windowWidth,
            }
        }
        warn("getWindowInfo 失败");
        return null;
    }

    private getSystemInfo(): WechatMiniprogram.SystemInfo {
        if (this._systemInfo) {
            return this._systemInfo;
        }
        if (wx.getSystemInfoSync) {
            this._systemInfo = wx.getSystemInfoSync();
            return this._systemInfo;
        }
        warn("getSystemInfo 失败");
        return null;
    }
}