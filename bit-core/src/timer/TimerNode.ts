/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 计时器节点
 */

import { HeapNode } from "../structures/BinaryHeap";

/** @internal */
export class TimerNode extends HeapNode {
    /** 定时器ID */
    public id: number;

    /** 定时器添加索引，同一时间回调根据OrderIndex排序 */
    public orderIndex: number;

    /** 定时间隔 */
    public interval: number;

    /** 回调时间点 */
    public expireTime: number;

    /** 重复次数 */
    public loop: number = 0;

    /** 定时回调 */
    public callback: () => void;

    /** 暂停时剩余时间 */
    public pauseRemainTime: number;

    /** 是否暂停 */
    public pause: boolean;

    /** * 是否被回收 */
    public recycled: boolean;

    constructor(id: number) {
        super();
        this.id = id;
    }

    /**
     * 是否比其他定时节点小
     * @param {HeapNode} other 其他定时节点
     * @returns {boolean} 
     */
    public lessThan(other: HeapNode): boolean {
        const otherTimerNode = other as TimerNode;

        if (Math.abs(this.expireTime - otherTimerNode.expireTime) <= 1e-5) {
            return this.orderIndex < otherTimerNode.orderIndex;
        }

        return this.expireTime < otherTimerNode.expireTime;
    }
}
