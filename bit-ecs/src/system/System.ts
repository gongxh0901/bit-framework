/**
 * @Author: Gongxh
 * @Date: 2025-05-15
 * @Description: 系统基类
 */

import { _ecsdecorator } from "../ECSDecorator";
import { IQueryResult } from "../query/IQuery";
import { Matcher } from "../query/Matcher";
import { World } from "../World";
import { ISystem } from "./ISystem";

export abstract class System implements ISystem {
    /** 世界 */
    public world: World;

    /** 是否启用 @internal */
    private _enabled: boolean = true;


    /** 查询器结果 */
    public query: IQueryResult;

    /** 匹配器 @internal */
    private _matcher: Matcher;

    /** 系统名称 */
    public get name(): string {
        return _ecsdecorator.getSystemName(this.constructor);
    }

    /**
     * 创建匹配器规则
     * 最后必须调用 build() 方法
     */
    protected get matcher(): Matcher {
        this._matcher = this._matcher || this.world.matcher;
        return this._matcher;
    }

    /**
     * 系统初始化
     * @internal
     */
    public _initialize(): void {
        this.onInit()
        this.query = this.matcher.build();
    }

    /**
     * 系统初始化
     * 在这里写匹配器规则
     */
    protected abstract onInit(): void;

    /**
     * 系统更新
     * @param {number} dt 时间间隔
     */
    public abstract update(dt: number): void;

    /**
     * 设置系统启用/禁用
     */
    public setEnabled(enabled: boolean): void {
        this._enabled = enabled;
    }

    /**
     * 获取系统启用/禁用
     */
    public isEnabled(): boolean {
        return this._enabled;
    }

    /**
     * 清除系统
     */
    public clear(): void {
        this._enabled = true;
    }
}