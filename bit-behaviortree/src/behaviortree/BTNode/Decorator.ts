/**
 * @Author: Gongxh
 * @Date: 2025-09-01
 * @Description: 装饰节点 装饰节点下必须包含子节点
 */

import { BT } from "../BT";
import { Status } from "../header";
import { BTNode, IBTNode } from "./BTNode";

/**
 * 修饰节点 基类
 * 有且仅有一个子节点
 */
export abstract class Decorator extends BTNode {
    constructor(child: IBTNode) {
        super([child]);
    }
}

/** 条件装饰节点基类 */
export abstract class ConditionDecorator extends Decorator {
    /**
     * 判断是否满足条件
     * @returns 是否满足条件
     */
    protected abstract isEligible(): boolean;

    public tick(dt: number): Status {
        if (this.isEligible()) {
            return this.children[0]!._execute(dt);
        }
        this.cleanupChild();
        return Status.FAILURE;
    }
}

/**
 * 结果反转节点
 * 必须且只能包含一个子节点
 * 第一个Child Node节点, 返回 FAILURE, 本Node向自己的Parent Node也返回 SUCCESS
 * 第一个Child Node节点, 返回 SUCCESS, 本Node向自己的Parent Node也返回 FAILURE
 */
@BT.ClassDecorator("Inverter", { name: "结果反转节点", group: "基础装饰节点", desc: "反转子节点的执行结果, 成功变失败, 失败变成功, 执行中保持不变" })
export class Inverter extends Decorator {
    public tick(dt: number): Status {
        const status = this.children[0]!._execute(dt);

        if (status === Status.SUCCESS) {
            return Status.FAILURE;
        } else if (status === Status.FAILURE) {
            return Status.SUCCESS;
        }
        return status; // RUNNING 保持不变
    }
}


/**
 * 时间限制节点
 * 只能包含一个子节点
 * 规定时间内, 根据Child Node的结果, 本节点向自己的父节点也返回相同的结果
 * 超时后, 直接返回 FAILURE
 */
@BT.ClassDecorator("LimitTime", { name: "时间限制节点", group: "基础装饰节点", desc: "限制时间内返回子节点状态, 超时后返回失败" })
export class LimitTime extends Decorator {
    @BT.prop({ type: BT.ParamType.float, description: "最大时间(秒)", defaultValue: 1 })
    protected _max: number = 1;

    private _value: number = 0;
    /**
     * 时间限制节点
     * @param child 子节点 
     * @param max 最大时间 (秒) 默认1秒
     */
    constructor(child: IBTNode, max: number = 1) {
        super(child);
        this._max = max;
    }

    protected override open(): void {
        this._value = 0;
    }

    public tick(dt: number): Status {
        this._value += dt;
        if (this._value > this._max) {
            this.cleanupChild();
            return Status.FAILURE;
        }
        return this.children[0]!._execute(dt);
    }
}

/**
 * 次数限制节点
 * 必须且只能包含一个子节点
 * 次数超过后, 直接返回失败; 次数未超过, 返回子节点状态
 */
@BT.ClassDecorator("LimitTicks", { name: "次数限制节点", group: "基础装饰节点", desc: "子节点成功, 次数+1, 限制次数内返回子节点状态, 超过限制次数返回失败" })
export class LimitTicks extends Decorator {
    @BT.prop({ type: BT.ParamType.int, description: "最大次数", defaultValue: 1 })
    protected _max: number = 1;

    private _value: number = 0;
    constructor(child: IBTNode, max: number = 1) {
        super(child);
        this._max = max;
    }

    protected override open(): void {
        this._value = 0;
    }

    public tick(dt: number): Status {
        if (this._value > this._max) {
            this.cleanupChild();
            return Status.FAILURE;
        }
        let status = this.children[0]!._execute(dt);
        if (status !== Status.RUNNING) {
            this._value++;
        }
        return status;
    }
}

/**
 * 循环节点 最大次数必须大于0
 * 必须且只能包含一个子节点
 * 子节点是成功或失败，累加计数
 * 次数超过之后返回子节点状态，否则返回 RUNNING
 */
@BT.ClassDecorator("Repeat", { name: "重复节点", group: "基础装饰节点", desc: "子节点成功或失败次数+1, 重复执行指定次数" })
export class Repeat extends Decorator {
    @BT.prop({ type: BT.ParamType.int, description: "重复次数", defaultValue: 1, min: 1 })
    protected _max: number = 1;

    private _value: number = 0;
    constructor(child: IBTNode, max: number = 1) {
        super(child);
        this._max = max;
    }

    protected override open(): void {
        this._value = 0;
    }

    public tick(dt: number): Status {
        // 执行子节点
        const status = this.children[0]!._execute(dt);
        // 如果子节点完成（成功或失败），增加计数
        if (status !== Status.RUNNING) {
            this._value++;
            // 检查是否达到最大次数
            if (this._value >= this._max) {
                return status;
            }
        }
        return Status.RUNNING;
    }
}

/**
 * 重复 -- 直到失败
 * 节点含义：重复执行直到失败，但最多重试max次
 * 必须且只能包含一个子节点
 * 
 * 子节点成功 计数+1
 */
@BT.ClassDecorator("RepeatUntilFailure", { name: "重复直到失败", group: "基础装饰节点", desc: "子节点成功则次数+1, 限制次数内返回执行中, 重复执行子节点直到子节点返回失败, 超过限制次数返回失败" })
export class RepeatUntilFailure extends Decorator {
    @BT.prop({ type: BT.ParamType.int, description: "最大重试次数", defaultValue: 1, min: 1 })
    protected _max: number = 1;

    private _value: number = 0;
    constructor(child: IBTNode, max: number = 1) {
        super(child);
        this._max = max;
    }

    protected override open(): void {
        this._value = 0;
    }

    public tick(dt: number): Status {
        const status = this.children[0]!._execute(dt);
        if (status === Status.FAILURE) {
            return Status.FAILURE;
        }
        if (status === Status.SUCCESS) {
            this._value++;
            if (this._value >= this._max) {
                // 重试次数耗尽了，但是子节点一直返回成功 就返回成功
                return Status.SUCCESS;
            }
        }
        return Status.RUNNING;
    }
}

/**
 * 重复 -- 直到成功
 * 节点含义：重复执行直到成功，但最多重试max次
 * 必须且只能包含一个子节点
 * 
 * 子节点失败, 计数+1
 */
@BT.ClassDecorator("RepeatUntilSuccess", { name: "重复直到成功", group: "基础装饰节点", desc: "子节点失败则次数+1, 限制次数内返回执行中, 重复执行子节点直到子节点返回成功, 超过限制次数返回失败" })
export class RepeatUntilSuccess extends Decorator {
    @BT.prop({ type: BT.ParamType.int, description: "最大重试次数", defaultValue: 1, step: 1 })
    protected _max: number = 1;

    private _value: number = 0;
    constructor(child: IBTNode, max: number = 1) {
        super(child);
        this._max = max;
    }

    protected override open(): void {
        this._value = 0;
    }

    public tick(dt: number): Status {
        // 执行子节点
        const status = this.children[0]!._execute(dt);
        if (status === Status.SUCCESS) {
            return Status.SUCCESS;
        }
        if (status === Status.FAILURE) {
            this._value++;
            if (this._value >= this._max) {
                // 重试次数耗尽了，但是子节点一直返回失败
                return Status.FAILURE;
            }
        }
        return Status.RUNNING;
    }
}

/**
 * 权重装饰节点
 */
@BT.ClassDecorator("WeightDecorator", { name: "权重装饰节点", group: "基础装饰节点", desc: "根据权重随机选择子节点执行, 用于随机选择节点的子节点" })
export class WeightDecorator extends Decorator {
    @BT.prop({ type: BT.ParamType.int, description: "权重", defaultValue: 1, step: 1 })
    private _weight: number;

    constructor(child: IBTNode, weight?: number) {
        super(child);
        // 优先使用构造函数参数，否则使用装饰器默认参数
        this._weight = weight || 1;
    }

    public tick(dt: number): Status {
        return this.children[0]!._execute(dt);
    }

    public get weight(): number {
        return this._weight;
    }
}