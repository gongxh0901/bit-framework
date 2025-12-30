/**
 * @Author: Gongxh
 * @Date: 2024-12-11
 * @Description: UI 装饰器
 */

import { InfoPool } from "./core/InfoPool";
import { IDecoratorInfo, MetadataKey } from "./interface/type";

/**
 * 获取对象属性
 * @param obj 对象
 * @param key 属性名
 * @returns 属性值
 */
function getObjectProp(obj: Record<string, any>, key: string): any {
    if (obj.hasOwnProperty(key)) {
        return obj[key];
    }
    return (obj[key] = Object.assign({}, obj[key]));
}

export namespace _uidecorator {
    /** @internal */
    const uiclassMap: Map<any, IDecoratorInfo> = new Map(); // 窗口注册信息

    /** @internal */
    const uicomponentMap: Map<any, IDecoratorInfo> = new Map(); // 组件注册信息

    /** @internal */
    const uiheaderMap: Map<string, IDecoratorInfo> = new Map(); // header注册信息

    /** 获取窗口注册信息 */
    export function getWindowMaps(): Map<any, IDecoratorInfo> { return uiclassMap }

    /** 获取组件注册信息 */
    export function getComponentMaps(): Map<any, IDecoratorInfo> { return uicomponentMap; }

    /** 获取header注册信息 */
    export function getHeaderMaps(): Map<any, IDecoratorInfo> { return uiheaderMap; }

    /**
     * 窗口装饰器
     * @param {string} groupName 窗口组名称
     * @param {string} pkgName fgui包名
     * @param {string} name 窗口名 (与fgui中的组件名一一对应)
     * @param {string[] | string} inlinePkgs 内联的包名 当前界面需要引用其他包中的资源时使用 引用多个包用数组 引用单个包用字符串
     * 
     * @example @uiclass("窗口组", "UI包名", "MyWindow", ["包名1", "包名2"])
     * @example @uiclass("窗口组", "UI包名", "MyWindow", "包名1")
     */
    export function uiclass(groupName: string, pkgName: string, name: string, inlinePkgs?: string[] | string): Function {
        /** target 类的构造函数 */
        return function (ctor: any): any {
            // 检查是否有原始构造函数引用（由其他装饰器如 @dataclass 提供）
            const originalCtor = ctor;
            // 给构造函数添加静态属性，存储窗口名称（避免混淆后 constructor.name 变化）
            ctor[MetadataKey.originalName] = name;
            uiclassMap.set(originalCtor, {
                ctor: ctor, // 存储实际的构造函数（可能被包装过）
                props: ctor[MetadataKey.prop] || null,
                callbacks: ctor[MetadataKey.callback] || null,
                controls: ctor[MetadataKey.control] || null,
                transitions: ctor[MetadataKey.transition] || null,
                res: {
                    group: groupName,
                    pkg: pkgName,
                    name: name,
                },
            });
            let pkgs: string[] = [];
            if (Array.isArray(inlinePkgs)) {
                pkgs = inlinePkgs;
            } else if (typeof inlinePkgs === "string") {
                pkgs = [inlinePkgs];
            }
            InfoPool.add(ctor, groupName, pkgName, name, pkgs);
            return ctor;
        };
    }

    /**
     * UI组件装饰器
     * @param {string} pkg 包名
     * @param {string} name 组件名
     */
    export function uicom(pkg: string, name: string): Function {
        return function (ctor: any): any {
            // 检查是否有原始构造函数引用（由其他装饰器如 @dataclass 提供）
            const originalCtor = ctor;
            // log(`pkg:【${pkg}】 uicom prop >${JSON.stringify(ctor[UIPropMeta] || {})}<`);
            ctor[MetadataKey.originalName] = name;
            uicomponentMap.set(originalCtor, {
                ctor: ctor, // 存储实际的构造函数（可能被包装过）
                props: ctor[MetadataKey.prop] || null,
                callbacks: ctor[MetadataKey.callback] || null,
                controls: ctor[MetadataKey.control] || null,
                transitions: ctor[MetadataKey.transition] || null,
                res: {
                    pkg: pkg,
                    name: name,
                }
            });
            InfoPool.addComponent(ctor, pkg, name);
            return ctor;
        };
    }

    /**
     * UI header装饰器
     * @param {string} pkg 包名
     * @param {string} name 组件名
     */
    export function uiheader(pkg: string, name: string): Function {
        return function (ctor: any): void {
            // 检查是否有原始构造函数引用（由其他装饰器如 @dataclass 提供）
            const originalCtor = ctor;
            // log(`pkg:【${pkg}】 uiheader prop >${JSON.stringify(ctor[UIPropMeta] || {})}<`);
            ctor[MetadataKey.originalName] = name;
            uiheaderMap.set(originalCtor, {
                ctor: ctor, // 存储实际的构造函数（可能被包装过）
                props: ctor[MetadataKey.prop] || null,
                callbacks: ctor[MetadataKey.callback] || null,
                controls: ctor[MetadataKey.control] || null,
                transitions: ctor[MetadataKey.transition] || null,
                res: {
                    pkg: pkg,
                    name: name,
                }
            });
            InfoPool.addHeader(ctor, pkg, name);
            return ctor;
        };
    }

    /**
     * UI属性装饰器
     * @param {Object} target 实例成员的类的原型
     * @param {string} name 属性名
     * 
     * example: @uiprop node: GObject
     */
    export function uiprop(target: Object, name: string): any {
        // debug("属性装饰器:", target.constructor, name);
        getObjectProp(target.constructor, MetadataKey.prop)[name] = 1;
    }

    /**
     * UI控制器装饰器
     * @param {Object} target 实例成员的类的原型
     * @param {string} name 属性名
     * 
     * example: @uicontrol node: GObject
     */
    export function uicontrol(target: Object, name: string): any {
        // debug("属性装饰器:", target.constructor, name);
        getObjectProp(target.constructor, MetadataKey.control)[name] = 1;
    }

    /**
     * UI动画装饰器
     * @param {Object} target 实例成员的类的原型
     * @param {string} name 属性名
     * 
     * example: @uitransition node: GObject
     */
    export function uitransition(target: Object, name: string): any {
        // debug("属性装饰器:", target.constructor, name);
        getObjectProp(target.constructor, MetadataKey.transition)[name] = 1;
    }

    /**
     * 方法装饰器 (给点击事件用)
     * @param {Object} target 实例成员的类的原型
     * @param {string} name 方法名
     */
    export function uiclick(target: Object, name: string, descriptor: PropertyDescriptor): void {
        // debug("方法装饰器:", target.constructor, name, descriptor);
        getObjectProp(target.constructor, MetadataKey.callback)[name] = descriptor.value;
    }
}

const _global = (globalThis || window || global) as any;
_global["getKunpoRegisterWindowMaps"] = function () {
    return _uidecorator.getWindowMaps();
};
_global["getKunpoRegisterComponentMaps"] = function () {
    return _uidecorator.getComponentMaps();
};
_global["getKunpoRegisterHeaderMaps"] = function () {
    return _uidecorator.getHeaderMaps();
};