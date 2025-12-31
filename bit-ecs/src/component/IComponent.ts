
/**
 * @Author: Gongxh
 * @Date: 2025-05-13
 * @Description: 组件接口
 */
export interface IComponent {
    /** 组件销毁时 用来重置数据 */
    reset(): void;
}