import { Rect } from "./Rect";
import { Vec2 } from "./Vec2";

/**
 * 2D碰撞检测工具类
 * 
 * @internal
 */
export class Intersection2D {
    /**
     * 检测两个圆是否相交
     * @param center1 第一个圆的中心
     * @param radius1 第一个圆的半径
     * @param center2 第二个圆的中心
     * @param radius2 第二个圆的半径
     * 
     * @internal
     */
    static circleCircle(center1: Vec2, radius1: number, center2: Vec2, radius2: number): boolean {
        const dx = center1.x - center2.x;
        const dy = center1.y - center2.y;
        const distanceSq = dx * dx + dy * dy;
        const radiusSum = radius1 + radius2;
        return distanceSq <= radiusSum * radiusSum;
    }

    /**
     * 检测多边形和圆是否相交
     * @param polygon 多边形的顶点数组
     * @param center 圆的中心
     * @param radius 圆的半径
     * 
     * @internal
     */
    static polygonCircle(polygon: Vec2[], center: Vec2, radius: number): boolean {
        // 首先检查圆心是否在多边形内
        if (this.pointInPolygon(center, polygon)) {
            return true;
        }

        // 检查圆是否与多边形的任意边相交
        for (let i = 0; i < polygon.length; i++) {
            const j = (i + 1) % polygon.length;
            if (this.lineCircle(polygon[i], polygon[j], center, radius)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 检测两个轴对齐矩形是否相交（零GC版本）
     * @param rect1 第一个矩形
     * @param pos1 第一个矩形的位置
     * @param rect2 第二个矩形
     * @param pos2 第二个矩形的位置
     * 
     * @internal
     */
    static rectRect(rect1: Rect, pos1: Vec2, rect2: Rect, pos2: Vec2): boolean {
        return !(rect1.xMax + pos1.x < rect2.xMin + pos2.x
            || rect2.xMax + pos2.x < rect1.xMin + pos1.x
            || rect1.yMax + pos1.y < rect2.yMin + pos2.y
            || rect2.yMax + pos2.y < rect1.yMin + pos1.y);
    }

    /**
     * 检测两个多边形是否相交
     * @param polygon1 第一个多边形的顶点数组
     * @param polygon2 第二个多边形的顶点数组
     */
    static polygonPolygon(polygon1: Vec2[], polygon2: Vec2[]): boolean {
        // 使用SAT (Separating Axis Theorem) 分离轴定理
        return this.satTest(polygon1, polygon2) && this.satTest(polygon2, polygon1);
    }

    /**
     * 检测点是否在多边形内（射线法）
     * @param point 检测点
     * @param polygon 多边形顶点数组
     * 
     * @internal
     */
    static pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
        let inside = false;
        const x = point.x;
        const y = point.y;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;

            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }

    /**
     * 检测线段和圆是否相交
     * @param start 线段起点
     * @param end 线段终点
     * @param center 圆心
     * @param radius 圆半径
     * 
     * @internal
     */
    private static lineCircle(start: Vec2, end: Vec2, center: Vec2, radius: number): boolean {
        // 计算线段到圆心的最短距离
        const A = center.x - start.x;
        const B = center.y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        if (lenSq === 0) {
            // 线段是一个点
            const dx = center.x - start.x;
            const dy = center.y - start.y;
            return dx * dx + dy * dy <= radius * radius;
        }

        let param = dot / lenSq;

        if (param < 0) {
            // 最近点是线段起点
            const dx = center.x - start.x;
            const dy = center.y - start.y;
            return dx * dx + dy * dy <= radius * radius;
        } else if (param > 1) {
            // 最近点是线段终点
            const dx = center.x - end.x;
            const dy = center.y - end.y;
            return dx * dx + dy * dy <= radius * radius;
        } else {
            // 最近点在线段上
            const closestX = start.x + param * C;
            const closestY = start.y + param * D;
            const dx = center.x - closestX;
            const dy = center.y - closestY;
            return dx * dx + dy * dy <= radius * radius;
        }
    }

    /**
     * SAT分离轴定理，用于检测两个多边形是否相交
     * @param polygon1 第一个多边形
     * @param polygon2 第二个多边形
     * 
     * @internal
     */
    private static satTest(polygon1: Vec2[], polygon2: Vec2[]): boolean {
        const len1 = polygon1.length;
        const len2 = polygon2.length;

        for (let i = 0; i < len1; i++) {
            const j = (i + 1) % len1;
            const v1 = polygon1[i];
            const v2 = polygon1[j];

            // 获取垂直于当前边的法向量
            const normalX = v2.y - v1.y;
            const normalY = v1.x - v2.x;

            // 快速归一化检查 - 如果法向量为零则跳过
            if (normalX === 0 && normalY === 0) {
                continue;
            }

            // 内联投影计算，避免函数调用开销
            let min1 = polygon1[0].x * normalX + polygon1[0].y * normalY;
            let max1 = min1;
            let min2 = polygon2[0].x * normalX + polygon2[0].y * normalY;
            let max2 = min2;

            // 优化：从索引1开始，避免重复计算
            for (let k = 1; k < len1; k++) {
                const dot = polygon1[k].x * normalX + polygon1[k].y * normalY;
                if (dot < min1) {
                    min1 = dot
                } else if (dot > max1) {
                    max1 = dot
                }
            }

            for (let k = 1; k < len2; k++) {
                const dot = polygon2[k].x * normalX + polygon2[k].y * normalY;
                if (dot < min2) {
                    min2 = dot
                } else if (dot > max2) {
                    max2 = dot
                }
            }

            // 检查分离
            if (max1 < min2 || max2 < min1) {
                return false;
            }
        }

        return true; // 没有找到分离轴，多边形相交
    }
} 