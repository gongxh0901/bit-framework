/**
 * @Author: Gongxh
 * @Date: 2025-02-14
 * @Description: 
 */
import { warn } from "@gongxh/bit-core";
import { _conditionDecorator } from "./ConditionDecorator";
import { ConditionMode } from "./ConditionMode";
import { ConditionBase } from "./node/ConditionBase";
import { ConditionNode } from "./node/ConditionNode";
export class ConditionManager {
    /** 注册的 条件类型对应条件的信息 @internal */
    private static readonly _typeToCondition: Map<number, ConditionBase> = new Map<number, ConditionBase>();

    /** 条件类型 对应 条件节点 @internal */
    private static readonly _typeToNotifyNodes: Map<number, Set<ConditionNode>> = new Map<number, Set<ConditionNode>>();
    /** 条件节点 对应 条件类型 @internal */
    private static readonly _nodeToConditionTypes: Map<ConditionNode, Set<number>> = new Map<ConditionNode, Set<number>>();

    /** 需要更新的条件 @internal */
    private static readonly _needUpdateConditions: Set<ConditionBase> = new Set<ConditionBase>();
    /** 需要更新的节点 @internal */
    private static readonly _needUpdateNodes: Set<ConditionNode> = new Set<ConditionNode>();

    /** 是否正在更新 @internal */
    private static _updating: boolean = false;

    /** 初始化所有条件，并全部更新一次 */
    public static initCondition(): void {
        const conditionMaps = _conditionDecorator.getConditionMaps();
        conditionMaps.forEach((ctor, conditionType) => {
            if (!this._typeToCondition.has(conditionType)) {
                const condition = new ctor();
                condition.type = conditionType;
                condition._init();
                this._addCondition(condition);
            } else {
                warn(`条件（${conditionType}）已经被注册, 跳过`);
            }
        });
        this._refreshAllConditions();
    }

    /**
     * 添加条件
     * @param {IConditionBase} condition 条件
     * @internal
     */
    private static _addCondition(condition: ConditionBase): void {
        if (this._updating) {
            throw new Error("请不要在ConditionManager更新过程中添加要更新的条件");
        }
        this._typeToNotifyNodes.set(condition.type, new Set<ConditionNode>());
        this._typeToCondition.set(condition.type, condition);
        this._needUpdateConditions.add(condition);
    }

    /**
     * 刷新所有条件
     * @internal
     */
    private static _refreshAllConditions(): void {
        let allCondition = this._typeToCondition;
        for (const condition of allCondition.values()) {
            condition._updateCondition();
        }
    }

    /**
     * 添加到更新列表中
     * @param conditionType 条件类型
     * @internal
     */
    public static _addUpdateCondition(conditionType: number): void {
        if (this._updating) {
            throw new Error("请不要在ConditionManager更新过程中添加要更新的条件");
        }
        // 添加待更新的条件;
        const condition = this._typeToCondition.get(conditionType);
        if (condition) {
            this._needUpdateConditions.add(condition);
        }
    }

    /**
     * 添加条件节点
     * @param notifyNode 条件节点
     * @param conditionType 条件类型
     * @internal
     */
    public static _addConditionNode(conditionNode: ConditionNode, conditionType: number): void {
        const condition = this._typeToCondition.get(conditionType);
        if (!condition) {
            warn(`不存在条件类型（${conditionType}），请通过装饰器()注册条件类型`);
            return;
        }
        // 添加通知类型对应节点
        let nodes = this._typeToNotifyNodes.get(condition.type);
        if (!nodes.has(conditionNode)) {
            nodes.add(conditionNode);
        }
        // 添加节点对应通知类型
        let conditionTypes = this._nodeToConditionTypes.get(conditionNode);
        if (!conditionTypes) {
            conditionTypes = new Set<number>();
            this._nodeToConditionTypes.set(conditionNode, conditionTypes);
        }
        if (!conditionTypes.has(condition.type)) {
            conditionTypes.add(condition.type);
        }
    }

    /**
     * 移除条件节点
     * @param conditionNode 条件节点
     * @param conditionType 条件类型
     * @internal
     */
    public static _removeConditionNode(conditionNode: ConditionNode): void {
        let types = this._nodeToConditionTypes.get(conditionNode);
        if (!types) {
            return;
        }
        for (const conditionType of types.values()) {
            let nodes = this._typeToNotifyNodes.get(conditionType);
            nodes.delete(conditionNode);
        }
        this._nodeToConditionTypes.delete(conditionNode);
    }

    /**
     * 立即更新条件节点（内部使用）
     * @param conditionNode 条件节点
     * @internal
     */
    public static _nowUpdateConditionNode(conditionNode: ConditionNode): void {
        this._tryUpdateConditionNode(conditionNode);
    }

    /**
     * 更新函数（内部使用）
     * @internal
     */
    public static _update(): void {
        this._updating = true;
        // 更新条件
        let needUpdateConditions = this._needUpdateConditions;
        if (needUpdateConditions.size > 0) {
            for (const condition of needUpdateConditions.values()) {
                this._tryUpdateCondition(condition);
            }
            needUpdateConditions.clear();
        }
        // 更新条件节点
        let needUpdateConditionNodes = this._needUpdateNodes;
        if (needUpdateConditionNodes.size > 0) {
            for (const conditionNode of needUpdateConditionNodes.values()) {
                this._tryUpdateConditionNode(conditionNode);
            }
            needUpdateConditionNodes.clear();
        }
        this._updating = false;
    }

    /**
     * 更新条件节点，如果状态改变，收集需要更新的通知节点(内部使用)
     * @param {ConditionBase} condition 条件
     * @internal
     */
    private static _tryUpdateCondition(condition: ConditionBase): void {
        // 更新条件
        if (!condition._updateCondition()) {
            return;
        }
        // 条件改变，收集需要更新的通知节点
        if (this._typeToNotifyNodes.has(condition.type)) {
            let nodes = this._typeToNotifyNodes.get(condition.type);
            let needUpdateConditionNodes = this._needUpdateNodes;
            for (const conditionNode of nodes) {
                if (!needUpdateConditionNodes.has(conditionNode)) {
                    needUpdateConditionNodes.add(conditionNode);
                }
            }
        }
    }

    /**
     * 更新条件节点(内部使用)
     * @param {ConditionNode} conditionNode 条件节点
     * @internal
     */
    private static _tryUpdateConditionNode(conditionNode: ConditionNode): void {
        if (!this._nodeToConditionTypes.has(conditionNode)) {
            return;
        }
        // 获取节点对应的所有通知条件
        const conditionTypes = this._nodeToConditionTypes.get(conditionNode);
        const conditions = this._typeToCondition;
        let canNotify = false;
        let modeType = conditionNode._modeType;
        switch (modeType) {
            case ConditionMode.Any:
                for (const conditionType of conditionTypes.values()) {
                    // 有一个满足就退出
                    if (conditions.get(conditionType).canNotify()) {
                        canNotify = true;
                        break;
                    }
                }
                break;
            case ConditionMode.All:
                canNotify = true;
                for (const conditionType of conditionTypes.values()) {
                    // 有任意一个不满足就退出
                    if (!conditions.get(conditionType).canNotify()) {
                        canNotify = false;
                        break;
                    }
                }
                break;
            default:
                break;
        }
        conditionNode.notify(canNotify);
    }
}