/**
 * @Author: Gongxh
 * @Date: 2025-09-02
 * @Description: 行为树共享数据
 * 
 * 专门用于存储和管理行为树执行过程中的共享数据
 */

import { IBTNode } from "./BTNode/BTNode";

/** 
 * 黑板数据接口
 */
export interface IBlackboard {
    getEntity<T>(): T;
    get<T>(key: string): T;
    set<T>(key: string, value: T): void;
    delete(key: string): void;
    has(key: string): boolean;
    clean(): void;
    createChild(scope?: number): IBlackboard;
    /** @internal */
    openNodes: WeakMap<IBTNode, boolean>;
}

/**
 * 黑板类
 */
export class Blackboard implements IBlackboard {
    private readonly _data = new Map<string, any>();
    public parent?: Blackboard | undefined;
    public children = new Set<Blackboard>();

    /** 
     * 正在运行中的节点
     * @internal
     */
    public openNodes = new WeakMap<IBTNode, boolean>();

    /** 实体 */
    private readonly _entity: any;
    public getEntity<T>(): T {
        return this._entity;
    }

    constructor(parent?: Blackboard, entity?: any) {
        this.parent = parent;
        if (parent) {
            parent.children.add(this);
        }
        // 优先使用传入的 entity，如果没有则从父级继承
        this._entity = entity !== undefined ? entity : (parent?._entity ?? null);
    }

    /** 核心: 查找链实现 */
    public get<T>(key: string): T {
        if (this._data.has(key)) {
            return this._data.get(key) as T;
        }
        return this.parent?.get(key) as T;
    }

    /** 写入: 只在当前层 */
    public set<T>(key: string, value: T): void {
        this._data.set(key, value);
    }

    /** 检查: 沿链查找 */
    public has(key: string): boolean {
        return this._data.has(key) || (this.parent?.has(key) ?? false);
    }

    public delete(key: string): void {
        this._data.delete(key);
    }

    public createChild(): Blackboard {
        return new Blackboard(this);
    }

    public clean(): void {
        // 清空当前黑板数据
        this._data.clear();

        // 重置运行状态
        this.openNodes = new WeakMap<IBTNode, boolean>();

        // 递归清理所有子黑板
        for (const child of this.children) {
            child.clean();
        }
    }
}

// 全局共享的黑板实例
export const globalBlackboard = new Blackboard();