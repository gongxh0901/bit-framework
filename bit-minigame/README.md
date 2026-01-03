# bit-minigame

小游戏平台适配库，抹平微信、支付宝、字节跳动小游戏平台的 API 差异。

## 简介

`bit-minigame` 是小游戏平台适配库，提供统一的接口调用方式，屏蔽微信、支付宝、字节跳动等平台的 API 差异。让开发者使用一套代码适配多个小游戏平台。

**核心特性**：
- 🔌 统一接口，一套代码适配三大平台
- 🎮 平台自动识别，无需手动判断
- 💰 统一的支付接口
- 📺 激励视频广告支持
- 🛠️ 登录、分享、剪贴板等常用功能
- 📱 完整的 TypeScript 类型定义

**支持平台**：
- ✅ 微信小游戏 (`Platform.isWX`)
- ✅ 支付宝小游戏 (`Platform.isAlipay`)
- ✅ 字节跳动小游戏 (`Platform.isBytedance`)

## 安装

```bash
npm install @gongxh/bit-minigame
```

## 使用说明

### 统一访问入口 (MiniHelper)

提供静态方法访问各功能模块：

- `common<T>()` - 获取通用接口实例
- `ad<T>()` - 获取广告接口实例
- `pay<T>()` - 获取支付接口实例

### 通用接口 (IMiniCommon)

提供平台基础信息和常用功能。

**启动参数**：
- `getLaunchOptions()` - 获取冷启动参数
- `getHotLaunchOptions()` - 获取热启动参数

**版本信息**：
- `getLibVersion()` - 获取基础库版本号
- `getHostVersion()` - 获取宿主程序版本（微信/支付宝/抖音版本）

**平台信息**：
- `getPlatform()` - 获取运行平台（ios/android/devtools等）
- `getEnvType()` - 获取运行类型（release/debug）

**屏幕信息**：
- `getScreenSize()` - 获取屏幕尺寸 `{width, height}`

**其他功能**：
- `exitMiniProgram()` - 退出小程序
- `setClipboardData(text)` - 复制到剪切板

### 广告接口 (IMiniRewardAds)

支持激励视频广告。

**显示广告**：
- `showRewardedVideoAd(options)` - 显示激励视频广告
  - `options.adUnitId` - 广告位 ID
  - `options.onComplete` - 广告播放完成回调
  - `options.onError` - 广告播放失败回调 `(errCode, errMsg) => void`
  - `options.onClose` - 广告关闭回调

**注意事项**：
- 广告位 ID 需在各平台后台单独申请
- 建议预加载广告提高成功率
- 必须处理广告加载失败的情况

### 支付接口 (IMiniPay)

统一的支付接口。

**初始化**：
- `init(offerId, unitPriceQuantity)` - 初始化支付
  - `offerId` - 商户号/AppId（因平台而异）
  - `unitPriceQuantity` - 单价数量

**价格检查**：
- `isPayable(rmb)` - 检查价格是否满足限制
  - 不同平台可能有不同的价格限制

**发起支付**：
- `pay(params)` - 发起支付
  - `params.rmb` - 支付金额（元）
  - `params.orderId` - 订单号
  - `params.shopId` - 商品 ID
  - `params.shopName` - 商品名称
  - `params.sandbox` - 沙盒环境（0:正式, 1:沙盒）
  - `params.extraInfo` - 额外信息（可选）
  - `params.success` - 成功回调 `(res) => void`
  - `params.fail` - 失败回调 `(res) => void`

**重要提示**：
- 必须在服务器端验证支付结果
- 测试时使用沙盒环境
- 不同平台的 offerId 参数含义不同

### 平台检测

建议使用 `@gongxh/bit-core` 的 `Platform` 类进行平台判断：

```typescript
import { Platform } from '@gongxh/bit-core';

if (Platform.isWX) {
    // 微信小游戏
} else if (Platform.isAlipay) {
    // 支付宝小游戏
} else if (Platform.isBytedance) {
    // 字节跳动小游戏
}
```

### 典型使用场景

1. **获取启动参数** - 处理分享邀请等
2. **激励视频广告** - 观看广告获取奖励
3. **内购支付** - 购买游戏道具
4. **平台差异处理** - 根据平台使用不同配置

详细 API 请查看 `bit-minigame.d.ts` 类型定义文件。

## 依赖

- [@gongxh/bit-core](https://www.npmjs.com/package/@gongxh/bit-core) - 核心功能（Platform 平台检测）

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-minigame)
