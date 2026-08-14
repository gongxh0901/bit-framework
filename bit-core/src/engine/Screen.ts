/**
 * @Author: Gongxh
 * @Date: 2024-12-08
 * @Description: 屏幕尺寸信息接口
 */
export class Screen {
    /** 屏幕宽度 */
    public static ScreenWidth: number;
    /** 屏幕高度 */
    public static ScreenHeight: number;
    /** 设计分辨率宽 */
    public static DesignWidth: number;
    /** 设计分辨率高 */
    public static DesignHeight: number;
    /** 顶部安全区外侧高度 */
    public static SafeAreaTop: number;
    /** 底部安全区外侧高度 */
    public static SafeAreaBottom: number;
    /** 左侧安全区外侧宽度 */
    public static SafeAreaLeft: number;
    /** 右侧安全区外侧宽度 */
    public static SafeAreaRight: number;
    /** 安全区的宽度 */
    public static SafeWidth: number;
    /** 安全区的高度 */
    public static SafeHeight: number;

    /** 安全区中心 X（FairyGUI 坐标） */
    public static get SafeCenterX(): number {
        return Screen.SafeAreaLeft + Screen.SafeWidth * 0.5;
    }

    /** 安全区中心 Y（FairyGUI 坐标，Y 向下） */
    public static get SafeCenterY(): number {
        return Screen.SafeAreaTop + Screen.SafeHeight * 0.5;
    }
}
