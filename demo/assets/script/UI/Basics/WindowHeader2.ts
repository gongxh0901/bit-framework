/**
 * @Author: Gongxh
 * @Date: 2025-12-29
 * @Description: 
 */

import { UI } from "../../header";
const { uiheader, uiclick } = UI._uidecorator;

@uiheader("Basics", "WindowHeader2")
export class WindowHeader2 extends UI.Header<{ title: string }> {
    protected onInit(): void {
        this.adapterType = UI.AdapterType.Bang;
    }

    protected onShow(userdata?: { title: string }): void {

    }
}
