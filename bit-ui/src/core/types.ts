/**
 * @Author: Gongxh
 * @Date: 2025-12-25
 * @Description: 类型定义
 */

export interface IWindowInfo {
    /** 类的构造函数 */
    ctor: any;
    /** 窗口组名 */
    group: string;
    /** fgui包名 */
    pkgName: string;
    /** 窗口名 */
    name: string;
}

export interface IHeaderInfo {
    /** 类的构造函数 */
    ctor: any;
    /** fgui包名 */
    pkgName: string;
}

export interface IWaitWindowCallbacks {
    /** 显示等待窗口 */
    showWaitWindow: (context?: string) => void;
    /** 隐藏等待窗口 */
    hideWaitWindow: () => void;
}

export interface IWindowOpenOptions {
    /**
     * 打开窗口前的异步准备逻辑。
     * 会在UI包资源加载前执行，执行期间使用通用等待窗。
     */
    beforeLoad?: () => void | Promise<void>;
}
