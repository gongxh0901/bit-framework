/**
 * @Author: Gongxh
 * @Date: 2025-04-19
 * @Description: 热更新实例
 */

import { debug, Time, Utils } from "@gongxh/bit-core";
import { ReadNetFile } from "@gongxh/bit-net";
import { game, native, sys } from "cc";
import { HotUpdateManager } from "./HotUpdateManager";

interface IHotUpdateConfig {
    packageUrl: string;
    remoteManifestUrl: string;
    remoteVersionUrl: string;
    version: string;
}

export enum HotUpdateCode {
    /** 是最新版本 或者 不需要热更 */
    LatestVersion = -1001,
    /** 更新中 */
    Updating = -1002,
    /** 更新失败 等待重试 */
    WaitRetry = -1003,
    /** 更新错误 */
    UpdateError = -1004,
    /** 检查更新错误 */
    CheckError = -1005,
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
     * @return {number} 
     */
    public async checkUpdate(): Promise<{ needUpdate: boolean, size?: number }> {
        // 读取本地 project.manifest
        const localManifest = await this.readLocalManifest();
        // 加载远程 version.manifest
        const versionManifest = await this.loadRemoteVersionManifest();
        if (Utils.compareVersion(localManifest.version, versionManifest.version) >= 0) {
            return { needUpdate: false };
        }
        // 刷新本地 manifest
        this.refreshLocalManifest(localManifest, versionManifest);
        // 检查更新
        return await this.startCheckUpdate();
    }

    /**
     * 开始热更新
     * @param res.skipCheck 是否跳过检查更新
     * @param res.progress 更新进度回调 kb: 已下载的资源大小, total: 总资源大小 (kb)
     * @param res.complete 更新结束回调 根据错误码判断 跳过还是重试失败资源
     */
    public async startUpdate(res: { skipCheck?: boolean, progress: (kb: number, total: number) => void, complete: (code: HotUpdateCode, message: string) => void }): Promise<void> {
        this._progress = res.progress;
        this._complete = res.complete;

        if (res.skipCheck) {
            this.startUpdateTask();
        } else {
            try {
                const result = await this.checkUpdate();
                if (result.needUpdate) {
                    this.startUpdateTask();
                } else {
                    this._complete(HotUpdateCode.LatestVersion, "是最新版本");
                }
            } catch (error) {
                // 检查更新失败了
                this._complete(HotUpdateCode.CheckError, error instanceof Error ? error.message : "检查更新出错");
            }
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
                    this._complete(HotUpdateCode.WaitRetry, event.getMessage());
                    break;
                }
                case native.EventAssetsManager.ERROR_UPDATING: {
                    // 更新出错了, 一般是开发中的问题, 重启游戏
                    this._complete(HotUpdateCode.UpdateError, event.getMessage());
                    break;
                }
                case native.EventAssetsManager.ERROR_DECOMPRESS: {
                    // 解压出错了, 一般是开发中的问题, 重启游戏
                    this._complete(HotUpdateCode.UpdateError, event.getMessage());
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
    private async readLocalManifest(): Promise<IHotUpdateConfig> {
        if (!this._am) {
            throw new Error("native.AssetsManager 未初始化");
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
            throw new Error("本地project.manifest文件数据为空");
        }
        return JSON.parse(content)
    }

    /** 读取远程version.manifest文件内容 */
    private async loadRemoteVersionManifest(): Promise<IHotUpdateConfig> {
        const versionManifest = await ReadNetFile.read<string>({ url: this.versionUrl });
        if (!Utils.isJsonString(versionManifest)) {
            throw new Error("远程version.manifest文件格式错误");
        }
        return JSON.parse(versionManifest);
    }

    /** 替换project.manifest中的内容 并刷新本地manifest */
    private refreshLocalManifest(manifest: IHotUpdateConfig, versionManifest: IHotUpdateConfig): void {
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
    }

    /** 调用cc的接口检测更新 */
    private startCheckUpdate(): Promise<{ needUpdate: boolean, size?: number }> {
        return new Promise((resolve, reject) => {
            // 设置回调
            this._am.setEventCallback((event: native.EventAssetsManager) => {
                let eventCode = event.getEventCode();
                // log(`${TAG} 检查更新回调code:${eventCode}`);
                switch (eventCode) {
                    case native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST: {
                        this._am.setEventCallback(null);
                        reject(new Error("检查更新时下载manifest文件失败"));
                        break;
                    }
                    case native.EventAssetsManager.ERROR_PARSE_MANIFEST: {
                        this._am.setEventCallback(null);
                        reject(new Error("检查更新时解析manifest文件失败"));
                        break;
                    }
                    case native.EventAssetsManager.ALREADY_UP_TO_DATE: {
                        this._am.setEventCallback(null);
                        resolve({ needUpdate: false, size: 0 });
                        break;
                    }
                    case native.EventAssetsManager.NEW_VERSION_FOUND: {
                        // 发现新版本
                        this._am.setEventCallback(null);
                        resolve({ needUpdate: true, size: this._am.getTotalBytes() / 1024 });
                        break;
                    }
                    default: {
                        break;
                    }
                }
            });
            this._am.checkUpdate();
        });
    }
}
