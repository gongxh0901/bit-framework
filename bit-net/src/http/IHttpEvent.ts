/**
 * @Author: Gongxh
 * @Date: 2024-12-28
 * @Description: 网络事件 
 */

import { IHttpResponse } from "./IHttpResponse";

export interface IHttpEvent {
    /** 名称 */
    name?: string;
    /** 自定义参数 */
    data?: any;
    /** 网络请求成功 */
    onComplete(response: IHttpResponse): void;
    /** 网络请求失败 */
    onError(response: IHttpResponse): void;
}