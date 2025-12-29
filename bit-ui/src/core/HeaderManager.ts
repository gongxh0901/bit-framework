/**
 * @Author: Gongxh
 * @Date: 2025-12-29
 * @Description: header(资源栏)管理类
 */

import { IHeader } from "../interface/IHeader";

export class HeaderManager {
    /** 
     * header的实例
     * @internal
     */
    private static _headers: Map<string, IHeader> = new Map();

    /** 
     * header的引用计数
     * @internal
     */
    private static _headerRefs: Map<string, number> = new Map();

    // /** 
    //  * 窗口名 > header名
    //  */
    // private static _windowHeaderMap: Map<string, string> = new Map();



}