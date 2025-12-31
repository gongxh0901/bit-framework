import { Blackboard, IBlackboard } from "./Blackboard";
import { IBTNode } from "./BTNode/BTNode";
import { Status } from "./header";

/**
 * 行为树
 * 所有节点全部添加到树中
 */
export class BehaviorTree<T> {
    /** 
     * @internal
     */
    private _root: IBTNode;
    /** 
     * @internal
     */
    private _blackboard: IBlackboard;

    get root(): IBTNode { return this._root; }
    get blackboard(): IBlackboard { return this._blackboard }

    /**
     * constructor
     * @param entity 实体
     * @param root 根节点
     */
    constructor(entity: T, root: IBTNode) {
        this._root = root;
        this._blackboard = new Blackboard(undefined, entity);
        // 构造时就初始化所有节点ID，避免运行时检查
        this._initializeAllNodeIds(this._root);
    }

    /**
     * 执行行为树
     */
    public tick(dt: number): Status {
        return this._root._execute(dt);
    }

    /**
     * 递归初始化所有节点ID
     * 在构造时一次性完成，避免运行时检查
     * @param node 要初始化的节点
     * @internal
     */
    private _initializeAllNodeIds(node: IBTNode, parent?: IBTNode): void {
        // 设置当前节点ID
        node._initialize(this._blackboard, parent ? parent.local : this._blackboard);
        // 递归设置所有子节点ID
        for (const child of node.children) {
            this._initializeAllNodeIds(child, node);
        }
    }

    /**
     * 完全重置行为树（核武器级别的重置）
     * 清空黑板并重置所有节点状态
     */
    public reset(): void {
        this._blackboard.clean();
    }
}