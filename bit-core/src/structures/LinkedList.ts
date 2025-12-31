
function defaultEquals<T>(a: T, b: T): boolean {
    return a === b;
}

/** 单链表结结构节点 */
export class LinkedNode<T> {
    public element: T;
    public next: LinkedNode<T>; // 下一项元素的指针
    constructor(element: T) {
        this.element = element;
        this.next = undefined;
    }
}

/** 双向链表结结构节点 */
export class DoublyNode<T> extends LinkedNode<T> {
    public prev: DoublyNode<T>; // 上一项元素的指针
    public next: DoublyNode<T>; // 下一元素的指针（重新定义下一个元素的类型）
    constructor(element: T) {
        super(element);
        this.prev = undefined;
    }
}

/** 单向链表 */
export class LinkedList<T> {
    /** @internal */
    protected _equalsFn: (a: T, b: T) => boolean;
    /** @internal */
    protected _count: number;
    /** @internal */
    protected _head: LinkedNode<T>;
    /**
     * create
     * @param equalsFn 比较是否相等（支持自定义）
     */
    constructor(equalsFn?: (a: T, b: T) => boolean) {
        this._equalsFn = equalsFn || defaultEquals;
        this._count = 0;
        this._head = undefined;
    }

    /** 向链表尾部添加元素 */
    public push(element: T): void {
        const node = new LinkedNode<T>(element);
        let current: LinkedNode<T>;
        if (this._head === undefined) {
            this._head = node;
        } else {
            current = this._head;
            while (current.next !== undefined) {
                current = current.next;
            }
            current.next = node;
        }
        this._count++;
    }


    /**
     * 在链表的指定位置插入一个元素。
     * @param element 要插入的元素。
     * @param index 插入位置的索引，从0开始计数。
     * @returns 如果插入成功返回true，否则返回false。
     */
    public insert(element: T, index: number): boolean {
        if (index >= 0 && index <= this._count) {
            const node = new LinkedNode<T>(element);
            if (index === 0) {
                const current = this._head;
                node.next = current;
                this._head = node;
            } else {
                const previous = this.getElementAt(index - 1);
                const current = previous.next;
                node.next = current;
                previous.next = node;
            }
            this._count++;
            return true;
        }
        return false;
    }

    /**
     * 获取链表中指定位置的元素，如果不存在返回 underfined
     * @param index
     */
    public getElementAt(index: number): LinkedNode<T> {
        if (index >= 0 && index <= this._count) {
            let node = this._head;
            for (let i = 0; i < index && node !== undefined; i++) {
                node = node.next;
            }
            return node;
        }
        return undefined;
    }

    /**
     * 从链表中移除一个元素
     * @param element
     */
    public remove(element: T): T {
        return this.removeAt(this.indexOf(element));
    }

    /**
     * 从链表的特定位置移除一个元素
     * @param index
     */
    public removeAt(index: number): T {
        if (index >= 0 && index < this._count) {
            let current = this._head;
            if (index === 0) {
                this._head = current.next;
            } else {
                const previous = this.getElementAt(index - 1);
                current = previous.next;
                previous.next = current.next;
            }
            this._count--;
            current.next = undefined;
            return current.element;
        }
        return undefined;
    }

    /**
     * 返回元素在链表中的索引，如果没有则返回-1
     * @param element
     */
    public indexOf(element: T): number {
        let current = this._head;
        for (let i = 0; i < this._count && current !== undefined; i++) {
            if (this._equalsFn(element, current.element)) {
                return i;
            }
            current = current.next;
        }
        return -1;
    }

    public clear(): void {
        this._head = undefined;
        this._count = 0;
    }

    public getHead(): LinkedNode<T> {
        return this._head;
    }

    public isEmpty(): boolean {
        return this.size() === 0;
    }

    public size(): number {
        return this._count;
    }

    public toString(): string {
        if (this._head === undefined) {
            return "";
        }
        let objString = `${this._head.element}`;
        let current = this._head.next;
        for (let i = 0; i < this.size() && current !== undefined; i++) {
            objString = `${objString},${current.element}`;
            current = current.next;
        }
        return objString;
    }
}

/** 双向链表 */
export class DoublyLinkedList<T> extends LinkedList<T> {
    /** @internal */
    protected _head: DoublyNode<T>; // 重新定义 head 类型
    /** @internal */
    protected _tail: DoublyNode<T>;
    /**
     * create
     * @param equalsFn 比较是否相等（支持自定义）
     */
    constructor(equalsFn?: (a: T, b: T) => boolean) {
        super(equalsFn);
        this._tail = undefined;
    }

    /**
     * 向链表尾部添加元素
     * @param element
     */
    public push(element: T): void {
        this.insert(element, this._count);
    }

    /**
     * 向链表指定位置添加元素
     * @param element
     * @param index
     */
    public insert(element: T, index: number): boolean {
        if (index >= 0 && index <= this._count) {
            const node = new DoublyNode<T>(element);
            let current = this._head;
            if (index === 0) {
                if (this._head === undefined) {
                    this._head = node;
                    this._tail = node;
                } else {
                    node.next = current;
                    current.prev = node;
                    this._head = node;
                }
            } else if (index === this._count) {
                current = this._tail;
                current.next = node;
                node.prev = current;
                this._tail = node;
            } else {
                const previous = this.getElementAt(index - 1);
                current = previous.next;
                node.next = current;
                previous.next = node;
                current.prev = node;
                node.prev = previous;
            }
            this._count++;
            return true;
        }
        return false;
    }

    /**
     * 从链表的特定位置移除一个元素
     * @param index
     */
    public removeAt(index: number): T {
        if (index >= 0 && index < this._count) {
            let current = this._head;
            if (index === 0) {
                this._head = current.next;
                if (this._count === 1) {
                    this._tail = undefined;
                } else {
                    this._head.prev = undefined;
                }
            } else if (index === this._count - 1) {
                current = this._tail;
                this._tail = current.prev;
                this._tail.next = undefined;
            } else {
                current = this.getElementAt(index);
                const previous = current.prev;
                previous.next = current.next;
                current.next.prev = previous;
            }
            this._count--;
            current.next = undefined;
            current.prev = undefined;
            return current.element;
        }
        return null;
    }

    /**
     * 获取链表中指定位置的元素，如果不存在返回 null
     * @param index
     */
    public getElementAt(index: number): DoublyNode<T> {
        if (index >= 0 && index <= this._count) {
            if (index > this._count * 0.5) {
                // 从后向前找
                let node = this._tail;
                for (let i = this._count - 1; i > index && node !== undefined; i--) {
                    node = node.prev;
                }
                return node;
            } else {
                // 从前向后找
                let node = this._head;
                for (let i = 0; i < index && node !== undefined; i++) {
                    node = node.next;
                }
                return node;
            }
        }
        return undefined;
    }

    public getHead(): DoublyNode<T> {
        return this._head;
    }

    public getTail(): DoublyNode<T> {
        return this._tail;
    }

    public clear(): void {
        this._head = undefined;
        this._tail = undefined;
        this._count = 0;
    }
}