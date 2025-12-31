/**
 * @Author: Gongxh
 * @Date: 2025-03-20
 * @Description: 热更新管理器
 */

import { native } from "cc";
import { Platform } from "@gongxh/bit-core";
import { ICheckUpdatePromiseResult } from "@gongxh/bit-core";
import { log } from "@gongxh/bit-core";
import { HotUpdate, HotUpdateCode } from "./HotUpdate";

const TAG = "hotupdate:";

export class HotUpdateManager {
    private static instance: HotUpdateManager;
    public static getInstance(): HotUpdateManager {
        if (!HotUpdateManager.instance) {
            HotUpdateManager.instance = new HotUpdateManager();
        }
        return HotUpdateManager.instance;
    }
    /** 是否初始化了 */
    private _isInitialized: boolean = false;
    /** 本地manifest路径 */
    private _manifestUrl: string = '';
    /** 版本号 */
    private _version: string = '';

    /** 资源版本号 */
    private _resVersion: string = null;
    /** 可写路径 */
    private _writablePath: string = '';
    /** 是否正在更新 或者 正在检查更新 */
    private _updating: boolean = false;

    /** 更新实例 */
    private _hotUpdate: HotUpdate = null;

    /** 
     * 热更新文件存放的可写路径
     */
    public get writablePath(): string {
        return this._writablePath;
    }

    /**
     * 本地manifest路径
     */
    public get manifestUrl(): string {
        return this._manifestUrl;
    }

    /** 
     * 传入的游戏版本号
     */
    public get version(): string {
        return this._version;
    }

    /** 
     * 获取资源版本号, 须初始化成功后再使用
     * @return 资源版本号 默认值 ‘0’
     */
    public get resVersion(): string {
        if (this._resVersion === null) {
            this._resVersion = new HotUpdate().resVersion;
        }
        return this._resVersion;
    }

    public set resVersion(version: string) {
        if (this._resVersion === null) {
            this._resVersion = version;
        }
    }

    /**
     * 1. 初始化热更新管理器
     * @param manifestUrl 传入本地manifest文件地址 资源的assets.nativeUrl
     * @param version 游戏版本号 eg: 1.0.0
     */
    public init(manifestUrl: string, version: string): void {
        if (this._isInitialized) {
            log(`${TAG} 热更新管理器不需要重复初始化`);
            return;
        }
        this._isInitialized = true;
        this._manifestUrl = manifestUrl;
        this._version = version;

        let writablePath = native?.fileUtils?.getWritablePath() || "";
        if (!writablePath.endsWith("/")) {
            writablePath += "/";
        }
        this._writablePath = `${writablePath}hot-update/${version}/`;
        log(`${TAG}可写路径:${this._writablePath}`);
    }

    /** 
     * 检查是否存在热更新
     * 提供一个对外的方法检查是否存在热更新
     * @return {Promise<ICheckUpdatePromiseResult>} 
     */
    public checkUpdate(): Promise<ICheckUpdatePromiseResult> {
        return new Promise((resolve, reject) => {
            if (!Platform.isNativeMobile) {
                reject({ code: HotUpdateCode.PlatformNotSupported, message: "当前平台不需要热更新" });
                return;
            }
            if (!this._isInitialized) {
                reject({ code: HotUpdateCode.NotInitialized, message: "未初始化, 需要先调用init方法" });
                return;
            }
            if (this._updating) {
                reject({ code: HotUpdateCode.Updating, message: "正在更新或者正在检查更新中" });
                return;
            }
            this._updating = true;
            this._hotUpdate = new HotUpdate();
            this._hotUpdate.checkUpdate().then((res) => {
                this._updating = false;
                // 有更新
                resolve(res);
            }).catch((res: ICheckUpdatePromiseResult) => {
                this._updating = false;
                // 无更新
                reject(res);
            });
        });
    }

    /**
     * 开始热更新
     * @param res.skipCheck 是否跳过检查更新
     * @param res.progress 更新进度回调 kb: 已下载的资源大小, total: 总资源大小 (kb)
     * @param res.complete 更新结束回调 根据错误码判断 跳过还是重试失败资源
     */
    public startUpdate(res: { skipCheck: boolean, progress: (kb: number, total: number) => void, complete: (code: HotUpdateCode, message: string) => void }): void {
        if (!Platform.isNativeMobile) {
            res.complete(HotUpdateCode.PlatformNotSupported, "当前平台不需要热更新");
            return;
        }
        if (!this._isInitialized) {
            res.complete(HotUpdateCode.NotInitialized, "未初始化, 需要先调用init方法");
            return;
        }
        if (this._updating) {
            res.complete(HotUpdateCode.Updating, "正在更新或者正在检查更新");
            return;
        }
        this._updating = true;
        if (res.skipCheck && this._hotUpdate) {
            this._hotUpdate.startUpdate({
                skipCheck: res.skipCheck,
                progress: res.progress,
                complete: (code: HotUpdateCode, message: string) => {
                    this._updating = false;
                    res.complete(code, message);
                }
            });
        } else {
            this._hotUpdate = new HotUpdate();
            this._hotUpdate.startUpdate({
                skipCheck: false,
                progress: res.progress,
                complete: (code: HotUpdateCode, message: string) => {
                    this._updating = false;
                    res.complete(code, message);
                }
            });
        }
    }

    /** 重试失败的资源 */
    public retryUpdate(): void {
        if (!this._hotUpdate) {
            throw new Error(`${TAG} 使用前 必须使用过startUpdate方法`);
        }
        this._hotUpdate.retryUpdate();
    }
}
