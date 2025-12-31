/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 
 */

import { Timer } from "./Timer";

export class GlobalTimer {
    /** @internal */
    private static _timer: Timer = null;
    /**
     * 初始化全局定时器，设置定时器间隔为16毫秒。
     * 此方法用于启动一个定时器实例，以便在整个应用程序中跟踪时间相关的操作。
     * @internal
     */
    public static initTimer(): void {
        this._timer = new Timer(16);
    }

    /**
     * 获取全局定时器实例。如果定时器尚未初始化，则进行初始化。
     * @returns {Timer} 全局定时器实例
     * @internal
     */
    public static get Timer(): Timer {
        if (this._timer) {
            return this._timer;
        }
        this.initTimer();
        return this._timer;
    }

    /**
     * 启动一个定时器，执行指定的回调函数。
     * @param callback - 要定时执行的回调函数。
     * @param interval - 定时器的时间间隔（秒）。
     * @param loop - [loop=0] 重复次数：0：回调一次，1~n：回调n次，-1：无限重复
     * @returns 返回定时器的ID。
     */
    public static startTimer(callback: () => void, interval: number, loop: number = 0): number {
        return this.Timer.start(callback, interval, loop);
    }

    /**
     * 停止指定ID的计时器。
     * @param timerId - 要停止的计时器的唯一标识符。
     */
    public static stopTimer(timerId: number): void {
        this.Timer.stop(timerId);
    }

    /**
     * 暂停指定ID的计时器。
     * @param timerId - 要暂停的计时器的唯一标识符。
     */
    public static pauseTimer(timerId: number): void {
        this.Timer.pause(timerId);
    }

    /**
     * 恢复指定ID的计时器。
     * @param timerId - 要恢复的计时器的唯一标识符。
     */
    public static resumeTimer(timerId: number): void {
        this.Timer.resume(timerId);
    }

    /**
     * 清除所有定时器。
     */
    public static clearAllTimer(): void {
        this.Timer.clear();
    }

    /**
     * 更新定时器
     * @param dt - 时间间隔
     * @internal
     */
    public static update(dt: number): void {
        this._timer?.update(dt);
    }
}