/**
 * @Author: Gongxh
 * @Date: 2024-12-08
 * @Description: 窗口的一些类型配置 
 */

/** 是否开启调试模式 */
export let KUNPO_DEBUG: boolean = false;

/**
 * 启用或禁用调试模式。
 * @param enable - 如果为 true，则启用调试模式；如果为 false，则禁用调试模式。不设置默认不开启
 */
export function enableDebugMode(enable: boolean): void {
    if (enable == true) {
        KUNPO_DEBUG = true;
        console.warn("调试模式已开启");
    } else {
        KUNPO_DEBUG = false;
    }
}

/** 窗口显示时，对其他窗口的隐藏处理类型 */
export enum WindowType {
    /** 不做任何处理 */
    Normal = 0,
    /** 关闭所有 */
    CloseAll = 1 << 0,
    /** 关闭上一个 */
    CloseOne = 1 << 1,
    /** 隐藏所有 */
    HideAll = 1 << 2,
    /** 隐藏上一个 */
    HideOne = 1 << 3,
}

/** 窗口适配类型，默认全屏 */
export enum AdapterType {
    /** 全屏适配 */
    Full = 0,
    /** 空出刘海 */
    Bang = 1,
    /** 固定的 不适配 */
    Fixed = 2,
}

/** 定义装饰器元数据的key */
export enum MetadataKey {
    /** 属性 */
    prop = "__uipropmeta__",
    /** 回调 */
    callback = "__uicbmeta__",
    /** 控制器 */
    control = "__uicontrolmeta__",
    /** 动画 */
    transition = "__uitransitionmeta__",
    /** 原始名称 */
    originalName = "__UI_ORIGINAL_NAME__",
}

/** 
 * 窗口属性基类
 */
export interface IDecoratorInfo {
    /** 构造函数 */
    ctor: any;
    /** 属性 */
    props: Record<string, 1>;
    /** 方法 */
    callbacks: Record<string, Function>;
    /** 控制器 */
    controls: Record<string, 1>;
    /** 动画 */
    transitions: Record<string, 1>;

    res: {
        /** fgui包名 */
        pkg: string;
        /** 组件名 */
        name: string;
        /** 窗口组名称 可选(只有窗口才会设置) */
        group?: string;

        /** 内联的包名 当前界面需要引用其他包中的资源时使用 (只有窗口才会设置) */
        inlinePkgs?: string[];
    }
}