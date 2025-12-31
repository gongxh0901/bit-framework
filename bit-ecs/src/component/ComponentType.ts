/**
 * @Author: Gongxh
 * @Date: 2025-05-13
 * @Description: 
 */

import { Component } from "./Component";


export interface ComponentType<T extends Component> {
    new(): T;
    ctype: number;
    cname: string;
}