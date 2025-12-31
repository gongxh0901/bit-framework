/**
 * @Author: Gongxh
 * @Date: 2024-12-22
 * @Description: 全局事件
 */

import { EventManager } from "../event/EventManager";

export class GlobalEvent {
    /** 
     * 事件管理器
     * @internal
     */
    private static event: EventManager = new EventManager();

    /** 
     * 添加一个事件
     * @param name 事件名称
     * @param callback 事件回调
     * @param target 事件目标
     */
    public static add(name: string, callback: (...args: any[]) => void, target?: any): number {
        return this.event.add(name, callback, target);
    }

    /**
     * 添加一个只触发一次的事件
     */
    public static addOnce(name: string, callback: (...args: any[]) => void, target?: any): number {
        return this.event.addOnce(name, callback, target);
    }

    /**
     * 发送一个事件
     * @param name 事件名称
     * @param args 事件参数
     */
    public static send(name: string, ...args: any[]): void {
        this.event.send(name, null, ...args);
    }

    /**
     * 发送一个事件给指定目标
     * @param name 事件名称
     * @param target 事件目标
     * @param args 事件参数
     */
    public static sendToTarget(name: string, target: any, ...args: any[]) {
        this.event.send(name, target, ...args);
    }

    /**
     * 移除一个指定ID的事件
     * @param eventId 事件ID
     */
    public static remove(eventId: number): void {
        this.event.remove(eventId);
    }

    public static removeByName(name: string): void {
        this.event.removeByName(name);
    }

    public static removeByTarget(target: any): void {
        this.event.removeByTarget(target);
    }

    /**
     * 通过目标和事件名称批量移除事件
     * @param name 事件名称
     * @param target 事件目标
     */
    public static removeByNameAndTarget(name: string, target: any) {
        this.event.removeByNameAndTarget(name, target);
    }

    /**
     * 清空所有事件
     */
    public static clearAll(): void {
        this.event.clearAll();
    }
}