/**
 * @Author: Gongxh
 * @Date: 2025-12-29
 * @Description: 
 */

import { UI } from "../../header";
const { uiclass, uiclick } = UI._uidecorator;

@uiclass("Window", "Window", "NormalWindow2")
export class NormalWindow2 extends UI.Window {
    protected onInit(): void {
        this.adapterType = UI.AdapterType.Bang;
        this.type = UI.WindowType.Normal;
        // this.bgAlpha = 0;
    }

    protected onShow(userdata?: any): void {

    }

    protected onClose(): void {
    }


    /** 关闭自己 */
    @uiclick
    private onCloseSelf(): void {
        this.removeSelf();
    }

    protected onEmptyAreaClick(): void {
        this.removeSelf();
    }
}
