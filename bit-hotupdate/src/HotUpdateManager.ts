/**
 * @Author: Gongxh
 * @Date: 2025-03-20
 * @Description: 热更新管理器
 */

import { log, Platform } from "@gongxh/bit-core";
import { native, sys } from "cc";
import { HotUpdate, HotUpdateCode } from "./HotUpdate";

const TAG = "hotupdate:";
const ONCE_HOTUPDATE_TEMP_MODIFY_VERSION_MANIFEST = "bit-framework-once-hotupdate-temp-modify-version-manifest";

export class HotUpdateManager {
    private static instance: HotUpdateManager;
    public static getInstance(): HotUpdateManager {
        if (!HotUpdateManager.instance) {
            HotUpdateManager.instance = new HotUpdateManager();
            HotUpdateManager.instance.tempVersionManifestName = sys.localStorage.getItem(ONCE_HOTUPDATE_TEMP_MODIFY_VERSION_MANIFEST) || "";
            sys.localStorage.removeItem(ONCE_HOTUPDATE_TEMP_MODIFY_VERSION_MANIFEST);
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

    /** 临时用的 version.manifest 文件名 */
    public tempVersionManifestName: string = '';

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
     * @param version 带build号的游戏版本号 eg: 1.0.0.23
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
     * @return {Promise<{ needUpdate: boolean, size?: number }>} 
     * @return {needUpdate} 是否需要更新
     * @return {size} 需要更新的资源大小 (KB)
     */
    public async checkUpdate(): Promise<{ needUpdate: boolean, size?: number }> {
        if (!Platform.isNativeMobile) {
            return { needUpdate: false };
        }
        if (!this._isInitialized) {
            throw new Error("未初始化, 需要先调用init方法");
        }
        if (this._updating) {
            throw new Error("正在更新或者正在检查更新中");
        }
        this._updating = true;

        try {
            this._hotUpdate = new HotUpdate();
            return await this._hotUpdate.checkUpdate();
        } finally {
            this._updating = false;
        }
    }

    /**
     * 开始热更新
     * @param res.skipCheck 是否跳过检查更新
     * @param res.progress 更新进度回调 kb: 已下载的资源大小, total: 总资源大小 (kb)
     * @param res.complete 更新结束回调 根据错误码判断 跳过还是重试失败资源
     */
    public startUpdate(res: { skipCheck: boolean, progress: (kb: number, total: number) => void, complete: (code: HotUpdateCode, message: string) => void }): void {
        if (!Platform.isNativeMobile) {
            res.complete(HotUpdateCode.LatestVersion, "当前平台不需要热更新");
            return;
        }
        if (!this._isInitialized) {
            throw new Error("HotUpdateManager 未初始化, 需要先调用init方法");
        }
        if (this._updating) {
            res.complete(HotUpdateCode.Updating, "正在更新或者正在检查更新");
            return;
        }
        this._updating = true;
        this._hotUpdate = (res.skipCheck && this._hotUpdate) ? this._hotUpdate : new HotUpdate();
        this._hotUpdate.startUpdate({
            skipCheck: res.skipCheck || false,
            progress: res.progress,
            complete: (code: HotUpdateCode, message: string) => {
                this._updating = false;
                res.complete(code, message);
            }
        });
    }

    /** 重试失败的资源 */
    public retryUpdate(): void {
        if (!this._hotUpdate) {
            throw new Error(`${TAG} 使用前 必须使用过startUpdate方法`);
        }
        this._hotUpdate.retryUpdate();
    }

    /** 保存一个测试用的标记，下次热更新替换掉 version.manifest 文件的文件名，从读取指定的文件用来热更, 方便线上版本测试 */
    public onceModifyVersionManifestUrlName(name: string): void {
        sys.localStorage.setItem(ONCE_HOTUPDATE_TEMP_MODIFY_VERSION_MANIFEST, name);
    }
}
