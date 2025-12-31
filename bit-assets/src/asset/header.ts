/**
 * @Author: Gongxh
 * @Date: 2025-10-21
 * @Description: 
 */

import { Asset } from "cc";

export interface IAssetConfig {
    /** bundle名下的资源路径 必填 */
    path: string;
    /** 资源类型 默认 Asset */
    type?: typeof Asset;
    /** 是否是单个文件 默认是文件夹 */
    isFile?: boolean;
    /** bundle名 默认 resources */
    bundle?: string;
}

/** 资源加载的状态类型 */
export enum StateType {
    Error,
    Wait,
    Loading,
    Finish,
}

export enum ErrorCode {
    /** 文件加载失败 */
    FileLoadFailed = 1,
    /** 资源包加载失败 */
    BundleLoadFailed = 2,
}