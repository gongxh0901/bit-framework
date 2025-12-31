import { Component } from "./Component";
import { EntityId } from "./ECType";
import { EntityManager } from "./EntityManager";

export class Entity {
    /**
     * 实体名称
     * @type {String}
     */
    public name: string;

    /**
     * 实体ID
     * @type {EntityId}
     */
    public id: EntityId;

    /**
     * 实体标识
     * @type {Set<number>}
     * @memberof Entity
     */
    public tags: Set<number>;

    /**
     * 实体状态
     * @type {Map<number, number>}
     * @memberof Entity
     */
    public states: Map<number, number>;
    /**
     * 是否被激活 （添加到实体管理器时激活）
     * @type {boolean}
     */
    public active: boolean = false;

    /**
     * 所属实体管理器 （实体创建后直接赋值）
     * @private
     * @type {EntityManager}
     */
    public entityManager: EntityManager;

    /**
     * 所有组件
     * @type {Map<number, Component>}
     * @type {number} 组件类型
     * @type {Component} 组件
     */
    public readonly components: Map<number, Component> = new Map();

    /**
     * 实体被添加到EntityManager
     * @internal
     */
    public _add(): void {
        this.active = true;
        for (const component of this.components.values()) {
            component._enter();
        }
    }

    /**
     * 实体销毁，不要手动调用
     * @internal
     */
    public _destroy(): void {
        this.removeAllComponents();
        this.tags && this.tags.clear();
        this.states && this.states.clear();
        this.active = false;
        this.entityManager = null;
    }

    /**
     * 添加标签
     * @param {number[]} ...tags 标签除了表示Entity，还可以通过EntityManager获取指定标签的Entity
     */
    public addTag(...tag: number[]): void {
        let tags = this.tags;
        if (!tags) {
            tags = this.tags = new Set<number>();
        }
        for (let i = 0; i < tag.length; i++) {
            tags.add(tag[i]);
            this.active && this.entityManager && this.entityManager._addEntityTag(this.id, tag[i]);
        }
    }

    /**
     * 删除标签
     * @param {number} tag 删除的标签
     */
    public removeTag(tag: number): void {
        if (this.tags) {
            this.tags.delete(tag);
            this.active && this.entityManager && this.entityManager._removeEntityTagById(this.id, tag);
        }
    }

    /**
     * 是否包含标签
     * @param {number} tag 标签
     * @returns {boolean} 是否包含
     */
    public hasTag(...tag: number[]): boolean {
        let tags = this.tags;
        if (!tags) {
            return false;
        }
        for (let i = 0; i < tag.length; i++) {
            if (tags.has(tag[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取组件
     * @param {number} componentType 组件类型
     * @returns {T}
     */
    public getComponent<T extends Component>(componentType: number): T {
        return this.components.get(componentType) as T;
    }

    /**
     * 添加组件
     * @param {Component} component 组件
     */
    public addComponent(component: Component): void {
        if (this.hasComponent(component.type)) {
            throw new Error(`组件{${component.constructor.name}类型:${component.type}）已经存在，不允许添加同一类型组件`);
        }
        this.components.set(component.type, component);
        component.entity = this;
        component._add();

        if (this.active) {
            component._enter();
        }
    }

    /**
     * 删除组件
     * @param {number} componentType 组件类型
     */
    public removeComponent(componentType: number): void {
        const component = this.components.get(componentType);

        if (component) {
            this.components.delete(componentType);
            component._remove();
        }
    }

    /**
     * 删除所有组件
     */
    public removeAllComponents(): void {
        for (const component of this.components.values()) {
            component._remove();
        }
        this.components.clear();
    }

    /**
     * 是否包含组件
     * @param {number} componentType 组件类型
     * @returns {boolean} 是否包含组件
     */
    public hasComponent(componentType: number): boolean {
        return this.components.has(componentType);
    }

    /**
     * 销毁自己
     */
    public destroy(): void {
        this.entityManager.destroyEntityById(this.id);
    }

    /**
     * 添加监听
     * @param eventName 监听的消息名
     * @param callback 回调
     * @param entityId 实体ID
     * @param once 是否单次监听
     */
    public addEvent(eventName: string, callback: (...args: any[]) => void, once: boolean = false): number {
        if (this.entityManager) {
            return this.entityManager._addEvent(eventName, callback, this, once);
        }
        return 0;
    }

    /**
     * 发送消息
     * @param eventName 消息名
     * @param entityId 实体ID
     * @param args 发送参数
     */
    public sendEvent(eventName: string, ...args: any[]): void {
        this.entityManager && this.entityManager._sendEvent(eventName, this, ...args);
    }

    /**
     * 通过事件ID移除消息监听
     * @param eventId 事件ID
     */
    public removeEvent(eventId: number): void {
        this.entityManager && this.entityManager._removeEvent(eventId, this);
    }

    public removeEventByName(eventName: string): void {
        this.entityManager && this.entityManager._removeEventByName(eventName, this);
    }

    /**
     * 移除实体上的所有消息监听
     */
    public removeAllEvent(): void {
        this.entityManager && this.entityManager._removeAllEvent(this);
    }

    /**
     * 添加状态
     *  状态采用计数方式，对状态处理时需要保证addState和removeState成对存在
     * @param {number} state 状态类型
     * @memberof Entity
     */
    public addState(state: number): void {
        let states = this.states;
        if (!states) {
            states = this.states = new Map<number, number>();
        }
        states.set(state, (states.get(state) || 0) + 1);
    }

    /**
     * 删除状态
     *
     * @param {number} state 状态类型
     * @returns {boolean} 如果计数为0或状态不存在，则返回true
     * @memberof Entity
     */
    public removeState(state: number): boolean {
        const states = this.states;
        if (!states) {
            return false;
        }
        let stateCount = states.get(state);
        if (stateCount) {
            // 处理状态计数，为0则删除状态
            --stateCount;
            if (stateCount == 0) {
                states.delete(state);
                return true;
            }

            states.set(state, stateCount);
            return false;
        }
        return true;
    }

    /**
     * 是否包含指定状态
     * @param {number} state 状态
     * @returns {boolean}
     * @memberof Entity
     */
    public hasState(state: number): boolean {
        return this.states && this.states.has(state);
    }

    /**
     * 清除状态
     * @param {number} state 状态
     * @memberof Entity
     */
    public clearState(state: number): void {
        this.states && this.states.delete(state);
    }

    /**
     * 清除所有状态
     * @memberof Entity
     */
    public clearAllStates(): void {
        this.states && this.states.clear();
    }
}
