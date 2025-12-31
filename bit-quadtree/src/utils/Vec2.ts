/**
 * 二维向量类
 */
export class Vec2 {
    public x: number;
    public y: number;

    /**
     * 创建一个向量
     * @param x 向量的x坐标
     * @param y 向量的y坐标
     * @internal
     */
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }
}

/**
 * 创建Vec2的快捷函数
 * @internal
 */
export function v2(x: number = 0, y: number = 0): Vec2 {
    return new Vec2(x, y);
} 