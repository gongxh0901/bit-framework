import { IBlackboard } from "../Blackboard";
import { BT } from "../BT";
import { Status } from "../header";
import { BTNode, IBTNode } from "./BTNode";
import { WeightDecorator } from "./Decorator";

/**
 * 组合节点基类
 * 有多个子节点
 * 
 * 组合节点全部都有记忆能力
 */
export abstract class Composite extends BTNode {
    constructor(...children: IBTNode[]) {
        super(children);
    }

    public override _initialize(global: IBlackboard, branch: IBlackboard): void {
        super._initialize(global, branch);
        this._local = branch.createChild();
    }

    protected override open(): void {
        this.set(`__nRunningIndex`, 0);
    }
}

/**
 * 记忆选择节点 从上到下执行
 * 遇到 FAILURE 继续下一个 
 * 遇到 SUCCESS 返回 SUCCESS 下次重新开始
 * 
 * 遇到 RUNNING 返回 RUNNING 下次从该节点开始
 */
@BT.ClassComposite("Selector", { name: "选择节点", group: "基础组合节点", desc: "子节点从左到右执行, 子节点状态: 成功则选择成立, 失败继续下一个, 执行中则返回执行中, 下次从该节点开始" })
export class Selector extends Composite {
    public tick(dt: number): Status {
        let index = this.get<number>(`__nRunningIndex`);
        for (let i = index; i < this.children.length; i++) {
            let status = this.children[i]!._execute(dt);
            if (status === Status.FAILURE) {
                continue;
            }
            if (status === Status.SUCCESS) {
                return status;
            }
            this.set(`__nRunningIndex`, i);
            return Status.RUNNING;
        }
        return Status.FAILURE;
    }
}

/**
 * 顺序节点 从上到下执行
 * 遇到 SUCCESS 继续下一个
 * 遇到 FAILURE 停止迭代 返回 FAILURE 下次重新开始
 * 
 * 遇到 RUNNING 返回 RUNNING 下次从该节点开始
 */
@BT.ClassComposite("Sequence", { name: "顺序节点", group: "基础组合节点", desc: "子节点从左到右执行, 子节点状态: 成功则继续下一个, 失败则停止迭代返回失败, 执行中返回执行中, 下次从该节点开始" })
export class Sequence extends Composite {
    public tick(dt: number): Status {
        let index = this.get<number>(`__nRunningIndex`);
        for (let i = index; i < this.children.length; i++) {
            let status = this.children[i]!._execute(dt);
            if (status === Status.SUCCESS) {
                continue;
            }
            if (status === Status.FAILURE) {
                return Status.FAILURE;
            }
            this.set(`__nRunningIndex`, i);
            return Status.RUNNING;
        }
        return Status.SUCCESS;
    }
}

/**
 * 并行节点 从左到右依次执行所有子节点 必定全部执行一遍
 * 返回优先级 FAILURE > RUNNING > SUCCESS
 * 注意：这里的"并行"是逻辑概念，实际是顺序执行
 * 
 * 记忆机制: 已经失败的子节点不会重复执行，只执行运行中的子节点
 */
@BT.ClassComposite("Parallel", { name: "并行节点", group: "基础组合节点", desc: "依次执行所有子节点(从左到右), 子节点状态: 任意失败则失败 > 任意执行中则执行中 > 全部成功则成功" })
export class Parallel extends Composite {
    protected override open(): void {
        super.open();
        // 初始化所有子节点状态为RUNNING
        for (let i = 0; i < this.children.length; i++) {
            this.set(`__childStatus_${i}`, Status.RUNNING);
        }
    }

    public tick(dt: number): Status {
        let result = Status.SUCCESS;
        for (let i = 0; i < this.children.length; i++) {
            // 获取该子节点的缓存状态
            let status = this.get<Status>(`__childStatus_${i}`);

            // 只执行还在运行中的子节点
            if (status === Status.RUNNING) {
                status = this.children[i]!._execute(dt);
                // 缓存子节点状态
                if (status !== Status.FAILURE && result !== Status.FAILURE) {
                    this.set(`__childStatus_${i}`, status);
                }
            }

            // 优先级: FAILURE > RUNNING > SUCCESS
            // 必须执行完所有子节点，不能提前终止
            if (status === Status.FAILURE) {
                result = Status.FAILURE;
            } else if (status === Status.RUNNING && result !== Status.FAILURE) {
                result = Status.RUNNING;
            }
        }
        // 所有子节点执行完毕后，如果不是RUNNING则清理
        if (result !== Status.RUNNING) {
            this.cleanupChild();
        }
        return result;
    }
}


/**
 * 随机选择节点
 * 随机选择一个子节点执行，支持权重
 * 返回子节点状态
 */
@BT.ClassComposite("RandomSelector", { name: "随机选择节点", group: "基础组合节点", desc: "随机选择一个子节点执行, 返回子节点状态" })
export class RandomSelector extends Composite {
    private _totalWeight: number = 0;
    private _weights: number[] = [];

    constructor(...children: IBTNode[]) {
        super(...children);
        this._totalWeight = 0;
        this._weights = [];

        for (const child of children) {
            const weight = (child instanceof WeightDecorator) ? child.weight : 1;
            this._totalWeight += weight;
            this._weights.push(this._totalWeight);
        }
    }

    protected override open(): void {
        this.set(`__nRunningIndex`, -1);
    }

    /** 根据权重随机选择子节点索引 */
    private selectRandomIndex(): number {
        const randomValue = Math.random() * this._totalWeight;
        // 线性查找（行为树子节点数量通常很少，性能足够）
        for (let i = 0; i < this._weights.length; i++) {
            if (randomValue < this._weights[i]!) {
                return i;
            }
        }
        return this._weights.length - 1;
    }

    public tick(dt: number): Status {
        if (this.children.length === 0) {
            return Status.FAILURE;
        }

        // 获取或选择子节点索引
        let index = this.get<number>(`__nRunningIndex`);
        if (index === -1) {
            index = this.selectRandomIndex();
        }

        // 执行选中的子节点
        const status = this.children[index]!._execute(dt);

        // 如果返回RUNNING，记录索引以便下次继续执行
        if (status === Status.RUNNING) {
            this.set(`__nRunningIndex`, index);
        }

        return status;
    }
}

/**
 * 并行任意成功节点 从左到右依次执行所有子节点 必定全部执行一遍
 * 返回优先级 SUCCESS > RUNNING > FAILURE
 * 注意：这里的"并行"是逻辑概念，实际是顺序执行
 * 
 * 记忆机制: 已经失败的子节点不会重复执行，只执行运行中的子节点
 */
@BT.ClassComposite("ParallelAnySuccess", { name: "并行任意成功节点", group: "基础组合节点", desc: "依次执行所有子节点(从左到右), 任意一个成功则成功 > 任意一个执行中则执行中 > 全部失败则失败" })
export class ParallelAnySuccess extends Composite {
    protected override open(): void {
        super.open();
        // 初始化所有子节点状态为RUNNING
        for (let i = 0; i < this.children.length; i++) {
            this.set(`__childStatus_${i}`, Status.RUNNING);
        }
    }

    public tick(dt: number): Status {
        let result = Status.FAILURE;
        for (let i = 0; i < this.children.length; i++) {
            // 获取该子节点的缓存状态
            let status = this.get<Status>(`__childStatus_${i}`);

            // 只执行还在运行中的子节点
            if (status === Status.RUNNING) {
                status = this.children[i]!._execute(dt);
                // 缓存子节点状态
                if (status !== Status.SUCCESS && result !== Status.SUCCESS) {
                    this.set(`__childStatus_${i}`, status);
                }
            }

            // 优先级: SUCCESS > RUNNING > FAILURE
            if (status === Status.SUCCESS) {
                result = Status.SUCCESS;
            } else if (status === Status.RUNNING && result !== Status.SUCCESS) {
                result = Status.RUNNING;
            }
        }
        // 所有子节点执行完毕后，如果不是RUNNING则清理
        if (result !== Status.RUNNING) {
            this.cleanupChild();
        }
        return result;
    }
}