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

    /** 获取引用计数 */
    private static getRef(pkg: string): number {
        return this.pkgRefs.get(pkg) || 0;
    }

    /** 增加引用计数 */
    private static addRef(pkg: string): void {
        this.pkgRefs.set(pkg, (this.getRef(pkg) || 0) + 1);
    }

    /**
     * 加载窗口需要的包
     * @param windowName 
     */
    public static loadRes(windowName: string): Promise<void> {
        // 获取窗口需要的资源包
        let packageNames = InfoPool.getWindowPkg(windowName);
        if (packageNames.length <= 0) {
            return Promise.resolve();
        }
        return this.loadPackages(packageNames);
    }

    /** 加载多个bundle */
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
     * 加载多个UI包资源
     * @param pkgNames 包名集合
     */
    private static loadPackages(pkgNames: string[]): Promise<void> {
        // 先找出来所有需要加载的包名
        let needLoadPackages = pkgNames.filter(pkg => this.getRef(pkg) <= 0);
        if (needLoadPackages.length <= 0) {
            // 增加引用计数
            pkgNames.forEach(pkg => this.addRef(pkg));
            return Promise.resolve();
        }
        // 一定有需要加载的资源
        this.addWaitRef();

        // 获取包对应的bundle名
        let bundleNames = needLoadPackages.map(pkg => InfoPool.getBundleName(pkg));

        // 加载bundle
        return new Promise((resolve, reject) => {
            this.loadBundles(bundleNames).then(() => {
                let total = needLoadPackages.length;
                for (const pkg of needLoadPackages) {
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
                            pkgNames.forEach(pkg => this.addRef(pkg));
                            resolve();
                        }
                    });
                }
            }).catch(err => {
                reject(err);
            });
        });
    }

    // /**
    //  * 加载fgui包
    //  * @param pkgs 包名集合
    //  * @param complete 加载完成回调
    //  */
    // private loadPackages(res: { pkgs: string[], complete: () => void, fail: (pkgs: string[]) => void }): void {
    //     // 过滤已经加载的包
    //     let needLoadPkgs = res.pkgs.filter(pkg => this.getRef(pkg) <= 0);

    //     let successPkgs: string[] = [];
    //     let failPkgs: string[] = [];
    //     let total: number = needLoadPkgs.length;
    //     if (total <= 0) {
    //         res.complete();
    //         return;
    //     }
    //     for (const pkg of needLoadPkgs) {
    //         let bundleName = this.getPkgBundle(pkg);
    //         let bundle = bundleName === "resources" ? resources : assetManager.getBundle(bundleName);
    //         if (!bundle) {
    //             throw new Error(`UI包【${pkg}】所在的bundle【${bundleName}】未加载`);
    //         }

    //     }
    // }

    // /** 
    //  * 加载窗口需要的包资源
    //  * @param windowName 窗口名
    //  */
    // public loadWindowRes(windowName: string): Promise<void> {
    //     return new Promise((resolve, reject) => {
    //         const pkgName = InfoPool.get(windowName).pkgName;
    //         if (!pkgName) {
    //             reject(new Error(`窗口【${windowName}】未注册，请使用 _uidecorator.uiclass 注册窗口`));
    //             return;
    //         }
    //         this.loadPackages({
    //             pkgs: [pkgName],
    //             complete: () => {
    //                 resolve();
    //             },
    //             fail: (pkgs: string[]) => {
    //                 reject(new Error(`窗口【${windowName}】打开失败`));
    //             }
    //         });
    //     });

    //     // 找到窗口对应的包名
    //     const pkgName = InfoPool.get(windowName).pkgName;

    //     // 不需要包资源 直接返回成功
    //     if (!this.hasWindowPkg(windowName)) {
    //         listenter.complete();
    //         return;
    //     }
    //     if (this._waitRef++ <= 0) {
    //         // 调用注入的回调函数 用来显示等待窗
    //         this._showWaitWindow?.();
    //     }
    //     this.loadPackages({
    //         pkgs: this.getWindowPkgs(windowName),
    //         complete: () => {
    //             if (--this._waitRef <= 0) {
    //                 // 调用注入的回调函数 关闭等待窗
    //                 listenter.complete();
    //                 this._hideWaitWindow?.();
    //             }
    //         },
    //         fail: (pkgs: string[]) => {
    //             console.warn(`界面${windowName}打开失败`);
    //             listenter.fail(pkgs);
    //             this._fail?.(windowName, "UI包加载失败", pkgs);
    //             if (--this._waitRef <= 0) {
    //                 // 调用注入的回调函数 关闭等待窗
    //                 this._hideWaitWindow?.();
    //             }
    //         }
    //     });
    // }


    /** 窗口名对应的包名列表 @internal */
    private _windowPkgs: Map<string, string[]> = new Map();
    /** 包的引用计数 @internal */
    private _pkgRefs: { [pkg: string]: number } = {};

    /** UI包路径 @internal */
    // private _uipath: string = "";
    /** UI包在bundle中的路径 @internal */
    private _uiPaths: { [bundle: string]: string } = {};

    /** 手动管理的包 @internal */
    private _manualPackages: Set<string> = new Set();
    /** 立即释放的包 @internal */
    private _imReleasePackages: Set<string> = new Set();

    // /** 资源配置相关接口 */
    // public initPackageConfig(res: IPackageConfigRes): void {
    //     if (!res || !res.config) {
    //         return;
    //     }
    //     if (this._isInit) {
    //         throw new Error("资源配置已初始化，请勿重复设置");
    //     }
    //     this._isInit = true;
    //     this._showWaitWindow = res?.showWaitWindow;
    //     this._hideWaitWindow = res?.hideWaitWindow;
    //     this._fail = res?.fail;

    //     this._uiPaths = res.config?.bundlePaths || {};
    //     this._uiPaths["resources"] = res.config?.uiPath || "";

    //     for (const bundle in this._uiPaths) {
    //         if (this._uiPaths[bundle] != "" && !this._uiPaths[bundle].endsWith("/")) {
    //             this._uiPaths[bundle] += "/";
    //         }
    //     }

    //     this._manualPackages = new Set(res.config.manualPackages || []);
    //     this._imReleasePackages = new Set(res.config.imReleasePackages || []);

    //     let windowPkgs = res.config.linkPackages || {};
    //     for (const windowName in windowPkgs) {
    //         let pkgs = windowPkgs[windowName];
    //         for (const pkg of pkgs || []) {
    //             this.addWindowPkg(windowName, pkg);
    //         }
    //     }

    //     // 遍历一遍，剔除手动管理的包
    //     this._windowPkgs.forEach((pkgs: string[], windowName: string) => {
    //         for (let i = pkgs.length - 1; i >= 0; i--) {
    //             if (this._manualPackages.has(pkgs[i])) {
    //                 pkgs.splice(i, 1);
    //             }
    //         }
    //         if (pkgs.length <= 0) {
    //             this._windowPkgs.delete(windowName);
    //         }
    //     });
    // }
    // /** 添加窗口对应的包名 */
    // public addWindowPkg(windowName: string, pkgName: string): void {
    //     if (!this._windowPkgs.has(windowName)) {
    //         this._windowPkgs.set(windowName, [pkgName]);
    //     } else {
    //         this._windowPkgs.get(windowName).push(pkgName);
    //     }
    // }

    // public addResRef(windowName: string): void {
    //     if (!this._isInit) {
    //         return;
    //     }
    //     // 不需要包资源 直接返回成功
    //     if (!this.hasWindowPkg(windowName)) {
    //         return;
    //     }
    //     let pkgs = this.getWindowPkgs(windowName);
    //     for (const pkg of pkgs) {
    //         this.addRef(pkg);
    //     }
    // }

    // /**
    //  * 释放窗口资源
    //  * @param windowName 窗口名
    //  */
    // public releaseWindowRes(windowName: string): void {
    //     if (!this._isInit || !this.hasWindowPkg(windowName)) {
    //         return;
    //     }
    //     let pkgs = this.getWindowPkgs(windowName);
    //     for (const pkg of pkgs) {
    //         this.decRef(pkg);
    //     }
    // }

    // /** 获取UI包所在的bundle名 */
    // private getPkgBundle(pkg: string): string {
    //     return this._pkgBundles.get(pkg) || "resources";
    // }

    // /** 获取UI包在bundle中的路径 */
    // private getPkgPath(pkg: string): string {
    //     let bundle = this._pkgBundles.get(pkg);
    //     return this._uiPaths[bundle] + pkg;
    // }

    // /** 获取窗口对应的包名列表 */
    // private getWindowPkgs(windowName: string): string[] {
    //     if (this._windowPkgs.has(windowName)) {
    //         return this._windowPkgs.get(windowName);
    //     }
    //     return [];
    // }

    // private hasWindowPkg(windowName: string): boolean {
    //     return this._windowPkgs.has(windowName);
    // }

    // /** 获取包的引用计数 */
    // private getRef(pkg: string): number {
    //     return this._pkgRefs[pkg] ? this._pkgRefs[pkg] : 0;
    // }

    // /** 增加包的引用计数 */
    // private addRef(pkg: string): void {
    //     this._pkgRefs[pkg] = this.getRef(pkg) + 1;
    // }

    // /** 减少包的引用计数 */
    // private decRef(pkg: string): void {
    //     this._pkgRefs[pkg] = this.getRef(pkg) - 1;
    //     if (this.getRef(pkg) <= 0) {
    //         delete this._pkgRefs[pkg];

    //         // 如果需要立即释放 释放包资源
    //         if (this._imReleasePackages.has(pkg)) {
    //             UIPackage.removePackage(pkg);
    //         }
    //     }
    // }
}