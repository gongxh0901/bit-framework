/**
 * @Author: Gongxh
 * @Date: 2025-12-30
 * @Description: 
 */
import { UI } from "../../header";
const { uiclass, uiclick } = UI._uidecorator;

@uiclass("Window", "Window", "CloseOneWindow")
export class CloseOneWindow extends UI.Window {
    protected onInit(): void {
        this.adapterType = UI.AdapterType.Bang;
        this.type = UI.WindowType.CloseOne;
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
}
