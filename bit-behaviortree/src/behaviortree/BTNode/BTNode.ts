import { globalBlackboard, IBlackboard } from "../Blackboard";
import { Status } from "../header";

export interface IBTNode {
    readonly children: IBTNode[];
    /** 本节点的的黑板引用 */
    local: IBlackboard;
    /**
     * 初始化节点
     * @param root 树根节点的黑板
     * @param parent 父节点的黑板
     */
    _initialize(root: IBlackboard, parent: IBlackboard): void;

    /**
     * @internal
     */
    _execute(dt: number): Status;
    tick(dt: number): Status;

    /**
     * 优先写入自己的黑板数据, 如果没有则写入父节点的黑板数据
     */
    set<T>(key: string, value: T): void;
    get<T>(key: string): T;

    /**
     * 写入树根节点的黑板数据
     */
    setRoot<T>(key: string, value: T): void;
    getRoot<T>(key: string): T;

    /**
     * 写入全局黑板数据
     */
    setGlobal<T>(key: string, value: T): void;
    getGlobal<T>(key: string): T;

    /** 获取关联的实体 */
    getEntity<T>(): T;

    /**
     * 递归清理子节点的打开状态
     * 用途:
     * 1.装饰节点的子节点未关闭，但是装饰节点关闭时，需要清理子节点的打开状态
     * 2.组合节点关闭，但是子节点可能还在运行，需要清理子节点的打开状态
     */
    cleanupChild(): void;
}


/**
 * 基础节点
 * 每个节点只管理自己需要的状态
 */
export abstract class BTNode implements IBTNode {
    public readonly children: IBTNode[];

    /** 树根节点的黑板引用 */
    protected _root!: IBlackboard;

    /** 本节点的的黑板引用 可能等于 _parent */
    protected _local!: IBlackboard;

    constructor(children?: IBTNode[]) {
        this.children = children ? [...children] : [];
    }

    public _initialize(root: IBlackboard, parent: IBlackboard): void {
        this._root = root;
        // 在需要的节点中重写，创建新的local
        this._local = parent;
    }

    /**
     * @internal
     */
    public _execute(dt: number): Status {
        // 首次执行时初始化
        const isRunning = this._local.openNodes.get(this) || false;
        if (!isRunning) {
            this._local.openNodes.set(this, true);
            this.open();
        }

        // 执行核心逻辑
        const status = this.tick(dt);

        // 执行完成时清理
        if (status !== Status.RUNNING) {
            this._local.openNodes.delete(this);
            this.close();
        }
        return status;
    }

    /**
     * 初始化节点（首次执行时调用）
     * 子类重写此方法进行状态初始化
     */
    protected open(): void { }
    protected close(): void { }

    public cleanupChild(): void {
        for (const child of this.children) {
            if (this._local.openNodes.has(child)) {
                child.cleanupChild();
                this._local.openNodes.delete(child);
                (child as BTNode).close();
            }
        }
    }

    /**
     * 执行节点逻辑
     * 子类必须实现此方法
     * @returns 执行状态
     */
    public abstract tick(dt: number): Status;

    public getEntity<T>(): T {
        return this._local.getEntity();
    }

    public set<T>(key: string, value: T): void {
        this._local.set(key, value);
    }

    public get<T>(key: string): T {
        return this._local.get(key);
    }

    public setRoot<T>(key: string, value: T): void {
        this._root.set(key, value);
    }

    public getRoot<T>(key: string): T {
        return this._root.get(key);
    }

    public setGlobal<T>(key: string, value: T): void {
        globalBlackboard.set(key, value);
    }

    public getGlobal<T>(key: string): T {
        return globalBlackboard.get(key);
    }

    public get local(): IBlackboard {
        return this._local;
    }
}