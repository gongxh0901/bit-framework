/**
 * 组件池 - 使用稀疏集合高效管理不同类型的组件
 */
import { _ecsdecorator } from '../ECSDecorator';
import { Entity } from '../entity/Entity';
import { DenseSet } from '../utils/DenseSet';
import { IComponent } from './IComponent';

export class ComponentPool {
    /**
     * 组件类型对应的紧凑数据集合 组件类型 -> 紧凑数据集合
     * @internal
     */
    private pools: DenseSet<IComponent>[] = [];

    /**
     * 组件池初始化
     * @internal
     */
    constructor() {
        let componentMaps = _ecsdecorator.getComponentMaps();
        this.pools.length = componentMaps.size + 1;
        for (let ctor of componentMaps.keys()) {
            let type = ctor.ctype;
            // 创建稀疏集合
            this.pools[type] = new DenseSet<IComponent>(() => new ctor());
        }
    }

    /**
     * 创建组件
     * @param componentType 组件类型
     * @returns 组件实例
     * @internal
     */
    public createComponent<T extends IComponent>(componentType: number): T {
        return this.pools[componentType].create() as T;
    }

    /**
     * 添加组件到实体 (其实是预添加)
     * @param entity 实体
     * @param comp 组件类型
     * @param component 组件实例
     * @internal
     */
    public addComponent<T extends IComponent>(entity: Entity, componentType: number, component: T): void {
        // 获取对应组件池并添加组件
        this.pools[componentType].add(entity, component);
    }

    /**
     * 获取实体的组件
     * @param entity 实体
     * @param componentType 组件类型
     * @returns 组件或undefined(如不存在)
     * @internal
     */
    public getComponent<T extends IComponent>(entity: Entity, componentType: number): T | undefined {
        return this.pools[componentType].get(entity) as T;
    }

    /**
     * 获取实体的多个组件 (专门给查询器用的)
     * @param entity 实体
     * @param componentTypes 组件类型
     * @internal
     */
    public getComponentBatch(entity: Entity, componentTypes: number[], out: IComponent[][], index: number): void {
        for (let type of componentTypes) {
            out[type][index] = this.getComponent(entity, type);
        }
    }

    /**
     * 删除实体的特定组件
     * @param entity 实体
     * @param componentType 组件类型
     * @internal
     */
    public removeComponent(entity: Entity, componentType: number): void {
        this.pools[componentType].remove(entity);
    }

    // 获取拥有特定组件的实体数量
    public getEntityCount(componentType: number): number {
        return this.pools[componentType].size;
    }

    /** 获取对应的组件池 */
    public getPool(componentType: number): DenseSet<IComponent> {
        return this.pools[componentType];
    }

    /**
     * 清理组件池中所有内容
     * @internal
     */
    public clear(): void {
        for (let i = 1; i < this.pools.length; i++) {
            let pool = this.pools[i];
            pool.clear();
        }
    }
}