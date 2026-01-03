# bit-net

网络通信库，提供 HTTP 请求和 WebSocket 连接的封装，支持跨平台使用。

## 简介

`bit-net` 是一个网络通信库，封装了 HTTP 和 WebSocket 功能，抹平了浏览器、原生平台和小游戏平台之间的 API 差异。提供统一、简洁的接口用于网络通信。

**核心特性**：
- 🌐 **HTTP 模块** - 封装 XMLHttpRequest，支持 POST/GET/PUT/HEAD 等方法
- 🔌 **WebSocket 模块** - 统一的 Socket 接口，兼容各平台
- 📡 支持 JSON、文本、二进制数据传输
- ⚡ 请求超时控制和错误处理
- 🎯 全局事件和回调两种响应方式

## 安装

```bash
npm install @gongxh/bit-net
```

## 使用说明

### HTTP 模块 (HttpManager)

提供 HTTP 请求功能，支持多种请求方法和响应类型。

**请求方法**：
- `post(url, data, responseType?, event?, headers?, timeout?)` - POST 请求
- `get(url, data, responseType?, event?, headers?, timeout?)` - GET 请求
- `put(url, data, responseType?, event?, headers?, timeout?)` - PUT 请求
- `head(url, data, responseType?, event?, headers?, timeout?)` - HEAD 请求

**响应类型**：
- `'json'` - JSON 格式（默认）
- `'text'` - 文本格式
- `'arraybuffer'` - 二进制数据

**响应处理方式**：
1. **回调方式** - 通过 `IHttpEvent` 接口设置成功和失败回调
2. **全局事件** - 通过 `HttpManager.HttpEvent` 监听所有请求响应

**接口定义**：
- `IHttpRequest` - 请求配置接口
- `IHttpResponse` - 响应数据接口
- `IHttpEvent` - 请求事件接口

### WebSocket 模块 (Socket)

提供统一的 WebSocket 接口，兼容浏览器、原生平台和小游戏平台。

**主要功能**：
- `new Socket(url, options)` - 创建 WebSocket 连接
- `send(data)` - 发送字符串消息
- `sendBuffer(buffer)` - 发送二进制数据（常用于 ProtoBuf）
- `close(code, reason)` - 关闭连接

**事件监听**：
- `onopen` - 连接成功回调
- `onmessage` - 接收消息回调
- `onclose` - 连接关闭回调
- `onerror` - 连接错误回调

**配置选项**：
- `binaryType` - 二进制数据类型（`'arraybuffer'` | `'blob'`）

详细 API 请查看 `bit-net.d.ts` 类型定义文件。

## 许可证

MIT License

## 作者

**bit老宫** (gongxh)  
**邮箱**: gong.xinhai@163.com

## 源码仓库

- [GitHub](https://github.com/Gongxh0901/bit-framework)
- [npm](https://www.npmjs.com/package/@gongxh/bit-net)