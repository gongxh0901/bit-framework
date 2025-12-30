/**
 * @Author: Gongxh
 * @Date: 2025-12-25
 * @Description: 信息池 注册的窗口、header、自定义组件的信息
 */

import { debug } from "@gongxh/bit-core";
import { UIObjectFactory } from "fairygui-cc";
import { PropsHelper } from "./PropsHelper";
import { IHeaderInfo, IWindowInfo } from "./types";

/** @internal */
export class InfoPool {
    /** @internal */
    private static _windowInfos: Map<string, IWindowInfo> = new Map(); // 窗口信息池 窗口名 -> 窗口信息

    /** @internal */
    private static _headerInfos: Map<string, IHeaderInfo> = new Map();  // 窗口header信息池 窗口header名 -> header信息

    /** @internal */
    private static _customComponents: Set<string> = new Set(); // 自定义组件信息池 自定义组件名 -> 组件信息

    /** @internal */
    private static _customPackageBundle: Map<string, string> = new Map(); // UI包所在的bundle名 1对1 默认: resources

    /** @internal */
    private static _customPackagePath: Map<string, string> = new Map();  // 自定义UI包所在的路径 1对1

    /** @internal */
    private static _windowPkgs: Map<string, string[]> = new Map(); // 窗口名对应的包名列表 窗口名 -> 包名列表

    /** @internal */
    private static _manualPackages: Set<string> = new Set(); // 需要手动管理的资源包名

    /** @internal */
    private static _dirty: boolean = true;

    /**
     * 添加窗口信息
     * @param ctor 类的构造函数
     * @param group 窗口组名
     * @param pkg 包名
     * @param name 窗口名
     * @param bundleName bundle名
     * @internal
     */
    public static add(ctor: any, group: string, pkg: string, name: string, pkgs: string[]): void {
        if (this.has(name)) {
            console.warn(`窗口【${name}】已注册，跳过，请检查是否重复注册`);
            return;
        }
        debug(`窗口注册  窗口名:${name} 包名:${pkg} 组名:${group}`);
        this._windowInfos.set(name, {
            ctor: ctor,
            group: group,
            pkgName: pkg,
            name: name
        });
        // 窗口组件扩展
        UIObjectFactory.setExtension(`ui://${pkg}/${name}`, ctor);

        this.addWindowPkg(name, pkg);
        if (pkgs.length > 0) {
            for (const pkg of pkgs) {
                this.addWindowPkg(name, pkg);
            }
        }
    }

    /**
     * 注册窗口header信息
     * @param ctor 类的构造函数
     * @param pkg 包名
     * @param name 窗口名
     * @param bundleName bundle名
     * @internal
     */
    public static addHeader(ctor: any, pkg: string, name: string): void {
        if (this.hasHeader(name)) {
            console.warn(`header【${name}】已注册，跳过，请检查是否重复注册`);
            return;
        }
        debug(`header注册  header名:${name} 包名:${pkg}`);
        this._headerInfos.set(name, {
            ctor: ctor,
            pkgName: pkg
        });
        // 窗口header扩展
        UIObjectFactory.setExtension(`ui://${pkg}/${name}`, ctor);
    }

    /**
     * 注册自定义组件信息
     * @param ctor 组件构造函数
     * @param pkg 包名
     * @param name 组件名
     * @internal
     */
    public static addComponent(ctor: any, pkg: string, name: string): void {
        const componentKey = `${pkg}/${name}`;
        if (this._customComponents.has(componentKey)) {
            console.debug(`自定义组件【${name}】已注册，跳过，请检查是否重复注册`);
            return;
        }
        debug(`自定义组件注册  组件名:${name} 包名:${pkg}`);
        this._customComponents.add(componentKey);
        this.registerComponent(ctor, pkg, name);
    }

    /**
     * 是否存在窗口信息
     * @param name 窗口名
     * @returns 是否存在
     * @internal
     */
    public static has(name: string): boolean {
        return this._windowInfos.has(name);
    }

    /**
     * 获取窗口信息
     * @param name 窗口名
     * @returns 窗口信息
     * @internal
     */
    public static get(name: string): IWindowInfo {
        if (!this.has(name)) {
            throw new Error(`窗口【${name}】未注册，请使用 _uidecorator.uiclass 注册窗口`);
        }
        return this._windowInfos.get(name);
    }

    /**
     * 是否存在窗口header信息
     * @param name 窗口header名
     * @returns 是否存在
     * @internal
     */
    public static hasHeader(name: string): boolean {
        return this._headerInfos.has(name);
    }

    /**
     * 获取窗口header信息
     * @param name 窗口header名
     * @returns 窗口header信息
     * @internal
     */
    public static getHeader(name: string): IHeaderInfo {
        if (!this.hasHeader(name)) {
            throw new Error(`窗口header【${name}】未注册，请使用 _uidecorator.uiheader 注册窗口header`);
        }
        return this._headerInfos.get(name);
    }

    /** 
     * 设置UI包所在的bundle名
     * @param pkg 包名
     * @param bundleName bundle名
     * @internal
     */
    public static addBundleName(pkg: string, bundleName: string): void {
        if (this._customPackageBundle.has(pkg)) {
            console.warn(`UI包【${pkg}】已设置过包名`);
            return;
        }
        this._customPackageBundle.set(pkg, bundleName);
    }

    /** 
     * 获取UI包所在的bundle名
     * @param pkg 包名
     * @returns bundle名
     * @internal
     */
    public static getBundleName(pkg: string): string {
        return this._customPackageBundle.get(pkg) || "resources";
    }

    /**
     * UI包所在的自定义路径
     * @param pkg 包名
     * @param path 路径
     * @internal
     */
    public static addPackagePath(pkg: string, path: string): void {
        if (this._customPackagePath.has(pkg)) {
            console.warn(`UI包【${pkg}】已设置过自定义路径`);
            return;
        }
        this._customPackagePath.set(pkg, path);
    }

    /**
     * 获取UI包所在的路径
     * @param pkg 包名
     * @returns 路径
     * @internal
     */
    public static getPackagePath(pkg: string): string {
        return `${this._customPackagePath.get(pkg) || 'ui'}/${pkg}`;
    }

    /** 
     * 添加窗口需要的包名
     * @param windowName 窗口名
     * @param pkg 包名
     * @internal
     */
    public static addWindowPkg(windowName: string, pkg: string): void {
        this._dirty = true;
        if (!this._windowPkgs.has(windowName)) {
            this._windowPkgs.set(windowName, [pkg]);
        } else {
            this._windowPkgs.get(windowName).push(pkg);
        }
    }

    /**
     * 获取窗口需要的包名列表
     * @param windowName 窗口名
     * @returns 包名列表
     * @internal
     */
    public static getWindowPkg(windowName: string): string[] {
        if (this._dirty) {
            this.refreshWindowPackages();
            this._dirty = false;
        }
        return this._windowPkgs.get(windowName) || [];
    }

    /**
     * 添加手动管理资源加载 和 卸载的包名
     * @param pkgName 包名
     * @internal
     */
    public static addManualPackage(pkgName: string): void {
        this._dirty = true;
        this._manualPackages.add(pkgName);
    }

    /**
     * 注册自定义组件信息
     * @param info 
     * @internal
     */
    private static registerComponent(ctor: any, pkg: string, name: string): void {
        // 自定义组件扩展
        const onConstruct = function (this: any): void {
            PropsHelper.serializeProps(this, pkg, name);
            this.onInit && this.onInit();
        };
        ctor.prototype.onConstruct = onConstruct;
        // 自定义组件扩展
        UIObjectFactory.setExtension(`ui://${pkg}/${name}`, ctor);
    }

    /** 刷新窗口需要的包名信息 */
    private static refreshWindowPackages(): void {
        for (const packages of this._windowPkgs.values()) {
            let len = packages.length;
            for (let index = len - 1; index >= 0; index--) {
                const name = packages[index];
                if (this._manualPackages.has(name)) {
                    packages.splice(index, 1);
                }
            }
        }
    }
}