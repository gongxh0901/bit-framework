/**
 * @Author: Gongxh
 * @Date: 2025-12-29
 * @Description: 
 */

import { UI } from "../../header";
import { WindowHeader1 } from "../Basics/WindowHeader1";
import { WindowHeader2 } from "../Basics/WindowHeader2";
const { uiclass, uiclick } = UI._uidecorator;

@uiclass("Window", "Window", "NormalWindow1")
export class NormalWindow1 extends UI.Window {

    private _duration: number = 0;
    private _changed: boolean = false;
    protected onInit(): void {
        this.adapterType = UI.AdapterType.Bang;
        this.type = UI.WindowType.Normal;
    }

    protected onShow(userdata: { name: string }): void {

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

    getHeaderInfo<U>(): UI.HeaderInfo<U> {
        if (this._duration > 5) {
            return UI.HeaderInfo.create(WindowHeader2, { title: "header2" });
        }
        return UI.HeaderInfo.create(WindowHeader1, { title: "header1" });
    }

    onUpdate(dt: number): void {
        if (this._changed) {
            return;
        }
        this._duration += dt;
        if (this._duration > 5) {
            this._changed = true;
            this.refreshHeader();
        }
    }
}
