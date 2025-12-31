/**
 * @Author: Gongxh
 * @Date: 2025-05-16
 * @Description: 
 */

import { ComponentPool } from "../component/ComponentPool";
import { IComponent } from "../component/IComponent";
import { _ecsdecorator } from "../ECSDecorator";
import { createMask, IMask } from "../utils/IMask";
import { RecyclePool } from "../utils/RecyclePool";
import { Entity } from "./Entity";

export class EntityPool {
    /** 
     * 实体id
     * @internal
     */
    private unique: number = 0;
    /**
     * 实体数量
     * @internal
     */
    private _size: number = 0;
    /**
     * 实体掩码 实体 -> 组件集合的掩码
     * @internal
     */
    private readonly entityMasks: Map<Entity, IMask> = new Map();
    /** 
     * 实体回收池
     * @internal
     */
    private readonly recyclePool: RecyclePool<Entity> = null;
    /** 
     * 掩码回收池
     * @internal
     */
    private readonly maskRecyclePool: RecyclePool<IMask> = null;

    /**
     * 组件池引用
     * @internal
     */
    private readonly _componentPool: ComponentPool = null;


    /**
     * 获取组件池
     * @internal
     */
    public get componentPool(): ComponentPool {
        return this._componentPool;
    }

    /** 
     * 获取有效实体数量
     * @returns 有效实体数量
     */
    public get size(): number {
        return this._size;
    }

    constructor(componentPool: ComponentPool, max: number) {
        this.unique = 0;
        this._size = 0;

        this._componentPool = componentPool;

        // 初始化实体回收池
        this.recyclePool = new RecyclePool<Entity>(() => this.unique++, null, 128, max);
        this.recyclePool.name = "EntityPool";
        // 实体掩码回收池
        this.maskRecyclePool = new RecyclePool<IMask>(() => createMask(), mask => mask.clear(), 128, max);
        this.maskRecyclePool.name = "MaskPool";
    }

    /** 
     * 创建实体 (实体仅包含一个ID)
     * @returns 实体
     * @internal
     */
    public createEntity(): Entity {
        return this.recyclePool.pop();
    }

    /**
     * 给实体添加组件
     * @param entity 实体
     * @param componentType 组件类型
     * @param component 组件
     * @internal
     */
    public addComponent(entity: Entity, componentType: number, component: IComponent): void {
        if (this.hasComponent(entity, componentType)) {
            console.warn(`entity[${entity}]已经拥有组件[${_ecsdecorator.getComponentName(componentType)}]`);
            return;
        }
        let mask = this.entityMasks.get(entity);
        if (!mask) {
            mask = this.maskRecyclePool.pop();
            this.entityMasks.set(entity, mask);
            this._size++;
        }
        mask.set(componentType);
        this._componentPool.addComponent(entity, componentType, component);
    }

    /**
     * 删除实体的组件
     * @param entity 实体
     * @param componentType 组件类型
     * @returns 是否成功删除
     */
    public removeComponent(entity: Entity, componentType: number): void {
        if (!this.entityMasks.has(entity)) {
            // 实体上没有组件
            console.warn(`entity[${entity}]已经被删除, 删除组件[${_ecsdecorator.getComponentName(componentType)}]失败`);
            return;
        }
        // 实体上没有组件
        if (!this.hasComponent(entity, componentType)) {
            console.warn(`entity[${entity}]上没有组件[${_ecsdecorator.getComponentName(componentType)}]`);
            return;
        }
        this._componentPool.removeComponent(entity, componentType);
        // 删除组件
        let mask = this.entityMasks.get(entity);
        mask.delete(componentType);
        if (mask.isEmpty()) {
            this._size--;
            // 回收掩码
            this.maskRecyclePool.recycle(mask);
            // 删除实体掩码
            this.entityMasks.delete(entity);
            // 回收实体
            this.recyclePool.recycle(entity);
        }
    }

    /**
     * 获取实体的组件
     * @param entity 实体
     * @param comp 组件类型
     * @returns 组件
     */
    public getComponent<T extends IComponent>(entity: Entity, componentType: number): T {
        if (!this.hasComponent(entity, componentType)) {
            console.warn(`获取组件[${_ecsdecorator.getComponentName(componentType)}]失败 entity[${entity}]上没有该组件`);
            return null;
        }
        return this._componentPool.getComponent(entity, componentType) as T;
    }

    /**
     * 检查实体是否拥有特定组件
     * @param entity 实体
     * @param componentType 组件类型
     * @returns 是否拥有
     */
    public hasComponent(entity: Entity, componentType: number): boolean {
        const mask = this.entityMasks.get(entity)
        return mask ? mask.has(componentType) : false;
    }

    /**
     * 获取实体的掩码
     * @param entity 实体
     * @returns 掩码
     */
    public getMask(entity: Entity): IMask {
        return this.entityMasks.get(entity);
    }

    /** 遍历实体上的组件 */
    public forEachComponent(entity: Entity, callback: (componentType: number) => void): void {
        let mask = this.entityMasks.get(entity)
        mask && mask.values().forEach(componentType => callback(componentType));
    }

    /** 遍历所有实体 */
    public forEachEntity(callback: (entity: Entity) => void): void {
        this.entityMasks.forEach((mask, entity) => callback(entity));
    }

    /**
     * 获取所有实体 调试可用，不要在生产环境中使用
     * @internal
     */
    public get entities(): Entity[] {
        return Array.from(this.entityMasks.keys());
    }

    /**
     * 清理实体池
     */
    public clear(): void {
        this.unique = 0;
        this._size = 0;
        this.entityMasks.clear();
        this.recyclePool.clear();
        this.maskRecyclePool.clear();
    }
}
