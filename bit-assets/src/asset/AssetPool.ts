/**
 * @Author: Gongxh
 * @Date: 2025-02-11
 * @Description: 资源池
 */

import { Asset, AssetManager, resources } from "cc";
import { AssetUtils } from "./AssetUtils";

export class AssetPool {
    /** 
     * 资源名对应的资源
     * @internal
     */
    private static _assets: Map<string, Asset> = new Map();
    /** 
     * uuid 对应的资源名
     * @internal
    */
    private static _uuidToName: Map<string, string> = new Map();

    /** @internal */
    private static _batchAssetNames: Map<string, Set<string>> = new Map();

    /** @internal */
    private static _assetToBatchName: WeakMap<Asset, string> = new WeakMap();


    /** 添加资源 */
    public static add(asset: Asset[] | Asset, bundle: AssetManager.Bundle = resources, batchName: string = ""): void {
        if (Array.isArray(asset)) {
            for (const item of asset) {
                this.add(item, bundle, batchName);
            }
        } else {
            let uuid = asset.uuid || asset._uuid;
            if (this._uuidToName.has(uuid)) {
                return;
            }
            // 增加引用计数
            asset.addRef();
            let info = bundle.getAssetInfo(uuid);
            let key = this.getKey(info.path, bundle.name);
            // log(`>>>uuid:${uuid}, path:${info.path}`);
            this._uuidToName.set(uuid, key);
            this._assets.set(key, asset);

            // 添加到批次
            this.addToBatch(batchName, key, asset);
        }
    }

    private static addToBatch(batchName: string, key: string, asset: Asset): void {
        if (!batchName) {
            return;
        }
        if (!this._batchAssetNames.has(batchName)) {
            this._batchAssetNames.set(batchName, new Set());
        }
        this._batchAssetNames.get(batchName).add(key);
        this._assetToBatchName.set(asset, batchName);
    }

    public static getAllAssetPaths(): string[] {
        return Array.from(this._assets.keys());
    }

    /** 
     * 检查资源是否存在
     * @param path 资源在bundle下的路径
     * @param bundlename 资源bundle名 默认 resources
     */
    public static has(path: string, bundlename: string = "resources"): boolean {
        let key = this.getKey(path, bundlename);
        return this._assets.has(key);
    }
    /** 
     * 获取资源
     * @param path 资源在bundle下的路径
     * @param bundlename 资源bundle名 默认 resources
     */
    public static get<T extends Asset>(path: string, bundlename: string = "resources"): T {
        let key = this.getKey(path, bundlename);
        if (!this._assets.has(key)) {
            console.warn(`获取资源失败: 资源 bundle:${bundlename}, path:${path} 未加载`);
        }
        return this._assets.get(key) as T;
    }

    /** 
     * 按 uuid 判断资源是否存在
     */
    public static hasUUID(uuid: string): boolean {
        if (!this._uuidToName.has(uuid)) {
            return false;
        }
        return true;
    }

    /** 
     * 按 uuid 获取资源
     */
    public static getByUUID<T extends Asset>(uuid: string): T {
        if (!this._uuidToName.has(uuid)) {
            console.warn(`获取资源失败: 资源 uuid:${uuid} 未加载`);
        }
        let key = this._uuidToName.get(uuid);
        return this._assets.get(key) as T;
    }

    /** 
     * 按资源加载批次释放资源
     * @param batchName 资源加载批次名 对应 AssetLoader 实例化时传入的 name
     */
    public static releaseBatchAssets(batchName: string): void {
        if (!this._batchAssetNames.has(batchName)) {
            return;
        }
        let names = this._batchAssetNames.get(batchName);
        for (const name of names) {
            this.release(name);
        }
        this._batchAssetNames.delete(batchName);
    }

    /** 
     * 按资源路径释放资源
     * @param path 资源在bundle下的路径
     * @param bundlename 资源bundle名 默认 resources
     */
    public static releasePath(path: string, bundlename: string = "resources"): void {
        let key = this.getKey(path, bundlename);
        this.release(key);
    }

    /** 
     * 按 bundle、文件夹和资源类型释放资源
     * @param dir 资源在bundle下的路径
     * @param bundlename 资源bundle名 默认 resources
     * @param asset 资源类型 不传表示所有类型的资源
     */
    public static releaseDir(dir: string, bundlename: string = "resources", asset?: typeof Asset): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (bundlename == "resources") {
                let uuids = AssetUtils.getUUIDs(dir, asset, resources);
                for (const uuid of uuids) {
                    this.releaseUUID(uuid);
                }
                resolve(true);
            } else {
                AssetUtils.loadBundle(bundlename).then((bundle: AssetManager.Bundle) => {
                    let uuids = AssetUtils.getUUIDs(dir, asset, bundle);
                    for (const uuid of uuids) {
                        this.releaseUUID(uuid);
                    }
                    resolve(true);
                }).catch((err: Error) => {
                    reject(false);
                });
            }
        });
    }

    /** 
     * 按 uuid 释放资源
     */
    public static releaseUUID(uuid: string): void {
        if (this._uuidToName.has(uuid)) {
            let key = this._uuidToName.get(uuid);
            this.release(key);
        }
    }

    /** 
     * 释放所有加载的资源
     */
    public static releaseAll(): void {
        this._assets.forEach((asset, key) => {
            asset.decRef();
        });
        this._assets.clear();
        this._uuidToName.clear();
        this._batchAssetNames.clear();
    }

    /** 
     * 按key释放资源
     * @internal
     */
    private static release(key: string): void {
        if (this._assets.has(key)) {
            let asset = this._assets.get(key);

            if (this._assetToBatchName.has(asset)) {
                let batchName = this._assetToBatchName.get(asset);
                this._batchAssetNames.get(batchName).delete(key);
                this._assetToBatchName.delete(asset);
            }

            this._uuidToName.delete(asset.uuid);
            asset.decRef();
            this._assets.delete(key);
        } else {
            console.warn(`释放资源失败: 资源【${key}】未加载`);
        }
    }

    /** 
     * 获取资源 key
     * @internal
     */
    private static getKey(path: string, bundlename: string = "resources"): string {
        return `${bundlename}:${path}`;
    }
}
