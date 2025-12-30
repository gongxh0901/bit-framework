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

export abstract class Header<T = any> extends GComponent implements IHeader<T> {
    /** 窗口适配类型 */
    public adapterType: AdapterType = AdapterType.Full;

    protected abstract onInit(): void;
    protected abstract onShow(userdata?: T): void;

    protected onAdapted(): void { };
    protected onClose(): void { };
    protected onHide(): void { };
    protected onShowFromHide(): void { };

    /**
     * 是否显示中
     */
    public isShowing(): boolean {
        return this.visible;
    }

    /**
     * 初始化 (内部方法)
     * @internal
     */
    public _init(): void {
        this.opaque = false;
        this.onInit();
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
     * 窗口适配
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
     * 显示
     * @param userdata 用户数据
     * @internal
     */
    public _show(userdata?: T): void {
        this.visible = true;
        this.onShow(userdata);
    }

    /**
     * 隐藏
     * @internal
     */
    public _hide(): void {
        this.visible = false;
        this.onHide();
    }
}