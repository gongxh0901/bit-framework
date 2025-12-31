import { BT } from "../BT";
import { Status } from "../header";
import { BTNode } from "./BTNode";

/**
 * 叶子节点 基类
 * 没有子节点
 */
export abstract class LeafNode extends BTNode {
    constructor() {
        super([]);
    }
}

/**
 * 次数等待节点(无子节点)
 * 次数内，返回RUNNING
 * 超次，返回SUCCESS
 */
@BT.ClassAction("WaitTicks", { name: "次数等待节点", group: "基础行为节点", desc: "指定次数后返回成功, 否则返回执行中" })
export class WaitTicks extends LeafNode {
    @BT.prop({ type: BT.ParamType.int, description: "最大等待次数", defaultValue: 0, step: 1 })
    private _max: number;
    private _value: number;

    constructor(maxTicks: number = 0) {
        super();
        this._max = maxTicks;
        this._value = 0;
    }

    protected override open(): void {
        super.open();
        this._value = 0;
    }

    public tick(): Status {
        if (++this._value >= this._max) {
            return Status.SUCCESS;
        }
        return Status.RUNNING;
    }
}

/**
 * 时间等待节点 时间(秒) 
 * 时间到后返回SUCCESS，否则返回RUNNING
 */
@BT.ClassAction("WaitTime", { name: "时间等待节点", group: "基础行为节点", desc: "等待指定时间(秒)后返回成功, 否则返回执行中" })
export class WaitTime extends LeafNode {
    @BT.prop({ type: BT.ParamType.float, description: "等待时间(秒)", defaultValue: 0, step: 0.01 })
    private _max: number;
    private _value: number = 0;
    constructor(duration: number = 0) {
        super();
        this._max = duration;
    }

    protected override open(): void {
        super.open();
        this._value = 0;
    }

    public tick(dt: number): Status {
        this._value += dt;
        if (this._value >= this._max) {
            return Status.SUCCESS;
        }
        return Status.RUNNING;
    }
}