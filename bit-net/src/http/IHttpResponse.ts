/**
 * @Author: Gongxh
 * @Date: 2024-12-28
 * @Description: 网络响应接口
 */

import { HttpResponseDataType } from "./HttpManager";
export interface IHttpResponse {
    /** 信息 */
    readonly message: string;

    /** 响应数据 */
    readonly data: HttpResponseDataType;

    /** http状态码 */
    readonly statusCode: number;

    /** 相应头 */
    readonly headers: any;
}