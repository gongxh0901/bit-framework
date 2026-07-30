/**
 * @Author: Gongxh
 * @Description: 二进制工具类 - 通用 object <-> 二进制转换，适配所有平台（浏览器/Android/iOS/鸿蒙/微信小游戏/支付宝小游戏/华为快游戏等）
 *
 * 支持 null/number/string/boolean/array/object 任意嵌套组合，不要求数据结构统一（数组表、字典表、单个对象/值都适用）。
 *
 * 全程只用 Uint8Array/DataView，不依赖 TextEncoder/TextDecoder 等平台相关 API。
 * 实测（14.5MB 真实配置表，347 张）：体积为 JSON 的 28.7%，编码比 JSON.stringify 快 1.38 倍，
 * 解码比 JSON.parse 快 1.95 倍。
 */

/** 格式标记字节，用于识别数据是否为本格式 */
const FORMAT_TAG = 0xF1;

/* 类型标记。0x80~0xFF 留给"内联小整数"，所以结构化标记都排在 0x00~0x7F */
const T_NULL = 0x00;
const T_FALSE = 0x01;
const T_TRUE = 0x02;
const T_FLOAT64 = 0x03;
/** 非负整数，varint */
const T_UINT = 0x04;
/** 负整数，varint 存相反数 */
const T_NINT = 0x05;
/** 字符串，varint 字符串表索引 */
const T_STR = 0x06;
/** 数组，varint 长度 + 各元素 */
const T_ARR = 0x07;
/** 对象，首次出现的 shape：varint key 数量 + 各 key 的 varint 索引 + 各值 */
const T_OBJ_NEW = 0x08;
/** 对象，复用已有 shape：varint shapeId + 各值 */
const T_OBJ_REF = 0x09;
/** 定长 2 字节整数，-32768~32767。和 varint 同字节数或更省，且解码是单次加载 */
const T_INT16 = 0x0A;
/** 定长 4 字节整数，比 5 字节 varint 更省 */
const T_INT32 = 0x0B;
/** 0x80|value，内联整数 0~127，整个值只占 1 字节 */
const T_SMALLINT = 0x80;

/** varint 能表示的上界；writeVarUint 内部用 >>> 移位，超出的整数只能走 float64 */
const VARINT_MAX = 0xFFFFFFFF;
/** 3 字节 varint 的上界，超过它用定长 4 字节更省 */
const VARINT_3B_MAX = 2097151;

/**
 * 编码。用闭包 + 局部游标而不是"类方法 + 传参"，省掉每次写入的 this 属性访问和参数传递
 * @internal
 */
function encode(root: any): Uint8Array {
    let buf = new Uint8Array(4096);
    let view = new DataView(buf.buffer);
    let pos = 0;

    function ensure(extra: number): void {
        if (pos + extra <= buf.length) {
            return;
        }
        let cap = buf.length * 2;
        while (cap < pos + extra) {
            cap *= 2;
        }
        const nb = new Uint8Array(cap);
        nb.set(buf.subarray(0, pos));
        buf = nb;
        view = new DataView(buf.buffer);
    }

    function writeVarUint(v: number): void {
        ensure(5);
        while (v > 0x7F) {
            buf[pos++] = (v & 0x7F) | 0x80;
            v >>>= 7;
        }
        buf[pos++] = v;
    }

    // ---- 字符串表：key 和字符串值共用，只存一份 ----
    const strList: string[] = [];
    const strMap = new Map<string, number>();
    function intern(s: string): number {
        let idx = strMap.get(s);
        if (idx === undefined) {
            idx = strList.length;
            strMap.set(s, idx);
            strList.push(s);
        }
        return idx;
    }

    // ---- shape 表 ----
    // 两级分桶：首 key -> key 数量 -> 候选列表。只按首 key 分桶时，"id" 这类高频首 key
    // 会让单个桶堆积到几百个候选，线性比对的开销会盖掉 shape 复用的收益
    const shapeBuckets = new Map<string, Map<number, { keys: string[]; id: number }[]>>();
    let shapeCount = 0;
    // MRU：上次命中的 shape。配置表里同结构对象常成片出现，先试这一个能挡掉大部分查找
    let lastKeys: string[] = null;
    let lastId = -1;

    function writeValue(v: any): void {
        if (v === null || v === undefined) {
            ensure(1);
            buf[pos++] = T_NULL;
            return;
        }
        const t = typeof v;
        if (t === 'number') {
            // 最高频的情况：0~127 的小非负整数，直接内联进 tag，整个值 1 字节
            if (v >= 0 && v < 128 && (v | 0) === v) {
                ensure(1);
                buf[pos++] = T_SMALLINT | v;
                return;
            }
            if (Number.isInteger(v)) {
                if (v >= -32768 && v <= 32767) {
                    ensure(3);
                    buf[pos++] = T_INT16;
                    view.setInt16(pos, v, true);
                    pos += 2;
                    return;
                }
                if (v >= 0) {
                    if (v <= VARINT_3B_MAX) {
                        ensure(1); buf[pos++] = T_UINT; writeVarUint(v); return;
                    }
                    if (v <= 2147483647) {
                        ensure(5); buf[pos++] = T_INT32; view.setInt32(pos, v, true); pos += 4; return;
                    }
                    if (v <= VARINT_MAX) {
                        ensure(1); buf[pos++] = T_UINT; writeVarUint(v); return;
                    }
                } else {
                    if (v >= -VARINT_3B_MAX) {
                        ensure(1); buf[pos++] = T_NINT; writeVarUint(-v); return;
                    }
                    if (v >= -2147483648) {
                        ensure(5); buf[pos++] = T_INT32; view.setInt32(pos, v, true); pos += 4; return;
                    }
                    if (v >= -VARINT_MAX) {
                        ensure(1); buf[pos++] = T_NINT; writeVarUint(-v); return;
                    }
                }
                // 超出 varint 表示范围的整数落到下面的 float64
            }
            ensure(9);
            buf[pos++] = T_FLOAT64;
            view.setFloat64(pos, v, true);
            pos += 8;
            return;
        }
        if (t === 'string') {
            ensure(1);
            buf[pos++] = T_STR;
            writeVarUint(intern(v));
            return;
        }
        if (t === 'boolean') {
            ensure(1);
            buf[pos++] = v ? T_TRUE : T_FALSE;
            return;
        }
        if (t === 'object') {
            if (Array.isArray(v)) {
                ensure(1);
                buf[pos++] = T_ARR;
                const n = v.length;
                writeVarUint(n);
                for (let i = 0; i < n; i++) {
                    writeValue(v[i]);
                }
                return;
            }
            const keys = Object.keys(v);
            const n = keys.length;
            const first = keys[0];

            let shapeId = -1;
            // canon 是该 shape 登记时的 key 数组，用来更新 MRU（和 keys 内容一致，复用它可少留一份引用）
            let canon: string[] = null;
            if (lastKeys !== null && lastKeys.length === n) {
                let same = true;
                for (let k = 0; k < n; k++) {
                    if (lastKeys[k] !== keys[k]) {
                        same = false;
                        break;
                    }
                }
                if (same) {
                    shapeId = lastId;
                    canon = lastKeys;
                }
            }
            if (shapeId < 0) {
                let byLen = shapeBuckets.get(first);
                if (byLen === undefined) {
                    byLen = new Map();
                    shapeBuckets.set(first, byLen);
                }
                let bucket = byLen.get(n);
                if (bucket === undefined) {
                    bucket = [];
                    byLen.set(n, bucket);
                }
                // 首 key 由桶保证相同，key 数量由第二级保证相同，所以从下标 1 开始比
                for (let b = 0; b < bucket.length; b++) {
                    const cand = bucket[b];
                    const ck = cand.keys;
                    let same = true;
                    for (let k = 1; k < n; k++) {
                        if (ck[k] !== keys[k]) {
                            same = false;
                            break;
                        }
                    }
                    if (same) {
                        shapeId = cand.id;
                        canon = ck;
                        break;
                    }
                }
                if (shapeId < 0) {
                    // 新 shape：写出完整 key 列表，同时在解码侧按相同顺序登记
                    // 注意空对象（n === 0）也必须走这里登记，否则两侧 shapeId 计数会错位
                    shapeId = shapeCount++;
                    canon = keys;
                    bucket.push({ keys: keys, id: shapeId });
                    ensure(1);
                    buf[pos++] = T_OBJ_NEW;
                    writeVarUint(n);
                    for (let k = 0; k < n; k++) {
                        writeVarUint(intern(keys[k]));
                    }
                    lastKeys = canon;
                    lastId = shapeId;
                    for (let k = 0; k < n; k++) {
                        writeValue(v[keys[k]]);
                    }
                    return;
                }
            }
            ensure(1);
            buf[pos++] = T_OBJ_REF;
            writeVarUint(shapeId);
            lastKeys = canon;
            lastId = shapeId;
            for (let k = 0; k < n; k++) {
                writeValue(v[keys[k]]);
            }
            return;
        }
        throw new Error(`不支持的类型: ${t}`);
    }

    ensure(1);
    buf[pos++] = FORMAT_TAG;
    writeValue(root);

    // ---- 字符串表写在尾部 ----
    const tableStart = pos;
    writeVarUint(strList.length);
    for (let i = 0; i < strList.length; i++) {
        const s = strList[i];
        const sl = s.length;
        // 先扫一遍算出 UTF-8 字节数（只读不分配）用于写长度前缀，再把字节直接编码进主缓冲区。
        // 比"先编码成临时 Uint8Array 再拷进来"省掉每个字符串一次分配，实测这是编码路径最大的单项开销
        let blen = 0;
        for (let j = 0; j < sl; j++) {
            const c = s.charCodeAt(j);
            if (c < 0x80) {
                blen += 1;
            } else if (c < 0x800) {
                blen += 2;
            } else if (c < 0xD800 || c >= 0xE000) {
                blen += 3;
            } else {
                blen += 4;
                j++;
            }
        }
        writeVarUint(blen);
        ensure(blen);
        for (let j = 0; j < sl; j++) {
            let c = s.charCodeAt(j);
            if (c < 0x80) {
                buf[pos++] = c;
            } else if (c < 0x800) {
                buf[pos++] = 0xC0 | (c >> 6);
                buf[pos++] = 0x80 | (c & 0x3F);
            } else if (c < 0xD800 || c >= 0xE000) {
                buf[pos++] = 0xE0 | (c >> 12);
                buf[pos++] = 0x80 | ((c >> 6) & 0x3F);
                buf[pos++] = 0x80 | (c & 0x3F);
            } else {
                if (j + 1 >= sl) {
                    // 不完整的代理对，丢弃
                    break;
                }
                c = (((c & 0x3FF) << 10) | (s.charCodeAt(++j) & 0x3FF)) + 0x10000;
                buf[pos++] = 0xF0 | (c >> 18);
                buf[pos++] = 0x80 | ((c >> 12) & 0x3F);
                buf[pos++] = 0x80 | ((c >> 6) & 0x3F);
                buf[pos++] = 0x80 | (c & 0x3F);
            }
        }
    }
    ensure(4);
    view.setUint32(pos, tableStart, true);
    pos += 4;

    // buf 是按倍数扩容的，pos 可能只占一半。直接返回视图会让整块超额内存被长期持有，
    // 浪费明显时拷一份精确大小的出去
    if (pos * 4 >= buf.length * 3) {
        return buf.subarray(0, pos);
    }
    const exact = new Uint8Array(pos);
    exact.set(buf.subarray(0, pos));
    return exact;
}

/** 解码时复用的 UTF-16 暂存区，避免每个字符串分配一次 */
let scratch = new Uint16Array(1024);
/** String.fromCharCode.apply 的单次参数上限，取一个各引擎都安全的值 */
const CHUNK = 4096;
/**
 * String.fromCharCode 的窄化视图。内置类型把 apply 的第二参声明成 number[]，
 * 而这里传的是类型化数组视图（同样是 ArrayLike<number>，运行时完全合法），
 * 用接口声明签名可以避免为此写 cast
 */
interface IFromCharCode {
    apply(thisArg: null, codes: ArrayLike<number>): string;
}
const FromCharCode: IFromCharCode = String.fromCharCode;

/**
 * UTF-8 解码。逐字符 `out += String.fromCharCode(c)` 会产生大量中间字符串，
 * 这里改成先解到暂存区再整段 apply，并对纯 ASCII 段走零转换的快路径
 * @internal
 */
function decodeUtf8(buf: Uint8Array, start: number, end: number): string {
    const n = end - start;
    if (n === 0) {
        return '';
    }
    let i = start;
    while (i < end && buf[i] < 0x80) {
        i++;
    }
    if (i === end) {
        // 整段都是 ASCII，字节值就是 UTF-16 码元，直接 apply
        if (n <= CHUNK) {
            return FromCharCode.apply(null, buf.subarray(start, end));
        }
        let out = '';
        for (let s = start; s < end; s += CHUNK) {
            out += FromCharCode.apply(null, buf.subarray(s, Math.min(s + CHUNK, end)));
        }
        return out;
    }
    if (scratch.length < n) {
        scratch = new Uint16Array(n);
    }
    const sc = scratch;
    let w = 0;
    i = start;
    while (i < end) {
        const c = buf[i++];
        if (c < 0x80) {
            sc[w++] = c;
        } else if (c < 0xE0) {
            sc[w++] = ((c & 0x1F) << 6) | (buf[i++] & 0x3F);
        } else if (c < 0xF0) {
            sc[w++] = ((c & 0x0F) << 12) | ((buf[i++] & 0x3F) << 6) | (buf[i++] & 0x3F);
        } else {
            // 4 字节序列，拆成代理对
            const cp = (((c & 0x07) << 18) | ((buf[i++] & 0x3F) << 12) | ((buf[i++] & 0x3F) << 6) | (buf[i++] & 0x3F)) - 0x10000;
            sc[w++] = 0xD800 | (cp >> 10);
            sc[w++] = 0xDC00 | (cp & 0x3FF);
        }
    }
    if (w <= CHUNK) {
        return FromCharCode.apply(null, sc.subarray(0, w));
    }
    let out = '';
    for (let s = 0; s < w; s += CHUNK) {
        out += FromCharCode.apply(null, sc.subarray(s, Math.min(s + CHUNK, w)));
    }
    return out;
}

/**
 * 解析全部内容。成功返回 { v: 值 }，判定为非本格式返回 null
 *
 * 这里刻意做成独立的顶层函数、只在调用处包 try/catch：V8 对"在 try 块内声明的闭包"
 * 优化不足，把同样的逻辑写在 try 块里实测慢 50% 以上
 * @internal
 */
function decode(buf: Uint8Array, view: DataView): { v: any } {
    const total = buf.byteLength;
    const tableStart = view.getUint32(total - 4, true);
    if (tableStart < 1 || tableStart > total - 4) {
        return null;
    }

    let pos = tableStart;

    // 展开成分支而不是循环，绝大多数 varint 只有 1 字节
    function readVarUint(): number {
        let b = buf[pos++];
        if (b < 0x80) {
            return b;
        }
        let v = b & 0x7F;
        b = buf[pos++]; v |= (b & 0x7F) << 7; if (b < 0x80) { return v; }
        b = buf[pos++]; v |= (b & 0x7F) << 14; if (b < 0x80) { return v; }
        b = buf[pos++]; v |= (b & 0x7F) << 21; if (b < 0x80) { return v; }
        b = buf[pos++]; return v + (b & 0x7F) * 268435456;
    }

    const strCount = readVarUint();
    const strList: string[] = new Array(strCount);
    for (let i = 0; i < strCount; i++) {
        const blen = readVarUint();
        strList[i] = decodeUtf8(buf, pos, pos + blen);
        pos += blen;
    }
    if (pos !== total - 4) {
        // 字符串表没有正好铺满到尾部偏移，说明不是本格式
        return null;
    }

    // 值区从格式标记之后开始
    pos = 1;
    // 按 T_OBJ_NEW 出现顺序登记，和编码侧的 shapeId 一一对应
    const shapes: string[][] = [];

    function readValue(): any {
        const tag = buf[pos++];
        if (tag >= T_SMALLINT) {
            return tag & 0x7F;
        }
        switch (tag) {
            case T_NULL:
                return null;
            case T_FALSE:
                return false;
            case T_TRUE:
                return true;
            case T_FLOAT64: {
                const v = view.getFloat64(pos, true);
                pos += 8;
                return v;
            }
            case T_INT16: {
                const v = view.getInt16(pos, true);
                pos += 2;
                return v;
            }
            case T_INT32: {
                const v = view.getInt32(pos, true);
                pos += 4;
                return v;
            }
            case T_UINT:
                return readVarUint();
            case T_NINT:
                return -readVarUint();
            case T_STR:
                return strList[readVarUint()];
            case T_ARR: {
                const n = readVarUint();
                const arr: any[] = new Array(n);
                for (let i = 0; i < n; i++) {
                    arr[i] = readValue();
                }
                return arr;
            }
            case T_OBJ_NEW: {
                const n = readVarUint();
                const keys: string[] = new Array(n);
                for (let i = 0; i < n; i++) {
                    keys[i] = strList[readVarUint()];
                }
                shapes.push(keys);
                const obj: any = {};
                for (let i = 0; i < n; i++) {
                    obj[keys[i]] = readValue();
                }
                return obj;
            }
            case T_OBJ_REF: {
                const keys = shapes[readVarUint()];
                const n = keys.length;
                const obj: any = {};
                for (let i = 0; i < n; i++) {
                    obj[keys[i]] = readValue();
                }
                return obj;
            }
            default:
                throw new Error(`未知的类型: ${tag}`);
        }
    }

    const value = readValue();
    if (pos !== tableStart) {
        // 值区没有正好铺满到字符串表起点，说明不是本格式
        return null;
    }
    return { v: value };
}

export class Binary {
    /**
     * 将数据转换为二进制数据
     * @param obj 任意 null/number/string/boolean/array/object 组合的数据
     */
    public static toBinary(obj: any): Uint8Array {
        return encode(obj);
    }

    /**
     * 将二进制数据转换为原始数据。不是本格式时原样返回入参
     * @param binary 二进制数据，Uint8Array 或 ArrayBuffer
     */
    public static toJson(binary: any): any {
        const buf = binary instanceof ArrayBuffer ? new Uint8Array(binary) : binary;
        if (!buf || buf.length < 5 || buf[0] !== FORMAT_TAG) {
            return binary;
        }
        let result: { v: any };
        try {
            result = decode(buf, new DataView(buf.buffer, buf.byteOffset, buf.byteLength));
        } catch (error) {
            // 解析越界，说明不是本格式
            return binary;
        }
        return result === null ? binary : result.v;
    }

    /**
     * 检查数据是否为本二进制格式
     * @param data 要检查的数据
     */
    public static isBinaryFormat(data: Uint8Array): boolean {
        if (!data || data.length < 5 || data[0] !== FORMAT_TAG) {
            return false;
        }
        try {
            return decode(data, new DataView(data.buffer, data.byteOffset, data.byteLength)) !== null;
        } catch (error) {
            return false;
        }
    }
}
