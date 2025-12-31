import { Component } from "./Component";
import { ObjectBase } from "./ObjectBase";
import { ObjectFactory } from "./ObjectFactory";

export class ComponentPool {
    /** 组件对象类型到组件类型转换 @internal */
    private readonly _objectTypeToComponentType: number[] = new Array<number>(128);
    /** 组件池 @internal */
    private _pools: Map<number, ObjectFactory> = new Map();
    /** 组件名称到组件对象类型转换 @internal */
    private _nameToObjectType: Map<string, number> = new Map();
    /**
     * 注册组件
     * @param {number} componentObjectType 组件对象类型
     * @param {number} componentType 组件类型
     * @param {string} name 组件名称
     * @param {new () => Component} ctor 构造函数
     * @internal
     */
    public register(componentObjectType: number, componentType: number, name: string, ctor: new () => ObjectBase): void {
        if (this._pools.has(componentObjectType)) {
            throw new Error(`组件(${name})已注册, 不允许重复注册`);
        }
        this._pools.set(componentObjectType, new ObjectFactory(componentObjectType, 128, name, ctor));
        this._nameToObjectType.set(name, componentObjectType);

        const objectTypeToComponentType = this._objectTypeToComponentType;
        for (let i = objectTypeToComponentType.length; i <= componentObjectType; ++i) {
            objectTypeToComponentType.push(i);
        }
        objectTypeToComponentType[componentObjectType] = componentType;
    }

    /**
     * 通过组件名称获取组件对象类型
     * @param {string} componentName 组件名称
     * @returns {number} 组件对象类型
     */
    public getObjectTypeByName(componentName: string): number {
        return this._nameToObjectType.get(componentName);
    }

    /**
     * 创建组件
     * @param {number} componentName 组件名
     * @returns {T} 创建的组件
     * @template T
     * @internal
     */
    public get<T extends Component>(componentName: string): T {
        let objectType = this.getObjectTypeByName(componentName);

        const factory = this._pools.get(objectType);
        if (!factory) {
            throw new Error(`组件（${componentName}）未注册，使用组件装饰器 ecclass 注册组件`);
        }
        const component = factory.allocate() as T;
        component.name = factory.name;
        component.type = this._objectTypeToComponentType[objectType];
        return component;
    }

    /**
     * 通过组件对象类型获取组件类名
     * @param {number} componentObjectType 组件类型
     * @returns {string}
     * @internal
     */
    public className(componentObjectType: number): string {
        const factory = this._pools.get(componentObjectType);
        if (!factory) {
            throw new Error(
                `组件（${componentObjectType}）没有注册，使用ComponentPool.register(componentObjectType, componentType, componentClass)注册组件`
            );
        }
        return factory.name;
    }

    /**
     * 回收组件
     * @param {BaseComponent} component 要回收的组件
     * @memberof ComponentPool
     * @internal
     */
    public recycle(component: Component): void {
        const objectFactory = this._pools.get(component.objectType);
        objectFactory.recycle(component);
    }

    /** 
     * 清理缓存
     * @internal
     */
    public clear(): void {
        for (const factory of this._pools.values()) {
            factory._clear();
        }
    }
}