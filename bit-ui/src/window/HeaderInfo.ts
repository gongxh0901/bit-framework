/**
 * @Author: Gongxh
 * @Date: 2025-01-10
 * @Description: 窗口顶部资源栏信息
 */

import { MetadataKey } from "../header";
import { IHeader } from "../interface/IHeader";

export class HeaderInfo<T> {
    /** header名字 */
    name: string;
    /** 自定义数据 用于Header窗口 onShow方法的自定义参数 @internal */
    userdata: T;

    /**
     * 创建 WindowHeaderInfo
     * @param {string} name header窗口名
     * @param {*} [userdata] 自定义数据
     * @returns {HeaderInfo}
     */
    static create<T extends new () => IHeader, U>(ctor: T, userdata?: U): HeaderInfo<U> {
        // 优先使用装饰器设置的静态属性，避免代码混淆后 constructor.name 变化
        const name = (ctor as any)[MetadataKey.originalName];
        if (!name) {
            throw new Error(`header【${ctor.name}】未注册，请使用 _uidecorator.uiheader 注册header`);
        }
        const info = new HeaderInfo<U>();
        info.name = name;
        info.userdata = userdata;
        return info;
    }
}