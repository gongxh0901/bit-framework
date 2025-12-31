/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 改进版事件管理器 - 支持递归保护
 */

import { CommandManager, CommandType } from "./Command";
import { Event } from "./Event";
import { EventFactory } from "./EventFactory";

/**
 * 最大递归深度常量
 */
const MAX_RECURSION_DEPTH = 20;

/**
 * 改进版事件管理器 - 防止递归调用栈溢出
 * 
 * 功能特性：
 * - 递归深度限制防止栈溢出
 * - 完全向后兼容现有API
 */
export class EventManager {
    /** 
     * 当前递归发送深度
     * 0 表示没有在发送，> 0 表示正在发送事件
     * @internal
     */
    private sending_depth: number = 0;

    /** 
     * 注册的所有事件 事件ID -> 事件
     * @internal
     */
    private events: Map<number, Event> = new Map<number, Event>();

    /** 
     * 事件名称 -> 事件ID集合
     * @internal
     */
    private nameToIds: Map<string, Set<number>> = new Map<string, Set<number>>();

    /** 
     * 事件目标 -> 事件ID集合
     * @internal
     */
    private targetToIds: Map<any, Set<number>> = new Map<any, Set<number>>();

    /** 
     * 事件工厂
     * @internal
     */
    private factory: EventFactory = new EventFactory(64, Event);

    /** 
     * 命令管理器
     * @internal
     */
    private commandManager: CommandManager = new CommandManager();

    /**
     * 添加事件监听器
     * @param name - 事件名称
     * @param callback - 回调函数，当事件触发时执行
     * @param target - 可选参数，指定事件监听的目标对象
     * @returns 返回事件ID，可用于移除事件
     */
    public add(name: string, callback: (...args: any[]) => void, target?: any): number {
        if (!name) {
            throw new Error("事件名称不能为空");
        }
        if (!callback) {
            throw new Error("回调函数不能为空");
        }
        let event = this.factory.allocate<Event>();
        event.name = name;
        event.callback = callback;
        event.target = target;
        event.once = false;

        if (this.sending_depth > 0) {
            this.commandManager.addEvent(event);
            return event.id;
        }
        this._addEvent(event);
        return event.id;
    }

    /**
     * 添加一个只触发一次的事件监听器
     * @param name - 事件名称
     * @param callback - 事件触发时要执行的回调函数
     * @param target - 可选参数，指定事件监听器的目标对象
     * @returns 返回事件ID，可用于移除事件
     */
    public addOnce(name: string, callback: (...args: any[]) => void, target?: any): number {
        if (!name) {
            throw new Error("事件名称不能为空");
        }
        if (!callback) {
            throw new Error("回调函数不能为空");
        }
        let event = this.factory.allocate<Event>();
        event.name = name;
        event.callback = callback;
        event.target = target;
        event.once = true;

        if (this.sending_depth > 0) {
            this.commandManager.addEvent(event);
            return event.id;
        }
        this._addEvent(event);
        return event.id;
    }

    /** 
     * 添加事件内部方法
     * @param event 事件对象
     * @internal
     */
    private _addEvent(event: Event): void {
        this.events.set(event.id, event);

        if (!this.nameToIds.has(event.name)) {
            this.nameToIds.set(event.name, new Set<number>());
        }

        const ids = this.nameToIds.get(event.name);
        ids.add(event.id);

        let target = event.target;
        if (target) {
            if (!this.targetToIds.has(target)) {
                this.targetToIds.set(target, new Set<number>());
            }
            this.targetToIds.get(target).add(event.id);
        }
    }

    /**
     * 发送事件给所有注册的监听器（带递归保护）
     * @param name - 事件名称
     * @param target - 可选参数，指定目标对象，只有目标对象匹配时才会触发监听器
     * @param args - 传递给监听器回调函数的参数
     */
    public send(name: string, target?: any, ...args: any[]): void {
        // 递归深度保护：阻止超过限制的执行并报告错误
        if (this.sending_depth >= MAX_RECURSION_DEPTH) {
            console.error(`[EventManager] 递归深度超出限制！`);
            console.error(`  事件名称: "${name}"`);
            console.error(`  当前深度: ${this.sending_depth}`);
            console.error(`  最大深度: ${MAX_RECURSION_DEPTH}`);
            console.error(`  为防止栈溢出，事件执行已被阻止`);
            return;
        }

        if (!this.nameToIds.has(name)) {
            return;
        }
        const eventIds = this.nameToIds.get(name);
        if (eventIds.size === 0) {
            return;
        }

        // 使用局部变量，避免嵌套调用时互相污染
        const needRemoveIds: number[] = [];
        const triggerList: Event[] = [];

        // 增加递归深度
        this.sending_depth++;

        // 构建触发列表
        for (const eventId of eventIds.values()) {
            if (!this.events.has(eventId)) {
                needRemoveIds.push(eventId);
                continue;
            }
            let event = this.events.get(eventId);
            if (!target || target === event.target) {
                triggerList.push(event);
                if (event.once) {
                    needRemoveIds.push(eventId);
                }
            }
        }

        // 同步触发事件
        for (const event of triggerList) {
            event.callback(...args);
        }

        // 减少递归深度
        this.sending_depth--;

        // 只在最外层执行清理工作
        if (this.sending_depth === 0) {
            // 清理 once 事件
            if (needRemoveIds.length > 0) {
                for (const id of needRemoveIds) {
                    this.remove(id);
                }
            }

            // 处理命令队列
            this.commandManager.forEach(command => {
                switch (command.type) {
                    case CommandType.Add:
                        this._addEvent(command.event);
                        break;
                    case CommandType.RemoveById:
                        this.remove(command.eventId);
                        break;
                    case CommandType.RemoveByName:
                        this.removeByName(command.name);
                        break;
                    case CommandType.RemoveByTarget:
                        this.removeByTarget(command.target);
                        break;
                    case CommandType.RemoveByNameAndTarget:
                        this.removeByNameAndTarget(command.name, command.target);
                        break;
                    case CommandType.ClearAll:
                        this.clearAll();
                        break;
                }
            });
        }
    }

    /** 
     * 通过事件ID移除事件
     * @param eventId 事件ID
     */
    public remove(eventId: number): void {
        if (!this.events.has(eventId)) {
            return;
        }
        if (this.sending_depth > 0) {
            this.commandManager.add(CommandType.RemoveById, eventId, null, null);
            return;
        }
        let event = this.events.get(eventId);
        let name = event.name;
        let target = event.target;

        this.events.delete(eventId);
        this.factory.recycle(event);

        if (this.nameToIds.has(name)) {
            this.nameToIds.get(name).delete(eventId);
        }
        if (target && this.targetToIds.has(target)) {
            this.targetToIds.get(target).delete(eventId);
        }
    }

    /**
     * 移除指定名称的所有事件
     * @param name 事件名称
     */
    public removeByName(name: string): void {
        if (!this.nameToIds.has(name)) {
            return;
        }
        let eventIds = this.nameToIds.get(name);
        if (eventIds.size === 0) {
            return;
        }

        if (this.sending_depth > 0) {
            this.commandManager.add(CommandType.RemoveByName, null, name, null);
            return;
        }
        eventIds.forEach(eventId => {
            if (this.events.has(eventId)) {
                let event = this.events.get(eventId);
                if (event.target && this.targetToIds.has(event.target)) {
                    this.targetToIds.get(event.target).delete(eventId);
                }
                this.events.delete(eventId);
                this.factory.recycle(event);
            }
        });
        this.nameToIds.delete(name);
    }

    /**
     * 移除指定目标的所有事件
     * @param target 目标对象
     */
    public removeByTarget(target: any): void {
        if (!this.targetToIds.has(target)) {
            return;
        }
        let eventIds = this.targetToIds.get(target);
        if (eventIds.size === 0) {
            return;
        }
        if (this.sending_depth > 0) {
            this.commandManager.add(CommandType.RemoveByTarget, null, null, target);
            return;
        }

        eventIds.forEach(eventId => {
            if (this.events.has(eventId)) {
                let event = this.events.get(eventId);
                if (this.nameToIds.has(event.name)) {
                    this.nameToIds.get(event.name).delete(eventId);
                }
                this.events.delete(eventId);
                this.factory.recycle(event);
            }
        });
        this.targetToIds.delete(target);
    }

    /**
     * 移除指定名称和指定目标的事件
     * @param name 事件名称
     * @param target 绑定的目标对象
     */
    public removeByNameAndTarget(name: string, target: any): void {
        if (!this.nameToIds.has(name)) {
            return;
        }
        let nameIds = this.nameToIds.get(name);
        let targetIds = this.targetToIds.get(target);
        // 检查targetIds是否存在，避免NPE
        if (nameIds.size === 0 || !targetIds || targetIds.size === 0) {
            return;
        }
        if (this.sending_depth > 0) {
            this.commandManager.add(CommandType.RemoveByNameAndTarget, null, name, target);
            return;
        }

        // 使用局部变量
        const needRemoveIds: number[] = [];
        if (nameIds.size < targetIds.size) {
            nameIds.forEach(eventId => {
                let event = this.events.get(eventId);
                if (event.target === target) {
                    needRemoveIds.push(eventId);
                }
            });
        } else {
            targetIds.forEach(eventId => {
                let event = this.events.get(eventId);
                if (event.name === name) {
                    needRemoveIds.push(eventId);
                }
            });
        }
        if (needRemoveIds.length > 0) {
            for (const id of needRemoveIds) {
                this.remove(id);
            }
        }
    }

    /**
     * 清空所有注册的事件
     */
    public clearAll(): void {
        if (this.sending_depth > 0) {
            this.commandManager.add(CommandType.ClearAll, null, null, null);
            return;
        }
        for (const event of this.events.values()) {
            this.factory.recycle(event);
        }
        this.events.clear();
        this.nameToIds.clear();
        this.targetToIds.clear();
        this.commandManager.clear();

        // 清理递归保护相关状态
        this.sending_depth = 0;
    }
}