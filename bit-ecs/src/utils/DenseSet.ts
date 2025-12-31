/**
 * 密集集合 (DenseSet) 实现
 * 一种高效的数据结构，用于ECS系统中存储和管理组件
 * 提供O(1)复杂度的添加、删除和查找操作
 */

import { IComponent } from "../component/IComponent";
import { Entity } from "../entity/Entity";
export class DenseSet<T extends IComponent> {
    /** 存储实际组件数据的数组 @internal */
    private dense: T[] = [];

    /** 实体到数组索引的映射 (实体 -> 数组索引) @internal */
    private readonly entityToIndex: Map<Entity, number> = new Map();

    /** 索引到实体的反向 @internal */
    private entities: Entity[] = [];

    /** 使用中的数量 @internal */
    private _size: number = 0;

    /** 被取出还未还回的数据 最小和最大索引 */
    private _min: number = 0;
    private _max: number = 0;

    /** 创建新对象的工厂函数 */
    private factory: () => T = null;

    constructor(factory: () => T) {
        this.factory = factory;
        this.dense.length = 0;
        this.entities.length = 0;
        this.expand(32);
        this.entityToIndex.clear();
        this._size = 0;
        this._min = 0;
        this._max = 0;
    }

    /**
     * 扩容
     * @param length 扩容长度 默认32
     * @internal
     */
    private expand(length: number = 32): void {
        let len = this.dense.length;
        let newLength = len + length;
        this.dense.length = newLength;
        this.entities.length = newLength;

        this.dense.fill(undefined, len, newLength);
        this.entities.fill(0, len, newLength);
    }

    /** 返回一个新组件 如果密集数组没有空位 则扩容 */
    public create(): T {
        // 先查看min之前的数据，是否存在未被使用的
        if (this._size < this._min) {
            // 左侧还有未被使用的组件
            this._min--;
            let component = this.dense[this._min];
            this.dense[this._min] = undefined;
            return component;
        } else {
            let len = this.dense.length;
            if (this._max >= len) {
                // 右侧没有内容 扩容
                if (len >= 1024) {
                    this.expand(512);
                } else {
                    this.expand(Math.max(len, 32));
                }
            }
        }
        let component = this.dense[this._max];
        this.dense[this._max] = undefined;
        this._max++;
        return component || this.factory();
    }

    /**
     * 添加或更新组件
     * @param entity 实体
     * @param component 组件数据
     * @internal
     */
    public add(entity: Entity, component: T): void {
        if (this._size != this._min) {
            this.dense[this._min] = this.dense[this._size];
        }
        // 添加到密集数组有效数据的位置
        this.dense[this._size] = component;
        this.entities[this._size] = entity;
        // 更新映射
        this.entityToIndex.set(entity, this._size);
        this._size++;
        this._min++;
    }

    /**
     * 删除实体上的组件
     * @param entity 实体
     * @returns 返回被删除的组件
     * @internal
     */
    public remove(entity: Entity): void {
        const index = this.entityToIndex.get(entity);
        const lastIndex = this._size - 1;
        // 如果不是最后一个元素，用最后一个元素替换被删除的元素
        if (index !== lastIndex) {
            const lastEntity = this.entities[lastIndex];
            // 交换位置
            [this.dense[index], this.dense[lastIndex]] = [this.dense[lastIndex], this.dense[index]];
            this.entities[index] = lastEntity;
            // 更新最后一个元素的映射
            this.entityToIndex.set(lastEntity, index);
        }
        // 清理映射
        this.entityToIndex.delete(entity);
        // 重置组件数据
        this.dense[lastIndex].reset();
        this._size--;
    }

    /**
     * 获取组件
     * @param entity 实体
     * @returns 组件
     * @internal
     */
    public get(entity: Entity): T {
        return this.dense[this.entityToIndex.get(entity)];
    }

    /**
     * 获取使用中的组件总数 (实体数量)
     * @internal
     */
    public get size(): number {
        return this._size;
    }

    /** 零GC遍历有效实体 */
    public forEachEntity(callback: (entity: Entity, index: number) => void): void {
        for (let i = 0; i < this._size; i++) {
            callback(this.entities[i], i);
        }
    }

    /**
     * 清理所有内容
     * @internal
     */
    public clear(): void {
        for (let i = 0; i < this._size; i++) {
            this.dense[i].reset();
        }
        this.dense.length = 0;
        this.entities.length = 0;
        this.entityToIndex.clear();
        this._size = 0;
        this._min = 0;
        this._max = 0;
    }
}