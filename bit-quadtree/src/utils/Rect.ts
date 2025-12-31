
/**
 * 矩形类
 */
export class Rect {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    /**
     * 创建一个矩形
     * @param x 矩形的x坐标
     * @param y 矩形的y坐标
     * @param width 矩形的宽度
     * @param height 矩形的高度
     * @internal
     */
    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * 获取矩形的最小X坐标
     * @internal
     */
    get xMin(): number {
        return this.x;
    }

    /**
     * 获取矩形的最大X坐标
     * @internal
     */
    get xMax(): number {
        return this.x + this.width;
    }

    /**
     * 获取矩形的最小Y坐标
     * @internal
     */
    get yMin(): number {
        return this.y;
    }

    /**
     * 获取矩形的最大Y坐标
     * @internal
     */
    get yMax(): number {
        return this.y + this.height;
    }

    /**
     * 获取矩形的中心X坐标
     * @internal
     */
    get centerX(): number {
        return this.x + this.width * 0.5;
    }

    /**
     * 获取矩形的中心Y坐标
     * @internal
     */
    get centerY(): number {
        return this.y + this.height * 0.5;
    }
}

/**
 * 创建Rect的快捷函数
 * @internal
 */
export function rect(x: number = 0, y: number = 0, width: number = 0, height: number = 0): Rect {
    return new Rect(x, y, width, height);
} 