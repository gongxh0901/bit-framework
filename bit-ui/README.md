## UI模块 

### 特点

  * 基于FairyGUI, 查看[FairyGUI官方文档](https://www.fairygui.com/docs/editor)
  
  * 灵活的 UI 装饰器（配合插件  `kunpo-fgui` 使用，一键导出界面配置，省时省力省代码）
  
  * 控制窗口之间的相互关系（eg: 打开界面时，是隐藏/关闭前一个界面，还是隐藏/关闭所有界面）
  
  * 多窗口组管理
  
  * 顶部显示金币钻石的资源栏（header），一次实现，多界面复用，
  
  * 支持不同界面使用不同 header

### 插件链接
* **kunpo-fgui**: [https://store.cocos.com/app/detail/7213](https://store.cocos.com/app/detail/7213)

### 使用

#### *一、FairyGUI界面*
> ![image-fgui-project](../image/image-fgui-project.png#pic_left)

#### *二、UI 装饰器使用*

> 注：只有使用了装饰器的内容才能在 `kunpo-fgui` 插件中识别，`kunpo-fgui`插件操作界面如下图

> ![image-fgui-editor](../image/image-fgui-editor.png#pic_left)


1. 窗口装饰器

   ```typescript
   import { Window, _uidecorator } from 'bit-ui';
   const { uiclass, uiprop, uiclick } = _uidecorator;
   
   /** 
   * 窗口装饰器
   * @param 参数1: 窗口容器节点名字
   * @param 参数2: FairyGUI中的UI包名
   * @param 参数3: FairyGUI中的组件名 必须和 class 类同名 这里是 MyWindow
   */
   @uiclass("Window", "UI包名", "MyWindow")
   export class MyWindow extends Window {
       // ... 窗口实现
   }
   ```

2. Header 装饰器

   ```typescript
   import { WindowHeader, _uidecorator } from 'bit-ui';
   const { uiheader } = _uidecorator;
   
   /** 
   * 窗口顶部资源栏装饰器
   * @param 参数1: FairyGUI中的UI包名
   * @param 参数2: FairyGUI中的组件名 必须和 class 类同名 这里是 MyWindowHeader
   */
   @uiheader("UI包名", "WindowHeader")
   export class MyWindowHeader extends WindowHeader {
       // ... Header 实现
   }
   ```

3. UI组件装饰器

   ```typescript
   import { _uidecorator } from 'bit-ui';
   const { uicom, uiprop, uiclick } = _uidecorator;
   
   /** 
   * UI组件类装饰器
   * @param 参数1: FairyGUI中的UI包名
   * @param 参数2: FairyGUI中的组件名 必须和 class 类同名 这里是 MyComponent
   */
   @uicom("Home", "MyComponent")
   export class MyComponent {
       // ... 组件实现
   }
   ```

4. UI属性装饰器

   ```typescript
   import { Window, _uidecorator } from 'bit-ui';
   const { uiclass, uiprop, uiclick } = _uidecorator;
   
   @uiclass("Window", "Home", "MyWindow")
   export class MyWindow extends Window {
       // FairyGUI 组件属性装饰器
       @uiprop private btnConfirm: GButton;  // 按钮组件
       @uiprop private txtTitle: GTextField; // 文本组件
       @uiprop private listItems: GList;     // 列表组件
   }
   ```
   
5. 点击事件装饰器

   ```typescript
   import { Window, _uidecorator } from 'bit-ui';
   const { uiclass, uiprop, uiclick } = _uidecorator;
   
   @uiclass("Window", "Home", "MyWindow")
   export class MyWindow extends Window {
       // 点击事件装饰器
       @uiclick
       private onTouchEvent(event: cc.Event): void {
           console.log('确认按钮被点击');
       }
   }
   ```
   
6. 控制器和动画装饰器

   ```typescript
   import { Window, _uidecorator } from 'bit-ui';
   const { uiclass, uiprop, uiclick, uicontrol, uitransition } = _uidecorator;
   
   @uiclass("Window", "Home", "MyWindow")
   export class MyWindow extends Window {
       // FairyGUI 组件属性装饰器
       @uicontrol private control: Controller;
       @uitransition private transition: Transition;
   }
   ```

   
#### *三、创建窗口*

1. 新建窗口类

   ```typescript
   /**
   * 窗口名必须和FairyGUI中的组件同名
   */
   import { Window, _uidecorator } from 'bit-ui';
   const { uiclass, uiprop, uiclick } = _uidecorator;
   
   @uiclass("Window", "UI包名", "MyWindow")
   export class MyWindow extends Window {
       protected onInit(): void {
           // 初始化窗口
       }
   
       protected onShow(userdata?: any): void {
           // 窗口显示时的逻辑
       }
   
       protected onClose(): void {
           // 窗口关闭时的逻辑
       }
   }
   ```

2. 窗口生命周期
- `onInit`: 窗口初始化时调用
- `onShow`: 窗口显示时调用
- `onClose`: 窗口关闭时调用
- `onHide`: 窗口隐藏时调用
- `onShowFromHide`: 窗口从隐藏状态恢复时调用
- `onCover`: 窗口被覆盖时调用
- `onRecover`: 窗口恢复时调用
- `onEmptyAreaClick`: 点击窗口空白区域时调用

#### *四、窗口资源加载配置*
```typescript
interface IPackageConfig {
    /** UI所在resources中的路径 */
    uiPath: string;
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
```

#### *五、窗口管理接口*
   ```typescript
   export class WindowManager {
     	/** 
     	 * 配置UI包的一些信息 (可以不配置 完全手动管理资源) 
     	 */
   		public static initPackageConfig(res: IPackageConfigRes): void;
     
       /**
        * 异步打开一个窗口 (如果UI包的资源未加载, 会自动加载 配合 WindowManager.initPackageConfig一起使用)
        */
       public static showWindow(windowName: string, userdata?: any): Promise<void>
   
       /**
        * 打开一个窗口 (用于已加载过资源的窗口)
        */
       public static showWindowIm(windowName: string, userdata?: any): void;
   
       /**
        * 关闭窗口
        */
       public static closeWindow(windowName: string);

       /* 
        * 获取窗口实例
        */
       public static getWindow<T extends Window>(windowName: string): T;

       /**
        * 获取当前最顶层窗口
        */
       public static getTopWindow(): Window;

       /**
        * 检查窗口是否存在
        */
       public static hasWindow(windowName: string): boolean;
   }
   ```