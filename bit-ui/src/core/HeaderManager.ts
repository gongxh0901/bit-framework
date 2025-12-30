/**
 * @Author: Gongxh
 * @Date: 2025-12-29
 * @Description: header(资源栏)管理类
 */

import { UIPackage } from "fairygui-cc";
import { IHeader } from "../interface/IHeader";
import { Header } from "../window/Header";
import { HeaderInfo } from "../window/HeaderInfo";
import { WindowBase } from "../window/WindowBase";
import { InfoPool } from "./InfoPool";
import { PropsHelper } from "./PropsHelper";
import { WindowManager } from "./WindowManager";

export class HeaderManager {
    /** @internal */
    private static _headers: Map<string, IHeader> = new Map(); // header名 > header实例

    /** @internal */
    private static _refCounts: Map<string, number> = new Map(); // header名 > 引用计数

    /** @internal */
    private static _headerWindowsMap: Map<string, Set<string>> = new Map(); // header名 > 窗口名列表

    /** @internal */
    private static _headerInfos: Map<string, HeaderInfo<any>> = new Map(); // 窗口名 > header的数据

    /** @internal */
    private static _cacheHeaderTopWindow: Map<string, string> = new Map(); // header名 > 缓存的当前显示该header的最上层窗口名

    /**
     * 屏幕适配
     * @internal
     */
    public static onScreenResize(): void {
        for (const header of this._headers.values()) {
            header._adapted();
        }
    }

    /**
     * 为窗口请求一个header
     * @param windowName 窗口名
     * @param headerInfo header信息
     */
    public static requestHeader(windowName: string, headerInfo: HeaderInfo<any> | null): void {
        // 保存header的信息
        if (!headerInfo) {
            return;
        }
        this._headerInfos.set(windowName, headerInfo);
        const headerName = headerInfo.name;
        // 如果header不存在，创建它
        if (!this._headers.has(headerName)) {
            const header = this.createHeader(headerInfo);
            this._headers.set(headerName, header);
            this._refCounts.set(headerName, 0);
            this._headerWindowsMap.set(headerName, new Set());
        }
        // 增加引用计数
        this._refCounts.set(headerName, this._refCounts.get(headerName) + 1);
        // 记录窗口和header的关系
        this._headerWindowsMap.get(headerName).add(windowName);
    }

    /**
     * 显示指定窗口的header
     * @param windowName 窗口名
     * @param fromHide 窗口是否从隐藏状态恢复显示
     */
    public static showHeader(windowName: string): void {
        if (!this.hasHeader(windowName)) {
            return;
        }
        const headerName = this.getHeaderName(windowName);
        const header = this.getHeader(headerName);

        // 更新最上层窗口（智能判断，只在必要时重新计算）
        this.updateTopWindow(headerName, windowName, true);

        // 只有当前窗口是最上层时才显示
        const currentTopWindow = this._cacheHeaderTopWindow.get(headerName);
        if (currentTopWindow === windowName) {
            header._show(this.getHeaderUserData(windowName));
        }
    }

    /**
     * 隐藏指定窗口的header
     * @param windowName 窗口名
     */
    public static hideHeader(windowName: string): void {
        if (!this.hasHeader(windowName)) {
            return;
        }
        const headerName = this.getHeaderName(windowName);
        const header = this.getHeader(headerName);

        // 更新最上层窗口（会自动处理切换逻辑）
        this.updateTopWindow(headerName, windowName, false);

        // 如果切换到了新的窗口，传递新的userdata0
        if (this._cacheHeaderTopWindow.has(headerName)) {
            const newTopWindowName = this._cacheHeaderTopWindow.get(headerName);
            header._show(this.getHeaderUserData(newTopWindowName));
        } else if (header.isShowing()) {
            header._hide();
        }
    }

    /**
     * 释放窗口的header（减少引用计数）
     * @param windowName 窗口名
     */
    public static releaseHeader(windowName: string): void {
        if (!this.hasHeader(windowName)) {
            return;
        }
        const headerName = this.getHeaderName(windowName);
        // 减少引用计数
        const refCount = this._refCounts.get(headerName) - 1;

        // 移除映射关系
        this._headerWindowsMap.get(headerName).delete(windowName);

        // 清除窗口的header信息
        this._headerInfos.delete(windowName);

        const header = this.getHeader(headerName);
        // 如果引用计数为0，销毁header
        if (refCount === 0) {
            header._close();
            this._headers.delete(headerName);
            this._refCounts.delete(headerName);
            this._headerWindowsMap.delete(headerName);
            this._cacheHeaderTopWindow.delete(headerName);
        } else {
            // 更新引用计数
            this._refCounts.set(headerName, refCount);
            // 查找新的最上层窗口 并显示
            const newTopWindowName = this.findTopWindowForHeader(headerName, windowName);
            if (newTopWindowName) {
                this._cacheHeaderTopWindow.set(headerName, newTopWindowName);
                this.adjustHeaderPosition(headerName, newTopWindowName);

                header._show(this.getHeaderUserData(newTopWindowName));
            } else {
                // 没找到需要显示的 隐藏掉
                this._cacheHeaderTopWindow.delete(headerName);
                header.isShowing() && header._hide();
            }
        }
    }

    /**
     * 获取窗口关联的header
     * @param windowName 窗口名
     * @returns header实例，如果没有则返回null
     */
    public static getHeaderByWindow(windowName: string): IHeader | null {
        if (!this.hasHeader(windowName)) {
            return null;
        }
        const headerName = this.getHeaderName(windowName);
        return this._headers.get(headerName) || null;
    }

    /**
     * 刷新窗口的header
     * 如果新的header和旧的header不是同一个，先释放旧的，再创建新的
     * 如果是同一个，更新userdata并重新显示
     * @param windowName 窗口名
     * @param newHeaderInfo 新的header信息
     */
    public static refreshWindowHeader(windowName: string, newHeaderInfo: HeaderInfo<any> | null): void {
        const oldHeaderName = this.getHeaderName(windowName);
        const newHeaderName = newHeaderInfo?.name;

        // 情况1：新旧 header 名称相同，只需要更新 userdata 并重新显示
        if (oldHeaderName === newHeaderName) {
            if (newHeaderInfo) {
                // 更新保存的 userdata
                this._headerInfos.set(windowName, newHeaderInfo);
                // 重新显示 header（如果当前窗口是最上层）
                const currentTopWindow = this._cacheHeaderTopWindow.get(newHeaderName);
                if (currentTopWindow === windowName) {
                    const header = this.getHeader(newHeaderName);
                    header._show(newHeaderInfo.userdata);
                }
            }
            return;
        }

        // 情况2：header 名称不同，先释放旧的，再创建新的
        // 释放旧的 header
        if (oldHeaderName) {
            this.releaseHeader(windowName);
        }

        // 请求新的 header 并显示
        if (newHeaderInfo) {
            this.requestHeader(windowName, newHeaderInfo);
            this.showHeader(windowName);
        }
    }

    private static createHeader(headerInfo: HeaderInfo<any>): IHeader {
        // 创建header实例
        const info = InfoPool.getHeader(headerInfo.name);
        const header = UIPackage.createObject(info.pkgName, headerInfo.name) as Header;
        header.name = headerInfo.name;
        PropsHelper.serializeProps(header, info.pkgName);
        header._init();
        header._adapted();
        return header;
    }

    /**
     * 获取窗口记录的header userdata
     * @internal
     */
    private static getHeaderUserData(windowName: string): any {
        return this._headerInfos.get(windowName)?.userdata;
    }

    /**
     * 根据窗口名字获取header名称
     * @internal
     */
    private static getHeaderName(windowName: string): string {
        return this._headerInfos.get(windowName)?.name;
    }

    /**
     * 窗口上是否存在header
     * @internal
     */
    private static hasHeader(windowName: string): boolean {
        return this._headerInfos.has(windowName);
    }

    /** 通过名称直接获取header实例 */
    private static getHeader<T extends IHeader>(name: string): T {
        return this._headers.get(name) as T;
    }

    /**
     * 更新header的最上层窗口（智能判断是否需要重新计算）
     * @internal
     */
    private static updateTopWindow(headerName: string, changedWindowName: string, isShowing: boolean): void {
        // 记录的最上层窗口名
        const topWindowName = this._cacheHeaderTopWindow.get(headerName);

        if (isShowing) {
            // 情况1：新窗口显示，且它在更高层级
            if (!topWindowName || this.isWindowAbove(changedWindowName, topWindowName)) {
                // 新窗口更靠上, 调整header位置并缓存
                this._cacheHeaderTopWindow.set(headerName, changedWindowName);
                this.adjustHeaderPosition(headerName, changedWindowName);
                return;
            }
        } else if (topWindowName === changedWindowName) {
            // 最上层的窗口需要隐藏, 查找新的最上层窗口
            const newTopWindowName = this.findTopWindowForHeader(headerName, changedWindowName);
            if (newTopWindowName) {
                this._cacheHeaderTopWindow.set(headerName, newTopWindowName);
                this.adjustHeaderPosition(headerName, newTopWindowName);
            } else {
                this._cacheHeaderTopWindow.delete(headerName);
                const header = this.getHeader(headerName);
                if (header && header.isShowing()) {
                    header._hide();
                }
            }
        }
    }

    /**
     * 判断窗口A是否在窗口B的上层 (如果是同一个窗口，返回false)
     * @internal
     */
    private static isWindowAbove(windowA: string, windowB: string): boolean {
        if (windowA === windowB) {
            return false;
        }
        const infoA = InfoPool.get(windowA);
        const infoB = InfoPool.get(windowB);

        // 先比较窗口组
        const groupNames = WindowManager.getGroupNames();
        const groupIndexA = groupNames.indexOf(infoA.group);
        const groupIndexB = groupNames.indexOf(infoB.group);

        if (groupIndexA !== groupIndexB) {
            return groupIndexA > groupIndexB;
        }

        // 同一个组，比较窗口在组内的位置
        const group = WindowManager.getWindowGroup(infoA.group);
        const indexA = group.windowNames.indexOf(windowA);
        const indexB = group.windowNames.indexOf(windowB);
        return indexA > indexB;
    }

    /**
     * 为header查找新的最上层窗口（排除指定窗口）
     * @internal
     */
    private static findTopWindowForHeader(headerName: string, excludeWindow: string): string | null {
        const windowNames: Set<string> = this._headerWindowsMap.get(headerName);
        if (!windowNames || windowNames.size === 0) {
            return null;
        };

        // 从上到下遍历窗口组
        const groupNames = WindowManager.getGroupNames();
        for (let i = groupNames.length - 1; i >= 0; i--) {

            // 从上到下遍历组内窗口
            const group = WindowManager.getWindowGroup(groupNames[i]);
            for (let j = group.windowNames.length - 1; j >= 0; j--) {
                const wName = group.windowNames[j];
                if (wName === excludeWindow) {
                    continue;
                }
                if (!windowNames.has(wName)) {
                    continue;
                }
                const win = WindowManager.getWindow(wName);
                if (win && win.isShowing()) {
                    return wName; // 找到就返回，不继续遍历
                }
            }
        }
        return null;
    }


    /**
     * 调整header到指定窗口的位置
     * @internal
     */
    private static adjustHeaderPosition(headerName: string, windowName: string): void {
        const header = this._headers.get(headerName);
        const window = WindowManager.getWindow<WindowBase<any, any>>(windowName);

        const info = InfoPool.get(windowName);
        const group = WindowManager.getWindowGroup(info.group);
        const parent = group.root;

        // 移动header到对应的group
        if ((header as any).parent !== parent) {
            (header as any).removeFromParent();
            parent.addChild(header as any);
        }

        // 调整层级：找到该组中最上层的显示窗口
        let maxWindowIndex = parent.getChildIndex(window as any);
        for (let i = group.windowNames.length - 1; i >= 0; i--) {
            const win = WindowManager.getWindow<WindowBase>(group.windowNames[i]);
            if (win && win.isShowing()) {
                maxWindowIndex = Math.max(maxWindowIndex, parent.getChildIndex(win));
            }
        }

        parent.setChildIndex(header as any, maxWindowIndex + 1);
    }
}