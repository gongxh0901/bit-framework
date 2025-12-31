## 安装kunpocc-net

项目已发布到 `npm`, 安装方法如下：

```bash
npm install kunpocc-net
```

## Http模块 

### 特点
  - 封装 XMLHttpRequest
  - 完整的请求响应接口
  - 独立使用简单，一行代码发送一个请求
  - 大型项目，管理简单

### 使用

```typescript
import { HttpManager, IHttpEvent, HttpResponseType } from 'kunpocc-net';

const event: IHttpEvent = {
    name: "login",
    onComplete: (response) => {
        console.log('请求成功:', response.data);
    },
    onError: (response) => {
        console.log('请求失败:', response.error);
    }
};

// POST 请求
HttpManager.post(
    "https://api.example.com/login",
    { username: "test", password: "123456" },
    "json",  // 响应类型：'json' | 'text' | 'arraybuffer'
    event,
    ["Content-Type", "application/json"],  // 请求头
    5  // 超时时间（秒）
);

// GET 请求
HttpManager.get(
    "https://api.example.com/users",
    { id: 1 },
    "json",
    event
);
```

#### *请求方法*
- `post(url, data, responseType?, event?, headers?, timeout?)`
- `get(url, data, responseType?, event?, headers?, timeout?)`
- `put(url, data, responseType?, event?, headers?, timeout?)`
- `head(url, data, responseType?, event?, headers?, timeout?)`

#### *参数说明*
- `url`: 请求地址
- `data`: 请求数据
- `responseType`: 响应类型（可选，默认 'json'）
  - `'json'`: JSON 格式
  - `'text'`: 文本格式
  - `'arraybuffer'`: 二进制数据
- `event`: 请求事件回调（可选）
- `headers`: 请求头（可选）
- `timeout`: 超时时间，单位秒（可选，0表示不超时）

#### *响应处理*
1. 回调方式（通过 IHttpEvent）：
```typescript
const event: IHttpEvent = {
    name: "自定义名称",
    data?: "自定义数据",  // 可选
    onComplete: (response) => {
        // 成功回调
    },
    onError: (response) => {
        // 失败回调
    }
};
```

2. 全局事件方式：
```typescript
GlobalEvent.add(HttpManager.HttpEvent, (result, response) => {
    // result: "succeed" | "fail"
    // response: IHttpResponse
}, this);
```



## socket网络模块

* 目的抹平小游戏平台和原生平台的使用差异

  `各个小游戏平台都是自己封装的socket 和 浏览器标准的websocket在用法上有一定的差异`

#### 使用

```typescript
import { Socket } from "kunpocc-net";

// 创建一个连接
let url = "wss:xxxxxxxx"
let socket = new Socket(url, { binaryType: "arraybuffer" });

// 监听连接open事件
socket.onopen = () => {
		log("连接成功");
}

// 监听收到服务端的消息
socket.onmessage = (data: string | ArrayBuffer) => {
    log("收到消息", data);
}

// 监听连接关闭的事件
socket.onclose = (code: number, reason: string) => {
		log("连接关闭", code, reason);
    socket = null;
}

// 发送字符串消息
socket.send("发送给服务端的消息");

// 发送二进制数据 一般都是使用ProtoBuf，具体使用可参考Demo
socket.sendBuffer(buffer);

// 主动断开连接
socket.close(3001, "主动断开连接");
```

## 作者

gongxh

## 联系作者

*  邮箱: gong.xinhai@163.com

## 仓库
[kunpocc-net gitee地址](https://gitee.com/gongxinhai/kunpocc-net)

[kunpocc-net github地址](https://github.com/Gongxh0901/kunpocc-net)