/**
 * @Author: Gongxh
 * @Date: 2025-12-29
 * @Description: 
 */

import { DEBUG } from "cc/env";
import { ccc, UI } from "./header";
import { HomeWindow } from "./UI/HomeWindow";
import { CloseAllWindow } from "./UI/Window/CloseAllWindow";
import { CloseOneWindow } from "./UI/Window/CloseOneWindow";
import { HideAllWindow } from "./UI/Window/HideAllWindow";
import { HideOneWindow } from "./UI/Window/HideOneWindow";
import { NormalWindow1 } from "./UI/Window/NormalWindow1";
import { NormalWindow2 } from "./UI/Window/NormalWindow2";

export class Debug {
    public static Register(): void {
        if (DEBUG) {
            this._registerSystemEvent();
        }
    }
    private static _registerSystemEvent(): void {
        ccc.input.on(ccc.Input.EventType.KEY_DOWN, (event: ccc.EventKeyboard) => {
            if (event.keyCode == ccc.KeyCode.NUM_1) {
                UI.WindowManager.showWindow(NormalWindow1)
            } else if (event.keyCode == ccc.KeyCode.NUM_2) {
                UI.WindowManager.showWindow(NormalWindow2);
            } else if (event.keyCode == ccc.KeyCode.NUM_3) {
                UI.WindowManager.showWindow(HideOneWindow);
            } else if (event.keyCode == ccc.KeyCode.NUM_4) {
                UI.WindowManager.showWindow(HideAllWindow);
            } else if (event.keyCode == ccc.KeyCode.NUM_5) {
                UI.WindowManager.showWindow(CloseOneWindow);
            } else if (event.keyCode == ccc.KeyCode.NUM_6) {
                UI.WindowManager.showWindow(CloseAllWindow);
            } else if (event.keyCode == ccc.KeyCode.NUM_7) {

            } else if (event.keyCode == ccc.KeyCode.NUM_8) {

            } else if (event.keyCode == ccc.KeyCode.NUM_9) {

            } else if (event.keyCode == ccc.KeyCode.NUM_0) {
                UI.WindowManager.showWindow(HomeWindow);
            } else if (event.keyCode == ccc.KeyCode.KEY_F) {

            } else if (event.keyCode == ccc.KeyCode.KEY_G) {

            } else if (event.keyCode == ccc.KeyCode.KEY_H) {

            } else if (event.keyCode == ccc.KeyCode.KEY_J) {

            }
        });
    }
}

