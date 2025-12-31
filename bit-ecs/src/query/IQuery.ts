/**
 * @Author: Gongxh
 * @Date: 2025-05-18
 * @Description: 查询器接口
 */

import { Component } from "../component/Component";
import { ComponentPool } from "../component/ComponentPool";
import { ComponentType } from "../component/ComponentType";
import { Entity } from "../entity/Entity";
import { EntityPool } from "../entity/EntityPool";

export interface IQueryResult {
    // 筛选出来的实体集合
    entitys: Entity[];

    /** 通用迭代器实现，会产生极少的GC */
    iterate<T extends Component>(c1: ComponentType<T>): IterableIterator<[Entity, T]>;

    iterate<T1 extends Component, T2 extends Component>(c1: ComponentType<T1>, c2: ComponentType<T2>): IterableIterator<[Entity, T1, T2]>;

    iterate<T1 extends Component, T2 extends Component, T3 extends Component>(c1: ComponentType<T1>, c2: ComponentType<T2>, c3: ComponentType<T3>): IterableIterator<[Entity, T1, T2, T3]>;

    iterate<T1 extends Component, T2 extends Component, T3 extends Component, T4 extends Component>(c1: ComponentType<T1>, c2: ComponentType<T2>, c3: ComponentType<T3>, c4: ComponentType<T4>): IterableIterator<[Entity, T1, T2, T3, T4]>;

    iterate<T1 extends Component, T2 extends Component, T3 extends Component, T4 extends Component, T5 extends Component>(c1: ComponentType<T1>, c2: ComponentType<T2>, c3: ComponentType<T3>, c4: ComponentType<T4>, c5: ComponentType<T5>): IterableIterator<[Entity, T1, T2, T3, T4, T5]>;

    iterate<T1 extends Component, T2 extends Component, T3 extends Component, T4 extends Component, T5 extends Component, T6 extends Component>(c1: ComponentType<T1>, c2: ComponentType<T2>, c3: ComponentType<T3>, c4: ComponentType<T4>, c5: ComponentType<T5>, c6: ComponentType<T6>): IterableIterator<[Entity, T1, T2, T3, T4, T5, T6]>;

    iterate<T1 extends Component, T2 extends Component, T3 extends Component, T4 extends Component, T5 extends Component, T6 extends Component, T7 extends Component>(c1: ComponentType<T1>, c2: ComponentType<T2>, c3: ComponentType<T3>, c4: ComponentType<T4>, c5: ComponentType<T5>, c6: ComponentType<T6>, c7: ComponentType<T7>): IterableIterator<[Entity, T1, T2, T3, T4, T5, T6, T7]>;

    iterate<T1 extends Component, T2 extends Component, T3 extends Component, T4 extends Component, T5 extends Component, T6 extends Component, T7 extends Component, T8 extends Component>(c1: ComponentType<T1>, c2: ComponentType<T2>, c3: ComponentType<T3>, c4: ComponentType<T4>, c5: ComponentType<T5>, c6: ComponentType<T6>, c7: ComponentType<T7>, c8: ComponentType<T8>): IterableIterator<[Entity, T1, T2, T3, T4, T5, T6, T7, T8]>;


    /** 零GC 单组件迭代器 */
    iterate1<T extends Component>(comp: ComponentType<T>): IterableIterator<[Entity, T]>;

    /** 零GC 双组件迭代器 */
    iterate2<T1 extends Component, T2 extends Component>(comp1: ComponentType<T1>, comp2: ComponentType<T2>): IterableIterator<[Entity, T1, T2]>;

    /** 零GC 三组件迭代器 */
    iterate3<T1 extends Component, T2 extends Component, T3 extends Component>(comp1: ComponentType<T1>, comp2: ComponentType<T2>, comp3: ComponentType<T3>): IterableIterator<[Entity, T1, T2, T3]>;

    /** 零GC 四组件迭代器 */
    iterate4<T1 extends Component, T2 extends Component, T3 extends Component, T4 extends Component>(comp1: ComponentType<T1>, comp2: ComponentType<T2>, comp3: ComponentType<T3>, comp4: ComponentType<T4>): IterableIterator<[Entity, T1, T2, T3, T4]>
}

export interface IQueryEvent {
    /** 变化的实体集合 */
    changeEntities: Set<Entity>;
    /** 是否需要全量刷新 */
    needFullRefresh: boolean;
    /** 变化的实体 */
    changeEntity(entity: Entity): void;
    /** 变化的实体集合 */
    batchChangeEntities(entities: Entity[]): void;
    /** 根据变化刷新缓存 */
    cacheRefresh(): void;
    /** 全量刷新 */
    cacheReset(): void;
    /** 清理 */
    clear(): void;
}

export interface IQuery {
    /** 实体池的引用 */
    entityPool: EntityPool;

    /** 组件池的引用 */
    componentPool: ComponentPool;
}
