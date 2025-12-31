/**
 * @Author: Gongxh
 * @Date: 2024-12-28
 * @Description: 网络请求
 */
import { sys } from "cc";
import { HttpRequestMethod, HttpResponseDataType, HttpResponseType } from "./HttpManager";
import { IHttpRequest } from "./IHttpRequest";
import { IHttpResponse } from "./IHttpResponse";

export class HttpRequest implements IHttpRequest, IHttpResponse {
    /** 请求方法 */
    public method: HttpRequestMethod;
    /** xhr实例 @internal */
    private _xhr: XMLHttpRequest;
    /** 请求超时时间 (s) */
    public timeout: number;
    /** 响应类型 */
    public responseType: HttpResponseType;
    /** 信息 */
    public message: string;
    /** 响应数据 */
    public data: HttpResponseDataType;

    /** 网络事件回调 @internal */
    private _callback: (result: "succeed" | "fail", response: IHttpResponse) => void;

    /**
     * http相应状态码
     * @readonly
     * @type {number}
     */
    public get statusCode(): number {
        return this._xhr.status;
    }

    /** 相应头 */
    public get headers(): any {
        return this._xhr.getAllResponseHeaders();
    }

    constructor() {
        this._xhr = new XMLHttpRequest();
    }

    public setNetCallback(callback: (result: "succeed" | "fail", response: IHttpResponse) => void): void {
        this._callback = callback;
    }

    public send(url: string, data: any, headers: any[]): void {
        let xhr = this._xhr;
        /** 设置请求超时时间 */
        xhr.timeout = this.timeout * 1000;
        /** 设置响应类型 */
        xhr.responseType = this.responseType;
        xhr.onabort = this._onHttpAbort.bind(this);
        xhr.onerror = this._onHttpError.bind(this);
        xhr.onload = this._onHttpLoad.bind(this);
        xhr.ontimeout = this._onHttpTimeout.bind(this);
        xhr.open(this.method, encodeURI(url));
        if (headers) {
            for (let i = 0; i < headers.length; i += 2) {
                xhr.setRequestHeader(headers[i], headers[i + 1]);
            }
        } else if (!sys.isMobile && sys.isBrowser) {
            if (!data || typeof data == "string") {
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            } else {
                xhr.setRequestHeader("Content-Type", "application/json");
            }
        }
        xhr.send(data);
    }

    /**
     * 终止Http请求
     * @param {boolean} [silent=false] 如果为true则不会回调错误信息
     */
    public abort(silent: boolean = false): void {
        if (silent) {
            this._clear();
        }
        this._xhr.abort();
    }

    /**
     * 请求中断
     * @internal
     */
    private _onHttpAbort(): void {
        this.message = "request aborted by user";
        this.onError();
    }

    /**
     * 请求错误
     * @internal
     */
    private _onHttpError(): void {
        this.message = "request error";
        this.onError();
    }

    /**
     * @internal
     */
    private _onHttpLoad(): void {
        const xhr = this._xhr;
        const status = xhr.status !== undefined ? xhr.status : 200;
        if (status === 200 || status === 204 || status === 0) {
            this.onComplete();
        } else {
            this.message = 'status:' + xhr.status + 'statusText:' + xhr.statusText + "responseURL:" + xhr.responseURL;
            this.onError();
        }
    }

    /**
     * 请求超时
     * @internal
     */
    private _onHttpTimeout(): void {
        this.message = "request timeout";
        this.onError();
    }

    /**
     * 请求发生错误
     * @internal
     */
    private onError(): void {
        this._callback?.("fail", this);
        this._clear();
    }

    /**
     * 请求完成
     * @internal
     */
    private onComplete(): void {
        try {
            if (this.responseType == "json") {
                this.data = this._xhr.response;
            } else if (this.responseType == "arraybuffer") {
                this.data = this._xhr.response;
            } else if (this.responseType == "text") {
                this.data = this._xhr.responseText;
            }
            this._callback?.("succeed", this);
            this._clear();
        } catch (e) {
            console.warn(`http响应数据解析错误，HttpResponseType(${this.responseType})\n    url: ${this._xhr.responseURL}\n    error: ` + e);
            this.onError();
        }
    }

    /**
     * 清除请求
     * @internal
     */
    private _clear(): void {
        this._xhr.onabort = null;
        this._xhr.onerror = null;
        this._xhr.onload = null;
        this._xhr.ontimeout = null;
        this._callback = null;
    }
}