import { Debug } from './Debug';
import { ccc, Core, fgui, UI } from './header';
import { HomeWindow } from './UI/HomeWindow';
const { ccclass, property, menu } = ccc._decorator;
@ccclass("GameEntry")
@menu("bit/GameEntry")
export class GameEntry extends Core.CocosEntry {
    @property(ccc.Node)
    private root: ccc.Node = null;
    onInit(): void {
        let deviceId = ccc.sys.localStorage.getItem('xBBres') as string;
        if (!deviceId || deviceId === "") {
            deviceId = "browser@" + Date.now().toString();
            ccc.sys.localStorage.setItem('xBBres', deviceId);
        }
        Core.Platform.deviceId = deviceId;
        Debug.Register();
        fgui.UIPackage.loadPackage("ui/manual/Basics", () => {
            this.intoGame();
        });
    }

    private intoGame(): void {
        UI.WindowManager.showWindow(HomeWindow, "这是一个测试窗口").then(() => {
            Core.log("窗口显示成功");
            this.root.active = false;
        }).catch((err: Error) => {
            Core.log("窗口显示失败", err.message);
        });
    }
}