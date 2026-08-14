/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 适配用的类
 */

import { ResolutionPolicy, view } from "cc";
import { Size } from "../header";
import { debug } from "../utils/log";
import { Screen } from "./Screen";

/** 长边/短边超过此值才应用安全区，否则四边清零 */
const SAFE_AREA_ASPECT_THRESHOLD = 16 / 9;

/** 适配器初始化配置 */
export interface IAdapterConfig {
    /** 顶部安全区（竖屏用；横屏时左右对称使用此值） */
    safeAreaTop: number;
    /** 底部安全区（仅竖屏） */
    safeAreaBottom: number;
}

export abstract class Adapter {
    /** 适配器实例 */
    static instance: Adapter;
    /**
     * 监听器
     * @internal
     */
    private listeners: ((...args: any) => void)[] = [];

    /** 配置的顶部安全区 */
    private safeAreaTop: number = 60;
    /** 配置的底部安全区 */
    private safeAreaBottom: number = 0;

    /**
     * 添加屏幕尺寸发生变化的监听
     * @param listener 监听器
     */
    public addResizeListener(listener: (...args: any) => void): void {
        this.listeners.push(listener);
    }

    /**
     * 移除屏幕尺寸发生变化的监听
     * @param listener 监听器
     */
    public removeResizeListener(listener: (...args: any) => void): void {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    /** 
     * 初始化适配器
     * @internal
     */
    public init(config?: IAdapterConfig) {
        Adapter.instance = this;
        debug("初始化适配器");
        if (config) {
            this.safeAreaTop = config.safeAreaTop;
            this.safeAreaBottom = config.safeAreaBottom;
        }
        // 设计尺寸 不会变化
        let designSize = this.getDesignSize();
        Screen.DesignHeight = designSize.height;
        Screen.DesignWidth = designSize.width;
        view.setDesignResolutionSize(Screen.DesignWidth, Screen.DesignHeight, ResolutionPolicy.SHOW_ALL);

        this.resize();
        this.registerListener((...args: any) => {
            debug("屏幕发生变化", ...args);
            this.resize();

            // 通知所有监听器
            for (const listener of this.listeners) {
                listener(...args);
            }
        });
    }

    /** 
     * 调整屏幕尺寸
     * @internal
     */
    protected resize(): void {
        // 屏幕像素尺寸
        const winSize = this.getScreenSize();
        const isDesignLandscape = Screen.DesignWidth > Screen.DesignHeight;
        const isLandscape = winSize.width > winSize.height;
        if (isDesignLandscape == isLandscape) {
            Screen.ScreenWidth = winSize.width;
            Screen.ScreenHeight = winSize.height;
        } else {
            Screen.ScreenWidth = winSize.height;
            Screen.ScreenHeight = winSize.width;
        }

        const longSide = Math.max(Screen.ScreenWidth, Screen.ScreenHeight);
        const shortSide = Math.min(Screen.ScreenWidth, Screen.ScreenHeight);
        const applySafeArea = shortSide > 0 && (longSide / shortSide) > SAFE_AREA_ASPECT_THRESHOLD;
        const top = applySafeArea ? this.safeAreaTop : 0;
        const bottom = applySafeArea ? this.safeAreaBottom : 0;

        if (isDesignLandscape) {
            // 横屏：无法区分左/右朝向，左右对称都用顶部 inset
            Screen.SafeAreaTop = 0;
            Screen.SafeAreaBottom = 0;
            Screen.SafeAreaLeft = top;
            Screen.SafeAreaRight = top;
            Screen.SafeWidth = Screen.ScreenWidth - Screen.SafeAreaLeft * 2;
            Screen.SafeHeight = Screen.ScreenHeight;
        } else {
            // 竖屏：顶部/底部可不相等
            Screen.SafeAreaTop = top;
            Screen.SafeAreaBottom = bottom;
            Screen.SafeAreaLeft = 0;
            Screen.SafeAreaRight = 0;
            Screen.SafeWidth = Screen.ScreenWidth;
            Screen.SafeHeight = Screen.ScreenHeight - Screen.SafeAreaTop - Screen.SafeAreaBottom;
        }
        this.printScreen();
    }

    /** 
     * 打印屏幕信息
     * @internal
     */
    private printScreen() {
        debug(`设计分辨率: ${Screen.DesignWidth}x${Screen.DesignHeight}`);
        debug(`屏幕分辨率: ${Screen.ScreenWidth}x${Screen.ScreenHeight}`);
        debug(`安全区 inset: top=${Screen.SafeAreaTop} bottom=${Screen.SafeAreaBottom} left=${Screen.SafeAreaLeft} right=${Screen.SafeAreaRight}`);
        debug(`安全区宽高: ${Screen.SafeWidth}x${Screen.SafeHeight}`);
    }

    /**
     * 获取屏幕尺寸
     * @abstract 子类实现
     * @returns {Size}
     * @internal
     */
    protected abstract getScreenSize(): Size;

    /**
     * 获取设计尺寸
     * @abstract 子类实现
     * @returns {Size}
     * @internal
     */
    protected abstract getDesignSize(): Size;

    /**
     * 注册尺寸发生变化的监听器
     * @abstract 子类实现
     * @param listener 监听器
     * @internal
     */
    protected abstract registerListener(listener: (...args: any) => void): void;
}
