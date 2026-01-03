interface Math {
    /**
     * 限制值
     * @param value 当前值
     * @param min 最小值
     * @param max 最大值
     */
    clampf(value: number, min: number, max: number): number;

    /**
     * 随机从 min 到 max 的整数(包含min和max)
     * @param min
     * @param max
     */
    rand(min: number, max: number): number;

    /**
     * 随机从 min 到 max的数
     * @param min
     * @param max
     */
    randRange(min: number, max: number): number;

    /**
     * 角度转弧度
     * @param angle 角度
     */
    rad(angle: number): number;

    /**
     * 弧度转角度
     * @param radian 弧度
     */
    deg(radian: number): number;

    /**
     * 数值平滑渐变
     * @param num1
     * @param num2
     * @param elapsedTime
     * @param responseTime
     */
    smooth(num1: number, num2: number, elapsedTime: number, responseTime: number): number;
}

Math.clampf = function (value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
};

Math.rand = function (min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

Math.randRange = function (min: number, max: number): number {
    return Math.random() * (max - min) + min;
};

Math.rad = function (angle: number): number {
    return (angle * Math.PI) / 180;
};

Math.deg = function (radian: number): number {
    return (radian * 180) / Math.PI;
};

Math.smooth = function (num1: number, num2: number, elapsedTime: number, responseTime: number): number {
    let out: number = num1;
    if (elapsedTime > 0) {
        out = out + (num2 - num1) * (elapsedTime / (elapsedTime + responseTime));
    }
    return out;
};

