/**
 * @Author: Gongxh
 * @Date: 2024-12-13
 * @Description: 
 */

import { assetManager, resources } from "cc";
import { UIPackage } from "fairygui-cc";
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
        if (--this.waitRef === 0) {
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
    private static loadUIPackages(packages: string[], windowName: string): Promise<void> {
        // 先找出来所有需要加载的包名
        let list = packages.filter(pkg => this.getRef(pkg) <= 0);
        if (list.length <= 0) {
            // 增加引用计数
            packages.forEach(pkg => this.addRef(pkg));
            return Promise.resolve();
        }
        // 一定有需要加载的资源
        this.addWaitRef();

        // 获取包对应的bundle名
        let bundleNames = list.map(pkg => InfoPool.getBundleName(pkg));
        // 加载bundle
        return this.loadBundles(bundleNames, windowName).then(() => {
            // 顺序加载每个UI包
            return this.loadUIPackagesSequentially(list, windowName);
        }).then(() => {
            // 所有包加载成功后，减少等待窗引用计数
            this.decWaitRef();
            // 增加包资源的引用计数
            packages.forEach(pkg => this.addRef(pkg));
        }).catch((err: Error) => {
            // 减少等待窗的引用计数
            this.decWaitRef();
            throw err;
        });
    }

    /**
     * 加载多个bundle（顺序加载）
     * @param bundleNames bundle名集合
     * @param windowName 窗口名（用于失败回调）
     * @internal
     */
    private static loadBundles(bundleNames: string[], windowName: string): Promise<void> {
        let unloadedBundleNames: string[] = bundleNames.filter(bundleName => bundleName !== "resources" && !assetManager.getBundle(bundleName));
        if (unloadedBundleNames.length <= 0) {
            return Promise.resolve();
        }

        // 递归方式实现顺序加载
        const loadNext = (index: number): Promise<void> => {
            if (index >= unloadedBundleNames.length) {
                return Promise.resolve();
            }

            const bundleName = unloadedBundleNames[index];
            return new Promise((resolve, reject) => {
                assetManager.loadBundle(bundleName, (err: any, bundle: any) => {
                    if (err) {
                        // 调用失败回调
                        if (this._onLoadFail) {
                            this._onLoadFail(windowName, 1, bundleName);
                        }
                        reject(new Error(`bundle【${bundleName}】加载失败`));
                    } else {
                        resolve(null);
                    }
                });
            }).then(() => {
                // 加载下一个
                return loadNext(index + 1);
            });
        };

        return loadNext(0);
    }

    /**
     * 顺序加载多个 UI 包
     * @param packages 包名列表
     * @param windowName 窗口名（用于失败回调）
     * @internal
     */
    private static loadUIPackagesSequentially(packages: string[], windowName?: string): Promise<void> {
        // 递归方式实现顺序加载
        const loadNext = (index: number): Promise<void> => {
            if (index >= packages.length) {
                return Promise.resolve();
            }

            const pkg = packages[index];
            return this.loadSingleUIPackage(pkg, windowName).then(() => {
                // 加载下一个
                return loadNext(index + 1);
            });
        };

        return loadNext(0);
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

            UIPackage.loadPackage(bundle, InfoPool.getPackagePath(pkg), (err: any) => {
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
            if (this.subRef(pkg) === 0) {
                UIPackage.removePackage(pkg);
            }
        }
    }
}