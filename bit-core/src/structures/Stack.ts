import { DoublyLinkedList } from "./LinkedList";

export class Stack<T> {
    /** @internal */
    private _items: DoublyLinkedList<T>;
    constructor(equalsFn?: (a: T, b: T) => boolean) {
        this._items = new DoublyLinkedList<T>(equalsFn);
    }

    public push(element: T): void {
        this._items.push(element);
    }

    public pop(): T {
        if (this.isEmpty()) {
            return undefined;
        }
        return this._items.removeAt(this.size() - 1);
    }

    public peek(): T {
        if (this.isEmpty()) {
            return undefined;
        }
        return this._items.getTail().element;
    }

    public size(): number {
        return this._items.size();
    }

    public isEmpty(): boolean {
        return this._items.isEmpty();
    }

    public clear(): void {
        this._items.clear();
    }

    public toString(): string {
        return this._items.toString();
    }
}
