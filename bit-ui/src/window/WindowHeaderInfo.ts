/**
 * @Author: Gongxh
 * @Date: 2025-01-10
 * @Description: 窗口顶部资源栏信息
 */

export class WindowHeaderInfo {
    /** header名字 */
    name: string;
    /** 自定义数据 用于Header窗口 onShow方法的自定义参数 @internal */
    userdata: any;

    /**
     * 创建 WindowHeaderInfo
     * @param {string} name header窗口名
     * @param {*} [userdata] 自定义数据
     * @returns {WindowHeaderInfo}
     */
    static create(name: string, userdata?: any): WindowHeaderInfo {
        const info = new WindowHeaderInfo();
        info.name = name;
        info.userdata = userdata;
        return info;
    }
}