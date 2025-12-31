/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 小游戏一些通用方法
 */

export interface IMiniCommon {
    /**
     * 获取冷启动参数
     */
    getLaunchOptions(): Record<string, any>;
    /**
     * 获取热启动参数
     */
    getHotLaunchOptions(): Record<string, any>;

    /** 
     * 获取基础库版本号
     */
    getLibVersion(): string;

    /** 
     * 获取运行平台 合法值（ios | android | ohos | windows | mac | devtools | iPad）
     * 微信上 iPad 会返回 ios
     */
    getPlatform(): 'ios' | 'android' | 'ohos' | 'windows' | 'mac' | 'devtools' | 'iPad';

    /**
     * 获取运行类型
     * 合法值（release | debug）
     */
    getEnvType(): 'release' | 'debug';

    /** 
     * 宿主程序版本 (这里指微信、抖音、支付宝版本)
     */
    getHostVersion(): string;

    /**
     * 获取屏幕尺寸
     */
    getScreenSize(): { width: number, height: number };

    /** 
     * 退出小程序
     */
    exitMiniProgram(): void;

    /**
     * 复制到剪切板
     */
    setClipboardData(text: string): void;
}