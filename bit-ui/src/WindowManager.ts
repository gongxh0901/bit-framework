/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 窗口管理类
 */

import { Screen } from "@gongxh/bit-core";
import { Color } from "cc";
import { GGraph } from "fairygui-cc";
import { InfoPool } from "./core/InfoPool";
import { WindowGroup } from "./core/WindowGroup";
import { MetadataKey } from "./header";
import { IWindow } from "./interface/IWindow";
import { IPropsConfig, PropsHelper } from "./utils/PropsHelper";
import { HeaderBase } from "./window/HeaderBase";
import { WindowBase } from "./window/WindowBase";

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
    private _headers: Map<string, HeaderBase> = new Map(); // 窗口顶部资源栏

    /** @internal */
    public static get bgAlpha(): number {
        return this._bgAlpha;
    }

    /** @internal */
    public static set bgAlpha(value: number) {
        this._bgAlpha = value;
    }

    // /** 配置UI包的一些信息 (可以不配置 完全手动管理) */
    // public static initPackageConfig(res: IPackageConfigRes): void {
    //     // this._resPool.initPackageConfig(res);
    // }

    /**
     * 屏幕大小改变时 调用所有窗口的screenResize方法 (内部方法)
     * @internal
     */
    public static onScreenResize(): void {
        this._windows.forEach((window: IWindow) => {
            window._adapted();
        });
        if (this._alphaGraph) {
            this._alphaGraph.setPosition(Screen.ScreenWidth * 0.5, Screen.ScreenHeight * 0.5);
            this._alphaGraph.setSize(Screen.ScreenWidth, Screen.ScreenHeight, true);
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
            const wIndex = parent.getChildIndex(topWindow);
            let gIndex = 0;
            // 确保遮罩在目标窗口组的根节点下
            if (this._alphaGraph.parent !== parent) {
                this._alphaGraph.removeFromParent();
                parent.addChild(this._alphaGraph);
                gIndex = parent.numChildren;
            } else {
                gIndex = parent.getChildIndex(this._alphaGraph);
            }
            let newIndex = gIndex > wIndex ? wIndex : wIndex - 1;
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
     * 异步打开一个窗口 (如果UI包的资源未加载, 会自动加载 配合 WindowManager.initPackageConfig一起使用)
     * @param 窗口类
     * @param userdata 用户数据
     */
    public static showWindow<T extends new () => IWindow>(window: T, userdata?: any): Promise<IWindow> {
        // 优先使用装饰器设置的静态属性，避免代码混淆后 constructor.name 变化
        const name = (window as any)[MetadataKey.originalName];
        return this.showWindowByName(name, userdata);
    }

    /** 
     * 通过窗口名称打开一个窗口
     * @param name 窗口名称
     * @param userdata 用户数据
     * @internal
     */
    public static showWindowByName<T extends IWindow>(name: string, userdata?: any): Promise<T> {
        // 找到他所属的窗口组
        const info = InfoPool.get(name);
        const group = this.getWindowGroup(info.group);
        return group.showWindow<T>(info, userdata);
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
    public static getWindow<T extends IWindow>(name: string): T | null {
        return this._windows.get(name) as T;
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
    }

    // /**
    //  * 显示指定名称的窗口，并传递可选的用户数据。(用于已加载过资源的窗口)
    //  * @param windowName - 窗口的名称。
    //  * @param userdata - 可选参数，用于传递给窗口的用户数据。
    //  */
    // public static showWindowIm(windowName: string, userdata?: any): void {
    //     const info = this._resPool.get(windowName);
    //     const windowGroup = this.getWindowGroup(info.group);
    //     this._resPool.addResRef(windowName);
    //     windowGroup.showWindow(info, userdata);
    // }

    // /**
    //  * 关闭窗口
    //  * @param windowName 窗口名
    //  */
    // public static closeWindow(windowName: string): void {
    //     if (!this._windows.has(windowName)) {
    //         console.warn(`窗口不存在 ${windowName} 不需要关闭`);
    //         return;
    //     }
    //     // 先在窗口组中移除
    //     let info = this._resPool.get(windowName);
    //     const windowGroup = this.getWindowGroup(info.group);
    //     windowGroup._removeWindow(windowName);
    //     // 窗口组中没有窗口了
    //     if (windowGroup.size == 0) {
    //         let index = this._queryGroupNames.indexOf(windowGroup.name);
    //         if (index > 0 && windowGroup.name == this.getTopGroupName()) {
    //             do {
    //                 const groupName = this._queryGroupNames[--index];
    //                 let group = this.getWindowGroup(groupName);
    //                 if (group.size > 0) {
    //                     this.getWindow(group.getTopWindowName())._recover();
    //                     break;
    //                 }
    //             } while (index >= 0);
    //         }
    //     }
    // }

    // /**
    //  * 获取当前最顶层的窗口实例。
    //  * @template T - 窗口实例的类型，必须继承自 IWindow 接口。
    //  * @returns {T | null} - 返回最顶层的窗口实例，如果没有找到则返回 null。
    //  * @description 该方法会遍历所有窗口组，找到最顶层的窗口并返回其实例。
    //  */
    // public static getTopWindow<T extends IWindow>(): T | null {
    //     let len = this._queryGroupNames.length;
    //     for (let i = len; i > 0;) {
    //         let group = this.getWindowGroup(this._queryGroupNames[--i]);
    //         if (group.size > 0) {
    //             return this.getWindow<T>(group.getTopWindowName());
    //         }
    //     }
    //     return null;
    // }



    // /**
    //  * 是否存在指定的窗口
    //  * @param name 窗口的名称。
    //  */
    // public static hasWindow(name: string): boolean {
    //     return this._windows.has(name);
    // }


    // /**
    //  * 获取当前顶层窗口组的名称。
    //  * 返回第一个包含至少一个窗口的窗口组名称。(该方法只检查不忽略查询的窗口组)
    //  * 如果没有找到任何包含窗口的组，则返回空字符串。
    //  */
    // public static getTopGroupName(): string {
    //     let len = this._queryGroupNames.length;
    //     for (let i = len - 1; i >= 0; i--) {
    //         let name = this._queryGroupNames[i];
    //         let group = this._groups.get(name);
    //         if (group.size > 0) {
    //             return name;
    //         }
    //     }
    //     return "";
    // }
}
