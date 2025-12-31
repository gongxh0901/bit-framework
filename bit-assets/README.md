## 资源加载
**!!! 注意：资源加载多次和一次效果一样 !!!**


### 特点
  * 通过`路径`或者`uuid`获取资源

  * 只适合手动管理资源，无论加载多少次，卸载一次后删除

  * 可根据 `new AssetLoader("batchName")` 传入的 `batchName`批量卸载资源

    > 比如进入战斗时，创建了多个new AssetLoader("batchName") 来加载资源，传入的batchName相同
    >
    > 等退出战斗后，可以通过 AssetPool.releaseBatchAssets("batchName") 一键释放batchName的资源

### 安装

```bash
npm install kunpocc-assets
```

### 使用

```typescript
    let paths: IAssetConfig[] = [
        { path: "ui/manual", type: cc.Asset },
        { path: "prefab", type: cc.Prefab },
        { path: "icon", type: cc.SpriteFrame },
        { path: "texture/6101/spriteFrame", type: cc.SpriteFrame, isFile: true },
        { path: "pet", type: cc.SpriteFrame, bundle: "bundle_res" },
    ];

    let loader = new KunpoAssets.AssetLoader("batchName");
    // 设置最大并行数量 默认:10
    loader.parallel = 10;
    // 设置失败重试次数 默认:0
    loader.retry = 3;
    // 设置回调函数
    loader.setCallbacks({
        complete: () => {
            console.log("加载成功");
        },
        fail: (code: number, msg: string) => {
            console.log("加载失败:", code, msg);
        },
        progress: (percent: number) => {
            console.log("加载进度:", percent);
        }
    });
    loader.start(paths);
```

### 接口
#### *资源加载器*

```typescript
interface IAssetConfig {
    /** 资源路径 必填 */
    path: string;
    /** 资源类型 默认:cc.Asset 可选 */
    type?: typeof Asset;
    /** 是否是单个文件 默认:false 可选 */
    isFile?: boolean;
    /** 资源bundle名 默认:resources 可选 */
    bundle?: string;
}

/**
 * 开始加载资源
 * @param {IAssetConfig[]} configs 资源配置
 */
public start(configs: IAssetConfig[]): void

/** 重试 重新加载失败的资源 */
public retryDownLoadFailedAssets(): void
```

#### *资源池*

```typescript
/** 资源是否已加载 */
public static has(path: string, bundlename: string = "resources"): boolean

/** 获取资源 */
public static get<T extends Asset>(path: string, bundlename: string = "resources"): T

/** 按 uuid 判断资源是否已加载 */
public static hasUUID(uuid: string): boolean

/** 按 uuid 获取资源 */
public static getByUUID<T extends Asset>(uuid: string): T

/** 按资源路径释放资源 */
public static releasePath(path: string, bundlename: string = "resources"): void

/** 按 bundle 和 文件夹释放资源 */
public static releaseDir(dir: string, bundlename: string = "resources", asset: typeof Asset): Promise<boolean>

/** 按 uuid 释放资源 */
public static releaseUUID(uuid: string): void

/** 释放所有加载的资源 */
public static releaseAll(): void

/** 
 * 按资源加载批次释放资源
 * @param batchName 资源加载批次名 对应 AssetLoader 实例化时传入的 name
 */
public static releaseBatchAssets(batchName: string): void;
```

