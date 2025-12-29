/**
 * @Author: Gongxh
 * @Date: 2024-12-14
 * @Description: 窗口基类和fgui组件对接
 */

import { Screen } from "@gongxh/bit-core";
import { GComponent } from "fairygui-cc";
import { WindowManager } from "../core/WindowManager";
import { AdapterType, WindowType } from "../header";
import { IWindow } from "../interface/IWindow";
import { HeaderInfo } from "./HeaderInfo";

export abstract class WindowBase<T = any, U = any> extends GComponent implements IWindow<T, U> {
    /** 窗口类型 */
    public type: WindowType = WindowType.Normal;

    /** 窗口适配类型 */
    public adapterType: AdapterType = AdapterType.Full;

    /** 底部遮罩的透明度 */
    public bgAlpha: number;

    /** @internal */
    private _swallowNode: GComponent = null; // 吞噬触摸的节点

    /** @internal */
    private _isTop: boolean = true;

    /**
     * 初始化方法 (框架内部使用)
     * @param swallowTouch 是否吞噬触摸事件
     * @param bgAlpha 底部遮罩的透明度
     * @internal
     */
    public _init(swallowTouch: boolean): void {
        // 窗口本身可能留有安全区的边, 所以需要一个全屏的节点来吞噬触摸事件
        let bgNode = new GComponent();
        bgNode.name = "swallow";
        bgNode.setPivot(0.5, 0.5, true);
        this.addChild(bgNode);
        bgNode.parent.setChildIndex(bgNode, 0);  // 调整显示层级
        bgNode.onClick(this.onEmptyAreaClick, this); // 空白区域点击事件
        bgNode.opaque = swallowTouch;
        this._swallowNode = bgNode;

        // 窗口自身也要设置是否吞噬触摸
        this.opaque = swallowTouch;
        this._isTop = true;
        this.bgAlpha = WindowManager.bgAlpha;
        this.onInit();
    }

    /**
     * 适配窗口
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
        // 屏幕的宽高
        this._swallowNode.setSize(Screen.ScreenWidth, Screen.ScreenHeight, true);
        // 位置放在窗口的中心
        this._swallowNode.setPosition(this.width * 0.5, this.height * 0.5);
        this.onAdapted();
    }

    /** 
     * 窗口关闭
     * @internal
     */
    public _close(): void {
        this.onClose();
        this.dispose();
    }

    /**
     * 显示窗口 (框架内部使用)
     * @param userdata 用户自定义数据
     * @internal
     */
    public _show(userdata?: T): void {
        this.visible = true;
        this.onShow(userdata);
    }

    /** 
     * 隐藏窗口 (框架内部使用)
     * @internal
     */
    public _hide(): void {
        this.visible = false;
        this.onHide();
    }
    /**
     * 从隐藏状态恢复显示
     * @internal
     */
    public _showFromHide(): void {
        this.visible = true;
        this.onShowFromHide();
    }

    /**
     * 除忽略的窗口组外, 显示到最上层时
     * @internal
     */
    public _toTop(): void {
        this._isTop = true;
        this.onToTop();
    }

    /**
     * 除忽略的窗口组外, 被上层窗口覆盖时
     * @internal
     */
    public _toBottom(): void {
        this._isTop = false;
        this.onToBottom();
    }

    /**
     * 设置窗口深度
     * @param depth 深度
     * @internal
     */
    public setDepth(depth: number): void {
        this.parent.setChildIndex(this, depth);
    }

    public isShowing(): boolean {
        return this.visible;
    }

    /** 是否在最上层显示 (除忽略的窗口组外, 显示到最上层时) */
    public isTop(): boolean {
        return this._isTop;
    }

    /** @internal */
    public screenResize(): void {
        this._adapted();
    }

    /**
     * 获取窗口顶部资源栏数据 默认返回空数组
     * @returns {HeaderInfo}
     */
    public abstract getHeaderInfo<U>(): HeaderInfo<U>;

    /** 
     * 刷新顶部资源栏 
     * 调用这个方法会重新创建 或者 刷新header
     * 用来在同一个界面显示不同的header
     */
    public refreshHeader(): void {
        // 强制刷新header
    }

    /** 
     * 用于在界面中关闭自己
     */
    protected removeSelf(): void {
        WindowManager.closeWindowByName(this.name);
    }

    protected abstract onAdapted(): void;

    protected abstract onInit(): void;
    protected abstract onClose(): void;

    protected abstract onShow(userdata?: T): void;
    protected abstract onShowFromHide(): void;
    protected abstract onHide(): void;

    protected abstract onToTop(): void;
    protected abstract onToBottom(): void;

    protected abstract onEmptyAreaClick(): void;
}