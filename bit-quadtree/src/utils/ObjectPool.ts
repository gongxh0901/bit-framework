/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 对象池，用于管理对象的创建和回收，减少GC压力
 */

/**
 * 可回收对象接口
 */
export interface IRecyclable {
    /** 重置对象状态以供重用 */
    reset(): void;
}

/**
 * 通用对象池
 */
export class ObjectPool<T extends IRecyclable> {
    private pool: T[] = [];
    private createFn: () => T;
    private maxSize: number;
    private createdCount: number = 0;
    private reusedCount: number = 0;
    private _poolIndex: number = 0; // 添加池索引以避免数组操作

    /**
     * 创建一个对象池
     * @param createFn 创建对象的函数
     * @param initialSize 初始大小
     * @param maxSize 最大大小
     * @internal
     */
    constructor(createFn: () => T, initialSize: number = 10, maxSize: number = 100) {
        this.createFn = createFn;
        this.maxSize = maxSize;

        // 预先创建初始对象
        this.pool = new Array(maxSize);
        for (let i = 0; i < initialSize; i++) {
            this.pool[i] = createFn();
        }
        this._poolIndex = initialSize;
    }

    /**
     * 从池中获取对象
     * @internal
     */
    public get(): T {
        if (this._poolIndex > 0) {
            this._poolIndex--;
            const obj = this.pool[this._poolIndex];
            obj.reset();
            this.reusedCount++;
            return obj;
        }

        // 池中没有可用对象，创建新的
        this.createdCount++;
        return this.createFn();
    }

    /**
     * 将对象回收到池中
     * @internal
     */
    public recycle(obj: T): void {
        // 防止池过大
        if (this._poolIndex < this.maxSize) {
            obj.reset();
            this.pool[this._poolIndex] = obj;
            this._poolIndex++;
        }
    }

    /**
     * 清空池
     * @internal
     */
    public clear(): void {
        this._poolIndex = 0;
        this.createdCount = 0;
        this.reusedCount = 0;
    }

    /**
     * 预热池 - 预先创建指定数量的对象
     * @internal
     */
    public warmUp(count: number): void {
        const targetIndex = Math.min(count, this.maxSize);
        for (let i = this._poolIndex; i < targetIndex; i++) {
            this.pool[i] = this.createFn();
        }
        this._poolIndex = targetIndex;
    }

    /**
     * 获取池状态信息
     * @internal
     */
    public getStats() {
        return {
            available: this._poolIndex,
            created: this.createdCount,
            reused: this.reusedCount,
            efficiency: this.reusedCount / (this.createdCount + this.reusedCount) || 0
        };
    }
}

/**
 * 对象池管理器 - 管理多个对象池
 */
export class PoolManager {
    private static instance: PoolManager;
    private pools: Map<string, ObjectPool<any>> = new Map();

    public static getInstance(): PoolManager {
        if (!PoolManager.instance) {
            PoolManager.instance = new PoolManager();
        }
        return PoolManager.instance;
    }

    /**
     * 注册对象池
     * @internal
     */
    public registerPool<T extends IRecyclable>(name: string, pool: ObjectPool<T>): void {
        this.pools.set(name, pool);
    }

    /**
     * 清空所有池
     * @internal
     */
    public clearAll(): void {
        for (const pool of this.pools.values()) {
            pool.clear();
        }
    }
} 