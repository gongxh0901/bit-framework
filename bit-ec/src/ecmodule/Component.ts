import { ComponentManager } from "./ComponentManager";
import { Entity } from "./Entity";
import { ObjectBase } from "./ObjectBase";

export abstract class Component extends ObjectBase {
    /** 组件名 */
    public name: string;

    /** 组件类型 */
    public type: number;

    /** 是否需要更新 */
    public needUpdate: boolean;

    /** 所属实体 */
    public entity: Entity;

    /** 所属组件管理器 */
    public componentManager: ComponentManager;

    /** 是否需要销毁 @internal */
    public _needDestroy: boolean;

    /** 更新ID @internal */
    public _updateId: number = -1;

    /** 是否更新中 @internal */
    public get _updating(): boolean {
        return this._updateId != -1;
    }

    /** 生命周期函数 添加到实体 @internal */
    public _add(): void {
        this.onAdd();
    }

    /** 生命周期函数 销毁 @internal */
    public _destroy(): void {
        this.onDestroy();
    }

    /** 生命周期函数 添加到实体后 在这个函数中可以获取其他组件 @internal */
    public _enter(): void {
        // 自动开启更新
        if (this.needUpdate) {
            this.componentManager.startUpdateComponent(this);
        }
        this.onEnter();
    }

    /** 生命周期函数 从实体中移除 @internal */
    public _remove(): void {
        this.stopUpdate();
        this.onRemove();
        this.componentManager._destroyComponent(this);
    }

    /** 更新 @internal */
    public _update(dt: number): void {
        this.onUpdate(dt);
    }

    /** 开启更新 */
    public startUpdate(): void {
        if (!this.needUpdate) {
            this.needUpdate = true;
            this.componentManager?.startUpdateComponent(this);
        }
    }

    /** 停止更新 */
    public stopUpdate(): void {
        if (this.needUpdate) {
            this.needUpdate = false;
            this.componentManager?.stopUpdateComponent(this);
        }
    }

    /**
     * 获取组件
     * @param {number} componentType 组件类型
     * @returns {T}
     */
    public getComponent<T extends Component>(componentType: number): T {
        return this.entity.getComponent<T>(componentType);
    }

    /**
     * 删除自己
     */
    public destroySelf(): void {
        this.entity.removeComponent(this.type);
    }

    /**
     * 被添加到实体 对应onDestroy
     */
    protected onAdd(): void { }

    /**
     * 组件被销毁 对应onAdd
     */
    protected onDestroy(): void { }

    protected onUpdate(dt: number): void { }

    /** 可在此方法获取实体其他组件 */
    protected abstract onEnter(): void;

    /** 从实体中删除 */
    protected abstract onRemove(): void;
}
