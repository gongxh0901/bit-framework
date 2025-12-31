/**
 * @Author: Gongxh
 * @Date: 2025-05-15
 * @Description: 系统组 - 可包含多个子系统的容器系统
 */

import { World } from "../World";
import { ISystem } from "./ISystem";

export class SystemGroup implements ISystem {
    /** @internal */
    private _name: string = "";

    /** 
     * 世界引用
     */
    public world: World;
    /** 
     * 是否启用
     * @internal
     */
    protected enabled: boolean = true;

    /**
     * 系统名称
     */
    public get name(): string {
        return this._name;
    }

    /** 
     * 子系统列表
     * @internal
     */
    protected systems: ISystem[] = [];

    /**
     * 帧间隔
     * @param frameInterval 帧间隔
     */
    private frameInterval: number = 1;

    /**
     * 帧计数
     * @internal
     */
    private frameCount: number = 0;
    /**
     * 帧计时
     * @internal
     */
    private frameTime: number = 0;

    /**
     * 系统组实例化
     * @param name 系统组名称
     * @param frameInterval 帧间隔 (1=每帧, 2=隔帧, 3=每3帧一次...)
     */
    constructor(name: string, frameInterval: number = 1) {
        this._name = name;
        // 帧间隔最小为1
        this.frameInterval = Math.max(1, frameInterval);
        // 帧计数
        this.frameCount = 0;
        // 帧计时
        this.frameTime = 0;
    }

    /** 初始化所有子系统 @internal */
    public _initialize(): void {
        let len = this.systems.length;
        for (let i = 0; i < len; i++) {
            let system = this.systems[i];
            system.world = this.world;
            system._initialize();
        }
    }

    /**
     * 添加子系统或子系统组
     * @param system 子系统或子系统组
     * @returns 系统组
     */
    public addSystem(system: ISystem): this {
        this.systems.push(system);
        return this;
    }

    /**
     * 更新所有启用的子系统
     * @param dt 时间间隔
     */
    public update(dt: number): void {
        if (!this.enabled) {
            return;
        }
        this.frameTime += dt;
        if (this.frameCount % this.frameInterval === 0) {
            let len = this.systems.length;
            for (let i = 0; i < len; i++) {
                this.systems[i].update(this.frameTime);
            }
            this.frameTime = 0;
            this.frameCount = 1;
        } else {
            this.frameCount++;
        }
    }

    /**
     * 启用/禁用系统组
     * @param enabled 是否启用
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * 系统是否启用
     * @returns 是否启用
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * 根据名称查找子系统
     * @param name 系统名称
     * @returns 子系统
     */
    public getSystem(name: string): ISystem {
        return this.systems.find(subSystem => {
            if (subSystem instanceof SystemGroup) {
                return subSystem.getSystem(name);
            }
            return subSystem.name === name;
        });
    }

    /**
     * 清除所有子系统
     */
    public clear(): void {
        // 帧计数
        this.frameCount = 0;
        // 帧计时
        this.frameTime = 0;
        // 启用/禁用
        this.enabled = true;
    }
}