/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 窗口管理类
 */

import { Screen } from "@gongxh/bit-core";
import { Color } from "cc";
import { GGraph } from "fairygui-cc";
import { IWindow } from "../interface/IWindow";
import { MetadataKey } from "../interface/type";
import { Window } from "../window/Window";
import { WindowBase } from "../window/WindowBase";
import { HeaderManager } from "./HeaderManager";
import { InfoPool } from "./InfoPool";
import { IPropsConfig, PropsHelper } from "./PropsHelper";
import { ResLoader } from "./ResLoader";
import { WindowGroup } from "./WindowGroup";

/**
 * 从窗口类型中提取 UserData 类型
 */
type ExtractUserData<T> = T extends Window<infer U, any> ? U : any;

/**
 * 从窗口构造函数中提取窗口实例类型
 */
type ExtractWindowInstance<T> = T extends new () => infer R ? R : never;

export class WindowManager {
    private static _bgAlpha: number = 0.75;
    private static _bgColor: Color = new Color(0, 0, 0, 0);

    /** @internal */
    private static _alphaGraph: GGraph = null; // 半透明的遮罩

    /** @internal */
    private static _groups: Map<string, WindowGroup> = new Map(); // 窗口组

    /** @internal */
    private static _groupNames: string[] = []; // 窗口组的名称列表

    /** @internal */
    private static _windows: Map<string, IWindow> = new Map(); // 所有窗口的引用

    /** @internal */
    public static get bgAlpha(): number {
        return this._bgAlpha;
    }

    /** @internal */
    public static set bgAlpha(value: number) {
        this._bgAlpha = value;
    }

    /**
     * 屏幕大小改变时 调用所有窗口的screenResize方法 (内部方法)
     * @internal
     */
    public static onScreenResize(): void {
        // 半透明遮罩适配
        if (this._alphaGraph) {
            this._alphaGraph.setPosition(Screen.ScreenWidth * 0.5, Screen.ScreenHeight * 0.5);
            this._alphaGraph.setSize(Screen.ScreenWidth, Screen.ScreenHeight, true);
        }
        // 所有窗口适配
        this._windows.forEach((window: IWindow) => {
            window._adapted();
        });
        // 所有header适配
        HeaderManager.onScreenResize();
    }

    /** 
     * 添加手动管理资源加载 和 卸载的包名
     * @param pkgName 包名
     */
    public static addManualPackage(pkgName: string): void {
        InfoPool.addManualPackage(pkgName);
    }

    /**
     * 提供一种特殊需求 用来手动设置包所在的 bundle名 以及包在bundle中的路径
     * @param name 窗口名称
     * @param bundleName bundle名 默认: resources
     * @param path 包在bundle中的路径 默认: ui目录
     */
    public static setPackageInfo(pkgName: string, bundleName: string = "resources", path: string = "ui"): void {
        if (bundleName !== "resources") {
            InfoPool.addBundleName(pkgName, bundleName);
        }
        if (path !== "ui") {
            InfoPool.addPackagePath(pkgName, path);
        }
    }

    /** 
     * 用于手动设置UI导出数据
     * @param config UI导出数据
     */
    public static setUIConfig(config: IPropsConfig): void {
        PropsHelper.setConfig(config as any);
    }

    /**
     * 设置UI包加载相关回调函数
     * @param callbacks 包含加载回调的对象
     * @param callbacks.showWaitWindow 显示加载等待窗的回调
     * @param callbacks.hideWaitWindow 隐藏加载等待窗的回调
     * @param callbacks.fail 打开窗口时资源加载失败的回调 code( 1:bundle加载失败 2:包加载失败 )
     */
    public static setPackageCallbacks(callbacks: {
        showWaitWindow: () => void;
        hideWaitWindow: () => void;
        fail: (windowName: string, code: 1 | 2, message: string) => void;
    }): void {
        ResLoader.setCallbacks(callbacks);
    }

    /**
     * 向窗口管理器添加一个窗口组 如果窗口组名称已存在，则抛出错误. (内部方法)
     * @param group 要添加的窗口组
     * @internal
     */
    public static addWindowGroup(group: WindowGroup): void {
        if (this._groups.has(group.name)) {
            throw new Error(`窗口组【${group.name}】已存在`);
        }
        this._groups.set(group.name, group);
        this._groupNames.push(group.name);
    }

    /**
     * 设置半透明遮罩
     * @param alphaGraph 半透明遮罩
     * @internal
     */
    public static setAlphaGraph(alphaGraph: GGraph): void {
        this._alphaGraph = alphaGraph;
    }

    /**
     * 异步打开一个窗口 (如果UI包的资源未加载, 会自动加载 可以配合 WindowManager.setPackageCallbacks一起使用)
     * @param 窗口类
     * @param userdata 用户数据
     */
    public static showWindow<T extends new () => Window<any, any>>(
        window: T,
        userdata?: ExtractUserData<ExtractWindowInstance<T>>
    ): Promise<ExtractWindowInstance<T>> {
        // 优先使用装饰器设置的静态属性，避免代码混淆后 constructor.name 变化
        const name = (window as any)[MetadataKey.originalName];
        if (!name) {
            throw new Error(`窗口【${window.name}】未注册，请使用 _uidecorator.uiclass 注册窗口`);
        }
        return this.showWindowByName(name, userdata) as Promise<ExtractWindowInstance<T>>;
    }

    /** 
     * 通过窗口名称打开一个窗口
     * @param name 窗口名称
     * @param userdata 用户数据
     * @internal
     */
    public static showWindowByName<T = any, U = any>(name: string, userdata?: T): Promise<IWindow<T, U>> {
        // 找到他所属的窗口组
        const info = InfoPool.get(name);
        const group = this.getWindowGroup(info.group);
        return group.showWindow<T, U>(info, userdata);
    }

    /**
     * 关闭一个窗口
     * @param ctor 窗口类
     */
    public static closeWindow<T extends new () => IWindow>(window: T): void {
        // 取到窗口的名称，优先使用装饰器设置的静态属性
        const name = (window as any)[MetadataKey.originalName];
        this.closeWindowByName(name);
    }

    /**
     * 通过窗口名称关闭一个窗口
     * @param name 窗口名称
     */
    public static closeWindowByName(name: string): void {
        if (!this.hasWindow(name)) {
            console.warn(`窗口不存在 ${name} 不需要关闭`);
            return;
        }
        const info = InfoPool.get(name);
        const group = this.getWindowGroup(info.group);
        group.removeWindow(name);

        // 调整半透明遮罩
        this.adjustAlphaGraph();

        // 找到最上层的窗口 调用toTop方法
        let topWindow = this.getTopWindow<IWindow, any>();
        if (topWindow && !topWindow.isTop()) {
            topWindow._toTop();
        }
    }

    /**
     * 是否存在窗口
     * @param name 窗口名称
     */
    public static hasWindow(name: string): boolean {
        return this._windows.has(name);
    }

    /**
     * 添加窗口
     * @param name 窗口名称
     * @param window 要添加的窗口对象，需实现 IWindow 接口。
     * @internal
     */
    public static addWindow(name: string, window: IWindow): void {
        this._windows.set(name, window);
    }

    /**
     * 移除窗口
     * @param name 窗口名称
     * @internal
     */
    public static removeWindow(name: string): void {
        this._windows.delete(name);
    }

    /**
     * 根据窗口名称获取窗口实例。
     * @template T 窗口类型，必须继承自IWindow接口。
     * @param name 窗口名称
     * @returns 如果找到窗口，则返回对应类型的窗口实例；否则返回null。
     */
    public static getWindow<T extends IWindow>(name: string): T | undefined {
        return this._windows.get(name) as T;
    }

    /**
     * 获取当前最顶层的窗口实例。
     * 默认会忽略掉忽略查询的窗口组
     * @returns {T | null} - 返回最顶层的窗口实例，如果没有找到则返回 null。
     */
    public static getTopWindow<T extends IWindow, U>(isAll: boolean = true): T | null {
        const names = this._groupNames;
        for (let i = names.length - 1; i >= 0; i--) {
            const group = this.getWindowGroup(names[i]);
            if (group.isIgnore && !isAll) {
                continue;
            }
            if (group.size === 0) {
                continue;
            }
            return group.getTopWindow() as T;
        }
        return null;
    }

    /**
     * 获取所有窗口组的名称列表（按层级顺序）
     * @returns 窗口组的名称列表
     */
    public static getGroupNames(): string[] {
        return this._groupNames;
    }
    /**
     * 根据给定的组名获取窗口组。如果组不存在，则抛出错误。
     * @param name 窗口组名称
     * @returns 返回找到的窗口组。
     */
    public static getWindowGroup(name: string): WindowGroup {
        if (this._groups.has(name)) {
            return this._groups.get(name);
        }
        throw new Error(`窗口组【${name}】不存在`);
    }

    /**
     * 关闭所有窗口
     * @param ignores 不关闭的窗口
     */
    public static closeAllWindow(ignores: IWindow[] = []): void {
        let len = this._groupNames.length;
        for (let i = len - 1; i >= 0; i--) {
            let group = this.getWindowGroup(this._groupNames[i]);
            group.closeAllWindow(ignores);
        }
        // 找到最上层的窗口 调用toTop方法
        let topWindow = this.getTopWindow<IWindow, any>();
        if (topWindow && !topWindow.isTop()) {
            topWindow._toTop();
        }
    }

    /**
     * 调整半透明遮罩的显示层级
     * 从上到下（从所有窗口组）查找第一个bgAlpha不为0的窗口，将遮罩放到该窗口下方
     * @internal
     */
    public static adjustAlphaGraph(): void {
        let topWindow: WindowBase = null;
        // 从后往前遍历窗口组（后面的窗口组层级更高）
        for (let i = this._groupNames.length - 1; i >= 0; i--) {
            const group = this._groups.get(this._groupNames[i]);
            if (group.size === 0) {
                continue;
            }
            // 在当前窗口组中从上到下查找第一个bgAlpha不为0的窗口
            for (let j = group.windowNames.length - 1; j >= 0; j--) {
                const name = group.windowNames[j];
                const win = WindowManager.getWindow<WindowBase>(name);
                if (win.bgAlpha > 0) {
                    topWindow = win;
                    break;
                }
            }
            if (topWindow) {
                break;
            }
        }
        // 如果找到了需要遮罩的窗口
        if (topWindow) {
            // 获取窗口组的根节点
            const parent = topWindow.parent;
            // 将遮罩设置到目标窗口的下方
            const windowIndex = parent.getChildIndex(topWindow);
            let gIndex = 0;
            // 确保遮罩在目标窗口组的根节点下
            if (this._alphaGraph.parent !== parent) {
                this._alphaGraph.removeFromParent();
                parent.addChild(this._alphaGraph);
                gIndex = parent.numChildren - 1;
            } else {
                gIndex = parent.getChildIndex(this._alphaGraph);
            }
            let newIndex = gIndex >= windowIndex ? windowIndex : windowIndex - 1;
            parent.setChildIndex(this._alphaGraph, newIndex);
            // 显示遮罩
            this._alphaGraph.visible = true;

            // 半透明遮罩绘制
            this._bgColor.a = topWindow.bgAlpha * 255;
            this._alphaGraph.clearGraphics();
            this._alphaGraph.drawRect(0, this._bgColor, this._bgColor);
        } else {
            // 没有找到需要遮罩的窗口，隐藏遮罩
            this._alphaGraph.visible = false;
        }
    }


    /**
     * 释放不再使用中的自动加载的UI资源
     * 针对在 UIModule 中设置了不自动释放资源的场景
     */
    public static releaseUnusedRes(): void {
        ResLoader.releaseUnusedRes();
    }
}
