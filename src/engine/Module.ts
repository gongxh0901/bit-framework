/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: cocos UI模块
 */
import { Component } from "cc";

export abstract class Module extends Component {
    /** 
     * 模块名称
     * @type {string}
     */
    public readonly moduleName: string;

    /** 
     * 模块初始化 (内部使用)
     * @internal
     */
    public init(): void {
        this.onInit();
    }

    /** 
     * 虚函数，子类需要实现
     * 模块初始化完成后调用的函数
     * @abstract
     */
    protected abstract onInit(): void;
}