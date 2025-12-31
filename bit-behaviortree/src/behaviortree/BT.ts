/**
 * 行为树装饰器和元数据管理
 * 用于编辑器显示和配置节点信息
 */

export namespace BT {
    /**
     * 参数类型枚举
     */
    export enum ParamType {
        int = "number",
        float = "float",
        string = "string",
        bool = "boolean",
        object = "object",
        array = "array"
    }

    /**
     * 节点类型枚举
     */
    export enum Type {
        /** 行为节点 */
        Action = "action",
        /** 条件节点 */
        Condition = "condition",
        /** 组合节点 */
        Composite = "composite",
        /** 装饰节点 */
        Decorator = "decorator"
    }

    /**
     * 参数描述接口
     */
    export interface ParameterInfo {
        /** 参数名称 */
        name: string;
        /** 参数类型 */
        type: ParamType;
        /** 参数描述 */
        description?: string;
        /** 默认值 */
        defaultValue?: any;
        /** 步进 针对数字类型的变更的最小单位 */
        step?: number,
        /** 最小值 */
        min?: number,
        /** 最大值 */
        max?: number,
        /** 对象属性定义 - 仅当type为object时使用 */
        properties?: { [key: string]: Omit<ParameterInfo, "name"> };
        /** 数组元素类型 - 仅当type为array时使用 */
        itemType?: ParamType;
        /** 数组元素对象定义 - 仅当type为array且itemType为object时使用 */
        itemProperties?: { [key: string]: Omit<ParameterInfo, "name"> };
    }

    /**
     * 节点元数据接口
     */
    export interface NodeMetadata {
        /** 节点名称 */
        name: string;
        /** 节点类名 */
        className: string;
        /** 节点分组 */
        group: string;
        /** 节点类型 */
        type: Type;
        /** 节点描述 */
        description: string;
        /** 参数列表 */
        parameters: ParameterInfo[];
        /** 最大子节点数量：0=不允许子节点，1=最多一个子节点，-1=无限制 */
        maxChildren: number;
    }

    /** 
     * 注册节点名 到 节点构造函数的映射
     */
    const NODE_NAME_TO_CONSTRUCTOR_MAP = new Map<string, any>();

    /**
     * 节点元数据存储
     */
    const NODE_METADATA_MAP = new Map<any, NodeMetadata>();

    /**
     * 节点参数存储
     */
    const NODE_PARAMETERS_MAP = new Map<any, ParameterInfo[]>();

    /**
     * 节点属性装饰器
     */
    export function prop(paramInfo: Omit<ParameterInfo, "name">) {
        return function (target: any, propertyKey: string) {
            const ctor = target.constructor;
            if (!NODE_PARAMETERS_MAP.has(ctor)) {
                NODE_PARAMETERS_MAP.set(ctor, []);
            }
            const parameters = NODE_PARAMETERS_MAP.get(ctor)!;
            parameters.push({
                ...paramInfo,
                name: propertyKey
            });
        };
    }

    /**
     * 行为节点装饰器
     * @param name 节点的类名 编辑器导出数据中的节点名字
     * @param info.group 节点在编辑器中的分组
     * @param info.name 节点在编辑器中的中文名
     * @param info.desc 节点描述信息
     */
    export function ClassAction(name: string, info?: { group?: string, name?: string, desc?: string }) {
        return function <T extends new (...args: any[]) => any>(constructor: T) {
            const parameters = NODE_PARAMETERS_MAP.get(constructor) || [];
            const fullMetadata: NodeMetadata = {
                className: name,
                group: info?.group || '未分组',
                name: info?.name || '',
                description: info?.desc || '',
                type: Type.Action,
                maxChildren: 0,
                parameters
            };
            NODE_METADATA_MAP.set(constructor, fullMetadata);
            NODE_NAME_TO_CONSTRUCTOR_MAP.set(name, constructor);
            return constructor;
        };
    }

    /**
     * 条件节点装饰器
     */
    export function ClassCondition(name: string, info?: { group?: string, name?: string, desc?: string }) {
        return function <T extends new (...args: any[]) => any>(constructor: T) {
            const parameters = NODE_PARAMETERS_MAP.get(constructor) || [];
            const fullMetadata: NodeMetadata = {
                className: name,
                group: info?.group || '未分组',
                name: info?.name || '',
                description: info?.desc || '',
                type: Type.Condition,
                maxChildren: 0,
                parameters
            };
            NODE_METADATA_MAP.set(constructor, fullMetadata);
            NODE_NAME_TO_CONSTRUCTOR_MAP.set(name, constructor);
            return constructor;
        };
    }

    /**
     * 组合节点装饰器
     */
    export function ClassComposite(name: string, info?: { group?: string, name?: string, desc?: string }) {
        return function <T extends new (...args: any[]) => any>(constructor: T) {
            const parameters = NODE_PARAMETERS_MAP.get(constructor) || [];
            const fullMetadata: NodeMetadata = {
                className: name,
                group: info?.group || '未分组',
                name: info?.name || '',
                description: info?.desc || '',
                type: Type.Composite,
                maxChildren: -1,
                parameters
            };
            NODE_METADATA_MAP.set(constructor, fullMetadata);
            NODE_NAME_TO_CONSTRUCTOR_MAP.set(name, constructor);
            return constructor;
        };
    }

    /**
     * 装饰节点装饰器
     */
    export function ClassDecorator(name: string, info?: { group?: string, name?: string, desc?: string }) {
        return function <T extends new (...args: any[]) => any>(constructor: T) {
            const parameters = NODE_PARAMETERS_MAP.get(constructor) || [];
            const fullMetadata: NodeMetadata = {
                className: name,
                group: info?.group || '未分组',
                name: info?.name || '',
                description: info?.desc || '',
                type: Type.Decorator,
                maxChildren: 1,
                parameters
            };
            NODE_METADATA_MAP.set(constructor, fullMetadata);
            NODE_NAME_TO_CONSTRUCTOR_MAP.set(name, constructor);
            return constructor;
        };
    }

    /**
     * 获取所有节点元数据
     */
    export function getAllNodeMetadata(): Map<any, NodeMetadata> {
        return new Map(NODE_METADATA_MAP);
    }

    /**
     * 通过节点名 获取 节点构造函数
     */
    export function getNodeConstructor(name: string): any {
        return NODE_NAME_TO_CONSTRUCTOR_MAP.get(name);
    }

    /**
     * 通过节点构造函数 找到节点元数据
     */
    export function getNodeMetadata(ctor: any): NodeMetadata {
        return NODE_METADATA_MAP.get(ctor)!;
    }
}

let _global = globalThis || window || global;
(_global as any)["getKunpoBTNodeMaps"] = function () {
    return BT.getAllNodeMetadata();
};