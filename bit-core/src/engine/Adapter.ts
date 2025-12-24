/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 适配用的类
 */

import { ResolutionPolicy, view } from "cc";
import { Size } from "../header";
import { debug } from "../log";
import { Screen } from "./Screen";

export abstract class Adapter {
    /** 适配器实例 */
    static instance: Adapter;

    private listeners: ((...args: any) => void)[] = [];

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
    public init() {
        Adapter.instance = this;
        debug("初始化适配器");
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
        Screen.SafeAreaHeight = 60;
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
        if (isDesignLandscape) {
            // 横屏
            /** 安全区的宽度 */
            Screen.SafeWidth = Screen.ScreenWidth - Screen.SafeAreaHeight * 2;
            /** 安全区的高度 */
            Screen.SafeHeight = Screen.ScreenHeight;
        } else {
            // 竖屏
            /** 安全区的宽度 */
            Screen.SafeWidth = Screen.ScreenWidth;
            /** 安全区的高度 */
            Screen.SafeHeight = Screen.ScreenHeight - Screen.SafeAreaHeight * 2;
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
        debug(`安全区域高度: ${Screen.SafeAreaHeight}`);
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