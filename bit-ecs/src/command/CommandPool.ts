/**
 * @Author: Gongxh
 * @Date: 2025-05-15
 * @Description: 命令缓冲池
 */

import { IComponent } from "../component/IComponent";
import { Entity } from "../entity/Entity";
import { EntityPool } from "../entity/EntityPool";
import { IQueryEvent } from "../query/IQuery";
import { CommandAdd } from "./CommandAdd";
import { CommandDel } from "./CommandDel";

export class CommandPool {
    /** 
     * 实体池的引用
     * @internal
     */
    private readonly entityPool: EntityPool;

    /** 添加组件命令 key是组件类型 */
    private addCommands: Map<number, CommandAdd> = new Map();
    /** 删除组件命令 key是组件类型 */
    private delCommands: Map<number, CommandDel> = new Map();

    /** 根据组件类型可以找到所有关心该组件的查询器 */
    private readonly componentTypeQuerys: Map<number, IQueryEvent[]> = new Map();

    constructor(entityPool: EntityPool) {
        this.entityPool = entityPool;
    }

    /**
     * 注册查询器
     * @param query 查询器
     * @param components 查询器关心的组件类型数组
     */
    public registerQuery(query: IQueryEvent, components: number[]) {
        let len = components.length;
        for (let i = 0; i < len; i++) {
            let type = components[i];
            let queries = this.componentTypeQuerys.get(type);
            if (!queries) {
                queries = [query];
                this.componentTypeQuerys.set(type, queries);
            } else {
                queries.push(query);
            }
        }
    }

    /**
     * 添加组件命令
     * @param entity 实体
     * @param componentType 组件类型
     * @param component 组件 (添加时有效)
     */
    public addComponent(entity: Entity, componentType: number, component?: IComponent) {
        let commandGroup = this.addCommands.get(componentType);
        if (!commandGroup) {
            commandGroup = new CommandAdd();
            this.addCommands.set(componentType, commandGroup);
        }
        commandGroup.add(entity, component);
    }

    /**
     * 删除组件命令
     * @param entity 实体
     * @param componentType 组件类型
     */
    public delComponent(entity: Entity, componentType: number) {
        let commandGroup = this.delCommands.get(componentType);
        if (!commandGroup) {
            commandGroup = new CommandDel();
            this.delCommands.set(componentType, commandGroup);
        }
        commandGroup.add(entity);
    }

    /**
     * 删除实体
     */
    public delEntity(entity: Entity) {
        this.entityPool.forEachComponent(entity, (componentType: number) => {
            this.delComponent(entity, componentType);
        });
    }

    public update() {
        let entityPool = this.entityPool;
        // 先删除组件
        this.delCommands.forEach((command: CommandDel, componentType: number) => {
            let entities = command.getEntities();
            let queries = this.componentTypeQuerys.get(componentType);
            let len = queries ? queries.length : 0;
            for (let i = 0; i < len; i++) {
                queries[i].batchChangeEntities(entities);
            }
            len = entities.length;
            for (let i = 0; i < len; i++) {
                entityPool.removeComponent(entities[i], componentType);
            }
            command.reset();
        });

        // 再添加组件
        this.addCommands.forEach((command: CommandAdd, componentType: number) => {
            let entities = command.getEntities();
            let queries = this.componentTypeQuerys.get(componentType);
            let len = queries ? queries.length : 0;
            for (let i = 0; i < len; i++) {
                queries[i].batchChangeEntities(entities);
            }
            command.forEach((entity: Entity, component: IComponent) => {
                entityPool.addComponent(entity, componentType, component);
            });
            command.reset();
        });
    }

    public clear() {
        this.addCommands.clear();
        this.delCommands.clear();
    }
}
