/**
 * @Author: Gongxh
 * @Date: 2025-01-11
 * @Description: 窗口顶边栏
 * 窗口顶边资源栏 同组中只会有一个显示
 */

import { Screen } from "@gongxh/bit-core";
import { GComponent } from "fairygui-cc";
import { AdapterType } from "../header";
import { IHeader } from "../interface/IHeader";
import { IWindow } from "../interface/IWindow";


export abstract class HeaderBase extends GComponent implements IHeader {
    /** 窗口适配类型 */
    public adapterType: AdapterType = AdapterType.Full;
    /** 引用计数 @internal */
    public _refCount: number = 0;

    protected abstract onInit(): void;
    protected abstract onShow(window: IWindow, userdata?: any): void;
    protected abstract onClose(): void;

    protected onHide(): void {

    }
    protected onAdapted(): void {

    }

    /**
     * 初始化 (内部方法)
     * @internal
     */
    public _init(): void {
        this.onInit();
    }

    /**
     * 窗口适配 (内部方法)
     * @internal
     */
    public _adapted(): void {
        this.setPosition(Screen.ScreenWidth * 0.5, Screen.ScreenHeight * 0.5);
        this.setPivot(0.5, 0.5, true);
        switch (this.adapterType) {
            case AdapterType.Full:
                this.setSize(Screen.ScreenWidth, Screen.ScreenHeight, true);
                break;
            case AdapterType.Bang:
                this.setSize(Screen.SafeWidth, Screen.SafeHeight, true);
                break;
            default:
                break;
        }
        this.onAdapted();
    }

    /**
     * 显示 (内部方法)
     * @param {IWindow} window 所属窗口
     * @internal
     */
    public _show(window: IWindow): void {
        this.visible = true;
        // this.onShow(window, window.getHeaderInfo()?.userdata);
    }

    /**
     * 隐藏 (内部方法)
     * @internal
     */
    public _hide(): void {
        this.visible = false;
        this.onHide();
    }

    /**
     * 关闭 (内部方法)
     * @internal
     */
    public _close(): void {
        this.onClose();
        this.dispose();
    }

    /**
     * 增加引用计数 (内部方法)
     * @internal
     */
    public _addRef(): void {
        this._refCount++;
    }

    /**
     * 减少引用计数 (内部方法)
     * @internal
     */
    public _decRef(): number {
        return --this._refCount;
    }

    /**
     * 屏幕大小改变时被调用 (内部方法)
     * @internal
     */
    public _screenResize(): void {
        this._adapted();
    }
}