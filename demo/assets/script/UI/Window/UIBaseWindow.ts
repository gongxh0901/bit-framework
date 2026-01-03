/**
 * @Author: Gongxh
 * @Date: 2025-12-27
 * @Description: 
 */
import { Core, fgui, UI } from "../../header";
import { HideAllWindow } from "./HideAllWindow";
import { HideOneWindow } from "./HideOneWindow";
import { NormalWindow1 } from "./NormalWindow1";
import { NormalWindow2 } from "./NormalWindow2";
const { uiclass, uiprop, uiclick, uicontrol, uitransition } = UI._uidecorator;

@uiclass("Window", "Window", "UIBaseWindow")
export class UIBaseWindow extends UI.Window {
    @uiprop private btn_closeOne: fgui.GButton;  // 关闭前一个
    @uiprop private btn_closeAll: fgui.GButton;  // 关闭所有

    protected onInit(): void {
        this.adapterType = UI.AdapterType.Bang;
        this.type = UI.WindowType.HideAll;
    }

    protected onShow(userdata?: any): void {
        Core.log("UIBaseWindow onShow:", userdata);

    }

    protected onClose(): void {
        Core.log("UIBaseWindow onClose");
    }


    /** 关闭自己 */
    @uiclick
    private onCloseSelf(): void {
        this.removeSelf();
    }

    /** 打开关闭前一个窗口的窗口 */
    @uiclick
    private onCloseOne(): void {
        Core.log("onCloseOne");
        // UI.WindowManager.closeWindow(UIBaseWindow);
    }

    /** 打开关闭所有窗口的窗口 */
    @uiclick
    private onCloseAll(): void {
        Core.log("onCloseAll");
        // UI.WindowManager.closeWindow(UIBaseWindow);
    }

    @uiclick
    private onNormalWindow1(): void {
        UI.WindowManager.showWindow(NormalWindow1);
    }

    @uiclick
    private onNormalWindow2(): void {
        UI.WindowManager.showWindow(NormalWindow2);
    }

    @uiclick
    private onHideOneWindow(): void {
        UI.WindowManager.showWindow(HideOneWindow);
    }

    @uiclick
    private onHideAllWindow(): void {
        UI.WindowManager.showWindow(HideAllWindow);
    }
}
