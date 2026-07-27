/**
 * @Author: Gongxh
 * @Date: 2025-02-14
 * @Description: 满足任意条件显示
 */
import { ConditionMode } from "../ConditionMode";
import { fgui } from "../types/header";
import { ConditionFGUINode } from "./ConditionFGUINode";
export class ConditionAnyNode extends ConditionFGUINode {
    /**
     * 构建红点节点
     * @param {fgui.GObject} node 关联节点
     * @param {...number[]} conditionTypes 条件类型
     */
    public constructor(node: fgui.GObject, ...conditionTypes: number[]) {
        super(node, ConditionMode.Any, ...conditionTypes);
    }
}