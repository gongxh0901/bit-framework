/**
 * @Author: Gongxh
 * @Date: 2024-12-12
 * @Description: 对象帮助类
 */
export class ObjectHelper {
    /**
     * 获取对象属性
     * @param obj 对象
     * @param key 属性名
     * @returns 属性值
     * @internal
     */
    public static getObjectProp(obj: Record<string, any>, key: string): any {
        if (obj.hasOwnProperty(key)) {
            return obj[key];
        }
        return (obj[key] = Object.assign({}, obj[key]));
    }
}