/**
 * @Author: Gongxh
 * @Date: 2024-12-13
 * @Description: 
 */

import { assetManager, resources } from "cc";
import { fgui } from "../types/header";
import { InfoPool } from "./InfoPool";

/** @internal */
export class ResLoader {
    /** 
     * 等待窗口的引用计数
     * 每次加载开始时 +1 每次加载完成时 -1
     * @internal
     */
    private static waitRef: number = 0;

    /** 包的引用计数 包名 -> 引用计数 */
    private static pkgRefs: Map<string, number> = new Map();

    /** 包的加载状态 包名 -> 加载中的Promise，用于防止并发加载 */
    private static loadingPromises: Map<string, Promise<void>> = new Map();

    /** 
     * 自动释放UI资源
     * @internal
     */
    private static autoRelease: boolean = true;

    /** UI包加载回调 - 显示加载等待窗 @internal */
    private static _showWaitWindow: (() => void) | null = null;

    /** UI包加载回调 - 隐藏加载等待窗 @internal */
    private static _hideWaitWindow: (() => void) | null = null;

    /** UI包加载回调 - 打开窗口时UI包加载失败 @internal */
    private static _onLoadFail: ((windowName: string, code: 1 | 2, message: string) => void) | null = null;

    /**
     * 设置UI包加载相关回调函数
     * @internal
     */
    public static setCallbacks(callbacks: {
        showWaitWindow: () => void;
        hideWaitWindow: () => void;
        fail: (windowName: string, code: 1 | 2, message: string) => void;
    }): void {
        this._showWaitWindow = callbacks.showWaitWindow;
        this._hideWaitWindow = callbacks.hideWaitWindow;
        this._onLoadFail = callbacks.fail;
    }

    /** @internal */
    public static setAutoRelease(auto: boolean): void {
        this.autoRelease = auto;
    }

    /**
     * 增加等待窗的引用计数
     * @internal
     */
    private static addWaitRef(): void {
        if (this.waitRef++ === 0) {
            this._showWaitWindow?.();
        }
    }

    /**
     * 减少等待窗的引用计数
     * @internal
     */
    private static decWaitRef(): void {
        // 修复：防止waitRef变为负数
        this.waitRef = Math.max(0, this.waitRef - 1);
        if (this.waitRef === 0) {
            this._hideWaitWindow?.();
        }
    }

    /** @internal */
    private static getRef(pkg: string): number {
        return this.pkgRefs.get(pkg) || 0;
    }

    /** @internal */
    private static addRef(pkg: string): void {
        this.pkgRefs.set(pkg, this.getRef(pkg) + 1);
    }

    /** @internal */
    private static subRef(pkg: string): number {
        let ref = this.getRef(pkg) - 1;
        this.pkgRefs.set(pkg, ref);
        return ref;
    }

    /**
     * 加载窗口需要的包
     * @param windowName 窗口名
     */
    public static loadWindowRes(windowName: string): Promise<void> {
        // 获取窗口需要的资源包
        let packageNames = InfoPool.getWindowPkg(windowName);
        if (packageNames.length <= 0) {
            return Promise.resolve();
        }
        return this.loadUIPackages(packageNames, windowName);
    }

    /**
     * 卸载窗口需要的包
     * @param windowName 窗口名
     */
    public static unloadWindowRes(windowName: string): void {
        // 获取窗口需要的资源包
        let packageNames = InfoPool.getWindowPkg(windowName);
        if (packageNames.length <= 0) {
            return;
        }
        this.unloadUIPackages(packageNames);
    }

    /**
     * 根据传入的UIPackage名称集合 加载多个UI包资源
     * @param packages 包名列表
     * @param windowName 窗口名（用于失败回调）
     * @internal
     */
    private static async loadUIPackages(packages: string[], windowName: string): Promise<void> {
        // 修复：防止并发加载相同的包
        // 检查是否有包正在加载，如果有则等待其完成
        const waitPromises: Promise<void>[] = [];
        for (const pkg of packages) {
            const loadingPromise = this.loadingPromises.get(pkg);
            if (loadingPromise) {
                waitPromises.push(loadingPromise);
            }
        }

        // 等待所有正在加载的包完成
        if (waitPromises.length > 0) {
            await Promise.all(waitPromises);
        }

        // 先找出来所有需要加载的包名
        let list = packages.filter(pkg => this.getRef(pkg) <= 0);
        if (list.length <= 0) {
            // 增加引用计数
            packages.forEach(pkg => this.addRef(pkg));
            return;
        }

        // 一定有需要加载的资源
        this.addWaitRef();

        // 记录成功加载的包，用于失败时回滚
        const loadedPackages: string[] = [];

        // 创建加载Promise并记录
        const loadPromise = (async () => {
            try {
                // 获取包对应的bundle名
                let bundleNames = list.map(pkg => InfoPool.getBundleName(pkg));
                // 加载bundle
                await this.loadBundles(bundleNames, windowName);

                // 顺序加载每个UI包，每加载成功一个就记录
                for (const pkg of list) {
                    await this.loadSingleUIPackage(pkg, windowName);
                    loadedPackages.push(pkg);
                }

                // 所有包加载成功后，减少等待窗引用计数
                this.decWaitRef();
                // 增加包资源的引用计数
                packages.forEach(pkg => this.addRef(pkg));
            } catch (err) {
                // 减少等待窗的引用计数
                this.decWaitRef();

                // 回滚：卸载已经加载成功的包
                loadedPackages.forEach(pkg => {
                    fgui.UIPackage.removePackage(pkg);
                });

                throw err;
            } finally {
                // 清理加载状态
                list.forEach(pkg => this.loadingPromises.delete(pkg));
            }
        })();

        // 记录正在加载的包
        list.forEach(pkg => this.loadingPromises.set(pkg, loadPromise));

        await loadPromise;
    }

    /**
     * 加载多个bundle（顺序加载）
     * @param bundleNames bundle名集合
     * @param windowName 窗口名（用于失败回调）
     * @internal
     */
    private static async loadBundles(bundleNames: string[], windowName: string): Promise<void> {
        let unloadedBundleNames: string[] = bundleNames.filter(bundleName => bundleName !== "resources" && !assetManager.getBundle(bundleName));
        if (unloadedBundleNames.length <= 0) {
            return;
        }

        // 顺序加载每个bundle
        for (const bundleName of unloadedBundleNames) {
            await new Promise<void>((resolve, reject) => {
                assetManager.loadBundle(bundleName, (err: any, bundle: any) => {
                    if (err) {
                        // 调用失败回调
                        if (this._onLoadFail) {
                            this._onLoadFail(windowName, 1, bundleName);
                        }
                        reject(new Error(`bundle【${bundleName}】加载失败`));
                    } else {
                        resolve();
                    }
                });
            });
        }
    }

    /**
     * 加载单个 UI 包
     * @param pkg 包名
     * @param windowName 窗口名（用于失败回调）
     * @internal
     */
    private static loadSingleUIPackage(pkg: string, windowName?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let bundleName = InfoPool.getBundleName(pkg);
            let bundle = bundleName === "resources" ? resources : assetManager.getBundle(bundleName);

            fgui.UIPackage.loadPackage(bundle, InfoPool.getPackagePath(pkg), (err: any) => {
                if (err) {
                    // 调用失败回调
                    if (windowName && this._onLoadFail) {
                        this._onLoadFail(windowName, 2, pkg);
                    }
                    reject(new Error(`UI包【${pkg}】加载失败`));
                } else {
                    resolve();
                }
            });
        });
    }

    /** 
     * 根据传入的UIPackage名称集合 卸载多个UI包资源
     * @param pkgNames UIPackage名称集合
     * @internal
     */
    private static unloadUIPackages(packages: string[]): void {
        for (const pkg of packages) {
            if (this.subRef(pkg) === 0 && this.autoRelease) {
                fgui.UIPackage.removePackage(pkg);
            }
        }
    }

    /**
     * 释放不再使用中的自动加载的UI资源
     * 释放所有引用计数 <= 0 的UI资源
     * @internal
     */
    public static releaseUnusedRes(): void {
        let keys = Array.from(this.pkgRefs.keys());
        for (const key of keys) {
            if (this.getRef(key) <= 0) {
                fgui.UIPackage.removePackage(key);
                this.pkgRefs.delete(key);
            }
        }
    }
}