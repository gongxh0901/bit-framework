/**
 * @Author: Gongxh
 * @Date: 2025-02-17
 * @Description: 条件装饰器
 */
export namespace _conditionDecorator {
    /** 用来存储条件注册信息 @internal */
    const cdClassMap: Map<number, any> = new Map();

    /** 获取组件注册信息 */
    export function getConditionMaps(): Map<number, any> {
        return cdClassMap;
    }

    /**
     * 条件装饰器
     * @param {number} conditionType 条件类型
     */
    export function conditionClass(conditionType: number): Function {
        /** target 类的构造函数 */
        return function (ctor: any): void {
            cdClassMap.set(conditionType, ctor);
            return ctor;
        };
    }
}