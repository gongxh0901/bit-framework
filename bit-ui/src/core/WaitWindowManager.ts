/**
 * @Author: Gongxh
 * @Date: 2026-07-29
 * @Description: 通用等待窗管理
 */

import { IWaitWindowCallbacks } from "./types";

/** @internal */
export class WaitWindowManager {
    /** 等待窗引用计数 */
    private static waitRef: number = 0;

    /** 显示等待窗回调 */
    private static _showWaitWindow: ((context?: string) => void) | null = null;

    /** 隐藏等待窗回调 */
    private static _hideWaitWindow: (() => void) | null = null;

    /** 设置等待窗回调 */
    public static setCallbacks(callbacks: IWaitWindowCallbacks): void {
        this._showWaitWindow = callbacks.showWaitWindow;
        this._hideWaitWindow = callbacks.hideWaitWindow;
    }

    /** 增加等待窗引用计数 */
    public static show(context?: string): void {
        if (this.waitRef++ === 0) {
            this._showWaitWindow?.(context);
        }
    }

    /** 减少等待窗引用计数 */
    public static hide(): void {
        this.waitRef = Math.max(0, this.waitRef - 1);
        if (this.waitRef === 0) {
            this._hideWaitWindow?.();
        }
    }

    /** 使用等待窗包裹一个同步或异步任务 */
    public static async run<T>(task: () => T | Promise<T>, context?: string): Promise<T> {
        this.show(context);
        try {
            return await task();
        } finally {
            this.hide();
        }
    }
}
