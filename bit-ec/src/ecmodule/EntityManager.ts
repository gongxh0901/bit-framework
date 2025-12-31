import { EventManager } from "@gongxh/bit-event";
import { Component } from "./Component";
import { ComponentManager } from "./ComponentManager";
import { ComponentPool } from "./ComponentPool";
import { EntityId, entityIdString, EntityIndexBits, getEntityIndex, getEntityVersion, MaxEntityCount } from "./ECType";
import { Entity } from "./Entity";

export class EntityManager {
    /**
     * 名称
     * @type {string}
     */
    public name: string;

    /**
     * 单例实体
     * @type {Entity}
     * @internal
     */
    public readonly insEntity: Entity = new Entity();

    /**
     * 单例实体激活状态
     * @type {boolean}
     * @internal
     */
    public insActive: boolean = false;

    /**
     * 组件管理
     * @type {ComponentManager}
     */
    public componentManager: ComponentManager;

    /**
     * 普通实体事件容器
     * @type {EventManager}
     * @internal
     */
    private _eventManager: EventManager;

    /**
     * 单例实体消息监听容器
     * @type {EventManager}
     * @internal
     */
    private _insEventManager: EventManager;

    /** 实体池 @internal */
    private readonly _entityPool: Entity[] = [];
    /** tag标记池 @internal */
    private readonly _tagToEntity: Map<number, Set<EntityId>> = new Map<number, Set<EntityId>>();
    /** 实体回收池 @internal */
    private _recyclePool: Entity[] = [];
    /** 实体回收池最大容量 @internal */
    private _maxCapacityInPool: number;
    /** 实体回收版本 @internal */
    private _entityVersion: number[] = [];
    /** 回收实体ID @internal */
    private _recycleEntityIds: EntityId[] = [];
    /** 世界是否删除 @internal */
    private _isDestroyed: boolean;
    /** 是否正在更新 @internal */
    private _updating: boolean;
    /**
     * 实体池最大容量，回收的多余的实体不会缓存
     * @param {string} name 名称
     * @param {ComponentPool} componentPool 组件池
     * @param {ComponentPool} componentUpdateOrderList 组件更新顺序
     * @param {number} [maxCapacityInPool=128] 实体回收池最大容量
     * @param {number} [preloadEntityCount=32] 预加载Entity数量
     */
    constructor(name: string, componentPool: ComponentPool, componentUpdateOrderList: number[], maxCapacityInPool: number = 128, preloadEntityCount: number = 32) {
        this.name = name;
        if (preloadEntityCount >= MaxEntityCount) {
            throw new Error(`预加载超出实体最大数量：${preloadEntityCount} >= max(${MaxEntityCount})`);
        }
        // 占位
        this._entityPool.push(null);
        this._entityVersion.push(1);
        this._maxCapacityInPool = maxCapacityInPool;
        // 预创建
        for (let i = 0; i < preloadEntityCount; ++i) {
            this._recyclePool.push(new Entity());
        }
        // 组件管理器
        this.componentManager = new ComponentManager(componentPool, componentUpdateOrderList);
        this.insEntity.entityManager = this;
    }

    /**
     * 添加实体标签（内部使用）
     * @param {EntityId} entityId 实体Id
     * @param {number} tag 标签
     * @internal
     */
    public _addEntityTag(entityId: EntityId, tag: number): void {
        this._validateEntityById(entityId);
        let entitiesByTag = this._tagToEntity.get(tag);
        if (!entitiesByTag) {
            entitiesByTag = new Set<EntityId>();
            this._tagToEntity.set(tag, entitiesByTag);
        }
        entitiesByTag.add(entityId);
    }

    /**
     * 删除实体Tag（内部使用）
     * @param {Entity} entity 实体
     * @param {number} tag 标签
     * @internal
     */
    public _removeEntityTag(entity: Entity, tag: number): void {
        this._removeEntityTagById(entity.id, tag);
    }

    /**
     * 通过实体ID删除实体Tag（内部使用）
     * @param {EntityId} entityId 实体Id
     * @param {number} tag 标签
     * @internal
     */
    public _removeEntityTagById(entityId: EntityId, tag: number): void {
        this._validateEntityById(entityId);
        const entitiesByTag = this._tagToEntity.get(tag);
        if (entitiesByTag) {
            entitiesByTag.delete(entityId);
        }
    }

    /**
     * 创建实体
     * @returns {Entity} 实体
     */
    public createEntity(name: string): Entity {
        const entity = this._recyclePool.pop() || new Entity();
        entity.id = 0;
        entity.name = name;
        entity.entityManager = this;
        return entity;
    }

    /**
     * 添加实体
     * @param {Entity} entity 要添加的实体
     */
    public addEntity(entity: Entity): void {
        if (this.exists(entity.id)) {
            throw new Error(`实体（${entityIdString(entity.id)}）已经添加到EntityManager`);
        }
        // 分配实体Id
        if (this._recycleEntityIds.length > 0) {
            const newIndex = this._recycleEntityIds.pop();
            this._entityPool[newIndex] = entity;
            entity.id = (this._entityVersion[newIndex] << EntityIndexBits) | newIndex;
        } else {
            this._entityPool.push(entity);
            this._entityVersion.push(1);
            entity.id = MaxEntityCount | (this._entityPool.length - 1);
        }
        this._addEntityToTag(entity);
        entity._add();
    }

    /**
     * 销毁实体
     * @param {Entity} entity 要删除的实体
     */
    public destroyEntity(entity: Entity): void {
        this.destroyEntityById(entity.id);
    }

    /**
     * 销毁指定ID实体
     * @param {EntityId} entityId 实体Id
     */
    public destroyEntityById(entityId: EntityId): void {
        const entity = this.getEntity(entityId);
        if (!entity) {
            console.log(`实体(${entityIdString(entityId)})已经被销毁`);
            return;
        }
        this._recycleEntity(entity);
        this._eventManager && this._eventManager.removeByTarget(entity);
    }

    /**
     * 销毁所有实体
     * @param {boolean} ignoreSingletonEntity 是否忽略单例实体
     */
    public destroyAllEntities(ignoreSingletonEntity: boolean): void {
        const entities = this._entityPool;
        for (let i = 1, len = entities.length; i < len; ++i) {
            if (entities[i]) {
                this._destroyEntity(entities[i]);
            }
        }
        this._recycleEntityIds.length = 0;
        this._entityPool.length = 0;
        this._entityVersion.length = 0;
        this._tagToEntity.clear();

        // 占位
        this._entityPool.push(null);
        this._entityVersion.push(1);
        this._eventManager && this._eventManager.clearAll();

        // 销毁单例实体组件
        if (!ignoreSingletonEntity) {
            this.insEntity._destroy();
            this.insActive = false;
            this._insEventManager && this._insEventManager.clearAll();
        }
    }

    /**
     * 通过实体ID获取实体
     * @param {EntityId} entityId 实体Id
     * @returns {(Entity | null)} 实体
     */
    public getEntity(entityId: EntityId): Entity | null {
        const index = getEntityIndex(entityId);
        if (index <= 0 || index >= this._entityPool.length) {
            return null;
        }
        if (this._entityVersion[index] == getEntityVersion(entityId)) {
            return this._entityPool[index];
        }
        return null;
    }

    /**
     * 获取指定标签的实体
     * @param {number} tag 标签
     * @returns {Entity[]} 返回的实体池
     */
    public getEntitiesByTag(tag: number): Entity[] {
        let buffer: Entity[] = [];
        const entitiesByTag = this._tagToEntity.get(tag);
        if (entitiesByTag) {
            for (const entityId of entitiesByTag) {
                const entity = this.getEntity(entityId);
                entity && buffer.push(entity);
            }
        }
        return buffer;
    }

    /**
     * 根据实体ID判断实体是否存在
     * @param {EntityId} entityId 实体Id
     * @returns {boolean}
     */
    public exists(entityId: EntityId): boolean {
        const index = getEntityIndex(entityId);
        if (index <= 0 || index >= this._entityPool.length) {
            return false;
        }
        const entity = this._entityPool[index];
        return entity && this._entityVersion[index] == getEntityVersion(entityId);
    }

    /**
     * 创建组件
     * @template T 组件类型
     * @param {string} componentName 组件名
     * @returns {T} 创建的组件
     */
    public createComponent<T extends Component>(componentName: string): T {
        return this.componentManager.createComponent<T>(componentName);
    }

    /**
     * 添加单例组件
     * @param component
     */
    public addSingleton(component: Component): void {
        this.insEntity.addComponent(component);
    }

    /**
     * 获取单例组件
     */
    public getSingleton<T extends Component>(componentType: number): T {
        return this.insEntity.getComponent<T>(componentType);
    }

    /**
     * 删除单例组件
     */
    public removeSingleton(componentType: number): void {
        this.insEntity.removeComponent(componentType);
    }

    /**
     * 是否存在对应的单例组件
     */
    public hasSingleton(componentType: number): boolean {
        return this.insEntity.hasComponent(componentType);
    }

    /**
     * 激活单例组件
     */
    public activeSingleton(): void {
        const insEntity = this.insEntity;
        if (this.insActive) {
            throw new Error("单例实体已经被激活");
        }
        this.insActive = true;
        insEntity.id = -1;
        insEntity._add();
    }

    /**
     * 销毁EntityManager
     */
    public destroy(): void {
        if (this._isDestroyed) {
            return;
        }
        if (this._updating) {
            throw new Error("请勿在更新时销毁EntityManager");
        }
        this.destroyAllEntities(false);
        this.componentManager.destroy();
        this._isDestroyed = true;
    }

    /**
     * 添加消息监听 (内部使用)
     * @param eventName 消息名
     * @param callback 事件回调
     * @param entityId 实体ID
     * @param once 是否单次事件
     * @internal
     */
    public _addEvent(eventName: string, callback: (...args: any[]) => void, entity: Entity, once: boolean = false): number {
        if (entity == this.insEntity) {
            this._insEventManager = this._insEventManager ? this._insEventManager : new EventManager();
            if (once) {
                return this._insEventManager.addOnce(eventName, callback, entity);
            } else {
                return this._insEventManager.add(eventName, callback, entity);
            }
        }
        this._eventManager = this._eventManager ? this._eventManager : new EventManager();
        if (once) {
            return this._eventManager.addOnce(eventName, callback, entity);
        } else {
            return this._eventManager.add(eventName, callback, entity);
        }
    }

    /**
     * 发送消息 (内部使用)
     * @param eventName 消息名
     * @param entityId 实体ID
     * @param args 发送参数
     * @internal
     */
    public _sendEvent(eventName: string, entity: Entity, ...args: any[]): void {
        if (entity == this.insEntity) {
            this._insEventManager && this._insEventManager.send(eventName, entity, ...args);
            return;
        }
        this._eventManager && this._eventManager.send(eventName, entity, ...args);
    }

    /**
     * 移除消息监听 (内部使用)
     * @param eventName 消息名
     * @param entity 实体
     * @param callback 事件回调
     * @internal
     */
    public _removeEvent(eventId: number, entity: Entity): void {
        if (entity == this.insEntity) {
            this._insEventManager && this._insEventManager.remove(eventId);
            return;
        }
        this._eventManager && this._eventManager.remove(eventId);
    }

    /**
     * 通过事件名移除特定实体上的消息监听 (内部使用)
     * @param eventName 事件名
     * @param entity 实体
     * @internal
     */
    public _removeEventByName(eventName: string, entity: Entity): void {
        if (entity == this.insEntity) {
            this._insEventManager && this._insEventManager.removeByNameAndTarget(eventName, entity);
            return;
        }
        this._eventManager && this._eventManager.removeByNameAndTarget(eventName, entity);
    }

    /**
     * 移除实体上的所有消息监听 (内部使用)
     * @param entity 实体
     * @internal
     */
    public _removeAllEvent(entity: Entity): void {
        if (entity == this.insEntity) {
            this._insEventManager && this._insEventManager.removeByTarget(entity);
            return;
        }
        this._eventManager && this._eventManager.removeByTarget(entity);
    }

    /**
     * 更新
     * @param {number} dt 时间间隔
     */
    public update(dt: number): void {
        this._updating = true;
        this.componentManager._update(dt);
        this._updating = false;
    }

    /**
     * 回收Entity
     * @param {Entity} entity 要回收的Entity
     * @internal
     */
    private _recycleEntity(entity: Entity): void {
        // 回收实体Id
        const entityIndex = getEntityIndex(entity.id);
        this._recycleEntityIds.push(entityIndex);
        this._entityPool[entityIndex] = null;
        ++this._entityVersion[entityIndex];

        this._destroyEntity(entity);
    }

    /**
     * 销毁实体
     * @param {Entity} entity
     * @internal
     */
    private _destroyEntity(entity: Entity): void {
        entity._destroy();
        if (this._recyclePool.length < this._maxCapacityInPool) {
            this._recyclePool.push(entity);
        }
    }

    /**
     * 实体根据tag添加到tag列表中
     * @param entity
     * @internal
     */
    private _addEntityToTag(entity: Entity): void {
        const tags = entity.tags;
        if (!tags || tags.size == 0) {
            return;
        }
        const entityId = entity.id;
        for (const tag of tags.values()) {
            this._addEntityTag(entityId, tag);
        }
    }

    /**
     * 验证实体ID是否存在
     * @param {EntityId} entityId 实体ID
     * @internal
     */
    private _validateEntityById(entityId: EntityId): void {
        if (!this.exists(entityId)) {
            throw new Error(`实体（${entityId}）不存在`);
        }
    }
}
