/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 支付宝小游戏工具类
 */

import { warn } from "@gongxh/bit-core";
import { IMiniCommon } from "../interface/IMiniCommon";


export class AlipayCommon implements IMiniCommon {
    private _launchOptions: AliyMiniprogram.AppLaunchOptions = null;

    private _systemInfo: getSystemInfoSyncReturn = null;
    private _accountInfo: AliyMiniprogram.AccountInfo = null;

    /**
     * @internal
     */
    constructor() {
        this._launchOptions = my.getLaunchOptionsSync();
    }

    public getLaunchOptions(): AliyMiniprogram.AppLaunchOptions {
        return this._launchOptions;
    }

    public getHotLaunchOptions(): Record<string, any> {
        return my.getEnterOptionsSync();
    }

    /** 
     * 获取基础库版本号
     */
    public getLibVersion(): string {
        return my.SDKVersion;
    }

    /** 
     * 获取运行平台 合法值（ios | android | ohos | windows | mac | devtools）
     */
    public getPlatform(): 'ios' | 'android' | 'ohos' | 'windows' | 'mac' | 'devtools' | 'iPad' {
        let platform = this.getSystemInfo().platform;
        if (platform === 'iOS' || platform == 'iPhone OS') {
            return 'ios';
        } else if (platform.indexOf('iPad') > 0) {
            return 'iPad';
        }
        return platform as ('ios' | 'android' | 'ohos' | 'windows' | 'mac' | 'devtools' | 'iPad');
    }

    /**
     * 获取版本类型
     */
    public getEnvType(): 'release' | 'debug' {
        return this.getAccountInfo().miniProgram.envVersion == "release" ? "release" : "debug";
    }

    /** 
     * 宿主程序版本 (这里指支付宝 或其他宿主 版本)
     */
    public getHostVersion(): string {
        return this.getSystemInfo().version;
    }

    /**
     * 获取屏幕尺寸
     */
    public getScreenSize(): { width: number, height: number } {
        const systemInfo = this.getSystemInfo();
        return {
            width: systemInfo.windowWidth,
            height: systemInfo.windowHeight
        }
    }

    /** 
     * 退出当前小程序 (必须通过点击事件触发才能调用成功)
     */
    public exitMiniProgram(): void {
        my.exitProgram();
    }

    /**
     * 复制到剪切板
     */
    public setClipboardData(text: string): void {
        my.setClipboard({
            text: text,
            fail: (res: AliyMiniprogram.CallBack.Fail) => {
                warn(`复制到剪切板失败 code:${res.error} msg:${res.errorMessage}`);
            }
        });
    }

    private getSystemInfo(): getSystemInfoSyncReturn {
        if (this._systemInfo) {
            return this._systemInfo;
        }
        if (my.getSystemInfoSync) {
            this._systemInfo = my.getSystemInfoSync();
            return this._systemInfo;
        }
        warn("getSystemInfo 失败");
        return null;
    }

    private getAccountInfo(): AliyMiniprogram.AccountInfo {
        if (this._accountInfo) {
            return this._accountInfo;
        }
        if (my.getAccountInfoSync) {
            this._accountInfo = my.getAccountInfoSync();
            return this._accountInfo;
        }
        warn("getAccountInfo 失败");
        return null;
    }
}