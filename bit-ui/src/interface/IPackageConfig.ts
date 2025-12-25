/**
 * @Author: Gongxh
 * @Date: 2025-02-25
 * @Description: 包配置格式
 */

interface IPackageConfig {
    /** UI所在resources中的路径 */
    uiPath: string;

    /** 如果UI不在 resources 中，则需要配置 所在bundle下的路径名*/
    bundlePaths?: { [bundleName: string]: string };

    /** 
     * 手动管理资源的包
     * 1. 用于基础UI包, 提供一些最基础的组件，所有其他包都可能引用其中的内容
     * 2. 资源header所在的包
     * 3. 用于一些特殊场景, 比如需要和其他资源一起加载, 并且显示进度条的包
     */
    manualPackages: string[];
    /** 
     * 不推荐配置 只是提供一种特殊需求的实现方式
     * 窗口引用到其他包中的资源 需要的配置信息
     */
    linkPackages: { [windowName: string]: string[] };

    /**
     * 关闭界面后，需要立即释放资源的包名（建议尽量少）
     * 一般不建议包进行频繁装载卸载，因为每次装载卸载必然是要消耗CPU时间（意味着耗电）和产生大量GC的。UI系统占用的内存是可以精确估算的，你可以按照包的使用频率设定哪些包是需要立即释放的。
     * 不包括手动管理的包 
     */
    imReleasePackages: string[];
}

export interface IPackageConfigRes {
    /** 配置信息 */
    config: IPackageConfig;
    /** 显示加载等待窗 */
    showWaitWindow: () => void;
    /** 隐藏加载等待窗 */
    hideWaitWindow: () => void;
    /** 打开窗口时UI包加载失败 */
    fail: (windowName: string, errmsg: string, pkgs: string[]) => void;
}