/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description:cocos游戏入口 定义了游戏启动时的基本配置和初始化流程。
 */

import { _decorator, Component, director, game } from "cc";
import { enableDebugMode } from "../header";
import { debug } from "../log";
import { CocosAdapter } from "./CocosAdapter";
import { Module } from "./Module";
import { PlatformInitializer } from "./Platform";
const { property } = _decorator;

export abstract class CocosEntry extends Component {
    @property({ displayName: "游戏帧率" }) fps: number = 60;
    @property({ displayName: "开启调试输出" }) enableDebug: boolean = false;

    /**
     * 虚函数，子类需要实现
     * kunpo库初始化完成后调用
     */
    public abstract onInit(): void;

    /**
     * 开始初始化kunpo框架
     * @internal
     */
    protected start(): void {
        // 是否开启调试输出
        this.enableDebug && enableDebugMode(true);

        debug("====================开始初始化=====================");

        // 设置游戏真帧率
        game.frameRate = this.fps;
        director.addPersistRootNode(this.node);
        this.node.setSiblingIndex(this.node.children.length - 1);

        // 平台信息初始化
        new PlatformInitializer();
        // 适配器
        new CocosAdapter().init();

        this.initModule();
        debug("=====================初始化完成=====================");
        this.onInit();
    }

    /**
     * 初始化模块
     * @internal
     */
    private initModule(): void {
        const modules = this.getComponentsInChildren(Module);
        for (const module of modules) {
            module.init();
        }
    }
}