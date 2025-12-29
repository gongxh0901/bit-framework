import { AdapterType } from "../header";

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
    /**
     * 初始化
     * @internal
     */
    _init(): void;

    /**
     * 关闭
     * @internal
     */
    _close(): void;

    /**
     * 窗口适配
     * @internal
     */
    _adapted(): void;

    /**
     * 显示
     * @internal
     */
    _show(): void;

    /**
     * 隐藏
     * @internal
     */
    _hide(): void;

    /**
     * 从隐藏状态恢复显示
     * @internal
     */
    _showFromHide(): void;

    /**
     * 是否显示中
     */
    isShowing(): boolean;
}
