/**
 * @Author: Gongxh
 * @Date: 2025-03-04
 * @Description: 二进制工具类 - 使用 JavaScript 标准库实现
 */

export class Binary {
    /**
     * 将对象转换为二进制数据
     */
    public static toBinary(obj: any): Uint8Array {
        // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        // console.log("原始数据", JSON.stringify(obj));
        const chunks: Uint8Array[] = [];
        this.writeValue(obj, chunks);

        // 计算总长度
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);

        // 合并所有数据块
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        // console.log("二进制数据", result);
        // console.log("还原数据", JSON.stringify(this.toJson(result)));
        return result;
    }

    /**
     * 将二进制数据转换JSON数据
     * @param binary 二进制数据
     * @returns 
     */
    public static toJson(binary: any): any {
        // 如果是 ArrayBuffer, 转换为 Uint8Array
        const uint8Array = binary instanceof ArrayBuffer ? new Uint8Array(binary) : binary;
        // 检查是否为二进制格式
        if (!this.isBinaryFormat(uint8Array)) {
            // 如果不是二进制格式, 直接返回
            return binary;
        }
        const view = new DataView(uint8Array.buffer);
        let offset = 0;
        return this.readValue(view, offset);
    }

    /**
     * 检查数据是否为二进制格式
     * @param data 要检查的数据
     * @returns 是否为二进制格式
     */
    public static isBinaryFormat(data: Uint8Array): boolean {
        if (!data || !data.length || data.length < 1) {
            return false;
        }
        // 检查第一个字节是否为有效的类型标记（0-5）
        const firstByte = data[0];
        if (firstByte < 0 || firstByte > 5) {
            return false
        }

        // 检查数据格式是否符合我们的二进制格式规范
        try {
            const view = new DataView(data.buffer);
            let offset = 0;

            // 递归检查数据格式
            this.validateBinaryFormat(view, offset);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 验证二进制数据格式
     * @param view DataView对象
     * @param offset 当前偏移量
     * @returns 下一个数据的偏移量
     * @internal
     */
    private static validateBinaryFormat(view: DataView, offset: number): number {
        const type = view.getUint8(offset);

        switch (type) {
            case 0: // null
                return 1;
            case 1: // number
                return 9;
            case 2: { // string
                const strLen = view.getUint32(offset + 1, true);
                return 5 + strLen;
            }
            case 3: // boolean
                return 2;
            case 4: { // array
                const arrLen = view.getUint32(offset + 1, true);
                let size = 5;
                for (let i = 0; i < arrLen; i++) {
                    size += this.validateBinaryFormat(view, offset + size);
                }
                return size;
            }
            case 5: { // object
                const objLen = view.getUint32(offset + 1, true);
                let size = 5;
                for (let i = 0; i < objLen; i++) {
                    const keyLen = view.getUint32(offset + size, true);
                    size += 4 + keyLen;
                    size += this.validateBinaryFormat(view, offset + size);
                }
                return size;
            }
            default:
                throw new Error('无效的类型标记');
        }
    }

    /** @internal */
    private static readValue(view: DataView, offset: number): any {
        const type = view.getUint8(offset++);

        switch (type) {
            case 0: // null
                return null;
            case 1: // number
                const num = view.getFloat64(offset, true);
                return num;
            case 2: { // string
                const strLen = view.getUint32(offset, true);
                offset += 4;
                const strBytes = new Uint8Array(view.buffer, offset, strLen);
                return this.utf8ArrayToString(strBytes);
            }
            case 3: // boolean
                return view.getUint8(offset) === 1;
            case 4: // array
                const arrLen = view.getUint32(offset, true);
                offset += 4;
                const arr = [];
                for (let i = 0; i < arrLen; i++) {
                    arr.push(this.readValue(view, offset));
                    offset += this.getNextOffset(view, offset);
                }
                return arr;
            case 5: { // object
                const objLen = view.getUint32(offset, true);
                offset += 4;
                const obj: any = {};
                for (let i = 0; i < objLen; i++) {
                    const keyLen = view.getUint32(offset, true);
                    offset += 4;
                    let key = '';
                    for (let j = 0; j < keyLen; j++) {
                        key += String.fromCharCode(view.getUint8(offset + j));
                    }
                    offset += keyLen;
                    obj[key] = this.readValue(view, offset);
                    offset += this.getNextOffset(view, offset);
                }
                return obj;
            }
            default:
                throw new Error(`未知的类型: ${type}`);
        }
    }

    /** @internal */
    private static writeValue(value: any, chunks: Uint8Array[]): void {
        if (value === null) {
            chunks.push(new Uint8Array([0]));
            return;
        }

        switch (typeof value) {
            case 'number': {
                const numBuf = new Uint8Array(9);
                numBuf[0] = 1;
                const view = new DataView(numBuf.buffer);
                view.setFloat64(1, value, true);
                chunks.push(numBuf);
                break;
            }
            case 'string': {
                const strBytes = this.stringToUtf8Array(value);
                const strLen = strBytes.length;
                const strBuf = new Uint8Array(5 + strLen);
                strBuf[0] = 2;
                const view = new DataView(strBuf.buffer);
                view.setUint32(1, strLen, true);
                strBuf.set(strBytes, 5);
                chunks.push(strBuf);
                break;
            }
            case 'boolean': {
                const boolBuf = new Uint8Array(2);
                boolBuf[0] = 3;
                boolBuf[1] = value ? 1 : 0;
                chunks.push(boolBuf);
                break;
            }
            case 'object': {
                if (Array.isArray(value)) {
                    const arrBuf = new Uint8Array(5);
                    arrBuf[0] = 4;
                    const view = new DataView(arrBuf.buffer);
                    view.setUint32(1, value.length, true);
                    chunks.push(arrBuf);
                    for (const item of value) {
                        this.writeValue(item, chunks);
                    }
                } else {
                    const keys = Object.keys(value);
                    const objBuf = new Uint8Array(5);
                    objBuf[0] = 5;
                    const view = new DataView(objBuf.buffer);
                    view.setUint32(1, keys.length, true);
                    chunks.push(objBuf);
                    for (const key of keys) {
                        const keyLen = key.length;
                        const keyBuf = new Uint8Array(4 + keyLen);
                        const keyView = new DataView(keyBuf.buffer);
                        keyView.setUint32(0, keyLen, true);
                        const keyBytes = new TextEncoder().encode(key);
                        keyBuf.set(keyBytes, 4);
                        chunks.push(keyBuf);
                        this.writeValue(value[key], chunks);
                    }
                }
                break;
            }
            default:
                throw new Error(`不支持的类型: ${typeof value}`);
        }
    }

    /** @internal */
    private static getNextOffset(view: DataView, offset: number): number {
        const type = view.getUint8(offset);
        switch (type) {
            case 0: return 1; // null
            case 1: return 9; // number
            case 2: return 5 + view.getUint32(offset + 1, true); // string
            case 3: return 2; // boolean
            case 4: { // array
                const arrLen = view.getUint32(offset + 1, true);
                let currentSize = 5;
                for (let i = 0; i < arrLen; i++) {
                    currentSize += this.getNextOffset(view, offset + currentSize);
                }
                return currentSize;
            }
            case 5: { // object
                const objLen = view.getUint32(offset + 1, true);
                let currentSize = 5;
                for (let i = 0; i < objLen; i++) {
                    const keyLen = view.getUint32(offset + currentSize, true);
                    currentSize += 4 + keyLen;
                    currentSize += this.getNextOffset(view, offset + currentSize);
                }
                return currentSize;
            }
            default:
                throw new Error(`未知的类型: ${type}`);
        }
    }

    /** @internal */
    private static utf8ArrayToString(array: Uint8Array): string {
        if (!array || array.length === 0) {
            return '';
        }
        let out = '';
        let i = 0;
        try {
            while (i < array.length) {
                let c = array[i++];
                if (c > 127) {
                    if (c > 191 && c < 224) {
                        if (i >= array.length) break;
                        c = ((c & 31) << 6) | (array[i++] & 63);
                    } else if (c > 223 && c < 240) {
                        if (i + 1 >= array.length) break;
                        c = ((c & 15) << 12) | ((array[i++] & 63) << 6) | (array[i++] & 63);
                    } else if (c > 239 && c < 248) {
                        if (i + 2 >= array.length) break;
                        c = ((c & 7) << 18) | ((array[i++] & 63) << 12) | ((array[i++] & 63) << 6) | (array[i++] & 63);
                    } else {
                        // 无效的 UTF-8 序列
                        continue;
                    }
                }
                if (c <= 0xffff) {
                    out += String.fromCharCode(c);
                } else if (c <= 0x10ffff) {
                    c -= 0x10000;
                    out += String.fromCharCode((c >> 10) | 0xd800);
                    out += String.fromCharCode((c & 0x3FF) | 0xdc00);
                }
            }
        } catch (error) {
            console.error('UTF-8 解码错误:', error);
            return '';
        }
        return out;
    }

    /** @internal */
    private static stringToUtf8Array(str: string): Uint8Array {
        if (!str || str.length === 0) {
            return new Uint8Array(0);
        }
        const arr: number[] = [];
        try {
            for (let i = 0; i < str.length; i++) {
                let charcode = str.charCodeAt(i);
                if (charcode < 0x80) {
                    arr.push(charcode);
                } else if (charcode < 0x800) {
                    arr.push(0xc0 | (charcode >> 6));
                    arr.push(0x80 | (charcode & 0x3f));
                } else if (charcode < 0xd800 || charcode >= 0xe000) {
                    arr.push(0xe0 | (charcode >> 12));
                    arr.push(0x80 | ((charcode >> 6) & 0x3f));
                    arr.push(0x80 | (charcode & 0x3f));
                } else {
                    // surrogate pair
                    if (i + 1 >= str.length) {
                        // 不完整的代理对
                        break;
                    }
                    i++;
                    charcode = ((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff);
                    charcode += 0x10000;
                    arr.push(0xf0 | (charcode >> 18));
                    arr.push(0x80 | ((charcode >> 12) & 0x3f));
                    arr.push(0x80 | ((charcode >> 6) & 0x3f));
                    arr.push(0x80 | (charcode & 0x3f));
                }
            }
        } catch (error) {
            console.error('UTF-8 编码错误:', error);
            return new Uint8Array(0);
        }
        return new Uint8Array(arr);
    }
}