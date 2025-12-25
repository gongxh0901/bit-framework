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