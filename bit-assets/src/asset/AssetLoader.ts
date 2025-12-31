/**
 * @Author: Gongxh
 * @Date: 2025-02-11
 * @Description: 资源加载器
 */

import { Asset, AssetManager, resources } from "cc";
import { AssetInfo } from "./AssetInfo";
import { AssetLoaderAgent } from "./AssetLoaderAgent";
import { AssetPool } from "./AssetPool";
import { AssetUtils } from "./AssetUtils";
import { ErrorCode, IAssetConfig, StateType } from "./header";

export class AssetLoader extends AssetLoaderAgent {
    /** @internal */
    protected _name: string = "";

    /** 
     * 当前并行加载数量
     * @internal
     */
    private _parallel: number = 0;

    /** 
     * 失败重试次数
     * @internal
     */
    private _retry: number = 0;

    /** 
     * 获取资源数量是否成功
     * @internal
     */
    private _initSuccess: boolean = false;

    /** @internal */
    private _configs: IAssetConfig[] = [];

    constructor(batchName?: string) {
        super();
        this._name = batchName || "";
    }

    /**
     * 开始加载资源
     * @param {IAssetConfig[]} res.configs 资源配置
     */
    public start(assetConfigs: IAssetConfig[]): void {
        this._configs = assetConfigs;
        this.onStart();
    }

    private onStart(): void {
        this.initialize();
        this._initSuccess = false;
        let initCount = this._configs.length;
        for (const info of this._configs) {
            let bundlename = info.bundle || "resources";
            if (bundlename == "resources") {
                let count = AssetUtils.getResourceCount(info.path, info.type, resources);
                this.setTotalCount(bundlename, info.path, count);

                this.addAssetInfo(new AssetInfo(info, resources));
                initCount--;
                initCount <= 0 && this.initSuccess();
            } else {
                AssetUtils.loadBundle(bundlename).then((bundle: AssetManager.Bundle) => {
                    let count = AssetUtils.getResourceCount(info.path, info.type, bundle);
                    this.setTotalCount(bundlename, info.path, count);

                    this.addAssetInfo(new AssetInfo(info, bundle));
                    initCount--;
                    initCount <= 0 && this.initSuccess();
                }).catch((err: Error) => {
                    if (this._retry < this._maxRetry) {
                        this._retry++;
                        this.onStart();
                    } else {
                        this.failCallback(ErrorCode.BundleLoadFailed, `加载bundle【${bundlename}】失败`);
                    }
                });
            }
        }
    }

    /** 
     * 初始化成功后，开始批量加载资源
     * @internal
     */
    private initSuccess(): void {
        this._initSuccess = true;
        this._parallel = 0;
        let maxLoad = Math.min(this.getAssetsCount(), this._maxParallel);
        for (let i = 0; i < maxLoad; i++) {
            this.loadNext();
        }
    }

    /** 
     * 加载下一个资源
     * @internal
     */
    private loadNext(): void {
        // 存在等待中的资源，则加载等待中的资源
        let index = this.getFirstWaitIndex();
        if (index > -1) {
            this.loadItem(index);
            return;
        }
        // 所有资源全部完成了，则完成
        if (this.isAllFinished()) {
            this.completeAll();
            return;
        }

        // 如果当前并行数量 > 0 则跳过
        if (this._parallel > 0) {
            return;
        }

        // 重试次数小于最大次数 则开始重试
        if (this._retry < this._maxRetry) {
            this.retryLoad();
            return;
        }
        // 最终资源加载失败了
        this.downloadFaildAnalysis();
    }

    /** 
     * 加载资源
     * @internal
     */
    private loadItem(index: number): void {
        let item = this.getAssetInfo(index);
        item.status = StateType.Loading;
        this._parallel++;

        if (item.isFile) {
            // 加载单个资源文件
            AssetUtils.loadFile(item.assetBundle, item.path, item.type, {
                complete: (asset: Asset) => {
                    this._parallel--;
                    item.status = StateType.Finish;
                    AssetPool.add(asset, item.assetBundle, this._name);
                    this.updateCompleteCount(item.bundle, item.path, 1, 1);
                    this.loadNext();
                },
                fail: () => {
                    this._parallel--;
                    item.status = StateType.Error;
                    this.loadNext();
                }
            });
        } else {
            // 加载文件夹
            AssetUtils.loadDir(item.assetBundle, item.path, item.type, {
                complete: (assets: Asset[]) => {
                    this._parallel--;
                    item.status = StateType.Finish;
                    AssetPool.add(assets, item.assetBundle, this._name);
                    this.loadNext();
                },
                fail: () => {
                    this._parallel--;
                    item.status = StateType.Error;
                    this.loadNext();
                },
                progress: (value: number, total: number) => {
                    (value > 0 && total > 0) && this.updateCompleteCount(item.bundle, item.path, value, total);
                }
            });
        }
    }

    /** 重新加载失败的资源 */
    public retryDownLoadFailedAssets(): void {
        this._parallel = 0;
        this._retry = 0;
        if (!this._initSuccess) {
            this._retry++;
            this.onStart();
        } else {
            this.retryLoad();
        }
    }

    /** 
     * 重试加载资源
     * @internal
     */
    private retryLoad(): void {
        this._retry++;
        let count = this.resetErrorAssets();
        let maxLoad = Math.min(count, this._maxParallel);
        for (let i = 0; i < maxLoad; i++) {
            this.loadNext();
        }
    }
}
