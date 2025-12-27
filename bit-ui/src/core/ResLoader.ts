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
     * 显示等待窗口的回调函数 (开始加载时显示)
     * @internal
     */
    private static showWaitListener: () => void = null;

    /** 
     * 隐藏等待窗口的回调函数 (加载完成后隐藏)
     * @internal
     */
    private static hideWaitListener: () => void = null;

    /** 
     * 等待窗口的引用计数
     * 每次加载开始时 +1 每次加载完成时 -1
     * @internal
     */
    private static waitRef: number = 0;

    /** 包的引用计数 包名 -> 引用计数 */
    private static pkgRefs: Map<string, number> = new Map();

    /**
     * 增加等待窗的引用计数
     * @internal
     */
    private static addWaitRef(): void {
        this.waitRef++ === 0 && this.showWaitListener?.();
    }

    /**
     * 减少等待窗的引用计数
     * @internal
     */
    private static decWaitRef(): void {
        --this.waitRef === 0 && this.hideWaitListener?.();
    }

    /** @internal */
    private static getRef(pkg: string): number {
        return this.pkgRefs.get(pkg) || 0;
    }

    /** @internal */
    private static addRef(pkg: string): void {
        this.pkgRefs.set(pkg, (this.getRef(pkg) || 0) + 1);
    }

    /** @internal */
    private static subRef(pkg: string): number {
        let ref = (this.getRef(pkg) || 0) - 1;
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
        return this.loadUIPackages(packageNames);
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
     * @internal
     */
    private static loadUIPackages(packages: string[]): Promise<void> {
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
        return new Promise((resolve, reject) => {
            this.loadBundles(bundleNames).then(() => {
                let total = list.length;
                for (const pkg of list) {
                    let bundleName = InfoPool.getBundleName(pkg);
                    let bundle = bundleName === "resources" ? resources : assetManager.getBundle(bundleName);
                    // bundle肯定存在
                    UIPackage.loadPackage(bundle, InfoPool.getPackagePath(pkg), (err: any) => {
                        if (err) {
                            // 减少等待窗的引用计数
                            this.decWaitRef();
                            reject(new Error(`UI包【${pkg}】加载失败`));
                            return;
                        }
                        if (--total <= 0) {
                            // 减少等待窗的引用计数
                            this.decWaitRef();

                            // 增加包资源的引用计数
                            packages.forEach(pkg => this.addRef(pkg));
                            resolve();
                        }
                    });
                }
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * 加载多个bundle
     * @param bundleNames bundle名集合
     * @internal
     */
    private static loadBundles(bundleNames: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            let unloadedBundleNames: string[] = bundleNames.filter(bundleName => bundleName !== "resources" && !assetManager.getBundle(bundleName));
            let total = unloadedBundleNames.length;
            if (total <= 0) {
                resolve();
            }
            for (const bundleName of unloadedBundleNames) {
                assetManager.loadBundle(bundleName, (err: any, bundle: any) => {
                    if (err) {
                        reject(new Error(`bundle【${bundleName}】加载失败`));
                    } else {
                        --total <= 0 && resolve();
                    }
                });
            }
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