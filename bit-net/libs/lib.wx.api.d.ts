/**
 * @Author: Gongxh
 * @Date: 2025-03-28
 * @Description: 
 */

declare namespace WechatMiniprogram {
    type IAnyObject = Record<string, any>

    interface ICommonCallBack {
        /**
         * 接口调用成功的回调函数
         */
        success?: () => void;

        /**
         * 接口调用失败的回调函数
         */
        fail?: () => void;

        /**
         * 接口调用结束的回调函数（调用成功、失败都会执行）
         */
        complete?: () => void;
    }

    interface GeneralCallbackResult {
        /** 错误信息 */
        errMsg: string
    }

    interface ConnectSocketOption extends ICommonCallBack {
        /** 开发者服务器 wss 接口地址 */
        url: string

        /** HTTP Header，Header 中不能设置 Referer */
        header?: IAnyObject

        /** 
         * 需要基础库: '1.4.0'
         * 子协议数组 
         */
        protocols?: string[]

        /** 
         * 需要基础库: '2.4.0'
         * 建立 TCP 连接的时候的 TCP_NODELAY 设置
         */
        tcpNoDelay?: boolean

        /** 
         * 需要基础库: '2.8.0'
         * 是否开启压缩扩展
         */
        perMessageDeflate?: boolean

        /** 
         * 需要基础库: '2.10.0'
         * 超时时间，单位为毫秒
         */
        timeout?: number

        /** 
         * 需要基础库: '2.29.0'
         * 强制使用蜂窝网络发送请求
         */
        forceCellularNetwork?: boolean
    }

    /** 
     * 需要基础库： `2.10.4`
     * 网络请求过程中一些调试信息 
     */
    interface SocketProfile {
        /** 组件准备好使用 SOCKET 建立请求的时间，这发生在检查本地缓存之前 */
        fetchStart: number;
        /** DNS 域名查询开始的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等 */
        domainLookupStart: number;
        /** DNS 域名查询完成的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等 */
        domainLookupEnd: number;
        /** 开始建立连接的时间，如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接开始的时间 */
        connectStart: number;
        /** 完成建立连接的时间（完成握手），如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接完成的时间。注意这里握手结束，包括安全连接建立完成、SOCKS 授权通过 */
        connectEnd: number;
        /** 单次连接的耗时，包括 connect ，tls */
        rtt: number;
        /** 握手耗时 */
        handshakeCost: number;
        /** 上层请求到返回的耗时 */
        cost: number;
    }

    interface SocketSendOption extends ICommonCallBack {
        /** 需要发送的消息 */
        data: string | ArrayBuffer;
    }
    interface SocketCloseOption extends ICommonCallBack {
        /** 
         * 1000（表示正常关闭连接）
         * 关闭代码
         */
        code?: number;
        /** 
         * 关闭原因
         * 这个字符串必须是不长于 123 字节的 UTF-8 文本
         */
        reason?: string;
    }

    interface SocketTask {
        /**
         * 发送消息
         * @param data 需要发送的消息
         */
        send(res: SocketSendOption): void

        /**
         * 关闭 WebSocket 连接
         * @param code 关闭代码
         * @param reason 关闭原因
         */
        close(res: SocketCloseOption): void

        /**
         * 监听 WebSocket 连接打开事件
         * @param listener 
         */
        onOpen(listener: (res: { header: IAnyObject, profile: SocketProfile }) => void): void

        /**
         * 监听 WebSocket 接收到消息事件
         * @param listener 
         * @param res.data 服务器返回的消息
         */
        onMessage(listener: (res: { data: string | ArrayBuffer }) => void): void

        /**
         * 监听 WebSocket 错误事件
         * @param listener 
         * @param res.errMsg 错误信息
         */
        onError(listener: (res: { errMsg: string }) => void): void

        /**
         * 监听 WebSocket 关闭事件
         * @param listener 
         * @param res.code 关闭代码
         * @param res.reason 关闭原因
         */
        onClose(listener: (res: { code: number, reason: string }) => void): void
    }

    interface Wx {
        connectSocket(option: ConnectSocketOption): SocketTask
    }

    /** 启动参数 */
    interface LaunchOptionsApp {
        /** 需要基础库： `2.20.0`
         *
         * API 类别
         *
         * 可选值：
         * - 'default': 默认类别;
         * - 'nativeFunctionalized': 原生功能化，视频号直播商品、商品橱窗等场景打开的小程序;
         * - 'browseOnly': 仅浏览，朋友圈快照页等场景打开的小程序;
         * - 'embedded': 内嵌，通过打开半屏小程序能力打开的小程序; */
        apiCategory:
        | 'default'
        | 'nativeFunctionalized'
        | 'browseOnly'
        | 'embedded'
        /** 打开的文件信息数组，只有从聊天素材场景打开（scene为1173）才会携带该参数 */
        forwardMaterials: ForwardMaterials[]
        /** 启动小程序的路径 (代码包路径) */
        path: string
        /** 启动小程序的 query 参数 */
        query: Record<string, string>
        /** 来源信息。从另一个小程序、公众号或 App 进入小程序时返回。否则返回 `{}`。(参见后文注意) */
        referrerInfo: ReferrerInfo
        /** 启动小程序的[场景值](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/scene.html) */
        scene: number
        /** 从微信群聊/单聊打开小程序时，chatType 表示具体微信群聊/单聊类型
         *
         * 可选值：
         * - 1: 微信联系人单聊;
         * - 2: 企业微信联系人单聊;
         * - 3: 普通微信群聊;
         * - 4: 企业微信互通群聊; */
        chatType?: 1 | 2 | 3 | 4
        /** shareTicket，详见[获取更多转发信息](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/share.html) */
        shareTicket?: string
    }

    /** 当前小程序运行的宿主环境 */
    interface AppBaseInfoHost {
        /** 宿主 app（第三方App） 对应的 appId （当小程序运行在第三方App环境时才返回） */
        appId: string
    }

    interface AppBaseInfo {
        /** 客户端基础库版本 */
        SDKVersion: string
        /** 是否已打开调试。可通过右上角菜单或 [wx.setEnableDebug](https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.setEnableDebug.html) 打开调试。 */
        enableDebug: boolean
        /** 当前小程序运行的宿主环境 */
        host: AppBaseInfoHost
        /** 微信设置的语言 */
        language: string
        /** 微信版本号 */
        version: string
        /** 系统当前主题，取值为`light`或`dark`，全局配置`"darkmode":true`时才能获取，否则为 undefined （不支持小游戏）
         *
         * 可选值：
         * - 'dark': 深色主题;
         * - 'light': 浅色主题; */
        theme?: 'dark' | 'light'
    }

    interface SafeArea {
        /** 安全区域右下角纵坐标 */
        bottom: number
        /** 安全区域的高度，单位逻辑像素 */
        height: number
        /** 安全区域左上角横坐标 */
        left: number
        /** 安全区域右下角横坐标 */
        right: number
        /** 安全区域左上角纵坐标 */
        top: number
        /** 安全区域的宽度，单位逻辑像素 */
        width: number
    }

    interface WindowInfo {
        /** 设备像素比 */
        pixelRatio: number
        /** 在竖屏正方向下的安全区域。部分机型没有安全区域概念，也不会返回 safeArea 字段，开发者需自行兼容。 */
        safeArea: SafeArea
        /** 屏幕高度，单位px */
        screenHeight: number
        /** 窗口上边缘的y值 */
        screenTop: number
        /** 屏幕宽度，单位px */
        screenWidth: number
        /** 状态栏的高度，单位px */
        statusBarHeight: number
        /** 可使用窗口高度，单位px */
        windowHeight: number
        /** 可使用窗口宽度，单位px */
        windowWidth: number
    }

    interface SystemInfo {
        /** 需要基础库： `1.1.0`
         *
         * 客户端基础库版本 */
        SDKVersion: string
        /** 需要基础库： `2.6.0`
         *
         * 允许微信使用相册的开关（仅 iOS 有效） */
        albumAuthorized: boolean
        /** 需要基础库： `1.8.0`
         *
         * 设备性能等级（仅 Android）。取值为：-2 或 0（该设备无法运行小游戏），-1（性能未知），>=1（设备性能值，该值越高，设备性能越好）<br> 注意：性能等级当前仅反馈真机机型，暂不支持 IDE 模拟器机型 */
        benchmarkLevel: number
        /** 需要基础库： `2.6.0`
         *
         * 蓝牙的系统开关 */
        bluetoothEnabled: boolean
        /** 需要基础库： `1.5.0`
         *
         * 设备品牌 */
        brand: string
        /** 需要基础库： `2.6.0`
         *
         * 允许微信使用摄像头的开关 */
        cameraAuthorized: boolean
        /** 设备方向
         *
         * 可选值：
         * - 'portrait': 竖屏;
         * - 'landscape': 横屏; */
        deviceOrientation: 'portrait' | 'landscape'
        /** 需要基础库： `2.15.0`
         *
         * 是否已打开调试。可通过右上角菜单或 [wx.setEnableDebug](https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.setEnableDebug.html) 打开调试。 */
        enableDebug: boolean
        /** 需要基础库： `1.5.0`
         *
         * 用户字体大小（单位px）。以微信客户端「我-设置-通用-字体大小」中的设置为准 */
        fontSizeSetting: number
        /** 需要基础库： `2.12.3`
         *
         * 当前小程序运行的宿主环境 */
        host: SystemInfoHost
        /** 微信设置的语言 */
        language: string
        /** 需要基础库： `2.6.0`
         *
         * 允许微信使用定位的开关 */
        locationAuthorized: boolean
        /** 需要基础库： `2.6.0`
         *
         * 地理位置的系统开关 */
        locationEnabled: boolean
        /** `true` 表示模糊定位，`false` 表示精确定位，仅 iOS 支持 */
        locationReducedAccuracy: boolean
        /** 需要基础库： `2.6.0`
         *
         * 允许微信使用麦克风的开关 */
        microphoneAuthorized: boolean
        /** 设备型号。新机型刚推出一段时间会显示unknown，微信会尽快进行适配。 */
        model: string
        /** 需要基础库： `2.6.0`
         *
         * 允许微信通知带有提醒的开关（仅 iOS 有效） */
        notificationAlertAuthorized: boolean
        /** 需要基础库： `2.6.0`
         *
         * 允许微信通知的开关 */
        notificationAuthorized: boolean
        /** 需要基础库： `2.6.0`
         *
         * 允许微信通知带有标记的开关（仅 iOS 有效） */
        notificationBadgeAuthorized: boolean
        /** 需要基础库： `2.6.0`
         *
         * 允许微信通知带有声音的开关（仅 iOS 有效） */
        notificationSoundAuthorized: boolean
        /** 需要基础库： `2.19.3`
         *
         * 允许微信使用日历的开关 */
        phoneCalendarAuthorized: boolean
        /** 设备像素比 */
        pixelRatio: number
        /** 客户端平台
         *
         * 可选值：
         * - 'ios': iOS微信（包含 iPhone、iPad）;
         * - 'android': Android微信;
         * - 'windows': Windows微信;
         * - 'mac': macOS微信;
         * - 'devtools': 微信开发者工具; */
        platform: 'ios' | 'android' | 'windows' | 'mac' | 'devtools'
        /** 需要基础库： `2.7.0`
         *
         * 在竖屏正方向下的安全区域。部分机型没有安全区域概念，也不会返回 safeArea 字段，开发者需自行兼容。 */
        safeArea: SafeArea
        /** 需要基础库： `1.1.0`
         *
         * 屏幕高度，单位px */
        screenHeight: number
        /** 需要基础库： `1.1.0`
         *
         * 屏幕宽度，单位px */
        screenWidth: number
        /** 需要基础库： `1.9.0`
         *
         * 状态栏的高度，单位px */
        statusBarHeight: number
        /** 操作系统及版本 */
        system: string
        /** 微信版本号 */
        version: string
        /** 需要基础库： `2.6.0`
         *
         * Wi-Fi 的系统开关 */
        wifiEnabled: boolean
        /** 可使用窗口高度，单位px */
        windowHeight: number
        /** 可使用窗口宽度，单位px */
        windowWidth: number
        /** 需要基础库： `2.11.0`
         *
         * 系统当前主题，取值为`light`或`dark`，全局配置`"darkmode":true`时才能获取，否则为 undefined （不支持小游戏）
         *
         * 可选值：
         * - 'dark': 深色主题;
         * - 'light': 浅色主题; */
        theme?: 'dark' | 'light'
    }

    interface DeviceInfo {
        /** 应用（微信APP）二进制接口类型（仅 Android 支持） */
        abi: string
        /** 设备性能等级（仅 Android 支持）。取值为：-2 或 0（该设备无法运行小游戏），-1（性能未知），>=1（设备性能值，该值越高，设备性能越好，目前最高不到50） */
        benchmarkLevel: number
        /** 设备品牌 */
        brand: string
        /** 需要基础库： `2.29.0`
         *
         * 设备 CPU 型号（仅 Android 支持）（Tips: GPU 型号可通过 WebGLRenderingContext.getExtension('WEBGL_debug_renderer_info') 来获取） */
        cpuType: string
        /** 需要基础库： `2.25.1`
         *
         * 设备二进制接口类型（仅 Android 支持） */
        deviceAbi: string
        /** 需要基础库： `2.30.0`
         *
         * 设备内存大小，单位为 MB */
        memorySize: string
        /** 设备型号。新机型刚推出一段时间会显示unknown，微信会尽快进行适配。 */
        model: string
        /** 客户端平台 */
        platform: string
        /** 操作系统及版本 */
        system: string
    }

    /** 小程序账号信息 */
    interface MiniProgram {
        /** 小程序 appId */
        appId: string
        /** 需要基础库： `2.10.0`
         *
         * 小程序版本
         *
         * 可选值：
         * - 'develop': 开发版;
         * - 'trial': 体验版;
         * - 'release': 正式版; */
        envVersion: 'develop' | 'trial' | 'release'
        /** 需要基础库： `2.10.2`
         *
         * 线上小程序版本号 */
        version: string
    }

    /** 插件账号信息（仅在插件中调用时包含这一项） */
    interface Plugin {
        /** 插件 appId */
        appId: string
        /** 插件版本号 */
        version: string
    }

    /** 账号信息 */
    interface AccountInfo {
        /** 小程序账号信息 */
        miniProgram: MiniProgram
        /** 插件账号信息（仅在插件中调用时包含这一项） */
        plugin: Plugin
    }

    interface MidasPaymentOption {
        /** 支付的类型，不同的支付类型有各自额外要传的附加参数 */
        mode: "game",
        /** 是否为沙盒环境 0: 正式环境 1: 沙盒环境 */
        env?: 0 | 1,
        /** 商户号 在米大师侧申请的应用id */
        offerId: string,
        /** 货币类型 */
        currencyType: "CNY",
        /** 申请接入时的平台，platform 与应用id有关 */
        platform?: "android" | "windows",
        /** 购买数量。mode=game 时必填。购买数量 */
        buyQuantity: number,
        /** 分区ID 默认1 */
        zoneId?: string,
        /** 
         * 业务订单号，每个订单号只能使用一次，重复使用会失败。开发者需要确保该订单号在对应游戏下的唯一性，平台会尽可能校验该唯一性约束，但极端情况下可能会跳过对该约束的校验。要求32个字符内，只能是数字、大小写字母、符号_-|*组成，不能以下划线（)开头。建议每次调用wx.requestMidasPayment都换新的outTradeNo。若没有传入，则平台会自动填充一个，并以下划线开头
         */
        outTradeNo: string,
        /** 接口调用成功的回调函数 */
        success?: (res: { errMsg: string }) => void,
        /** 接口调用失败的回调函数 */
        fail?: (res: { errCode: number, errMsg: string, errno: number }) => void,
        /** 接口调用结束的回调函数（调用成功、失败都会执行） */
        complete?: () => void;
    }

    interface RewardedVideoAdOnCloseListenerResult {
        /** 需要基础库： `2.1.0`
         *
         * 视频是否是在用户完整观看的情况下被关闭的 */
        isEnded: boolean
    }
    interface RewardedVideoAdOnErrorListenerResult {
        /** 需要基础库： `2.2.2`
         *
         * 错误码
         *
         * 可选值：
         * - 1000: 后端接口调用失败;
         * - 1001: 参数错误;
         * - 1002: 广告单元无效;
         * - 1003: 内部错误;
         * - 1004: 无合适的广告;
         * - 1005: 广告组件审核中;
         * - 1006: 广告组件被驳回;
         * - 1007: 广告组件被封禁;
         * - 1008: 广告单元已关闭; */
        errCode: 1000 | 1001 | 1002 | 1003 | 1004 | 1005 | 1006 | 1007 | 1008
        /** 错误信息 */
        errMsg: string
    }

    /** onClose 传入的监听函数。不传此参数则移除所有监听函数。 */
    type RewardedVideoAdOffCloseCallback = (
        result: RewardedVideoAdOnCloseListenerResult
    ) => void
    /** onError 传入的监听函数。不传此参数则移除所有监听函数。 */
    type RewardedVideoAdOffErrorCallback = (
        result: RewardedVideoAdOnErrorListenerResult
    ) => void
    /** 用户点击 `关闭广告` 按钮的事件的监听函数 */
    type RewardedVideoAdOnCloseCallback = (
        result: RewardedVideoAdOnCloseListenerResult
    ) => void
    /** 激励视频错误事件的监听函数 */
    type RewardedVideoAdOnErrorCallback = (
        result: RewardedVideoAdOnErrorListenerResult
    ) => void
    /** onLoad 传入的监听函数。不传此参数则移除所有监听函数。 */
    type OffLoadCallback = (res: GeneralCallbackResult) => void
    type OnLoadCallback = (res: GeneralCallbackResult) => void

    interface RewardedVideoAd {
        /** 
         * [Promise RewardedVideoAd.load()](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.load.html)
         * 在插件中使用：不支持
         * 加载激励视频广告。 */
        load(): Promise<any>
        /** 
         * [Promise RewardedVideoAd.show()](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.show.html)
         * 在插件中使用：不支持
         * 显示激励视频广告。激励视频广告将从屏幕下方推入。 */
        show(): Promise<any>
        /** 
         * [RewardedVideoAd.destroy()](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.destroy.html)
         * 需要基础库： `2.8.0`
         * 在插件中使用：不支持
         * 销毁激励视频广告实例。 */
        destroy(): void
        /** 
         * [RewardedVideoAd.offClose(function listener)](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.offClose.html)
         * 在插件中使用：不支持
         * 移除用户点击 `关闭广告` 按钮的事件的监听函数
         *
         * **示例代码**
         *
         * ```js
         * const listener = function (res) { console.log(res) }
         *
         * RewardedVideoAd.onClose(listener)
         * RewardedVideoAd.offClose(listener) // 需传入与监听时同一个的函数对象
         * ``` 
         */
        offClose(
            /** onClose 传入的监听函数。不传此参数则移除所有监听函数。 */
            listener?: RewardedVideoAdOffCloseCallback
        ): void
        /** 
         * [RewardedVideoAd.offError(function listener)](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.offError.html)
         * 在插件中使用：不支持
         * 移除激励视频错误事件的监听函数
         *
         * **示例代码**
         *
         * ```js
         * const listener = function (res) { console.log(res) }
         *
         * RewardedVideoAd.onError(listener)
         * RewardedVideoAd.offError(listener) // 需传入与监听时同一个的函数对象
         * ``` 
         */
        offError(
            /** onError 传入的监听函数。不传此参数则移除所有监听函数。 */
            listener?: RewardedVideoAdOffErrorCallback
        ): void
        /** 
         * [RewardedVideoAd.offLoad(function listener)](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.offLoad.html)
         * 在插件中使用：不支持
         * 移除激励视频广告加载事件的监听函数
         * **示例代码**
         * ```js
         * const listener = function (res) { console.log(res) }
         *
         * RewardedVideoAd.onLoad(listener)
         * RewardedVideoAd.offLoad(listener) // 需传入与监听时同一个的函数对象
         * ``` 
         */
        offLoad(
            /** onLoad 传入的监听函数。不传此参数则移除所有监听函数。 */
            listener?: OffLoadCallback
        ): void
        /** 
         * [RewardedVideoAd.onClose(function listener)](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.onClose.html)
         * 在插件中使用：不支持
         * 监听用户点击 `关闭广告` 按钮的事件。 */
        onClose(
            /** 用户点击 `关闭广告` 按钮的事件的监听函数 */
            listener: RewardedVideoAdOnCloseCallback
        ): void
        /** 
         * [RewardedVideoAd.onError(function listener)](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.onError.html)
         * 在插件中使用：不支持
         * 监听激励视频错误事件。
         *
         * **错误码信息与解决方案表**
         *
         *  错误码是通过onError获取到的错误信息。调试期间，可以通过异常返回来捕获信息。
         *  在小程序发布上线之后，如果遇到异常问题，可以在[“运维中心“](https://mp.weixin.qq.com/)里面搜寻错误日志，还可以针对异常返回加上适当的监控信息。
         *
         * | 代码 | 异常情况 | 理由 | 解决方案 |
         * | ------ | -------------- | --------------- | -------------------------- |
         * | 1000  | 后端错误调用失败  | 该项错误不是开发者的异常情况 | 一般情况下忽略一段时间即可恢复。 |
         * | 1001  | 参数错误    | 使用方法错误 | 可以前往developers.weixin.qq.com确认具体教程（小程序和小游戏分别有各自的教程，可以在顶部选项中，“设计”一栏的右侧进行切换。|
         * | 1002  | 广告单元无效    | 可能是拼写错误、或者误用了其他APP的广告ID | 请重新前往mp.weixin.qq.com确认广告位ID。 |
         * | 1003  | 内部错误    | 该项错误不是开发者的异常情况 | 一般情况下忽略一段时间即可恢复。|
         * | 1004  | 无适合的广告   | 广告不是每一次都会出现，这次没有出现可能是由于该用户不适合浏览广告 | 属于正常情况，且开发者需要针对这种情况做形态上的兼容。 |
         * | 1005  | 广告组件审核中  | 你的广告正在被审核，无法展现广告 | 请前往mp.weixin.qq.com确认审核状态，且开发者需要针对这种情况做形态上的兼容。|
         * | 1006  | 广告组件被驳回  | 你的广告审核失败，无法展现广告 | 请前往mp.weixin.qq.com确认审核状态，且开发者需要针对这种情况做形态上的兼容。|
         * | 1007  | 广告组件被封禁  | 你的广告能力已经被封禁，封禁期间无法展现广告 | 请前往mp.weixin.qq.com确认小程序广告封禁状态。 |
         * | 1008  | 广告单元已关闭  | 该广告位的广告能力已经被关闭 | 请前往mp.weixin.qq.com重新打开对应广告位的展现。| */
        onError(
            /** 激励视频错误事件的监听函数 */
            listener: RewardedVideoAdOnErrorCallback
        ): void
        /** 
         * [RewardedVideoAd.onLoad(function listener)](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.onLoad.html)
         * 在插件中使用：不支持
         * 监听激励视频广告加载事件。 */
        onLoad(
            /** 激励视频广告加载事件的监听函数 */
            listener: OnLoadCallback
        ): void
    }

    interface CreateRewardedVideoAdOption {
        /** 广告单元 id */
        adUnitId: string
        /** 
         * 需要基础库： `2.8.0`
         * 是否启用多例模式，默认为false 
         */
        multiton?: boolean
    }

    interface Wx {
        getLaunchOptionsSync(): LaunchOptionsApp;
        getEnterOptionsSync(): LaunchOptionsApp;
        getWindowInfo(): WindowInfo;
        getAppBaseInfo(): AppBaseInfo;
        getSystemInfoSync(): SystemInfo;
        getDeviceInfo(): DeviceInfo;
        getAccountInfoSync(): AccountInfo;
        exitMiniProgram(): void;
        setClipboardData(res: { data: string, fail: (res: GeneralCallbackResult) => void }): void;
        requestMidasPayment(res: MidasPaymentOption): void;
        /** 
         * [[RewardedVideoAd](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.html) wx.createRewardedVideoAd(Object object)](https://developers.weixin.qq.com/miniprogram/dev/api/ad/wx.createRewardedVideoAd.html)
         * 需要基础库： `2.0.4`
         * 在插件中使用：需要基础库 `2.8.1`
         *
         * 创建激励视频广告组件。请通过 [wx.getSystemInfoSync()](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemInfoSync.html) 返回对象的 SDKVersion 判断基础库版本号后再使用该 API（小游戏端要求 >= 2.0.4， 小程序端要求 >= 2.6.0）。调用该方法创建的激励视频广告是一个单例（小游戏端是全局单例，小程序端是页面内单例，在小程序端的单例对象不允许跨页面使用）。 
         */
        createRewardedVideoAd(option: CreateRewardedVideoAdOption): RewardedVideoAd
    }
}
declare const wx: WechatMiniprogram.Wx