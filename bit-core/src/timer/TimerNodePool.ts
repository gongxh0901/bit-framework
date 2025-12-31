/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 计时器节点回收池
 */
import { TimerNode } from "./TimerNode";

const TimerIdBit = 19;
const TimerCount = 1 << (32 - TimerIdBit);
const TimerVersionMask = (1 << TimerIdBit) - 1;
const TimerMaxVersion = TimerVersionMask;

export class TimerNodePool {
    /** @internal */
    private _pool: Array<TimerNode> = new Array<TimerNode>();
    /** @internal */
    private _freeIndices: Array<number> = new Array<number>();

    /**
     * 定时器池
     * @param {number} capacity 初始容量
     * @internal
     */
    public constructor(capacity: number) {
        for (let i = 0; i < capacity; ++i) {
            const timerNode = new TimerNode(i << TimerIdBit);

            timerNode.recycled = true;
            this._pool.push(timerNode);
            this._freeIndices.push(i);
        }
    }

    /**
     * 分配定时器节点
     * @returns {TimerNode} 定时器节点
     * @internal
     */
    public allocate(): TimerNode {
        let timerNode: TimerNode;
        const pools = this._pool;

        if (this._freeIndices.length == 0) {
            if (pools.length == TimerCount) {
                throw new Error("超出时钟个数: " + TimerCount);
            }
            timerNode = new TimerNode(pools.length << TimerIdBit);
            pools.push(timerNode);
        } else {
            const index = this._freeIndices.pop();

            timerNode = pools[index];
            timerNode.recycled = false;
            if ((timerNode.id & TimerVersionMask) == TimerMaxVersion) {
                throw new Error("时钟版本号过高: " + TimerMaxVersion);
            }
            ++timerNode.id;
        }

        return timerNode;
    }

    /**
     * 回收定时器节点
     * @param {number} timerId 定时器ID
     * @internal
     */
    public recycle(timerId: number): void {
        const index = timerId >>> TimerIdBit;

        if (index < 0 || index >= this._pool.length) {
            throw new Error("定时器不存在");
        }

        const timerNode = this._pool[index];

        if (timerNode.recycled) {
            throw new Error("定时器已经被回收");
        }

        timerNode.recycled = true;
        timerNode.callback = null;
        this._freeIndices.push(index);
    }

    /**
     * 根据TimerID获取定时器节点
     * @param {number} timerId 定时器ID
     * @returns {TimerNode}
     * @internal
     */
    public get(timerId: number): TimerNode | undefined {
        const index = timerId >>> TimerIdBit;
        const version = timerId & TimerVersionMask;

        if (index < 0 || index >= this._pool.length) {
            return null;
        }

        const timerNode = this._pool[index];
        if (timerNode.recycled) {
            return null;
        }

        const timerNodeVersion = timerNode.id & TimerVersionMask;

        if (timerNodeVersion != version) {
            return null;
        }

        return timerNode;
    }

    /**
     * 清空正在使用的Timer
     * @internal
     */
    public clear(): void {
        const pools = this._pool;
        const timerNodeCount = pools.length;
        const freeIndices = this._freeIndices;

        freeIndices.length = 0;
        for (let i = 0; i < timerNodeCount; ++i) {
            pools[i].recycled = true;
            pools[i].callback = null;
            freeIndices.push(i);
        }
    }
}
