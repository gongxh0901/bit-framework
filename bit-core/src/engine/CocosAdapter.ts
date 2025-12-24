/**
 * @Author: Gongxh
 * @Date: 2024-12-08
 * @Description: 
 */

import { screen as ccScreen, view } from "cc";
import { Size } from "../header";
import { debug } from "../log";
import { Adapter } from "./Adapter";

export class CocosAdapter extends Adapter {
    /**
     * 获取屏幕像素尺寸
     * @returns {Size}
     * @internal
     */
    protected getScreenSize(): Size {
        let windowSize = ccScreen.windowSize;
        let width = Math.ceil(windowSize.width / view.getScaleX());
        let height = Math.ceil(windowSize.height / view.getScaleY());
        return { width, height };
    }

    /**
     * 获取设计尺寸
     * @returns {Size}
     * @internal
     */
    protected getDesignSize(): Size {
        let designSize = view.getDesignResolutionSize();
        return { width: designSize.width, height: designSize.height };
    }

    /**
     * 设置尺寸发生变化的监听
     * @param callback 回调
     * @internal
     */
    protected registerListener(listener: (...args: any) => void): void {
        if (ccScreen && ccScreen.on) {
            ccScreen.on("window-resize", (...args: any) => {
                debug("window-resize");
                listener(...args);
            }, this);
            ccScreen.on("orientation-change", (...args: any) => {
                debug("orientation-change");
                listener(...args);
            }, this);
            ccScreen.on("fullscreen-change", (...args: any) => {
                debug("fullscreen-change");
                listener(...args);
            }, this);
        } else {
            // 3.8.0之前的版本
            view.setResizeCallback(listener);
        }
    }
}
