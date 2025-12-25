import { AdapterType } from "../header";
import { IWindow } from "./IWindow";

/**
 * @Author: Gongxh
 * @Date: 2024-12-08
 * @Description: 窗口顶边资源栏
 */
export interface IHeader {
    /** 资源栏名称 */
    name: string;
    /** 窗口适配类型 */
    adapterType: AdapterType;
    /** 引用计数 @internal */
    _refCount: number;
    /**
     * 初始化 (内部方法)
     * @internal
     */
    _init(): void;
    /**
     * 窗口适配 (内部方法)
     * @internal
     */
    _adapted(): void;
    /**
     * 显示 (内部方法)
     * @param {IWindow} window 所属窗口
     * @internal
     */
    _show(window: IWindow): void;
    /**
     * 隐藏 (内部方法)
     * @internal
     */
    _hide(): void;
    /**
     * 关闭 (内部方法)
     * @internal
     */
    _close(): void;

    /** 
     * 增加引用计数 (内部方法)
     * @internal
     */
    _addRef(): void;
    /** 
     * 减少引用计数 (内部方法)
     * @internal
     */
    _decRef(): number;

    /** 
     * 屏幕大小改变时被调用 (内部方法)
     * @internal
     */
    _screenResize(): void;
}
