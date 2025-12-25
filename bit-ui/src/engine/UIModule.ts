/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: cocos UI模块
 */
import { _decorator, JsonAsset } from "cc";

import { Adapter, debug, Module, Screen } from "@gongxh/bit-core";
import { GGraph, GRoot } from "fairygui-cc";
import { IPropsConfig, PropsHelper } from "../utils/PropsHelper";
import { WindowManager } from "../WindowManager";
import { CocosWindowContainer } from "./CocosWindowContainer";

const { ccclass, menu, property } = _decorator;

@ccclass("UIModule")
@menu("bit/UIModule")
export class UIModule extends Module {
    @property({ type: JsonAsset, displayName: "配置文件", tooltip: "编辑器:https://store.cocos.com/app/detail/7213 导出的配置文件" }) ui_config: JsonAsset = null;

    @property({ displayName: "底部遮罩透明度", tooltip: "半透明遮罩的默认透明度", min: 0, max: 1, step: 0.01 }) bgAlpha: number = 0.75;

    /** 模块名称 */
    public moduleName: string = "UI模块";

    public onInit(): void {
        this.ui_config && PropsHelper.setConfig(this.ui_config.json as IPropsConfig);

        // 设置底部遮罩的默认透明度
        WindowManager.bgAlpha = this.bgAlpha;

        /** 初始化窗口管理系统 */
        GRoot.create();
        debug("初始化 WindowContainers");

        const alphaGraph = new GGraph();
        alphaGraph.touchable = false;
        alphaGraph.name = "bgAlpha";
        alphaGraph.setPosition(Screen.ScreenWidth * 0.5, Screen.ScreenHeight * 0.5);
        alphaGraph.setSize(Screen.ScreenWidth, Screen.ScreenHeight, true);
        alphaGraph.setPivot(0.5, 0.5, true);
        alphaGraph.visible = false;
        GRoot.inst.addChild(alphaGraph);
        WindowManager.setAlphaGraph(alphaGraph);

        for (const container of this.getComponentsInChildren(CocosWindowContainer)) {
            container.init();
        }
        this.node.destroyAllChildren();
        Adapter.instance.addResizeListener(this.onScreenResize.bind(this));
    }

    /**
     * 屏幕大小改变时被调用
     * @internal
     */
    private onScreenResize(...args: any[]): void {
        WindowManager.onScreenResize();
    }
}