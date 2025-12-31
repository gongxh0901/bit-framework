/**
 * @Author: Gongxh
 * @Date: 2025-05-15
 * @Description: 系统接口 - 所有系统和系统组都实现此接口
 */

import { ComponentType } from "../component/ComponentType";
import { IComponent } from "../component/IComponent";
import { World } from "../World";

export interface ISystem {
    /** 系统名称 */
    name: string;

    /** 世界 */
    world: World;

    /** 系统初始化 内部方法 @internal */
    _initialize(): void;

    /** 系统更新 */
    update(dt: number): void;

    /** 设置系统启用/禁用 */
    setEnabled(enabled: boolean): void;

    /** 获取系统启用/禁用 */
    isEnabled(): boolean;

    /** 获取系统查询器 */
    clear(): void;
}

/** 系统查询器数据 */
export interface IQueryData {
    /** 必须包含的组件 */
    includes?: ComponentType<IComponent>[];
    /** 必须排除的组件 */
    excludes?: ComponentType<IComponent>[];
    /** 可选包含的组件 */
    optionals?: ComponentType<IComponent>[];
}