/**
 * @Author: Gongxh
 * @Date: 2025-01-14
 * @Description: 实体组件装饰器
 */

import { Color, Size, Vec2, Vec3 } from "cc";
import { ObjectHelper } from "../tool/ObjectHelper";


export namespace _ecdecorator {
    /** @internal */
    const ECPropMeta = "__ecpropmeta__"

    type ECPropType = "int" | "float" | "string" | "boolean" | "size" | "vec2" | "vec3" | "color" | "asset" | "spriteframe" | "jsonAsset" | "particle" | "animation" | "audio" | "prefab" | "skeleton" | "enum" | "array" | "object" | "entity";

    interface ECPropInfoBase {
        /** 属性默认值 */
        defaultValue?: any,
        /** 编辑器中的显示名称 */
        displayName?: string,
        /** 编辑器中的提示 */
        tips?: string
    }

    interface ECPropInfoNumber extends ECPropInfoBase {
        /** 属性类型 */
        type: "int" | "float";
        /** 默认值:0 */
        defaultValue?: number;
    }

    interface ECPropInfoBoolean extends ECPropInfoBase {
        /** 属性类型 */
        type: "boolean";
        /** 默认值:false */
        defaultValue?: boolean;
    }

    interface ECPropInfoSize extends ECPropInfoBase {
        /** 属性类型 */
        type: "size";
        /** 默认值:Size(0,0) */
        defaultValue?: Size;
    }

    interface ECPropInfoVec extends ECPropInfoBase {
        /** 属性类型 */
        type: "vec2" | "vec3";
        /** 默认值: Vec2(0,0) | Vec3(0,0,0) */
        defaultValue?: Vec2 | Vec3;
    }

    interface ECPropInfoString extends ECPropInfoBase {
        /** 属性类型 */
        type: "string" | "asset" | "spriteframe" | "jsonAsset" | "particle" | "animation" | "audio" | "prefab" | "skeleton" | "entity";
        /** 默认值: "" */
        defaultValue?: string;
    }

    interface ECPropInfoColor extends ECPropInfoBase {
        /** 属性类型 */
        type: "color";
        /** 默认值:Color(255, 255, 255, 255) */
        defaultValue?: Color;
    }

    interface ECPropInfoArray extends ECPropInfoBase {
        /** 属性类型 */
        type: "array";
        /** 类型格式 当类型是复合类型enum、array、object时必须 */
        format: ECPropType | ECPropInfo;
    }

    interface ECPropInfoObject extends ECPropInfoBase {
        /** 属性类型 */
        type: "object";
        /** 类型格式 当类型是复合类型enum、array、object时必须 */
        format: Record<string, ECPropType> | Record<string, ECPropInfo>;
    }

    interface ECPropInfoEnum extends ECPropInfoBase {
        type: "enum";
        /** 枚举值 */
        format: object;
        /** 默认值 */
        defaultValue?: string | number;
    }

    export type ECPropInfo = ECPropInfoNumber | ECPropInfoBoolean | ECPropInfoSize | ECPropInfoVec | ECPropInfoString | ECPropInfoColor | ECPropInfoArray | ECPropInfoObject | ECPropInfoEnum;

    /**
     * 组件注册数据结构
     */
    export interface ECComponentInfo {
        /** 组件名 */
        name: string;
        /** 组件类型 */
        componentType: number;
        /** 组件描述 */
        describe: string;
        /** 属性 */
        props: Record<string, ECPropInfo>;
    }
    /** 用来存储组件注册信息 */
    const eclassMap: Map<any, ECComponentInfo> = new Map();

    /** 获取组件注册信息 */
    export function getComponentMaps(): Map<any, ECComponentInfo> {
        return eclassMap;
    }

    /**
     * 实体组件装饰器
     * @param {string} res.describe 组件组描述
     */
    export function ecclass(name: string, componentType: number, res?: { describe?: string }): Function {
        /** target 类的构造函数 */
        return function (ctor: any): void {
            eclassMap.set(ctor, {
                name: name,
                componentType: componentType,
                props: ctor[ECPropMeta],
                describe: res?.describe || name
            });
        };
    }

    /** 组件属性装饰器 */
    export function ecprop(options: ECPropInfo): any {
        return function (target: any, propName: any): void {
            ObjectHelper.getObjectProp(target.constructor, ECPropMeta)[propName] = options;
        };
    }
}

let _global = globalThis || window || global;
(_global as any)["getKunpoRegisterECMaps"] = function () {
    return _ecdecorator.getComponentMaps() as any;
};