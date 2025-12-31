/**
 * @Author: Gongxh
 * @Date: 2025-05-21
 * @Description: 添加组件命令
 */

import { IComponent } from "../component/IComponent";
import { Entity } from "../entity/Entity";

export class CommandAdd {
    private components: IComponent[] = [];
    private entities: Entity[] = [];

    private _size: number = 0;

    private isDirty: boolean = true;
    private cacheEntities: Entity[] = [];

    constructor() {
        this.components.length = 64;
        this.entities.length = 64;
    }

    public get size(): number {
        return this._size;
    }

    /** 添加命令 */
    public add(entity: Entity, component: IComponent): void {
        if (this._size >= this.entities.length) {
            this.expand();
        }
        this.components[this._size] = component;
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
    public forEach(callback: (entity: Entity, component: IComponent) => void): void {
        for (let i = 0; i < this._size; i++) {
            callback(this.entities[i], this.components[i]);
        }
    }

    /** 重置 */
    public reset(): void {
        this.components.length = 64;
        this.entities.length = 64;
        this._size = 0;
        this.isDirty = true;
        this.cacheEntities.length = 0;
    }

    private expand(): void {
        if (this.entities.length >= 1024) {
            this.components.length += 512;
            this.entities.length += 512;
        } else {
            this.components.length *= 2;
            this.entities.length *= 2;
        }
    }
}
