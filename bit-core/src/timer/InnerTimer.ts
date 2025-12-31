/**
 * @Author: Gongxh
 * @Date: 2025-02-14
 * @Description: 内部使用的全局定时器
 */

import { Timer } from "./Timer";

export class InnerTimer {
    private static _timer: Timer = null;
    /**
     * 初始化全局定时器，设置定时器间隔为16毫秒。
     * 此方法用于启动一个定时器实例，以便在整个应用程序中跟踪时间相关的操作。
     */
    public static initTimer(): void {
        this._timer = new Timer(16);
    }

    /**
     * 启动一个定时器，执行指定的回调函数。
     * @param callback - 要定时执行的回调函数。
     * @param interval - 定时器的时间间隔（秒）。
     * @param loop - [loop=0] 重复次数：0：回调一次，1~n：回调n次，-1：无限重复
     * @returns 返回定时器的ID。
     */
    public static startTimer(callback: () => void, interval: number, loop: number = 0): number {
        return this._timer.start(callback, interval, loop);
    }

    /**
     * 停止指定ID的计时器。
     * @param timerId - 要停止的计时器的唯一标识符。
     */
    public static stopTimer(timerId: number): void {
        this._timer.stop(timerId);
    }

    public static update(dt: number): void {
        this._timer?.update(dt);
    }
}