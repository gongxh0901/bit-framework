/**
 * @Author: Gongxh
 * @Date: 2025-09-16
 * @Description: 根据数据创建一颗行为树
 */

import { BehaviorTree } from "./BehaviorTree";
import { BT } from "./BT";
import { IBTNode } from "./BTNode/BTNode";

export interface INodeConfig {
    id: string,
    className: string,
    parameters: Record<string, any>,
    children: string[]
}

/**
 * 根据节点配置递归创建节点
 * @param info 节点配置
 * @param nodeMap 所有节点配置的映射表
 * @returns 创建的节点实例
 */
function createNodeRecursively(info: INodeConfig, nodeMap: Map<string, INodeConfig>): IBTNode {
    // 获取节点构造函数
    const ctor = BT.getNodeConstructor(info.className);
    if (!ctor) {
        throw new Error(`未找到节点【${info.className}】的构造函数`);
    }

    // 递归创建子节点
    const childNodes: IBTNode[] = [];
    for (const childId of info.children || []) {
        const childInfo = nodeMap.get(childId);
        if (!childInfo) {
            throw new Error(`未找到子节点【${childId}】，行为树配置导出信息错误`);
        }
        const childNode = createNodeRecursively(childInfo, nodeMap);
        childNodes.push(childNode);
    }

    // 创建节点实例
    let btnode: IBTNode;
    const metadata = BT.getNodeMetadata(ctor);
    if (metadata.type === BT.Type.Action || metadata.type === BT.Type.Condition) {
        btnode = new ctor();
    } else if (metadata.type === BT.Type.Decorator) {
        btnode = new ctor(childNodes[0]!);
    } else {
        btnode = new ctor(...childNodes);
    }
    // 设置节点参数
    for (const key in info.parameters) {
        (btnode as any)[key] = info.parameters[key];
    }
    return btnode;
}

export function createBehaviorTree<T>(config: INodeConfig[], entity: T): BehaviorTree<T> {
    // 验证配置
    if (!config || !Array.isArray(config) || config.length === 0) {
        throw new Error("Config is empty or invalid");
    }

    // 创建配置映射表
    const nodeMap = new Map<string, INodeConfig>();
    for (const info of config) {
        nodeMap.set(info.id, info);
    }
    return new BehaviorTree(entity, createNodeRecursively(config[0]!, nodeMap));
}