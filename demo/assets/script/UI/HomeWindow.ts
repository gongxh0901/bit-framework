/**
 * @Author: Gongxh
 * @Date: 2024-12-11
 * @Description: 
 */

import { Core, fgui, UI } from "../header";
import { UIBaseWindow } from "./Window/UIBaseWindow";
const { uiclass, uiprop, uiclick, uicontrol, uitransition } = UI._uidecorator;

@uiclass("Window", "Home", "HomeWindow")
export class HomeWindow extends UI.Window {
    @uicontrol private status: fgui.Controller;
    @uicontrol private sta2: fgui.Controller;

    @uicontrol private bookCtrl: fgui.Controller;
    @uicontrol private doneCtrl: fgui.Controller;
    @uicontrol private resultCtrl: fgui.Controller;


    @uitransition private t0: fgui.Transition;
    @uitransition private t1: fgui.Transition;

    protected onInit(): void {
        this.adapterType = UI.AdapterType.Bang;
        this.type = UI.WindowType.CloseAll;
    }

    protected onShow(userdata?: any): void {
        Core.log("HomeWindow onShow:", userdata);
        // console.log("this.status", this.status);
        // console.log("this.sta2", this.sta2);
        // console.log("this.bookCtrl", this.bookCtrl);
        // console.log("this.doneCtrl", this.doneCtrl);
        // console.log("this.resultCtrl", this.resultCtrl);
    }

    protected onClose(): void {
        Core.log("HomeWindow onClose");
    }

    @uiclick
    private onClickUI(): void {
        UI.WindowManager.showWindow(UIBaseWindow);
    }

    @uiclick
    private onSocketWindow(): void {
        Core.log("222");
    }

    @uiclick
    private onClickBtnCondition(): void {
        Core.log("333");
    }


    @uiclick
    private onClickMiniGame(): void {
        Core.log("444");
    }

    @uiclick
    private onClickBtnHotUpdate(): void {
        Core.log("555");
    }

    @uiclick
    private onClickData(): void {
        Core.log("666");
    }
}
