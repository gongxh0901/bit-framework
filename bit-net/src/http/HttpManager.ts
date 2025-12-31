/**
 * @Author: Gongxh
 * @Date: 2024-12-28
 * @Description: 网络请求管理器
 */

import { HttpRequest } from "./HttpRequest";
import { IHttpEvent } from "./IHttpEvent";
import { IHttpResponse } from "./IHttpResponse";

/** http请求方法 */
export type HttpRequestMethod = "GET" | "POST" | "HEAD" | "PUT"
/** http响应类型 */
export type HttpResponseType = "text" | "json" | "arraybuffer";
/** http响应数据类型 */
export type HttpResponseDataType = string | ArrayBuffer | object;

export class HttpManager {
    public static HttpEvent: string = "event::http";

    /**
     * 发送post请求
     * @param {string} url 请求地址
     * @param {any} data 请求数据
     * @param {HttpResponseType} responseType 响应类型
     * @param {IHttpEvent} netEvent 网络事件
     * @param {any[]} headers 请求头 [key1, value1, key2, value2, ...] 形式
     * @param {number} timeout (单位s) 请求超时时间 默认0 (0表示不超时)
     */
    public static post(url: string, data: any, responseType: HttpResponseType = "json", netEvent: IHttpEvent, headers?: any[], timeout: number = 0): HttpRequest {
        return this._send("POST", url, data, responseType, netEvent, headers, timeout);
    }

    /**
     * 发送get请求
     * @param {string} url 请求地址
     * @param {any} data 请求数据
     * @param {HttpResponseType} responseType 响应类型
     * @param {IHttpEvent} netEvent 网络事件
     * @param {any[]} headers 请求头 [key1, value1, key2, value2, ...] 形式
     * @param {number} timeout (单位s) 请求超时时间 默认0 (0表示不超时)
     */
    public static get(url: string, data: any, responseType: HttpResponseType = "json", netEvent: IHttpEvent, headers?: any[], timeout: number = 0): HttpRequest {
        return this._send("GET", url, data, responseType, netEvent, headers, timeout);
    }

    /**
     * 发送put请求
     * @param {string} url 请求地址
     * @param {any} data 请求数据
     * @param {HttpResponseType} responseType 响应类型
     * @param {IHttpEvent} netEvent 网络事件
     * @param {any[]} headers 请求头 [key1, value1, key2, value2, ...] 形式
     * @param {number} timeout (单位s) 请求超时时间 默认0 (0表示不超时)
     */
    public static put(url: string, data: any, responseType: HttpResponseType = "json", netEvent: IHttpEvent, headers?: any[], timeout: number = 0): HttpRequest {
        return this._send("PUT", url, data, responseType, netEvent, headers, timeout);
    }

    /**
     * 发送head请求
     * @param {string} url 请求地址
     * @param {any} data 请求数据
     * @param {HttpResponseType} responseType 响应类型
     * @param {IHttpEvent} netEvent 网络事件
     * @param {any[]} headers 请求头 [key1, value1, key2, value2, ...] 形式
     * @param {number} timeout (单位s) 请求超时时间 默认0 (0表示不超时)
     */
    public static head(url: string, data: any, responseType: HttpResponseType = "json", netEvent: IHttpEvent, headers?: any[], timeout: number = 0): HttpRequest {
        return this._send("HEAD", url, data, responseType, netEvent, headers, timeout);
    }

    /**
     * 发送http请求
     * @param {HttpRequestMethod} method 请求方式
     * @param {string} url 请求地址
     * @param {any} data 请求数据
     * @param {HttpResponseType} responseType 响应类型
     * @param {IHttpEvent} netEvent 网络事件
     * @param {any[]} headers 请求头 [key1, value1, key2, value2, ...] 形式
     * @param {number} timeout (单位s) 请求超时时间 默认0 (0表示不超时)
     * @internal
     */
    private static _send(method: HttpRequestMethod, url: string, data: any, responseType: HttpResponseType, netEvent: IHttpEvent, headers?: any[], timeout?: number): HttpRequest {
        let http = new HttpRequest()
        http.setNetCallback((result: "succeed" | "fail", response: IHttpResponse) => {
            switch (result) {
                case "succeed":
                    netEvent?.onComplete(response);
                    break;
                case "fail":
                    netEvent?.onError(response);
                    break;
            }
        });
        http.method = method;
        http.timeout = timeout;
        http.responseType = responseType;
        http.send(url, data, headers);
        return http;
    }
}