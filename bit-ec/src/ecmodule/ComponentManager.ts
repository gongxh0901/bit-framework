import { Component } from "./Component";
import { ComponentPool } from "./ComponentPool";

/**
 * 组件更新信息
 * @internal
 */
export class ComponentUpdate {
    /** 组件更新类型 */
    public componentType: number;

    /** 组件更新列表 @internal */
    private readonly _components: Component[] = [];

    /** create constructor @internal */
    public constructor(componentType: number) {
        this.componentType = componentType;
    }

    /**
     * 添加要更新的组件
     * @param component 组件
     * @internal
     */
    public addComponent(component: Component): void {
        this._components.push(component);
        component._updateId = this._components.length - 1;
    }

    /**
     * 删除要更新的组件
     * @param {Component} component 组件
     * @internal
     */
    public removeComponent(component: Component): void {
        const components = this._components;
        const finalUpdateID = components.length - 1;
        const updateID = component._updateId;

        component._updateId = -1;
        /** 最后一个和当前要删除的不是同一个，交换位置 */
        if (finalUpdateID != updateID) {
            const finalComponent = components[finalUpdateID];
            // #EC_DEBUG_BEGIN
            if (finalComponent._updateId != finalUpdateID) {
                throw new Error(`组件(${finalComponent.toString()})更新ID(${finalUpdateID})与存储更新ID(${finalComponent._updateId})不一致`);
            }
            // #EC_DEBUG_END
            finalComponent._updateId = updateID;
            components[updateID] = finalComponent;
        }
        components.pop();
    }

    /** 更新 @internal */
    public _update(dt: number): void {
        const components = this._components;
        const componentCount = components.length;

        if (componentCount > 0) {
            for (let i = 0; i < componentCount; ++i) {
                const component = components[i];

                if (component.needUpdate && component._updating) {
                    component._update(dt);
                }
            }
        }
    }
}

export class ComponentManager {
    /**
     * 组件池
     * @type {ComponentPool}
     * @internal
     */
    protected componentPool: ComponentPool;

    /** 更新组件池 @internal */
    protected readonly updatingComponents: ComponentUpdate[] = [];
    /** 组件更新顺序 @internal */
    protected readonly componentUpdateOrderList: number[] = [];

    /** 新添加的或者新停止更新的组件池 @internal */
    private readonly _toUpdateComponents: Component[] = [];
    /** 新停止更新的组件池 @internal */
    private readonly _toStopComponents: Component[] = [];

    /** 当前更新的组件类型 @internal */
    private _currentUpdateComponentType: number = -1;

    /**
     *Creates an instance of ComponentManager.
     * @param {ComponentPool} componentPool 组件池
     * @param {number[]} componentUpdateOrderList 组件更新顺序
     * @internal
     */
    constructor(componentPool: ComponentPool, componentUpdateOrderList: number[]) {
        this.componentPool = componentPool;
        this._toUpdateComponents.length = 0;
        this._toStopComponents.length = 0;
        for (const componentType of componentUpdateOrderList) {
            this._addComponentUpdateOrder(componentType);
        }
    }

    /**
     * 销毁组件管理器
     * @internal
     */
    public destroy(): void {
        this.componentPool.clear();
        this.updatingComponents.length = 0;
        this.componentUpdateOrderList.length = 0;
        this._toUpdateComponents.length = 0;
        this._toStopComponents.length = 0;
    }

    /**
     * 创建组件
     * @template T
     * @param {string} componentName 组件名
     * @returns {T} 创建的组件
     * @internal
     */
    public createComponent<T extends Component>(componentName: string): T {
        const component = this.componentPool.get(componentName) as T;
        // component._enable = true;
        // component.needDestroy = false;
        component.componentManager = this;
        return component;
    }

    /**
     * 开始更新组件
     * @param {Component} component 组件
     */
    public startUpdateComponent(component: Component): void {
        if (component._updating) {
            return;
        }
        if (this._currentUpdateComponentType != component.type) {
            this._addComponentToUpdateList(component);
            return;
        }
        this._toUpdateComponents.push(component);
    }

    /**
     * 停止更新组件
     * @param {Component} component 组件
     */
    public stopUpdateComponent(component: Component): void {
        if (!component._updating) {
            return;
        }

        if (this._currentUpdateComponentType != component.type) {
            this._removeComponentToUpdateList(component);
            return;
        }

        this._toStopComponents.push(component);
    }

    /**
     * 销毁组件（内部使用）
     * @param {Component} component
     * @internal
     */
    public _destroyComponent(component: Component): void {
        if (!component._updating) {
            component._destroy();
            this.componentPool.recycle(component);
        } else {
            component._needDestroy = true;
        }
    }

    /** 
     * 更新所有组件（内部使用）
     * @param {number} dt 时间间隔
     * @internal
     */
    public _update(dt: number): void {
        this._updateAllComponents(dt);
        this._currentUpdateComponentType = -1;

        this._clearStopComponents();
        this._addUpdateComponents();
    }

    /**
     * 添加组件更新顺序，先添加的先更新
     * @param {number} componentType 组件类型
     * @returns {ComponentManager} 组件管理器
     * @internal
     */
    private _addComponentUpdateOrder(componentType: number): ComponentManager {
        this.componentUpdateOrderList.push(componentType);
        const updatingComponents = this.updatingComponents;
        for (let i = updatingComponents.length; i <= componentType; ++i) {
            updatingComponents.push(null);
        }
        if (updatingComponents[componentType]) {
            throw new Error(`组件类型（${componentType}:${this.componentPool.className(componentType)}）已经添加到更新列表`);
        }
        updatingComponents[componentType] = new ComponentUpdate(componentType);
        return this;
    }

    /** 
     * 添加组件到组件更新列表
     * @param {Component} component 组件
     * @internal
     */
    private _addComponentToUpdateList(component: Component): void {
        if (component.type >= this.updatingComponents.length || !this.updatingComponents[component.type]) {
            throw new Error(`组件（${component.constructor.name}）没有添加到组件更新列表，请使用addComponentUpdateOrder添加更新`);
        }
        this.updatingComponents[component.type].addComponent(component);
    }

    /** 
     * 组件更新列表中删除组件
     * @param {Component} component 组件
     * @internal
     */
    private _removeComponentToUpdateList(component: Component): void {
        this.updatingComponents[component.type].removeComponent(component);
    }

    /** 
     * 更新所有组件
     * @param {number} dt 时间间隔
     * @internal
     */
    private _updateAllComponents(dt: number): void {
        // 按优先级更新所有组件
        const updateList = this.componentUpdateOrderList;
        const updatingComponents = this.updatingComponents;
        let componentType: number;

        for (let i = 0, l = updateList.length; i < l; ++i) {
            componentType = updateList[i];
            this._currentUpdateComponentType = componentType;
            updatingComponents[componentType]._update(dt);
        }
    }

    /**
     * 清除停止更新的组件
     * @internal
     */
    private _clearStopComponents(): void {
        const toStopComponents = this._toStopComponents;
        const l = toStopComponents.length;
        if (l > 0) {
            for (let i = 0; i < l; ++i) {
                const component = toStopComponents[i];
                if (!component.needUpdate && component._updating) {
                    this._removeComponentToUpdateList(component);
                    if (component._needDestroy) {
                        this._destroyComponent(component);
                    }
                }
            }
            toStopComponents.length = 0;
        }
    }

    /**
     * 添加更新组件
     * @internal
     */
    private _addUpdateComponents(): void {
        const toUpdateComponents = this._toUpdateComponents;
        const l = toUpdateComponents.length;
        if (l > 0) {
            for (let i = 0; i < l; ++i) {
                const component = toUpdateComponents[i];
                if (component.needUpdate && !component._updating) {
                    this._addComponentToUpdateList(component);
                }
            }
            toUpdateComponents.length = 0;
        }
    }
}
