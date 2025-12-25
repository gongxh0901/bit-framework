/**
 * @Author: Gongxh
 * @Date: 2024-12-26
 * @Description: 自定义组件扩展帮助类
 */
import { debug } from "@gongxh/bit-core";
import { UIObjectFactory } from "fairygui-cc";
import { _uidecorator } from "../decorator";
import { PropsHelper } from "./PropsHelper";

export class ComponentExtendHelper {
    /** 已注册的组件集合 @internal */
    private static _registeredComponents: Set<string> = new Set<string>();

    public static register(): void {
        for (const { ctor, res } of _uidecorator.getComponentMaps().values()) {
            const componentKey = `${res.pkg}/${res.name}`;
            if (this._registeredComponents.has(componentKey)) {
                console.debug(`自定义组件已注册，跳过  组件名:${res.name} 包名:${res.pkg}`);
                continue;
            }
            console.debug(`自定义组件注册  组件名:${res.name} 包名:${res.pkg}`);
            this.registerComponent(ctor, res.pkg, res.name);
            this._registeredComponents.add(componentKey);
        }
    }

    /**
     * 动态注册自定义组件
     * @param ctor 组件构造函数
     * @param pkg 包名
     * @param name 组件名
     */
    public static dynamicRegister(ctor: any, pkg: string, name: string): void {
        const componentKey = `${pkg}/${name}`;
        if (this._registeredComponents.has(componentKey)) {
            console.debug(`自定义组件已注册，跳过  组件名:${name} 包名:${pkg}`);
            return;
        }
        debug(`自定义组件注册  组件名:${name} 包名:${pkg}`);
        this.registerComponent(ctor, pkg, name);
        this._registeredComponents.add(componentKey);
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
}