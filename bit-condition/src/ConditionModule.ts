/**
 * @Author: Gongxh
 * @Date: 2025-02-14
 * @Description: 条件显示模块
 */
import { debug, InnerTimer, Module } from "@gongxh/bit-core";
import { _decorator } from "cc";
import { ConditionManager } from "./ConditionManager";

const { ccclass, menu, property } = _decorator;

@ccclass("ConditionModule")
@menu("kunpo/condition/ConditionModule")
export class ConditionModule extends Module {
    @property({
        displayName: "更新间隔（秒）",
        min: 0.1,
        step: 0.1,
    })
    updateDeltaTime: number = 0.3;

    /** 模块名称 */
    public moduleName: string = "条件显示模块";

    /** 计时器 @internal */
    private _timer: number = 0;
    public init(): void {
        this.onInit();

        this._timer = InnerTimer.startTimer(() => {
            ConditionManager._update();
        }, this.updateDeltaTime, -1);
    }

    /** 模块初始化完成后调用的函数 */
    protected onInit(): void {
        debug("ConditionModule init complete");
    }

    public onDestroy(): void {
        InnerTimer.stopTimer(this._timer);
    }
}