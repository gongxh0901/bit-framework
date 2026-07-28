/**
 * @Author: Gongxh
 * @Date: 2025-04-19
 * @Description: 热更新实例
 */

import { debug, ICheckUpdatePromiseResult, IPromiseResult, Time, Utils, warn } from "@gongxh/bit-core";
import { ReadNetFile } from "@gongxh/bit-net";
import { game, native, sys } from "cc";
import { HotUpdateManager } from "./HotUpdateManager";

interface IHotUpdateConfig {
    packageUrl: string;
    remoteManifestUrl: string;
    remoteVersionUrl: string;
    version: string;
}

export interface IManifestResult extends IPromiseResult {
    manifest?: IHotUpdateConfig;
}

export enum HotUpdateCode {
    /** 成功 */
    Succeed = 0,
    /** 平台不支持 不需要热更新 */
    PlatformNotSupported = -1000,
    /** 未初始化 */
    NotInitialized = -1001,
    /** 是最新版本 */
    LatestVersion = -1002,
    /** 更新中 */
    Updating = -1003,
    /** 加载本地manifest失败 */
    LoadManifestFailed = -1004,
    /** 下载manifest文件失败 */
    ParseManifestFailed = -1005,

    /** 下载version.manifest失败 */
    LoadVersionFailed = -1006,
    /** 解析version.manifest失败 */
    ParseVersionFailed = -1007,


    /** 更新失败 需要重试 */
    UpdateFailed = -1008,
    /** 更新错误 */
    UpdateError = -1009,
    /** 解压错误 */
    DecompressError = -1010,
}

const TAG = "hotupdate:";
export class HotUpdate {
    /** 资源管理器 */
    private _am: native.AssetsManager = null;
    /** 更新进度回调 */
    private _progress: (kb: number, total: number) => void = null;
    private _complete: (code: HotUpdateCode, message: string) => void = null;

    public get resVersion(): string {
        return this._am?.getLocalManifest()?.getVersion() || "0";
    }

    /** 获取 version.manifest 文件的远程地址 */
    private get versionUrl(): string {
        return this._am?.getLocalManifest()?.getVersionFileUrl() || "";
    }

    constructor() {
        let writablePath = HotUpdateManager.getInstance().writablePath;
        let manifestUrl = HotUpdateManager.getInstance().manifestUrl;

        // 创建 am 对象
        this._am = new native.AssetsManager(manifestUrl, writablePath, Utils.compareVersion);
        this._am?.setVerifyCallback(this._verifyCallback);
        HotUpdateManager.getInstance().resVersion = this.resVersion;
    }

    /** 重试失败的资源 */
    public retryUpdate(): void {
        this._am.downloadFailedAssets();
    }

    /** 
     * 检查是否存在热更新
     * 提供一个对外的方法检查是否存在热更新
     * @return {Promise<ICheckUpdatePromiseResult>} 
     */
    public async checkUpdate(): Promise<ICheckUpdatePromiseResult> {
        // 读取本地 project.manifest
        const localRes = await this.readLocalManifest();
        if (localRes.code !== HotUpdateCode.Succeed) {
            throw localRes;
        }

        // 加载远程 version.manifest
        const remoteRes = await this.loadRemoteVersionManifest();
        if (remoteRes.code !== HotUpdateCode.Succeed) {
            throw remoteRes;
        }

        // 刷新本地 manifest
        const refreshRes = await this.refreshLocalManifest(localRes.manifest, remoteRes.manifest);
        if (refreshRes.code !== HotUpdateCode.Succeed) {
            throw refreshRes;
        }

        // 检查更新
        const checkRes = await this.startCheckUpdate();
        if (checkRes.code !== HotUpdateCode.Succeed) {
            throw checkRes;
        }
        return checkRes;
    }

    /**
     * 开始热更新
     * @param res.skipCheck 是否跳过检查更新
     * @param res.progress 更新进度回调 kb: 已下载的资源大小, total: 总资源大小 (kb)
     * @param res.complete 更新结束回调 根据错误码判断 跳过还是重试失败资源
     */
    public startUpdate(res: { skipCheck?: boolean, progress: (kb: number, total: number) => void, complete: (code: HotUpdateCode, message: string) => void }): void {
        this._progress = res.progress;
        this._complete = res.complete;

        if (res.skipCheck) {
            this.startUpdateTask();
        } else {
            this.checkUpdate().then(res => {
                this.startUpdateTask();
            }).catch((res: ICheckUpdatePromiseResult) => {
                this._complete(res.code, res.message);
            });
        }
    }

    private startUpdateTask(): void {
        this._am.setEventCallback((event: native.EventAssetsManager) => {
            let eventCode = event.getEventCode();
            debug(`${TAG} 更新回调code:${eventCode}`);
            switch (eventCode) {
                case native.EventAssetsManager.UPDATE_PROGRESSION: {
                    let bytes = event.getDownloadedBytes() / 1024;
                    let total = event.getTotalBytes() / 1024;
                    this._progress(bytes, total);
                    break;
                }
                case native.EventAssetsManager.UPDATE_FINISHED: {
                    // 更新完成 自动重启
                    this._am.setEventCallback(null);

                    // Prepend the manifest's search path
                    let searchPaths = native.fileUtils.getSearchPaths();
                    // log(`${TAG} 当前搜索路径:${JSON.stringify(searchPaths)}`);

                    let newPaths = this._am.getLocalManifest().getSearchPaths();
                    // log(`${TAG} 新搜索路径:${JSON.stringify(newPaths)}`);

                    Array.prototype.unshift.apply(searchPaths, newPaths);
                    sys.localStorage.setItem('hotupdate::version', HotUpdateManager.getInstance().version);
                    sys.localStorage.setItem('hotupdate::searchpaths', JSON.stringify(searchPaths));
                    native.fileUtils.setSearchPaths(searchPaths);

                    // 0.5秒后 自动重启游戏
                    setTimeout(() => { game.restart(); }, 500);
                    break;
                }
                case native.EventAssetsManager.UPDATE_FAILED: {
                    // 更新失败了, 等待重试
                    this._complete(HotUpdateCode.UpdateFailed, event.getMessage());
                    break;
                }
                case native.EventAssetsManager.ERROR_UPDATING: {
                    // 更新出错了, 一般是开发中的问题, 重启游戏
                    this._complete(HotUpdateCode.UpdateError, event.getMessage());
                    break;
                }
                case native.EventAssetsManager.ERROR_DECOMPRESS: {
                    // 解压出错了, 一般是开发中的问题, 重启游戏
                    this._complete(HotUpdateCode.DecompressError, event.getMessage());
                    break;
                }
                default:
                    break;
            }
        });
        this._am.update();
    }

    /** 验证资源 */
    private _verifyCallback(path: string, asset: native.ManifestAsset): boolean {
        // 资源是否被压缩, 如果压缩我们不需要检查它的md5值
        let compressed = asset.compressed;
        if (compressed) {
            return true;
        }
        // 预期的md5
        let expectedMD5 = asset.md5;
        // 资源大小
        let size = asset.size;
        // 验证资源md5
        // log(`${TAG} 记录的md5:${expectedMD5} 文件大小:${size} 文件相对路径:${asset.path} 绝对路径:${path}`);
        return true;
    }

    /** 读取本地的project.manifest文件 */
    private async readLocalManifest(): Promise<IManifestResult> {
        if (!this._am) {
            throw { code: HotUpdateCode.LoadManifestFailed, message: "读取本地project.manifest文件失败" };
        }
        const writablePath = HotUpdateManager.getInstance().writablePath;
        const cacheManifestPath = writablePath + "project.manifest";

        let content = "";
        if (native.fileUtils.isFileExist(cacheManifestPath)) {
            content = native.fileUtils.getStringFromFile(cacheManifestPath);
        } else {
            const manifestUrl = HotUpdateManager.getInstance().manifestUrl;
            content = native.fileUtils.getStringFromFile(manifestUrl);
        }
        if (!content) {
            throw { code: HotUpdateCode.LoadManifestFailed, message: "读取本地project.manifest文件失败" };
        }
        return { code: HotUpdateCode.Succeed, message: "succeed", manifest: JSON.parse(content) }
    }

    /** 读取远程version.manifest文件内容 */
    private async loadRemoteVersionManifest(): Promise<IManifestResult> {
        try {
            const content = await ReadNetFile.read<string>({ url: this.versionUrl });
            if (Utils.isJsonString(content)) {
                return { code: HotUpdateCode.Succeed, message: "succeed", manifest: JSON.parse(content) };
            }
            return { code: HotUpdateCode.ParseVersionFailed, message: "远程version.manifest文件格式错误" };
        } catch (error: any) {
            // { code: number, message: string }
            warn(`${TAG} 读取远程version.manifest文件失败`, error?.code, error?.message);
            throw { code: HotUpdateCode.LoadVersionFailed, message: "读取远程version.manifest文件失败" };
        }
    }

    /** 替换project.manifest中的内容 并刷新本地manifest */
    private async refreshLocalManifest(manifest: IHotUpdateConfig, versionManifest: IHotUpdateConfig): Promise<IPromiseResult> {
        if (Utils.compareVersion(manifest.version, versionManifest.version) >= 0) {
            return { code: HotUpdateCode.LatestVersion, message: "已是最新版本" };
        }
        // 替换manifest中的内容
        const now = `${Time.now()}`;
        manifest.remoteManifestUrl = Utils.addUrlParam(versionManifest.remoteManifestUrl, "timeStamp", now);
        manifest.remoteVersionUrl = Utils.addUrlParam(versionManifest.remoteVersionUrl, "timeStamp", now);
        manifest.packageUrl = versionManifest.packageUrl;

        // 注册本地 manifest 根目录
        const manifestUrl = HotUpdateManager.getInstance().manifestUrl;
        let found = manifestUrl.lastIndexOf("/");
        if (found === -1) {
            found = manifestUrl.lastIndexOf("\\");
        }
        const manifestRoot = found !== -1 ? manifestUrl.substring(0, found + 1) : "";
        this._am.getLocalManifest().parseJSONString(JSON.stringify(manifest), manifestRoot);
        // log(TAG + "manifest root:" + this._am.getLocalManifest().getManifestRoot());
        // log(TAG + "manifest packageUrl:" + this._am.getLocalManifest().getPackageUrl());
        // log(TAG + "manifest version:" + this._am.getLocalManifest().getVersion());
        // log(TAG + "manifest versionFileUrl:" + this._am.getLocalManifest().getVersionFileUrl());
        // log(TAG + "manifest manifestFileUrl:" + this._am.getLocalManifest().getManifestFileUrl());
        return { code: HotUpdateCode.Succeed, message: "succeed" };
    }

    /** 调用cc的接口检测更新 */
    private startCheckUpdate(): Promise<ICheckUpdatePromiseResult> {
        return new Promise((resolve) => {
            // 设置回调
            this._am.setEventCallback((event: native.EventAssetsManager) => {
                let eventCode = event.getEventCode();
                // log(`${TAG} 检查更新回调code:${eventCode}`);
                switch (eventCode) {
                    case native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                        this.finishCheckUpdate(resolve, { code: HotUpdateCode.LoadManifestFailed, message: "检查更新时下载manifest文件失败", size: 0 });
                        return;
                    case native.EventAssetsManager.ERROR_PARSE_MANIFEST:
                        this.finishCheckUpdate(resolve, { code: HotUpdateCode.ParseManifestFailed, message: "检查更新时解析manifest文件失败", size: 0 });
                        return;
                    case native.EventAssetsManager.ALREADY_UP_TO_DATE:
                        this.finishCheckUpdate(resolve, { code: HotUpdateCode.LatestVersion, message: "已是最新版本", size: 0 });
                        return;
                    case native.EventAssetsManager.NEW_VERSION_FOUND:
                        // 发现新版本
                        this.finishCheckUpdate(resolve, { code: HotUpdateCode.Succeed, message: "发现新版本", size: this._am.getTotalBytes() / 1024 });
                        return;
                }
            });
            this._am.checkUpdate();
        });
    }

    private finishCheckUpdate(resolve: (result: ICheckUpdatePromiseResult) => void, result: ICheckUpdatePromiseResult): void {
        this._am.setEventCallback(null);
        resolve(result);
    }
}
