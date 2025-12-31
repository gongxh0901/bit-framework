/**
 * @Author: Gongxh
 * @Date: 2025-05-15
 * @Description: 查询结果迭代器
 */

import { Component } from "../component/Component";
import { ComponentPool } from "../component/ComponentPool";
import { ComponentType } from "../component/ComponentType";
import { Entity } from "../entity/Entity";
import { EntityPool } from "../entity/EntityPool";
import { IQuery, IQueryEvent, IQueryResult } from "./IQuery";
import { Matcher } from "./Matcher";

/** 临时数组 */
const temporaryList: any[] = [];

export class Query implements IQuery, IQueryResult, IQueryEvent {
    entityPool: EntityPool; // 实体池
    componentPool: ComponentPool; // 组件池
    matcher: Matcher;

    changeEntities: Set<Entity> = new Set();
    needFullRefresh: boolean = false;

    /**
     * 实体集合
     * @internal
     */
    private _entitys: Set<Entity> = new Set();

    constructor(componentPool: ComponentPool, entityPool: EntityPool, matcher: Matcher) {
        this.componentPool = componentPool;
        this.entityPool = entityPool;
        this.matcher = matcher;

        this._entitys.clear();
    }

    public changeEntity(entity: Entity): void {
        if (this.needFullRefresh) {
            return;
        }
        this.changeEntities.add(entity);
        if (this.changeEntities.size > 100) {
            this.needFullRefresh = true;
            this.changeEntities.clear();
        }
    }

    public batchChangeEntities(entities: Entity[]): void {
        if (this.needFullRefresh) {
            return;
        }
        if (this.changeEntities.size + entities.length > 100) {
            this.needFullRefresh = true;
            this.changeEntities.clear();
            return;
        }
        for (let i = 0; i < entities.length; i++) {
            this.changeEntities.add(entities[i]);
        }
    }

    public cacheRefresh(): void {
        for (let entity of this.changeEntities.values()) {
            let mask = this.entityPool.getMask(entity);
            if (mask && this.matcher.isMatch(mask)) {
                // 添加
                this._entitys.add(entity);
            } else if (this._entitys.has(entity)) {
                // 删除
                this._entitys.delete(entity);
            }
        }
    }

    /** 
     * 检查必须包含的组件类型对应的实体最少的 
     * @returns 组件类型 -1: 没有必须包含的配置 0: 实体数为0 其他: 组件类型
     * @internal
     */
    private checkAllOf(): number {
        const matcher = this.matcher;
        let componentPool = this.componentPool;
        // 必须全部包含的组件类型 取出最少的一个池子
        if (!matcher.ruleAllOf) {
            return -1;
        }
        // 找出必须包含的组件类型对应的实体最少的组件
        let lessType: number = -1;
        let lessSize: number = Infinity;

        const indices = matcher.ruleAllOf.indices;
        let len = indices.length;
        for (let i = 0; i < len; i++) {
            let type = indices[i];
            let size = componentPool.getEntityCount(type);
            if (size === 0) {
                return 0;
            }
            if (size < lessSize) {
                lessSize = size;
                lessType = type;
            }
        }
        return lessType;
    }

    public cacheReset(): void {
        const matcher = this.matcher;
        let componentPool = this.componentPool;
        let lessType = this.checkAllOf();
        this._entitys.clear();

        if (lessType === -1) {
            let anyTypes = matcher.ruleAnyOf.indices;
            // 使用Set去重 这里会产生GC
            for (let type of anyTypes) {
                let dense = componentPool.getPool(type);
                dense.forEachEntity(entity => {
                    if (matcher.isMatch(this.entityPool.getMask(entity))) {
                        this._entitys.add(entity)
                    }
                });
            }
        } else if (lessType !== 0) {
            // 存在必须包含的组件类型
            // 从最小集合开始筛选 - 避免全量扫描
            let dense = componentPool.getPool(lessType);
            // const size = dense.size;
            dense.forEachEntity((entity) => {
                if (matcher.isMatch(this.entityPool.getMask(entity))) {
                    this._entitys.add(entity)
                }
            });
        }
    }

    public clear(): void {
        this._entitys.clear();
        this.changeEntities.clear();
    }

    public get entitys(): Entity[] {
        this.lazyRefresh();
        return Array.from(this._entitys);
    }

    /**
     * 获取实体集合
     * @returns 实体集合
     * @deprecated 请使用 entitys 代替
     */
    public getEntitys(): Entity[] {
        return this.entitys;
    }

    private lazyRefresh(): void {
        if (this.needFullRefresh) {
            this.cacheReset();
            this.needFullRefresh = false;
            this.changeEntities.clear();
        } else if (this.changeEntities.size > 0) {
            this.cacheRefresh();
            this.changeEntities.clear();
        }
    }

    /** 通用迭代器实现，会产生极少的GC */
    public *iterate(...comps: ComponentType<Component>[]): IterableIterator<any> {
        this.lazyRefresh();
        const pool = this.componentPool;
        for (let entity of this._entitys) {
            temporaryList.length = 0;
            for (let i = 0; i < comps.length; i++) {
                let component = pool.getComponent(entity, comps[i].ctype);
                temporaryList.push(component);
            }
            yield [entity, ...temporaryList];
        }
    }

    /** 零GC 单组件迭代器 */
    public *iterate1<T extends Component>(comp: ComponentType<T>): IterableIterator<[Entity, T]> {
        this.lazyRefresh();
        const pool = this.componentPool;
        for (let entity of this._entitys) {
            const c1 = pool.getComponent(entity, comp.ctype) as T;
            yield [entity, c1];
        }
    }

    /** 零GC 双组件迭代器 */
    public *iterate2<T1 extends Component, T2 extends Component>(comp1: ComponentType<T1>, comp2: ComponentType<T2>): IterableIterator<[Entity, T1, T2]> {
        this.lazyRefresh();
        const pool = this.componentPool;
        for (let entity of this._entitys) {
            const c1 = pool.getComponent(entity, comp1.ctype) as T1;
            const c2 = pool.getComponent(entity, comp2.ctype) as T2;
            yield [entity, c1, c2];
        }
    }

    /** 零GC 三组件迭代器 */
    public *iterate3<T1 extends Component, T2 extends Component, T3 extends Component>(comp1: ComponentType<T1>, comp2: ComponentType<T2>, comp3: ComponentType<T3>): IterableIterator<[Entity, T1, T2, T3]> {
        this.lazyRefresh();
        const pool = this.componentPool;
        for (let entity of this._entitys) {
            const c1 = pool.getComponent(entity, comp1.ctype) as T1;
            const c2 = pool.getComponent(entity, comp2.ctype) as T2;
            const c3 = pool.getComponent(entity, comp3.ctype) as T3;
            yield [entity, c1, c2, c3];
        }
    }

    /** 零GC 四组件迭代器 */
    public *iterate4<T1 extends Component, T2 extends Component, T3 extends Component, T4 extends Component>(comp1: ComponentType<T1>, comp2: ComponentType<T2>, comp3: ComponentType<T3>, comp4: ComponentType<T4>): IterableIterator<[Entity, T1, T2, T3, T4]> {
        this.lazyRefresh();
        const pool = this.componentPool;
        for (let entity of this._entitys) {
            const c1 = pool.getComponent(entity, comp1.ctype) as T1;
            const c2 = pool.getComponent(entity, comp2.ctype) as T2;
            const c3 = pool.getComponent(entity, comp3.ctype) as T3;
            const c4 = pool.getComponent(entity, comp4.ctype) as T4;
            yield [entity, c1, c2, c3, c4];
        }
    }
}