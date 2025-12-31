/**
 * @Author: Gongxh
 * @Date: 2025-05-22
 * @Description: 删除组件命令
 */

import { Entity } from "../entity/Entity";

export class CommandDel {
    private entities: Entity[] = [];
    private _size: number = 0;

    private isDirty: boolean = true;
    private cacheEntities: Entity[] = [];

    constructor() {
        this.entities.length = 64;
        this.cacheEntities.length = 0;
    }

    public get size(): number {
        return this._size;
    }

    /** 添加命令 */
    public add(entity: Entity): void {
        if (this._size >= this.entities.length) {
            this.expand();
        }
        this.entities[this._size] = entity;
        this._size++;
        this.isDirty = true;
    }

    public getEntities(): Entity[] {
        if (this.isDirty) {
            this.cacheEntities.length = this.size;
            for (let i = 0; i < this._size; i++) {
                this.cacheEntities[i] = this.entities[i];
            }
            this.isDirty = false;
        }
        return this.cacheEntities;
    }

    /** 高效遍历 */
    public forEach(callback: (entity: Entity) => void): void {
        for (let i = 0; i < this._size; i++) {
            callback(this.entities[i]);
        }
    }

    /** 重置 */
    public reset(): void {
        this.entities.length = 64;
        this.cacheEntities.length = 0;
        this._size = 0;
        this.isDirty = true;
    }

    private expand(): void {
        if (this.entities.length >= 1024) {
            this.entities.length += 512;
        } else {
            this.entities.length *= 2;
        }
    }
}
