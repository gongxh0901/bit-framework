/**
 * @Author: Gongxh
 * @Date: 2025-04-18
 * @Description: 读取网络文件内容
 */

import { Utils } from "../Utils";
import { HttpManager } from "../http/HttpManager";
import { IHttpResponse } from "../http/IHttpResponse";

export class ReadNetFile {
    constructor(res: { url: string, timeout: number, responseType: "text" | "json" | "arraybuffer", onComplete: (data: any) => void, onError: (code: number, message: string) => void }) {
        // 地址上带时间戳参数 确保每次请求都到服务器上请求最新配置，而不是拿到上次请求的缓存数据
        let now = new Date().getTime();
        let url = Utils.addUrlParam(res.url, "timeStamp", `${now}`);
        HttpManager.get(url, null, res.responseType, {
            onComplete: (response: IHttpResponse) => {
                res.onComplete(response.data);
            },
            onError: (response: IHttpResponse) => {
                res.onError(response.statusCode, response.message);
            }
        }, null, res.timeout || 6);
    }
}