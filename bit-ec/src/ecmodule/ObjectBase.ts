export class ObjectBase {
    /** 是否被回收 */
    public recycled: boolean;

    /** 对象类型 */
    public objectType: number;

    /** 回收 @internal */
    public _recycle(): void {
        this.recycled = true;
    }

    /** 重新利用 @internal */
    public _reuse(): void {
        this.recycled = false;
    }
}