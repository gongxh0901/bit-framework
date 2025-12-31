/**
 * @Author: Gongxh
 * @Date: 2024-12-28
 * @Description: 网络任务
 */

import { IHttpEvent } from "./IHttpEvent";
import { IHttpResponse } from "./IHttpResponse";

export abstract class HttpTask implements IHttpEvent {
    /** 名称 */
    public name: string;
    /** 自定义参数 */
    public data?: any;
    /** 请求完成 */
    public abstract onComplete(response: IHttpResponse): void;
    /** 请求错误 */
    public abstract onError(response: IHttpResponse): void;
    /** 请求开始 */
    public abstract start(): void;
}