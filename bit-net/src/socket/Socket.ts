/**
 * @Author: Gongxh
 * @Date: 2025-03-28
 * @Description: 网络socket
 */

import { sys } from "cc";

type BinaryType = "blob" | "arraybuffer";

interface SocketOptions {
    /** 
     * 给原生平台 和 web 用
     * 一个协议字符串或者一个包含协议字符串的数组。
     * 这些字符串用于指定子协议，这样单个服务器可以实现多个 WebSocket 子协议（
     * 例如，你可能希望一台服务器能够根据指定的协议（protocol）处理不同类型的交互。
     * 如果不指定协议字符串，则假定为空字符串。
     */
    protocols?: string[];

    /** 
     * 使用 Blob 对象处理二进制数据。这是默认值
     * 使用 ArrayBuffer 对象处理二进制数据
     * @url https://developer.mozilla.org/docs/Web/API/WebSocket/binaryType
     */
    binaryType?: BinaryType;

    /** 超时时间 默认3000毫秒 */
    timeout?: number;
}

export class Socket {
    /** 
     * socket对象 
     * @internal
     */
    private _socket: WebSocket | WechatMiniprogram.SocketTask | AliyMiniprogram.SocketTask | BytedanceMiniprogram.SocketTask;

    /**
     * @param {string} url 要连接的 URL；这应该是 WebSocket 服务器将响应的 URL
     * @param {SocketOptions} options 可选参数 针对不同平台的一些特殊参数 详细信息见定义
     */
    constructor(url: string, options?: SocketOptions) {
        if (sys.platform == sys.Platform.WECHAT_GAME) {
            this._socket = this.createWechatSocket(url, options?.timeout || 3000, options?.protocols);
        } else if (sys.platform == sys.Platform.ALIPAY_MINI_GAME) {
            this._socket = this.createAliSocket(url, options?.timeout || 3000, options?.protocols);
        } else if (sys.platform == sys.Platform.BYTEDANCE_MINI_GAME) {
            this._socket = this.createBytedanceSocket(url, options?.timeout || 3000, options?.protocols);
        } else {
            this._socket = this.createOtherSocket(url, options?.binaryType, options?.timeout || 3000, options?.protocols);
        }
    }

    /** 
     * 微信小游戏创建socket
     * @internal
     */
    private createWechatSocket(url: string, timeout?: number, protocols?: string[]): WechatMiniprogram.SocketTask {
        let socket = wx.connectSocket({
            url,
            protocols: protocols,
            timeout: timeout,
            success: () => { console.log("socket success") },
            fail: () => { console.warn("socket fail") }
        });
        socket.onOpen(() => {
            this.onopen && this.onopen();
        });
        socket.onMessage((res: { data: string | ArrayBuffer }) => {
            this.onmessage && this.onmessage(res.data);
        });
        socket.onError((res: { errMsg: string }) => {
            // 微信上socket和原生平台以及浏览器不一致 所以这里特殊处理 给他一个默认的错误码
            this.onclose?.(1000, res?.errMsg);
        });
        socket.onClose((res: { code: number, reason: string }) => {
            this.onclose?.(res.code, res.reason);
        });
        return socket;
    }

    /** 
     * 支付宝小游戏创建socket
     * @internal
     */
    private createAliSocket(url: string, timeout?: number, protocols?: string[]): AliyMiniprogram.SocketTask {
        let socket = my.connectSocket({
            url,
            protocols: protocols,
            multiple: true,
            timeout: timeout,
            success: () => { console.log("socket success") },
            fail: () => { console.warn("socket fail") }
        });

        socket.onOpen((info: AliyMiniprogram.OnOpenData) => {
            this.onopen && this.onopen();
        });
        socket.onMessage((info: AliyMiniprogram.OnMessageData) => {
            if (!this.onmessage) {
                return;
            }
            if (info.isBuffer) {
                if (my.base64ToArrayBuffer) {
                    this.onmessage(my.base64ToArrayBuffer(info.data.data));
                } else if (atob) {
                    this.onmessage(this.base64ToArrayBuffer(info.data.data));
                } else {
                    this.onmessage(info.data.data);
                }
                this.onmessage(info.data.data);
            } else {
                this.onmessage(info.data.data);
            }
        });
        socket.onError((info: { data: AliyMiniprogram.CallBack.Fail }) => {
            this.onclose && this.onclose(info.data.error, info.data.errorMessage);
        });
        socket.onClose((info: { code: number, reason: string, data: { code: number, reason: string } }) => {
            this.onclose && this.onclose(info.code, info.reason);
        });
        return socket;
    }

    /**
     * 抖音小游戏创建socket
     * @internal
     */
    private createBytedanceSocket(url: string, timeout?: number, protocols?: string[]): BytedanceMiniprogram.SocketTask {
        let socket: BytedanceMiniprogram.SocketTask = tt.connectSocket({
            url,
            protocols: protocols,
            success: () => { console.log("socket success") },
            fail: () => { console.warn("socket fail") }
        });

        let timer = setTimeout(() => {
            socket.close({});
        }, timeout);

        socket.onOpen(() => {
            timer && clearTimeout(timer);
            timer = null;
            this.onopen && this.onopen();
        });
        socket.onMessage((info: { data: string | ArrayBuffer }) => {
            this.onmessage && this.onmessage(info.data);
        });
        socket.onError((res: { errMsg: string }) => {
            timer && clearTimeout(timer);
            timer = null;
            // 微信上socket和原生平台以及浏览器不一致 所以这里特殊处理 给他一个默认的错误码
            this.onclose?.(1000, res.errMsg);
        });
        socket.onClose((res: { code: string, reason: string }) => {
            timer && clearTimeout(timer);
            timer = null;
            this.onclose?.(Number(res.code), res.reason);
        });
        return socket;
    }

    /** 
     * 除微信小游戏、支付宝小游戏、抖音小游戏之外的平台创建socket
     * @internal
     */
    private createOtherSocket(url: string, binaryType: BinaryType, timeout?: number, protocols?: string[]): WebSocket {
        let socket = new WebSocket(url, protocols);
        if (binaryType) {
            socket.binaryType = binaryType;
        }

        let timer = setTimeout(() => {
            socket.close();
        }, timeout);

        socket.onopen = () => {
            timer && clearTimeout(timer);
            timer = null;
            this.onopen?.();
        }
        socket.onmessage = (event: MessageEvent) => {
            this.onmessage?.(event.data);
        }
        socket.onerror = () => {
            timer && clearTimeout(timer);
            timer = null;
            this.onerror?.();
        }
        socket.onclose = (event: CloseEvent) => {
            timer && clearTimeout(timer);
            timer = null;
            this.onclose?.(event?.code, event?.reason);
        }
        return socket;
    }

    /**
     * 发送文本数据
     * @param data - 文本数据
     */
    public send(data: string): void {
        if (sys.platform == sys.Platform.WECHAT_GAME) {
            (this._socket as WechatMiniprogram.SocketTask).send({ data: data });
        } else if (sys.platform == sys.Platform.ALIPAY_MINI_GAME) {
            (this._socket as AliyMiniprogram.SocketTask).send({ data: data });
        } else if (sys.platform == sys.Platform.BYTEDANCE_MINI_GAME) {
            (this._socket as BytedanceMiniprogram.SocketTask).send({ data: data });
        } else {
            (this._socket as WebSocket).send(data);
        }
    }

    /**
     * 发送二进制数据
     * @param data - 二进制数据
     */
    public sendBuffer(data: ArrayBuffer): void {
        if (sys.platform == sys.Platform.WECHAT_GAME) {
            (this._socket as WechatMiniprogram.SocketTask).send({ data: data });
        } else if (sys.platform == sys.Platform.ALIPAY_MINI_GAME) {
            if (my.arrayBufferToBase64) {
                (this._socket as AliyMiniprogram.SocketTask).send({ data: my.arrayBufferToBase64(data), isBuffer: true });
            } else if (btoa) {
                (this._socket as AliyMiniprogram.SocketTask).send({ data: this.uint8ArrayToBase64(new Uint8Array(data)), isBuffer: true });
            } else {
                (this._socket as AliyMiniprogram.SocketTask).send({ data: data });
            }
        } else if (sys.platform == sys.Platform.BYTEDANCE_MINI_GAME) {
            (this._socket as BytedanceMiniprogram.SocketTask).send({ data: data });
        } else {
            (this._socket as WebSocket).send(data);
        }
    }

    /**
     * 客户端主动断开
     * @param code - 关闭代码: 如果没有传这个参数，默认使用1000, 客户端可使用的数字范围: [3001-3999]
     * @param reason - 关闭原因: 一个人类可读的字符串，它解释了连接关闭的原因。这个 UTF-8 编码的字符串不能超过 123 个字节
     */
    public close(code?: number, reason?: string): void {
        if (sys.platform == sys.Platform.WECHAT_GAME) {
            (this._socket as WechatMiniprogram.SocketTask).close({ code: code, reason: reason });
        } else if (sys.platform == sys.Platform.ALIPAY_MINI_GAME) {
            (this._socket as AliyMiniprogram.SocketTask).close({ code: code, reason: reason });
        } else if (sys.platform == sys.Platform.BYTEDANCE_MINI_GAME) {
            (this._socket as BytedanceMiniprogram.SocketTask).close({ code: code, reason: reason });
        } else {
            (this._socket as WebSocket).close(code, reason);
        }
    }

    /**
     * 获取socket示例
     * 在微信小游戏、支付宝小游戏、抖音小游戏 返回的是他们平台的socket实例类型
     */
    public socket<T>(): T {
        return this._socket as T;
    }

    /** 
     * socket已准备好 open成功
     * 当前连接已经准备好发送和接受数据
     */
    public onopen: () => void;

    /** 
     * 接收到服务端发送的消息
     * @param data - 消息数据
     */
    public onmessage: (data: string | ArrayBuffer) => void;

    /**
     * 监听可能发生的错误，一般用不到
     */
    public onerror: () => void;

    /**
     * 关闭连接
     * @param code - 关闭代码
     * @param reason - 关闭原因
     */
    public onclose: (code: number, reason: string) => void;

    /** 
     * 二进制数据转成Base64 (支付宝用)
     * @internal
     */
    private uint8ArrayToBase64(u8Array: Uint8Array): string {
        let CHUNK_SIZE = 0x8000; // 32768
        let index = 0;
        let length = u8Array.length;
        let result = '';
        let slice: Uint8Array<ArrayBufferLike>;;

        // 分段处理，避免`btoa`输入字符串过长
        for (; index < length; index += CHUNK_SIZE) {
            slice = u8Array.subarray(index, Math.min(index + CHUNK_SIZE, length));
            // 将Uint8Array转换为字符串并使用btoa进行Base64编码
            result += btoa(String.fromCharCode(...slice));
        }
        return result;
    }

    /** 
     * base64转成ArrayBuffer (支付宝用)
     * @internal
     */
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        let binary_string = atob(base64);
        let len = binary_string.length;
        let bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
