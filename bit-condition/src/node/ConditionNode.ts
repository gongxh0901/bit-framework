/**
 * @Author: Gongxh
 * @Date: 2025-02-14
 * @Description: 条件节点
 */

import { ConditionManager } from "../ConditionManager";
import { ConditionMode } from "../ConditionMode";

export abstract class ConditionNode {
    /** 条件类型 @internal */
    public _modeType: ConditionMode;

    /**
     * 构建红点节点
     * @param {GObject} node 关联节点
     * @param {...number[]} conditionTypes 条件类型
     */
    public constructor(modeType: ConditionMode, ...conditionTypes: number[]) {
        this._modeType = modeType;
        for (const conditionType of conditionTypes) {
            ConditionManager._addConditionNode(this, conditionType);
        }
    }

    /** 移除节点 */
    public destroy(): void {
        ConditionManager._removeConditionNode(this);
    }

    /**
     * 通知节点更新
     * @param {boolean} visible 节点显示状态
     */
    public abstract notify(visible: boolean): void;
}
