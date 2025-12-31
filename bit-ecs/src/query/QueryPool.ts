/**
 * @Author: Gongxh
 * @Date: 2025-05-16
 * @Description: 查询器池
 * 
 * 事件驱动的查询器， 只处理真正发生变化的实体，不需要遍历整个集合
 */

import { CommandPool } from "../command/CommandPool";
import { ComponentPool } from "../component/ComponentPool";
import { EntityPool } from "../entity/EntityPool";
import { Matcher } from "./Matcher";
import { Query } from "./Query";

export class QueryPool {
    /** 
     * 组件池引用
     * @internal
     */
    private componentPool: ComponentPool;
    /** 
     * 实体池引用
     * @internal
     */
    private entityPool: EntityPool;
    /** 
     * 命令池引用
     * @internal
     */
    private commandPool: CommandPool;
    /**
     * 查询器池 key:生成的唯一ID value:查询器
     * @internal
     */
    private queries: Map<string, Query> = new Map();

    constructor(componentPool: ComponentPool, entityPool: EntityPool, commandPool: CommandPool) {
        this.componentPool = componentPool;
        this.entityPool = entityPool;
        this.commandPool = commandPool;
    }

    /**
     * 获取查询器
     * @param key 查询器唯一ID
     * @returns 查询器
     */
    public get(key: string): Query {
        return this.queries.get(key);
    }

    /**
     * 创建并添加查询器
     * @param key 查询器唯一ID
     * @param matcher 查询器
     * @returns 查询器
     */
    public add(key: string, matcher: Matcher): Query {
        if (this.has(key)) {
            return this.queries.get(key);
        } else {
            const query = new Query(this.componentPool, this.entityPool, matcher)
            this.queries.set(key, query);
            // 查询器注册到命令缓冲池中
            this.commandPool.registerQuery(query, matcher.indices);
            return query;
        }
    }

    /**
     * 判断是否存在查询器
     * @param key 查询器唯一ID
     * @returns 是否存在
     */
    private has(key: string): boolean {
        return this.queries.has(key);
    }

    public clear(): void {
        this.queries.forEach((query) => {
            query.clear();
        });
    }
}
