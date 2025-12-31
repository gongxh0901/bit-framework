/**
 * @Author: Gongxh
 * @Date: 2025-02-14
 * @Description: 条件基类
 */

import { ConditionManager } from "../ConditionManager";

export abstract class ConditionBase {
    /** 初始化 @internal */
    public _init(): void {
        this.onInit();
    }

    /** 条件类型 */
    public type: number;

    /** 是否可以通知 @internal */
    private _canNotify: boolean;
    /**
     * 是否可以通知
     * @returns {boolean}
     */
    public canNotify(): boolean {
        return this._canNotify;
    }

    public tryUpdate(): void {
        ConditionManager._addUpdateCondition(this.type);
    }

    /**
     * 更新条件
     * @returns {boolean} 是否发生变化
     */
    public _updateCondition(): boolean {
        let canNotify = this.evaluate();
        if (canNotify == this._canNotify) {
            return false;
        }
        this._canNotify = canNotify;
        return true;
    }

    /**
     * 初始化
     */
    protected abstract onInit(): void;

    /**
     * 返回条件结果 子类实现
     * @returns {boolean}
     */
    protected abstract evaluate(): boolean;
}
