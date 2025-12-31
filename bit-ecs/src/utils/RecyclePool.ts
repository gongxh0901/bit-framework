/**
 * @Author: Gongxh
 * @Date: 2025-05-14
 * @Description: 通用对象回收池
 * 提供高效的对象复用、内存预分配和自动扩容功能
 * 
 * 设置最大容量, 默认不能超过2048个
 */

export class RecyclePool<T> {
    /** 回收池名称 */
    public name: string = "";

    /** 存储可复用对象的数组 */
    private pool: T[] = [];

    /** 当前池中可用对象的数量 */
    private _count: number = 0;

    /** 最大容量 */
    private max: number = 2048;

    /** 创建新对象的工厂函数 */
    private factory: () => T;

    /** 重置对象的函数 */
    private reset: (obj: T) => void;

    /**
     * 创建对象回收池
     * @param factory 创建新对象的工厂函数
     * @param min 初始容量
     * @param reset 重置对象的函数(可选)
     */
    constructor(factory: () => T, reset?: (obj: T) => void, min: number = 32, max: number = 2048) {
        this.max = max;
        this.factory = factory;
        this.reset = reset || ((obj: T) => { });
        // 初始化容量
        for (let i = 0; i < min; i++) {
            this.pool.push(this.factory());
        }
        // 更新容量
        this._count = min;
    }

    /**
     * 从池中获取一个对象
     * 如果池为空，自动扩展容量
     */
    public pop(): T {
        if (this._count > 0) {
            this._count--;
            const obj = this.pool[this._count];
            this.pool[this._count] = undefined;
            return obj;
        }
        // 池已空
        return this.factory();
    }

    /**
     * 回收一个对象到池中
     * @param obj 要归还的对象
     * @returns 是否成功归还
     */
    public recycle(obj: T): void {
        let capacity = this.pool.length;
        // 池已满，先扩容再归还
        if (this._count === capacity && capacity < this.max) {
            capacity = capacity >= 512 ? capacity + 256 : capacity * 2;
            this.pool.length = Math.min(capacity, this.max);
            // console.log(`回收池【${this.name}】容量扩容: ${capacity}`);
        }
        this.reset(obj);
        this.pool[this._count++] = obj;
    }

    /**
     * 清空回收池
     */
    public clear(): void {
        // 重置所有有效对象
        let len = this._count;
        for (let i = 0; i < len; i++) {
            this.reset(this.pool[i]);
        }
    }
}