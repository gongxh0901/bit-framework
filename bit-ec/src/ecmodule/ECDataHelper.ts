import { color, size, v2, v3 } from "cc";
import { Component } from "./Component";
import { ComponentPool } from "./ComponentPool";
import { _ecdecorator } from "./ECDecorator";

/**
 * @Author: Gongxh
 * @Date: 2025-01-24
 * @Description: 
 */
export class ECDataHelper {
    /** 组件池 @internal */
    public static _componentPool: ComponentPool = new ComponentPool();

    /** 注册所有组件 @internal */
    public static registerComponents(): void {
        let index = 0;
        let maps = _ecdecorator.getComponentMaps();
        maps.forEach((info: _ecdecorator.ECComponentInfo, ctor: any) => {
            this._componentPool.register(index++, info.componentType, info.name, ctor);
        });
    }

    public static getComponentPool(): ComponentPool {
        return this._componentPool;
    }

    /** 解析组件数据 */
    public static parse(component: Component, data: Record<string, any>): void {
        const maps = _ecdecorator.getComponentMaps();
        const ctor = component.constructor;
        if (!maps.has(ctor)) {
            return;
        }
        const info = maps.get(ctor);
        for (const property in data) {
            let propInfo = info.props[property];
            if (!propInfo) {
                console.warn(`组件 ${component.name} 属性 ${property} 未注册`);
                continue;
            }
            let value = data[property];
            (component as any)[property] = this.getPropValue(propInfo, value);
        }
    }

    private static getPropValue(propInfo: _ecdecorator.ECPropInfo, value: any): any {
        switch (propInfo.type) {
            case "int":
                if (typeof value === "number") {
                    return value;
                }
                return propInfo.defaultValue || 0;
            case "float":
                if (typeof value === "number") {
                    return value;
                }
                return propInfo.defaultValue || 0;
            case "boolean":
                if (typeof value === "boolean") {
                    return value;
                }
                return propInfo.defaultValue || false;
            case "size":
                if (typeof value === "object" && typeof value.width === "number" && typeof value.height === "number") {
                    return size(value.width, value.height);
                }
                return propInfo.defaultValue || size(0, 0);
            case "vec2":
                if (typeof value === "object" && typeof value.x === "number" && typeof value.y === "number") {
                    return v2(value.x, value.y);
                }
                return propInfo.defaultValue || v2(0, 0);
            case "vec3":
                if (typeof value === "object" && typeof value.x === "number" && typeof value.y === "number" && typeof value.z === "number") {
                    return v3(value.x, value.y, value.z);
                }
                return propInfo.defaultValue || v3(0, 0, 0);
            case "color":
                if (typeof value === "object" && typeof value[0] === "number" && typeof value[1] === "number" && typeof value[2] === "number") {
                    return color(value[0], value[1], value[2], typeof value[3] === "number" ? value[3] : 255);
                }
                return propInfo.defaultValue || color(255, 255, 255, 255);
            case "asset":
            case "spriteframe":
            case "prefab":
            case "jsonAsset":
            case "particle":
            case "animation":
            case "audio":
            case "skeleton":
            case "entity":
                return typeof value === "string" ? value : (propInfo.defaultValue || "");
            case "enum":
                return value;
            case "array":
                if (Array.isArray(value)) {
                    return value;
                }
                return propInfo.defaultValue || [];
            case "object":
                if (typeof value === "object") {
                    return value;
                }
                return propInfo.defaultValue || {};
            default:
                break;
        }
        return undefined;
    }
}
