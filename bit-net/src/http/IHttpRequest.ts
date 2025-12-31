/**
 * @Author: Gongxh
 * @Date: 2024-12-28
 * @Description: 网络请求接口
 */

import { HttpRequestMethod, HttpResponseType } from "./HttpManager";
export interface IHttpRequest {
    /** 请求方法 */
    readonly method: HttpRequestMethod;
    /** 请求超时时间 (s) */
    readonly timeout: number;
    /** 响应类型 */
    readonly responseType: HttpResponseType;
}