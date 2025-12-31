/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 二叉堆(默认最小堆) 支持最大堆和最小堆
 */

export abstract class HeapNode {
    public index: number;
    public abstract lessThan(other: HeapNode): boolean;
}


export class BinaryHeap<T extends HeapNode> {
    /** @internal */
    private _nodes: Array<T>;
    /** @internal */
    private _size: number;
    /** @internal */
    private _capacity: number;

    constructor(capacity: number) {
        this._size = 0;
        this._capacity = capacity <= 0 ? 4 : capacity;
        this._nodes = new Array<T>(this._capacity);
    }

    /**
     * 清空
     */
    public clear(): void {
        this._size = 0;
    }

    /**
     * 获取节点
     * @param index 节点索引
     */
    public get(index: number): T {
        return this._nodes[index];
    }

    /**
     * 获取顶部节点
     */
    public top(): T {
        return this._nodes[0];
    }

    /**
     * 是否包含节点
     * @param node 节点
     */
    public contains(node: T): boolean {
        return node.index >= 0 && node.index < this._size;
    }

    /**
     * Push节点
     * @param node 节点
     */
    public push(node: T): void {
        const size = ++this._size;

        if (size > this._capacity) {
            this._capacity = this._nodes.length *= 2;
        }

        this._sortUp(node, size - 1);
    }

    /**
     * Pop节点
     * @returns
     */
    public pop(): T {
        if (this._size == 0) {
            return null;
        }

        const nodes = this._nodes;
        const node = nodes[0];

        node.index = -1;
        nodes[0] = null;

        const size = --this._size;

        if (size > 0) {
            const finalNode = nodes[size];

            nodes[size] = null;
            this._sortDown(finalNode, 0);
        }

        return node;
    }

    /**
     * 移除节点
     * @param node 要移除的节点
     */
    public remove(node: T): void {
        if (!this.contains(node)) {
            return;
        }

        const size = --this._size;
        const nodes = this._nodes;


        // 如果删除的不是最后一个元素，需要调整堆
        if (node.index < size) {
            const newNode = (nodes[node.index] = nodes[size]);
            newNode.index = node.index;
            nodes[size] = null;
            this.update(newNode);
        } else {
            nodes[size] = null;
        }
        node.index = -1;
    }

    /**
     * 更新节点
     * @param node 要更新的节点
     */
    public update(node: T): boolean {
        if (!this.contains(node)) {
            return false;
        }

        const index = node.index;
        const nodes = this._nodes;

        if (index > 0 && nodes[index].lessThan(nodes[this._parent(index)])) {
            this._sortUp(nodes[index], index);
        } else {
            this._sortDown(nodes[index], index);
        }

        return true;
    }

    /** @internal */
    private _parent(index: number): number {
        return (index - 1) >> 1;
    }

    public get count(): number {
        return this._size;
    }

    public get empty(): boolean {
        return this._size == 0;
    }

    /** @internal */
    private _sortUp(node: T, index: number): void {
        let parentIndex = this._parent(index);
        const nodes = this._nodes;

        while (index > 0 && node.lessThan(nodes[parentIndex])) {
            nodes[parentIndex].index = index;
            nodes[index] = nodes[parentIndex];
            index = parentIndex;
            parentIndex = this._parent(parentIndex);
        }

        node.index = index;
        nodes[index] = node;
    }

    /** @internal */
    private _sortDown(node: T, index: number): void {
        let childIndex = (index << 1) + 1;
        const nodes = this._nodes;
        const size = this._size;

        while (childIndex < size) {
            let newParent = node;

            // left
            if (nodes[childIndex].lessThan(newParent)) {
                newParent = nodes[childIndex];
            }

            // right
            if (childIndex + 1 < size && nodes[childIndex + 1].lessThan(newParent)) {
                ++childIndex;
                newParent = nodes[childIndex];
            }

            if (node == newParent) {
                break;
            }

            // swap down
            newParent.index = index;
            nodes[index] = newParent;
            index = childIndex;
            childIndex = (childIndex << 1) + 1;
        }

        node.index = index;
        nodes[index] = node;
    }
}