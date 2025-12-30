/**
 * @Author: Gongxh
 * @Date: 2024-12-14
 * @Description: 
 */
import { HeaderInfo } from "./HeaderInfo";
import { WindowBase } from "./WindowBase";

export abstract class Window<T = any, U = any> extends WindowBase<T, U> {
    protected onAdapted(): void {

    }

    protected abstract onInit(): void
    protected abstract onClose(): void

    protected abstract onShow(userdata?: T): void;

    protected onHide(): void { }
    protected onShowFromHide(): void { }

    protected onToTop(): void { }
    protected onToBottom(): void { }

    /**
     * 空白区域点击事件处理函数。
     * 当用户点击窗口的空白区域时触发此方法。
     */
    protected onEmptyAreaClick(): void {

    }

    /**
     * 获取窗口顶部资源栏数据 默认返回空数组
     * @returns {HeaderInfo}
     */
    public getHeaderInfo<U>(): HeaderInfo<U> {
        return null;
    }
}