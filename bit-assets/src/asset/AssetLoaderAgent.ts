/**
 * @Author: Gongxh
 * @Date: 2025-10-21
 * @Description: 
 */

import { AssetInfo } from "./AssetInfo";
import { ErrorCode, StateType } from "./header";

export class AssetLoaderAgent {
    /** @internal */
    protected _maxParallel: number = 10;

    /** @internal */
    protected _maxRetry: number = 0;

    /** 
     * 资源加载项
     * @internal
     */
    private _assetInfos: AssetInfo[] = [];

    /** 
     * 加载完成数量
     * @internal
     */
    private _completeCounts: Map<string, { value: number, total: number }> = new Map();

    /** 是否加载完成 @internal */
    private _isComplete: boolean = false;

    /** 
     * 设置最大并行数量
     * @param {number} parallel 最大并行数量
     */
    public set parallel(parallel: number) {
        this._maxParallel = Math.max(1, parallel);
    }

    /** 
     * 设置失败重试次数
     * @param {number} retry 失败重试次数 默认: 0
     */
    public set retry(retry: number) {
        this._maxRetry = retry;
    }

    /** @internal */
    protected initialize(): void {
        this._isComplete = false;
        this._assetInfos.length = 0;
        this._completeCounts.clear();
    }


    /** 
     * 设置资源总数量
     * @param bundle bundle名
     * @param path 资源路径
     * @param total 总数量
     * @internal
     */
    protected setTotalCount(bundle: string, path: string, total: number): void {
        let key = `${bundle}:${path}`;
        this._completeCounts.set(key, { value: 0, total: total });
    }

    /** 
     * 添加加载完成数量
     * @param bundle bundle名
     * @param path 资源路径
     * @param count 完成数量
     * @internal
     */
    protected updateCompleteCount(bundle: string, path: string, count: number, total: number): void {
        let key = `${bundle}:${path}`;
        if (this._completeCounts.has(key)) {
            let info = this._completeCounts.get(key);
            info.value = Math.min(count, total);
            info.total = total;
        } else {
            this._completeCounts.set(key, { value: Math.min(count, total), total: total });
        }
        this.progressUpdate();
    }

    /** @internal */
    protected addAssetInfo(info: AssetInfo): void {
        this._assetInfos.push(info);
    }

    /** 通过索引获取 */
    protected getAssetInfo(index: number): AssetInfo {
        return this._assetInfos[index];
    }

    /** @internal */
    protected getAssetsCount(): number {
        return this._assetInfos.length;
    }

    /** 
     * 找到第一个等待中资源的索引  如果不存在则返回 -1
     * @internal
     */
    protected getFirstWaitIndex(): number {
        return this._assetInfos.findIndex(item => item.status == StateType.Wait);
    }

    /** @internal */
    protected isAllFinished(): boolean {
        return this._assetInfos.every(item => item.status == StateType.Finish);
    }

    /** 
     * 重置失败资源状态为等待中
     * @internal
     */
    protected resetErrorAssets(): number {
        let count = 0;
        for (const item of this._assetInfos) {
            if (item.status == StateType.Error) {
                item.status = StateType.Wait;
                count++;
            }
        }
        return count;
    }

    protected downloadFaildAnalysis(): void {
        // 找到所有失败的资源 把路径拼成字符串
        let paths = [];
        for (const item of this._assetInfos) {
            if (item.status == StateType.Error) {
                paths.push(`bundle:${item.bundle} path:${item.path}`);
            }
        }
        let msg = `加载失败资源:\n${paths.join("\n")}`;
        this.failCallback(ErrorCode.FileLoadFailed, msg);
    }

    /********************** 回调相关内容 begin **********************/
    /** @internal */
    private _progress: (percent: number) => void;

    /** @internal */
    private _complete: () => void;

    /** @internal */
    private _fail: (code: ErrorCode, msg: string) => void;

    /**
     * @param res 设置回调函数
     * @param {Function} res.complete 加载完成回调
     * @param {Function} res.fail 加载失败回调
     * @param {Function} res.progress 加载进度回调
     */
    public setCallbacks(res: { complete: () => void, fail?: (code: number, msg: string) => void, progress?: (percent: number) => void }): void {
        this._complete = res.complete || (() => { });
        this._fail = res.fail || (() => { });
        this._progress = res.progress || (() => { });
    }

    /** @internal */
    private progressUpdate(): void {
        if (!this._progress) {
            return;
        }
        let count = 0, totalCount = 0;
        for (const { value, total } of this._completeCounts.values()) {
            count += value;
            totalCount += total;
        }
        this._progress(Math.max(Math.min(count / totalCount, 1), 0));
    }

    /** @internal */
    protected completeAll(): void {
        if (this._isComplete) {
            return;
        }
        this._isComplete = true;
        this._complete?.();
    }

    /** @internal */
    protected failCallback(code: ErrorCode, msg: string): void {
        this._fail?.(code, msg);
    }
    /********************** 回调相关内容 end **********************/
}