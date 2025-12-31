// const base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
class Crypt {
    // Bit-wise rotation left
    public static rotl(n: number, b: number): number {
        return (n << b) | (n >>> (32 - b));
    }

    // Bit-wise rotation right
    public static rotr(n: number, b: number): number {
        return (n << (32 - b)) | (n >>> b);
    }

    // Swap big-endian to little-endian and vice versa
    public static endianNumber(n: number): any {
        return (Crypt.rotl(n, 8) & 0x00ff00ff) | (Crypt.rotl(n, 24) & 0xff00ff00);
    }

    // Swap big-endian to little-endian and vice versa
    public static endianArray(n: number[]): any {
        for (let i = 0, l = n.length; i < l; i++) {
            n[i] = Crypt.endianNumber(n[i]);
        }
        return n;
    }

    // Generate an array of any length of random bytes
    public static randomBytes(n: number): number[] {
        const bytes = [];

        for (; n > 0; n--) {
            bytes.push(Math.floor(Math.random() * 256));
        }
        return bytes;
    }

    // Convert a byte array to big-endian 32-bit words
    public static bytesToWords(bytes: number[]): number[] {
        const words: any[] = [];

        for (let i = 0, b = 0, l = bytes.length; i < l; i++, b += 8) {
            words[b >>> 5] |= bytes[i] << (24 - (b % 32));
        }
        return words;
    }

    // Convert big-endian 32-bit words to a byte array
    public static wordsToBytes(words: number[]): number[] {
        const bytes = [];

        for (let b = 0, l = words.length * 32; b < l; b += 8) {
            bytes.push((words[b >>> 5] >>> (24 - (b % 32))) & 0xff);
        }
        return bytes;
    }

    // Convert a byte array to a hex string
    public static bytesToHex(bytes: number[]): string {
        const hex = [];

        for (let i = 0, l = bytes.length; i < l; i++) {
            hex.push((bytes[i] >>> 4).toString(16));
            hex.push((bytes[i] & 0xf).toString(16));
        }
        return hex.join("");
    }

    // Convert a hex string to a byte array
    public static hexToBytes(hex: string): number[] {
        const bytes = [];

        for (let c = 0, l = hex.length; c < l; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }
        return bytes;
    }
}

// Convert a string to a byte array
function stringToBytes(str: string): number[] {
    str = unescape(encodeURIComponent(str));
    const bytes = [];

    for (let i = 0, l = str.length; i < l; i++) {
        bytes.push(str.charCodeAt(i) & 0xff);
    }
    return bytes;
}

function isFastBuffer(obj: any): boolean {
    return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer(obj: any): boolean {
    return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isBuffer(obj.slice(0, 0));
}

function isBuffer(obj: any): boolean {
    return obj && (isFastBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
}

// The core
const md5Lib = function (message: string): number[] {
    const bytes = stringToBytes(message);
    const m = Crypt.bytesToWords(bytes),
        l = bytes.length * 8;
    let ml = m.length;
    let a = 1732584193,
        b = -271733879,
        c = -1732584194,
        d = 271733878;

    // Swap endian
    for (let i = 0; i < ml; i++) {
        m[i] = (((m[i] << 8) | (m[i] >>> 24)) & 0x00ff00ff) | (((m[i] << 24) | (m[i] >>> 8)) & 0xff00ff00);
    }

    // Padding
    m[l >>> 5] |= 0x80 << l % 32;
    m[(((l + 64) >>> 9) << 4) + 14] = l;

    // Method shortcuts
    const FF = md5Lib._ff,
        GG = md5Lib._gg,
        HH = md5Lib._hh,
        II = md5Lib._ii;

    ml = m.length;
    for (let i = 0; i < ml; i += 16) {
        const aa = a,
            bb = b,
            cc = c,
            dd = d;

        a = FF(a, b, c, d, m[i + 0], 7, -680876936);
        d = FF(d, a, b, c, m[i + 1], 12, -389564586);
        c = FF(c, d, a, b, m[i + 2], 17, 606105819);
        b = FF(b, c, d, a, m[i + 3], 22, -1044525330);
        a = FF(a, b, c, d, m[i + 4], 7, -176418897);
        d = FF(d, a, b, c, m[i + 5], 12, 1200080426);
        c = FF(c, d, a, b, m[i + 6], 17, -1473231341);
        b = FF(b, c, d, a, m[i + 7], 22, -45705983);
        a = FF(a, b, c, d, m[i + 8], 7, 1770035416);
        d = FF(d, a, b, c, m[i + 9], 12, -1958414417);
        c = FF(c, d, a, b, m[i + 10], 17, -42063);
        b = FF(b, c, d, a, m[i + 11], 22, -1990404162);
        a = FF(a, b, c, d, m[i + 12], 7, 1804603682);
        d = FF(d, a, b, c, m[i + 13], 12, -40341101);
        c = FF(c, d, a, b, m[i + 14], 17, -1502002290);
        b = FF(b, c, d, a, m[i + 15], 22, 1236535329);

        a = GG(a, b, c, d, m[i + 1], 5, -165796510);
        d = GG(d, a, b, c, m[i + 6], 9, -1069501632);
        c = GG(c, d, a, b, m[i + 11], 14, 643717713);
        b = GG(b, c, d, a, m[i + 0], 20, -373897302);
        a = GG(a, b, c, d, m[i + 5], 5, -701558691);
        d = GG(d, a, b, c, m[i + 10], 9, 38016083);
        c = GG(c, d, a, b, m[i + 15], 14, -660478335);
        b = GG(b, c, d, a, m[i + 4], 20, -405537848);
        a = GG(a, b, c, d, m[i + 9], 5, 568446438);
        d = GG(d, a, b, c, m[i + 14], 9, -1019803690);
        c = GG(c, d, a, b, m[i + 3], 14, -187363961);
        b = GG(b, c, d, a, m[i + 8], 20, 1163531501);
        a = GG(a, b, c, d, m[i + 13], 5, -1444681467);
        d = GG(d, a, b, c, m[i + 2], 9, -51403784);
        c = GG(c, d, a, b, m[i + 7], 14, 1735328473);
        b = GG(b, c, d, a, m[i + 12], 20, -1926607734);

        a = HH(a, b, c, d, m[i + 5], 4, -378558);
        d = HH(d, a, b, c, m[i + 8], 11, -2022574463);
        c = HH(c, d, a, b, m[i + 11], 16, 1839030562);
        b = HH(b, c, d, a, m[i + 14], 23, -35309556);
        a = HH(a, b, c, d, m[i + 1], 4, -1530992060);
        d = HH(d, a, b, c, m[i + 4], 11, 1272893353);
        c = HH(c, d, a, b, m[i + 7], 16, -155497632);
        b = HH(b, c, d, a, m[i + 10], 23, -1094730640);
        a = HH(a, b, c, d, m[i + 13], 4, 681279174);
        d = HH(d, a, b, c, m[i + 0], 11, -358537222);
        c = HH(c, d, a, b, m[i + 3], 16, -722521979);
        b = HH(b, c, d, a, m[i + 6], 23, 76029189);
        a = HH(a, b, c, d, m[i + 9], 4, -640364487);
        d = HH(d, a, b, c, m[i + 12], 11, -421815835);
        c = HH(c, d, a, b, m[i + 15], 16, 530742520);
        b = HH(b, c, d, a, m[i + 2], 23, -995338651);

        a = II(a, b, c, d, m[i + 0], 6, -198630844);
        d = II(d, a, b, c, m[i + 7], 10, 1126891415);
        c = II(c, d, a, b, m[i + 14], 15, -1416354905);
        b = II(b, c, d, a, m[i + 5], 21, -57434055);
        a = II(a, b, c, d, m[i + 12], 6, 1700485571);
        d = II(d, a, b, c, m[i + 3], 10, -1894986606);
        c = II(c, d, a, b, m[i + 10], 15, -1051523);
        b = II(b, c, d, a, m[i + 1], 21, -2054922799);
        a = II(a, b, c, d, m[i + 8], 6, 1873313359);
        d = II(d, a, b, c, m[i + 15], 10, -30611744);
        c = II(c, d, a, b, m[i + 6], 15, -1560198380);
        b = II(b, c, d, a, m[i + 13], 21, 1309151649);
        a = II(a, b, c, d, m[i + 4], 6, -145523070);
        d = II(d, a, b, c, m[i + 11], 10, -1120210379);
        c = II(c, d, a, b, m[i + 2], 15, 718787259);
        b = II(b, c, d, a, m[i + 9], 21, -343485551);

        a = (a + aa) >>> 0;
        b = (b + bb) >>> 0;
        c = (c + cc) >>> 0;
        d = (d + dd) >>> 0;
    }

    return Crypt.endianArray([a, b, c, d]);
};

// Auxiliary functions
// eslint-disable-next-line max-params
md5Lib._ff = function (a: any, b: any, c: any, d: any, x: any, s: any, t: any): any {
    const n = a + ((b & c) | (~b & d)) + (x >>> 0) + t;

    return ((n << s) | (n >>> (32 - s))) + b;
};
// eslint-disable-next-line max-params
md5Lib._gg = function (a: any, b: any, c: any, d: any, x: any, s: any, t: any): any {
    const n = a + ((b & d) | (c & ~d)) + (x >>> 0) + t;

    return ((n << s) | (n >>> (32 - s))) + b;
};
// eslint-disable-next-line max-params
md5Lib._hh = function (a: any, b: any, c: any, d: any, x: any, s: any, t: any): any {
    const n = a + (b ^ c ^ d) + (x >>> 0) + t;

    return ((n << s) | (n >>> (32 - s))) + b;
};
// eslint-disable-next-line max-params
md5Lib._ii = function (a: any, b: any, c: any, d: any, x: any, s: any, t: any): any {
    const n = a + (c ^ (b | ~d)) + (x >>> 0) + t;

    return ((n << s) | (n >>> (32 - s))) + b;
};

/**
 * 对字符串执行md5处理
 *
 * @export
 * @param {string} message 要处理的字符串
 * @returns {string} md5
 */
export function md5(message: string): string {
    if (message === undefined || message === null) {
        throw new Error("Illegal argument " + message);
    }
    return Crypt.bytesToHex(Crypt.wordsToBytes(md5Lib(message)));
}