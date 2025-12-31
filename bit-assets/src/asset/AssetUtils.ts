/**
 * @Author: Gongxh
 * @Date: 2025-02-11
 * @Description: 资源工具类
 */

import { Asset, AssetManager, assetManager, resources } from "cc";
import { ErrorCode } from "./header";

export class AssetUtils {
    /** 获取资源数量 */
    public static getResourceCount(dir: string, type: typeof Asset, bundle: AssetManager.Bundle = resources): number {
        dir = assetManager.utils.normalize(dir);
        if (dir[dir.length - 1] === "/") {
            dir = dir.slice(0, -1);
        }
        let list = bundle.getDirWithPath(dir, type);
        return list.length;
    }

    /** 获取资源名称 */
    public static getUUIDs(dir: string, type: typeof Asset, bundle: AssetManager.Bundle = resources): string[] {
        let uuids: string[] = [];
        let path = assetManager.utils.normalize(dir);
        if (path[path.length - 1] === "/") {
            path = path.slice(0, -1);
        }
        let list = bundle.getDirWithPath(path, type);
        for (const asset of list) {
            uuids.push(asset.uuid);
        }
        return uuids;
    }

    /** 加载 bundle */
    public static loadBundle(bundlename: string): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            let bundle = assetManager.getBundle(bundlename);
            if (bundle) {
                resolve(bundle);
            } else {
                assetManager.loadBundle(bundlename, (err: Error, bundle: AssetManager.Bundle) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(bundle);
                    }
                });
            }
        });
    }

    /** 
     * 加载单个资源
     * @param bundle 资源包名或资源包
     * @param path 资源路径
     * @param type 资源类型
     * @param callbacks 回调函数
     */
    public static loadFile<T extends typeof Asset>(bundle: string | AssetManager.Bundle, path: string, type: T, callbacks?: { complete?: (asset: Asset) => void, fail?: (code: ErrorCode, msg: string) => void }): void {
        if (typeof bundle === "string") {
            AssetUtils.loadBundle(bundle).then((bundle: AssetManager.Bundle) => {
                // 加载单个资源
                bundle.load(path, type, (error: Error, asset: Asset) => {
                    if (error) {
                        callbacks?.fail?.(ErrorCode.FileLoadFailed, `加载资源失败【bundle:${bundle} path:${path}】`);
                    } else {
                        callbacks?.complete?.(asset);
                    }
                });
            }).catch((err: Error) => {
                callbacks?.fail?.(ErrorCode.BundleLoadFailed, `加载bundle[${bundle}]失败`);
            });
        } else {
            // 加载单个资源
            bundle.load(path, type, (error: Error, asset: Asset) => {
                if (error) {
                    callbacks?.fail?.(ErrorCode.FileLoadFailed, `加载资源失败【bundle:${bundle.name} path:${path}】`);
                } else {
                    callbacks?.complete?.(asset);
                }
            });
        }
    }

    /** 
     * 加载文件夹下的资源
     * @param bundle 资源包名或资源包
     * @param path 资源路径
     * @param type 资源类型
     * @param callbacks 回调函数
     * @param callbacks.progress 进度回调 value: 已完成数量 total: 总数量
     */
    public static loadDir<T extends typeof Asset>(bundle: string | AssetManager.Bundle, path: string, type: T, callbacks?: { complete?: (assets: Asset[]) => void, fail?: (code: ErrorCode, msg: string) => void, progress?: (value: number, total: number) => void }): void {
        if (typeof bundle === "string") {
            AssetUtils.loadBundle(bundle).then((bundle: AssetManager.Bundle) => {
                bundle.loadDir(path, type,
                    // 进度回调
                    (finished: number, total: number) => { callbacks?.progress?.(finished, total); },
                    // 完成回调
                    (error: Error, assets: Asset[]) => {
                        if (error) {
                            callbacks?.fail?.(ErrorCode.FileLoadFailed, `加载文件夹失败【bundle:${bundle} path:${path}】`);
                        } else {
                            callbacks?.complete?.(assets);
                        }
                    }
                );
            }).catch((err: Error) => {
                callbacks?.fail?.(ErrorCode.BundleLoadFailed, `加载bundle[${bundle}]失败`);
            });
        } else {
            bundle.loadDir(path, type,
                // 进度回调
                (finished: number, total: number) => { callbacks?.progress?.(finished, total); },
                // 完成回调
                (error: Error, assets: Asset[]) => {
                    if (error) {
                        callbacks?.fail?.(ErrorCode.FileLoadFailed, `加载文件夹失败【bundle:${bundle} path:${path}】`);
                    } else {
                        callbacks?.complete?.(assets);
                    }
                }
            );
        }
    }
}
