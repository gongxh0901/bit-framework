/**
 * @Author: Gongxh
 * @Date: 2024-12-08
 * @Description: 
 */

import { AdapterType, WindowType } from "../header";

export interface IWindow {
    /** 窗口名称 */
    name: string;
    /** 窗口类型 */
    type: WindowType;
    /** 窗口适配类型 */
    adapterType: AdapterType;
    /** 底部遮罩的透明度 */
    bgAlpha: number;

    /**
     * 初始化
     * @param swallowTouch 是否吞噬触摸事件
     * @internal
     */
    _init(swallowTouch: boolean): void;

    /**
     * 窗口适配
     * @internal
     */
    _adapted(): void;

    /** 
     * 窗口关闭
     * @internal
     */
    _close(): void;

    /**
     * 显示窗口 (和 _close并不是一一对应)
     * @param userdata 用户自定义数据
     * @internal
     */
    _show(userdata?: any): void;

    /**
     * 恢复到顶部显示时 (除忽略的窗口组外, 显示到最上层时)
     * @internal
     */
    _toTop(): void;

    /**
     * 被上层窗口覆盖时 (除忽略的窗口组外, 被上层窗口覆盖时)
     * @internal
     */
    _toBottom(): void;

    /**
     * 隐藏窗口
     * @internal
     */
    _hide(): void;

    /**
     * 从隐藏状态恢复显示
     * @internal
     */
    _showFromHide(): void;

    /**
     * 窗口是否显示
     * @internal
     */
    isShowing(): boolean;


    /**
     * 设置窗口深度
     * @param depth 深度
     * @internal
     */
    setDepth(depth: number): void;

    // /** 获取资源栏数据 */
    // getHeaderInfo(): WindowHeaderInfo;

    // /** @internal */
    // _setHeader(header: IHeader): void;
}