/**
 * @Author: Gongxh
 * @Date: 2025-01-14
 * @Description: 实体组件管理对外接口
 */

import { Node } from "cc";
import { ECDataHelper } from "./ECDataHelper";
import { Entity } from "./Entity";
import { EntityManager } from "./EntityManager";

interface IEntityConfig {
    [componentName: string]: Record<string, any>
}

interface IWorldConfig {
    /** 实体管理器 */
    world: EntityManager;
    /** 世界节点 */
    worldNode: Node;
}

export class ECManager {
    /** 实体管理器 @internal */
    private static _worlds: Map<string, IWorldConfig> = new Map();
    /** 实体配置信息 @internal */
    private static _entityList: { [name: string]: Record<string, any> } = {};

    /** 初始化ECManager */
    public static init(config?: { [entityName: string]: IEntityConfig }): void {
        if (config) {
            this.registerEntityConfig(config);
        }
        ECDataHelper.registerComponents();
    }

    /**
     * 创建EC世界 创建EC世界前必须先注册组件
     * @param {string} worldName 名称
     * @param {Node} node 世界节点
     * @param {number[]} componentUpdateOrderList 组件更新顺序列表 (只传需要更新的组件列表)
     * @param {number} [maxCapacityInPool=128] 实体池最大容量，多余的实体不会缓存
     * @param {number} [preloadEntityCount=32] 预加载Entity数量
     */
    public static createECWorld(worldName: string, node: Node, componentUpdateOrderList: number[], maxCapacityInPool = 128, preloadEntityCount = 32): EntityManager {
        if (this._worlds.has(worldName)) {
            throw new Error(`ECWorld ${worldName} already exists`);
        }
        const entityManager = new EntityManager(worldName, ECDataHelper.getComponentPool(), componentUpdateOrderList, maxCapacityInPool, preloadEntityCount);
        this._worlds.set(worldName, { world: entityManager, worldNode: node });
        return entityManager;
    }

    /** 获取EC世界 */
    public static getECWorld(worldName: string): EntityManager {
        if (!this._worlds.has(worldName)) {
            throw new Error(`ECWorld ${worldName} not found`);
        }
        const entityManager = this._worlds.get(worldName).world;
        if (!entityManager) {
            throw new Error(`ECWorld ${worldName} is null`);
        }
        return entityManager;
    }

    /** 获取EC世界节点 */
    public static getECWorldNode(worldName: string): Node {
        if (!this._worlds.has(worldName)) {
            throw new Error(`ECWorld ${worldName} not found`);
        }
        const node = this._worlds.get(worldName).worldNode;
        if (!node) {
            throw new Error(`ECWorld ${worldName} is null`);
        }
        return node;
    }

    /** 销毁EC世界 */
    public static destroyECWorld(worldName: string): void {
        let entityManager = this.getECWorld(worldName);
        if (entityManager) {
            entityManager.destroy();
            this._worlds.delete(worldName);
        }
    }

    /**
     * 注册配置表中的实体信息
     * @param config 实体配置信息，格式为 {实体名: {组件名: 组件数据}}
     */
    public static registerEntityConfig(config: { [entityName: string]: IEntityConfig }): void {
        if (!config) {
            return;
        }
        // 遍历并注册每个实体的配置
        for (const entityName in config) {
            this._entityList[entityName] = config[entityName];
        }
    }

    /**
     * 添加实体信息 (如果已经存在, 则数据组合)
     * 如果存在编辑器编辑不了的数据 用来给编辑器导出的实体信息 添加扩展数据
     * @param name 实体名
     * @param info 实体信息 
     */
    public static addEntityInfo(name: string, info: IEntityConfig): void {
        if (this._entityList[name]) {
            this._entityList[name] = Object.assign(this._entityList[name], info);
        } else {
            this._entityList[name] = info;
        }
    }

    /** 获取实体配置信息 */
    public static getEntityInfo(name: string): Record<string, any> {
        if (!this._entityList[name]) {
            throw new Error(`Entity ${name} info not found, please register it first`);
        }
        return this._entityList[name];
    }

    /**
     * 创建实体
     * @param worldName 实体管理器名称
     * @param name 实体名字
     * @returns {kunpo.Entity} 实体
     */
    public static createEntity(worldName: string, name: string): Entity {
        let info = this.getEntityInfo(name);
        let world = this.getECWorld(worldName);
        let entity = world.createEntity(name);
        info && this._addComponentToEntity(world, entity, info);

        world.addEntity(entity);
        return entity;
    }

    /**
     * 添加组件到实体
     * @param {EntityManager} world 实体管理器
     * @param {Entity} entity 实体
     * @param {Record<string, any>} componentsData 组件数据
     * @internal
     */
    private static _addComponentToEntity(world: EntityManager, entity: Entity, componentsData: Record<string, any>): void {
        for (const componentName in componentsData) {
            let component = world.createComponent(componentName);
            ECDataHelper.parse(component, componentsData[componentName]);
            entity.addComponent(component);
        }
    }

    /**
     * 销毁实体
     * @param worldName 世界名称
     * @param entity 实体
     */
    public static destroyEntity(worldName: string, entity: Entity): void {
        if (!entity || !entity.id) {
            return;
        }
        this.destroyEntityById(worldName, entity.id);
    }

    /**
     * 销毁实体
     * @param worldName 世界名称
     * @param entityId 实体ID
     */
    public static destroyEntityById(worldName: string, entityId: number): void {
        let world = this.getECWorld(worldName);
        world.destroyEntityById(entityId);
    }
}
