/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 字节跳动 API 类型定义
 */

declare namespace BytedanceMiniprogram {
    type IAnyObject = Record<string, any>

    type GeneralSuccessCallback = (res: GeneralSuccessResult) => void;
    type GeneralFailCallback = (res: GeneralFailResult) => void;
    type GeneralCompleteCallback = (res: any) => void;

    interface GeneralSuccessResult {
        errMsg: string;
    }

    interface GeneralFailCodeResult {
        errCode: number;
        errMsg: string;
    }

    interface GeneralFailResult {
        errMsg: string;
        errNo?: number;
    }

    /** 获取版本信息和环境变量 */
    interface EnvInfo {
        /** 小程序信息 */
        microapp: {
            /** 小程序版本号 */
            mpVersion: string;
            /** 小程序环境 */
            envType: string;
            /** 小程序appId */
            appId: string;
        };
        /** 插件信息 */
        plugin: Record<string, unknown>;
        /** 通用参数 */
        common: {
            /** 用户数据存储的路径 */
            USER_DATA_PATH: string;
            /** 校验白名单属性中的appInfoLaunchFrom后返回额外信息 */
            location: string | undefined;
            launchFrom: string | undefined;
            schema: string | undefined;
        };
    }

    interface SystemInfo {
        /** 操作系统版本 */
        system: string;
        /** 操作系统类型 */
        platform: string;
        /** 手机品牌 */
        brand: string;
        /** 手机型号 */
        model: string;
        /** 宿主 App 版本号 */
        version: string;
        /**
         * 宿主 APP 名称
         *
         * - Toutiao 今日头条
         * - Douyin 抖音（国内版)
         * - news_article_lite 今日头条（极速版)
         * - live_stream 火山小视频
         * - XiGua 西瓜
         * - PPX 皮皮虾
         */
        appName: string;
        /** 客户端基础库版本 */
        SDKVersion: string;
        /** 屏幕宽度 */
        screenWidth: number;
        /** 屏幕高度 */
        screenHeight: number;
        /** 可使用窗口宽度 */
        windowWidth: number;
        /** 可使用窗口高度 */
        windowHeight: number;
        /** 设备像素比 */
        pixelRatio: number;
        /** 状态栏的高度，单位 px */
        statusBarHeight: number;
        /** 在竖屏正方向下的安全区域 */
        safeArea: {
            /** 安全区域左上角横坐标 */
            left: number;
            /** 安全区域右下角横坐标 */
            right: number;
            /** 安全区域左上角纵坐标 */
            top: number;
            /** 安全区域右下角纵坐标 */
            bottom: number;
            /** 安全区域的宽度，单位逻辑像素 */
            width: number;
            /** 安全区域的高度，单位逻辑像素 */
            height: number;
        };
    }


    interface LaunchParams {
        /**
         * 小程序启动页面路径
         * @version 1.12.0
         */
        path: string;
        /**
         * 小程序启动场景值
         * @version 1.12.0
         */
        scene: string;
        /**
         * 小程序启动参数
         * @version 1.12.0
         */
        query: object;
        /**
         * 来源信息。从另一个小程序进入小程序时返回。否则返回 {}。
         * @version 1.15.0
         */
        referrerInfo: {
            /** 来源小程序的 appId */
            appId: string;
            /** 来源小程序传过来的数据，场景值为 011009 或 011010 时支持。 */
            extraData: object;
        };
        /**
         * 唤起小程序页面的来源方式，10 表示用户点击小程序入口 schema，0 表示其它方式，比如前后台切换
         * @version 1.90.0
         */
        showFrom: number;
    }


    interface SocketTask {
        /**
         * 表示 Socket 连接状态 code
         * 若由于参数错误导致未创建连接, 则为 undefined
         */
        readonly readyState?: 0 | 1 | 2 | 3;
        /** 表示 Socket 正在连接的常量 */
        readonly CONNECTING: 0;
        /** 表示 Socket 连接已经打开的常量 */
        readonly OPEN: 1;
        /** 表示 Socket 连接关闭中的常量 */
        readonly CLOSING: 2;
        /** 表示 Socket 连接已关闭的常量 */
        readonly CLOSED: 3;

        /**
         * ### WebSocket 发送给服务端数据的方法
         */
        send: (res: {
            data: string | ArrayBuffer,
            success?: GeneralSuccessCallback,
            fail?: GeneralFailCallback,
            complete?: GeneralCompleteCallback
        }) => void;

        /** ### 关闭 WebSocket 连接的方法。 */
        close: (res: {
            code?: number,
            reason?: string,
            success?: GeneralSuccessCallback,
            fail?: GeneralFailCallback,
            complete?: GeneralCompleteCallback
        }) => void;

        /**
         * ### 监听 WebSocket 连接服务器成功的事件
         * 表示 WebSocket 的状态变成 open，可以发送数据给服务器。
         */
        onOpen: (
            callback: (res: {
                /** 连接服务器返回的 Response Header */
                header: Record<string, unknown>;
                /** 使用的网络传输层协议 */
                protocolType: string;
                /** websocket 类型 */
                socketType: "ttnet" | "tradition";
            }) => void
        ) => void;

        /** 监听 WebSocket 与服务器的连接断开的事件 */
        onClose: (
            callback: (res: {
                /** 使用的网络传输层协议 */
                protocolType: string;
                /** websocket 类型 */
                socketType: string;
                /** 错误信息 */
                errMsg: string;
                /** 关闭原因 */
                reason: string;
                /** 关闭 code */
                code: string;
            }) => void
        ) => void;

        /** ### 监听 WebSocket 接收到服务器发送信息的事件。 */
        onMessage: (
            callback: (res: {
                /** 接收到的服务器消息 */
                data: string | ArrayBuffer;
                /** websocket 使用的协议 */
                protocolType: string;
                /** websocket 类型 */
                socketType: "ttnet" | "tradition";
            }) => void
        ) => void;

        /** ### 监听 WebSocket 发生错误的事件 */
        onError: (
            callback: (res: {
                /** 错误信息 */
                errMsg: string;
            }) => void
        ) => void;
    }


    interface RewardedVideoAd {
        /** 广告创建后默认是隐藏的，可以通过该方法显示广告 */
        show: () => Promise<any>;
        /** 当广告素材加载出现错误时，可以通过 load 方法手动加载 */
        load: () => Promise<any>;
        /** 绑定广告 load 事件的监听器 */
        onLoad: (fn: Callback) => void;
        /** 解除绑定 load 事件的监听器 */
        offLoad: (fn: Callback) => void;
        /** 绑定 error 事件的监听器 */
        onError: (fn: (data: GeneralFailCodeResult) => void) => void;
        /** 解除绑定 error 事件的监听器 */
        onClose: (fn: (data: { isEnded: boolean, count?: number }) => void) => void;
        /** 绑定 close 事件的监听器 */
        offClose: (fn: Callback) => void;
    }

    interface CreateRewardedVideoAdOption {
        /** 广告位 id */
        adUnitId: string;
        /** 是否开启再得广告模式（只支持安卓系统的抖音和抖音极速版） */
        multiton?: boolean;
        /** 
         * 再得广告的奖励文案，玩家每看完一个广告都会展示，如【再看1个获得xx】
         * xx 即 multitonRewardMsg 中的文案，按顺序依次展示，单个文案最大长度为 7
         * multiton 为 true 时必填
         */
        multitonRewardMsg?: string[];
        /** 
         * 额外观看广告的次数，合法的数据范围为 1-4，multiton 为 true 时必填
         */
        multitonRewardTimes?: number;
        /** 
         * 是否开启进度提醒，开启时广告文案为【再看N个获得xx】，关闭时为【 再看1个获得xx】。
         * N 表示玩家当前还需额外观看广告的次数
         */
        progressTip?: boolean;
    }

    interface IPaymentOptions {
        /** 支付的类型, 目前仅为"game" */
        mode: "game";
        /** 环境配置，目前合法值仅为"0" */
        env: 0;
        /** 货币类型，目前合法值仅为"CNY" */
        currencyType: "CNY";
        /** 申请接入时的平台，目前仅为"android" */
        platform: "android";
        /** 
         * 金币购买数量，金币数量必须满足：金币数量*金币单价 = 限定价格等级
         * goodType为游戏币场景时必传，其他场景不传 
         */
        buyQuantity?: number;

        /** 
         * 游戏服务区id，开发者自定义。游戏不分大区则默认填写"1"。如果应用支持多角色，则角色 ID 接在分区 ID 后，用"_"连接
         */
        zoneId?: string;
        /**
         * 游戏开发者自定义的唯一订单号，订单支付成功后通过服务端支付结果回调回传
         * 必须具有唯一性，如果不传或重复传相同值，则会报错
         */
        customId: string;
        /** 游戏开发者自定义的其他信息，订单支付成功后通过服务端支付结果回调回传。字符串长度最大不能超过 256。 */
        extraInfo?: string;
        /** 支付场景 默认:0 */
        goodType?: number;
        /** goodType为道具直购场景时必传，代表道具现金价格，单位为【分】，如道具价格为0.1元，则回传10 */
        orderAmount?: string;
        /** goodType为道具直购场景时，代表道具名称，长度限制小于等于10个字符，用于区分道具类型 */
        goodName?: string;

        success?: (res: GeneralSuccessResult) => void;
        fail?: (res: GeneralFailCodeResult) => void;
        complete?: (res: any) => void;
    }

    interface IAwemeCustomerOptions {
        /** 游戏开发者自定义的其他信息，订单支付成功后通过服务端支付结果回调回传。字符串长度最大不能超过 256。（强烈建议传入） */
        extraInfo?: string;
        /** 
         * 游戏服务区id，开发者自定义。游戏不分大区则默认填写"1"。如果应用支持多角色，则角色 ID 接在分区 ID 后，用"_"连接
         */
        zoneId?: string;

        /** 币种，目前仅为“DIAMOND” */
        currencyType: "DIAMOND" | "CNY";
        /** 
         * 金币购买数量，金币数量必须满足：金币数量*金币单价 = 限定价格等级
         * goodType为游戏币场景时必传，其他场景不传 
         */
        buyQuantity?: number;
        /** 支付场景 默认:0 */
        goodType?: number;
        /** goodType为道具直购场景时必传，代表道具现金价格，单位为【分】，如道具价格为0.1元，则回传10 */
        orderAmount?: string;
        /** goodType为道具直购场景时，代表道具名称，长度限制小于等于10个字符，用于区分道具类型 */
        goodName?: string;
        /**
         * 游戏开发者自定义的唯一订单号，订单支付成功后通过服务端支付结果回调回传
         * 必须具有唯一性，如果不传或重复传相同值，则会报错
         */
        customId: string;
        success?: (res: GeneralSuccessResult) => void;
        fail?: (res: GeneralFailResult) => void;
        complete?: (res: any) => void;
    }

    interface TT {
        getEnvInfoSync(): EnvInfo;
        getSystemInfoSync(): SystemInfo;
        getLaunchOptionsSync(): LaunchParams;
        exitMiniProgram(res: {
            success?: GeneralSuccessCallback,
            fail?: GeneralFailCallback,
            complete?: GeneralCompleteCallback
        }): void;

        setClipboardData(res: {
            data: string,
            success?: GeneralSuccessCallback,
            fail?: GeneralFailCallback,
            complete?: GeneralCompleteCallback
        }): void;

        connectSocket(res: {
            /** Socket 连接地址 */
            url: string;
            /** 请求头 */
            header?: Record<string, string>;
            /** 子协议 */
            protocols?: string[];
            success?: (res: { socketTaskId: number }) => void,
            fail?: GeneralFailCallback,
            complete?: GeneralCompleteCallback
        }): SocketTask;

        // requestMidasPayment(res: MidasPaymentOption): void;

        createRewardedVideoAd(option: CreateRewardedVideoAdOption): RewardedVideoAd;

        /** 支付 */
        requestGamePayment(res: IPaymentOptions): void;
        /** 发起抖音钻石支付 */
        openAwemeCustomerService(res: IAwemeCustomerOptions): void;
    }

}
declare const tt: BytedanceMiniprogram.TT