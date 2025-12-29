/**
 * @Author: Gongxh
 * @Date: 2024-12-08
 * @Description: 窗口组 (在同一个窗口容器的上的窗口)
 */

import { GComponent, UIPackage } from "fairygui-cc";
import { WindowType } from "../header";
import { IWindow } from "../interface/IWindow";
import { WindowBase } from "../window/WindowBase";
import { PropsHelper } from "./PropsHelper";
import { ResLoader } from "./ResLoader";
import { IWindowInfo } from "./types";
import { WindowManager } from "./WindowManager";

export class WindowGroup {
    /** @internal */
    private _name: string = ""; // 窗口组的名字

    /** @internal */
    private _root: GComponent; // 窗口组的根节点

    /** @internal */
    private _ignore: boolean = false; // 忽略查询

    /** @internal */
    private _swallowTouch: boolean = false; // 吞噬触摸事件

    /** @internal */
    private _windowNames: string[] = []; // 窗口名列表 顺序为窗口显示的层级 (最后一个显示在最上层)

    /**
     * 获取窗口组的名称。
     * @returns {string} 窗口组的名称。
     */
    public get name(): string { return this._name; }

    /** 获取窗口组的根节点 */
    public get root(): GComponent { return this._root; }

    /**
     * 获取当前窗口组中窗口的数量。
     * @returns 窗口数量
     */
    public get size(): number { return this._windowNames.length; }

    /** 获取窗口组中窗口的名称列表 */
    public get windowNames(): string[] { return this._windowNames; }

    /**
     * 获取是否忽略查询的状态。
     * @returns {boolean} 如果忽略查询，则返回 true，否则返回 false。
     */
    public get isIgnore(): boolean { return this._ignore; }

    /**
     * 实例化 
     * @param name 组名
     * @param root 窗口组的根节点 一个fgui的组件
     * @param ignoreQuery 是否忽略顶部窗口查询
     * @param swallowTouch 是否吞掉触摸事件
     * @param bgAlpha 半透明遮罩的透明度
     * @internal
     */
    constructor(name: string, root: GComponent, ignoreQuery: boolean, swallowTouch: boolean) {
        this._name = name;
        this._root = root;
        this._ignore = ignoreQuery;
        this._swallowTouch = swallowTouch;
        this._windowNames = [];
    }

    /**
     * 显示一个窗口
     * @param info 窗口信息
     * @param userdata 
     * @internal
     */
    public showWindow<T = any, U = any>(info: IWindowInfo, userdata?: T): Promise<IWindow<T, U>> {
        return new Promise((resolve, reject) => {
            let lastTopWindow = WindowManager.getTopWindow();

            if (WindowManager.hasWindow(info.name)) {
                const window = WindowManager.getWindow(info.name);
                this.showAdjustment(window, userdata);

                if (lastTopWindow && lastTopWindow.name !== window.name) {
                    lastTopWindow._toBottom();
                }
                window._toTop();

                resolve(window);
            } else {
                ResLoader.loadWindowRes(info.name).then(() => {
                    const window = this.createWindow(info.pkgName, info.name);
                    this.showAdjustment(window, userdata);

                    if (lastTopWindow && lastTopWindow.name !== window.name) {
                        lastTopWindow._toBottom();
                    }

                    resolve(window);
                }).catch((err: Error) => {
                    reject(new Error(`窗口【${info.name}】打开失败: ${err.message}`));
                });
            }
        });
    }

    /**
     * show一个界面后的调整
     * @param window 
     * @internal
     */
    private showAdjustment(window: IWindow, userdata?: any): void {
        // 如果窗口不在最上层 则调整层级
        this.moveWindowToTop(window);
        // 最后再调用窗口的show方法
        window._show(userdata);
        // 调整半透明遮罩
        WindowManager.adjustAlphaGraph();
    }

    /**
     * 将指定名称的窗口移动到窗口组的最顶层。
     * @param name 窗口的名称。
     * @internal
     */
    private moveWindowToTop(window: IWindow): void {
        if (this._windowNames[this.size - 1] !== window.name) {
            const index = this._windowNames.indexOf(window.name);
            this._windowNames.splice(index, 1);
            // 放到数组的末尾
            this._windowNames.push(window.name);

            // 调整了显示层级, 根据最上层的窗口的type, 处理上一个窗口的关闭状态
            this._processWindowCloseStatus(window);
        }
        // 调整窗口的显示层级
        window.setDepth(this._root.numChildren - 1);

        // 处理窗口显示和隐藏状态
        this.processWindowHideStatus(this.size - 1);
    }

    /**
     * 根据窗口名创建窗口 并添加到显示节点
     * @param windowName 窗口名
     * @internal
     */
    private createWindow(pkg: string, name: string): WindowBase {
        let window = UIPackage.createObject(pkg, name) as WindowBase;
        window.name = name;
        PropsHelper.serializeProps(window, pkg);
        window._init(this._swallowTouch);
        window._adapted();
        // 添加到显示节点
        this._root.addChild(window);
        WindowManager.addWindow(name, window);
        // 窗口组之前没有窗口, 显示窗口组节点
        if (this.size === 0) {
            this._root.visible = true;
        }
        this._windowNames.push(name);
        return window;
    }

    /**
     * 处理index下层窗口的隐藏状态的私有方法。递归调用
     * @param index - 窗口索引
     */
    private processWindowHideStatus(index: number): void {
        if (index < 0) {
            return;
        }
        let window = WindowManager.getWindow(this._windowNames[index]);
        // 如果当前是当前组中的最后一个窗口并且当前窗口是隐藏状态 则恢复隐藏
        if (index == this.size - 1 && !window.isShowing()) {
            window._showFromHide();
        }
        // 已经是第一个窗口了
        if (index == 0) {
            return;
        }
        if (window.type === WindowType.HideAll) {
            // 隐藏所有
            for (let i = index - 1; i >= 0; i--) {
                let name = this._windowNames[i];
                const window = WindowManager.getWindow(name);
                window.isShowing() && window._hide();
            }
            return;
        } else if (window.type === WindowType.HideOne) {
            // 隐藏上一个
            let prevWindowName = this._windowNames[index - 1];
            let prevWindow = WindowManager.getWindow(prevWindowName);
            prevWindow.isShowing() && prevWindow._hide();
        } else {
            // 如果上一个窗口被隐藏了 需要恢复显示
            let prevWindowName = this._windowNames[index - 1];
            let prevWindow = WindowManager.getWindow(prevWindowName);
            !prevWindow.isShowing() && prevWindow._showFromHide();
        }
        this.processWindowHideStatus(index - 1);
    }

    /**
     * 根据传入窗口的关闭类型, 处理上一个窗口或者所有窗口的关闭
     * @param window 新创建的窗口
     * @internal
     */
    private _processWindowCloseStatus(window: IWindow): void {
        // 新创建窗口 如果需要关闭窗口或者关闭所有窗口 处理窗口的关闭
        while (this.size > 0) {
            let name = this._windowNames.pop();
            WindowManager.getWindow(name)._close();
            WindowManager.removeWindow(name);
            if (window.type === WindowType.CloseOne) {
                // 关闭一个窗口 结束循环
                break;
            }
        }
    }

    /**
     * 移除指定名称的窗口。
     * @param name 窗口的名称。
     * @internal
     */
    public removeWindow(name: string): void {
        // let lastIndex = this.size - 1;
        let window = WindowManager.getWindow(name);

        window._close();

        // 先删除窗口组中记录的窗口名称
        let index = this._windowNames.lastIndexOf(name);
        this._windowNames.splice(index, 1);

        // 删除WindowManager中记录的窗口
        WindowManager.removeWindow(name);

        // 释放资源
        ResLoader.unloadWindowRes(name);

        if (this.size == 0) {
            this._root.visible = false;
        } else {
            this.processWindowHideStatus(this.size - 1);
        }
        //TODO:: 调整header
    }

    // /**
    //  * 处理header的显示状态 并调整层级
    //  * @internal
    //  */
    // private _processHeaderStatus(): void {
    //     // 找到第一个要显示的header
    //     let firstHeader: HeaderBase = null;
    //     let firstWindow: IWindow = null;
    //     let index = this.size - 1;
    //     for (let i = this.size - 1; i >= 0; --i) {
    //         let name = this._windowNames[i];
    //         let window = WindowManager.getWindow<WindowBase>(name);;
    //         if (window.isShowing() && window.getHeader()) {
    //             firstWindow = window;
    //             firstHeader = window.getHeader();
    //             index = i;
    //             break;
    //         }
    //     }
    //     this._headers.forEach((header, name) => {
    //         this._root.setChildIndex(header, 0);
    //         if (!firstHeader && header.visible) {
    //             header._hide();
    //         } else if (firstHeader) {
    //             if (firstHeader.name == name && !header.visible) {
    //                 header._show(firstWindow);
    //             } else if (firstHeader.name != name && header.visible) {
    //                 header._hide();
    //             }
    //         }
    //     });
    //     if (firstHeader) {
    //         if (index == this.size - 1) {
    //             this._root.setChildIndex(firstHeader, this._root.numChildren - 1);
    //         } else {
    //             this._root.setChildIndex(firstHeader, this._root.numChildren - this.size + index - 1);
    //         }
    //     }
    // }

    // /**
    //  * 调整指定窗口的透明度图形。并根据窗口的背景透明度绘制半透明遮罩。
    //  * @param window - 需要调整透明度的窗口对象。
    //  * @internal
    //  */
    // private _adjustAlphaGraph(window: IWindow): void {
    //     this._root.setChildIndex(this._alphaGraph, this._root.numChildren - 1);
    // }

    public hasWindow(name: string): boolean {
        return this._windowNames.indexOf(name) >= 0;
    }

    /**
     * 获取窗口组顶部窗口实例
     * @returns {IWindow} 顶部窗口实例
     */
    public getTopWindow<T extends IWindow>(): T {
        if (this.size > 0) {
            return WindowManager.getWindow(this._windowNames[this.size - 1]);
        }
        console.warn(`窗口组【${this._name}】中不存在窗口`);
        return null;
    }

    /**
     * 关闭窗口组中的所有窗口
     * @param ignores 不关闭的窗口名
     * @internal
     */
    public closeAllWindow(ignores: IWindow[] = []): void {
        let names = this._windowNames.filter(name => !ignores.some(ignore => ignore.name === name));
        let existIgnore = names.length > 0;

        let len = this.size - 1;
        for (let i = len; i >= 0; i--) {
            let name = this._windowNames[i];
            if (!existIgnore || !names.includes(name)) {
                WindowManager.getWindow(name)._close();
                WindowManager.removeWindow(name);
            }
        }
        // 统一处理窗口的显示状态
        if (this.size == 0) {
            this._root.visible = false;
        } else {
            this.processWindowHideStatus(this.size - 1);
        }
    }
}
