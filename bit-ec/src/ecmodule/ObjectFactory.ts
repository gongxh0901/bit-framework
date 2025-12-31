import { ObjectBase } from "./ObjectBase";

/** @internal */
export class ObjectFactory {
    /** 对象类 */
    private _ctor: new () => ObjectBase;
    /** 对象名称 */
    private _name: string;
    /** 对象类型 */
    private _objectType: number;
    /** 最大容量 */
    private _maxCapacity: number;
    /** 对象池 */
    private _stack: ObjectBase[] = [];

    constructor(objectType: number, capacity: number, name: string, objectClass: new () => ObjectBase) {
        this._objectType = objectType;
        this._maxCapacity = capacity;
        this._name = name;
        this._ctor = objectClass;
    }

    /**
     * 获取对象名称
     * @returns {string} 对象名称
     */
    public get name(): string {
        return this._name;
    }

    /**
     * 获取对象
     * @returns {T} 返回的组件
     */
    public allocate<T extends ObjectBase>(): T {
        if (this._stack.length == 0) {
            const ret = new this._ctor() as T;
            ret.objectType = this._objectType;
            return ret;
        }
        const ret = this._stack.pop() as T;
        ret._reuse();
        return ret;
    }

    /**
     * 回收对象
     * @returns {boolean}
     */
    public recycle(ret: ObjectBase): boolean {
        if (ret.recycled) {
            throw new Error(`对象（${ret.constructor.name}）已经被回收了`);
        }
        if (this._maxCapacity > 0 && this._stack.length < this._maxCapacity) {
            ret._recycle();
            this._stack.push(ret);
            return true;
        }
        return false;
    }

    public _clear(): void {
        this._stack.length = 0;
    }
}