/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 平台相关
 */

import { sys } from "cc";
import { debug } from "../utils/log";

export enum PlatformType {
    Android = 1,
    IOS = 2,
    HarmonyOS = 3,
    /** 微信小游戏 */
    WX = 4,
    /** 支付宝小游戏 */
    Alipay = 5,
    /** 字节小游戏 */
    Bytedance = 6,
    /** 华为快游戏 */
    HuaweiQuick = 7,
    /** 其他都为Browser */
    Browser = 1001,
}

export class Platform {
    /**
     * 是否为原生平台
     * @type {boolean}
     */
    public static isNative: boolean = false;

    /**
     * 是否为移动平台
     * @type {boolean}
     */
    public static isMobile: boolean = false;

    /**
     * 是否为原生移动平台
     * @type {boolean}
     */
    public static isNativeMobile: boolean = false;

    /**
     * 是否为安卓平台
     * @type {boolean}
     */
    public static isAndroid: boolean = false;

    /**
     * 是否为IOS平台
     * @type {boolean}
     */
    public static isIOS: boolean = false;

    /**
     * 是否为HarmonyOS平台
     * @type {boolean}
     */
    public static isHarmonyOS: boolean = false;

    /**
     * 是否为微信小游戏
     * @type {boolean}
     */
    public static isWX: boolean = false;

    /**
     * 是否为支付宝小游戏
     * @type {boolean}
     */
    public static isAlipay: boolean = false;

    /**
     * 是否为字节小游戏
     * @type {boolean}
     */
    public static isBytedance: boolean = false;

    /** 
     * 是否是华为快游戏
     * @type {boolean}
     */
    public static isHuaweiQuick: boolean = false;

    /**
     * 是否为浏览器
     * @type {boolean}
     */
    public static isBrowser: boolean = false;

    /**
     * 平台类型
     * @type {PlatformType}
     */
    public static platform: PlatformType;

    /**
     * 设备ID
     * @type {string}
     */
    public static deviceId: string;
}

/**
 * 平台初始化器
 * @internal
 */
export class PlatformInitializer {
    constructor() {
        this.initPlatform();
    }

    /**
     * 初始化平台
     * @internal
     */
    private initPlatform(): void {
        // 处理平台判断
        Platform.isNative = sys.isNative;
        Platform.isMobile = sys.isMobile;
        Platform.isNativeMobile = sys.isNative && sys.isMobile;

        switch (sys.os) {
            case sys.OS.ANDROID:
                Platform.isAndroid = true;
                debug("系统类型 Android");
                break;
            case sys.OS.IOS:
                Platform.isIOS = true;
                debug("系统类型 IOS");
                break;
            case sys.OS.OPENHARMONY:
                Platform.isHarmonyOS = true;
                debug("系统类型 HarmonyOS");
                break;
            default:
                break;
        }

        switch (sys.platform) {
            case sys.Platform.WECHAT_GAME:
                Platform.isWX = true;
                Platform.platform = PlatformType.WX;
                break;
            case sys.Platform.ALIPAY_MINI_GAME:
                Platform.isAlipay = true;
                Platform.platform = PlatformType.Alipay;
                break;
            case sys.Platform.BYTEDANCE_MINI_GAME:
                Platform.isBytedance = true;
                Platform.platform = PlatformType.Bytedance;
                break
            case sys.Platform.HUAWEI_QUICK_GAME:
                Platform.isHuaweiQuick = true;
                Platform.platform = PlatformType.HuaweiQuick;
                break;
            default:
                // 其他都设置为浏览器
                Platform.isBrowser = true;
                Platform.platform = PlatformType.Browser;
                break;
        }
        debug(`platform: ${PlatformType[Platform.platform]}`);
    }
}