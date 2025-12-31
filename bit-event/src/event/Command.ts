/**
 * @Author: Gongxh
 * @Date: 2025-06-06
 * @Description: 命令
 */

import { Event } from "./Event";

export enum CommandType {
    Add = 1,

    RemoveById = 2,
    RemoveByName = 3,
    RemoveByTarget = 4,
    RemoveByNameAndTarget = 5,
    ClearAll = 6,
}

/**
 * 命令
 * @internal
 */
export class Command {
    public type: CommandType = CommandType.Add;

    public eventId: number;
    public event: Event;
    public name: string;
    public target: any;

    public reset(): void {
        this.type = CommandType.Add;

        this.eventId = 0;
        this.event = null;
        this.name = null;
        this.target = null;
    }
}

/**
 * 命令管理器
 * @internal
 */
export class CommandManager {

    private commands: Command[] = [];
    private index: number = 0;
    private length: number = 0;

    private clearAll: boolean = false;

    /**
     * 添加一个添加事件的命令
     * @param event 事件
     */
    public addEvent(event: Event): void {
        if (this.index == this.length) {
            let command = new Command();
            command.type = CommandType.Add;
            command.event = event;

            this.commands.push(command);
            this.length++;
            this.index++;
        } else {
            let command = this.commands[this.index++];
            command.type = CommandType.Add;
            command.event = event;
        }
    }

    /**
     * 添加一个删除事件或者清理所有的命令
     */
    public add(type: CommandType, eventId: number, name: string, target: any): void {
        if (type == CommandType.ClearAll) {
            this.clearAll = true;
            return;
        }

        if (this.index == this.length) {
            let command = new Command();
            command.type = type;
            command.eventId = eventId;
            command.name = name;
            command.target = target;

            this.commands.push(command);
            this.length++;
            this.index++;
        } else {
            let command = this.commands[this.index++];
            command.type = type;
            command.eventId = eventId;
            command.name = name;
            command.target = target;
        }
    }

    public forEach(callback: (command: Command) => void): void {
        if (this.clearAll) {
            callback({ type: CommandType.ClearAll, eventId: 0, event: null, name: null, target: null, reset: null });
            return;
        }

        for (let i = 0; i < this.index; i++) {
            let command = this.commands[i];
            callback(command);
            command.reset();
        }
        this.index = 0;
    }

    public clear(): void {
        this.commands.length = 0;
        this.index = 0;
        this.clearAll = false;
        this.length = 0;
    }
}