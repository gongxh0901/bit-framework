/**
 * @Author: Gongxh
 * @Date: 2025-03-06
 * @Description: 时间工具
 */

import { game } from "cc";
import { debug } from "./log";

/** 时间对象缓存 */
let TimeCache: Date = null;

export class Time {
    /** 
     * 游戏系统启动时间戳
     * @internal
     */
    private static _osBootTime: number = 0;

    /** 
     * 主动设置的网络时间 单位ms
     * @internal
     */
    private static _netTime: number = 0;

    /** 
     * 本地时间与网路时间的偏移量 单位ms
     * @internal
     */
    private static _netTimeDiff: number = 0;

    /** 
     * 获取当前毫秒时间戳
     * @internal
     */
    private static _nowTimestamp: () => number;

    /** 获取游戏系统启动时间戳 */
    public static get osBootTime(): number { return this._osBootTime; }

    /** 获取主动设置的网络时间 单位ms */
    public static get netTime(): number { return this._netTime; }

    /** 获取本地时间与网路时间的偏移量 单位ms */
    public static get netTimeDiff(): number { return this._netTimeDiff; }

    /** 获取系统运行时间 */
    public static get runTime(): number { return Math.floor(game.totalTime); }

    /**
     * 配置系统启动时间
     * @internal
     */
    public static _configBoot(): void {
        this._osBootTime = Math.floor(Date.now());
        TimeCache = new Date();
        this._nowTimestamp = (): number => {
            return this._osBootTime + this.runTime;
        }
        debug("系统启动时间", this.formatTime(this._osBootTime));
    }

    /**
     * 设置网络时间, 单位ms
     * @param netTime 网络时间
     */
    public static setNetTime(netTime: number): void {
        if (netTime == 0) {
            return;
        }
        this._netTime = netTime;
        const localTime = this._nowTimestamp();
        this._netTimeDiff = Math.floor(this.netTime - localTime);
        debug(`设置网络时间: net(${this.formatTime(this.netTime)}), boot(${this.formatTime(this.osBootTime)}), diff(${Math.abs(this.netTimeDiff / 1000)}秒)`);
    }

    /**
     * 获取当前时间 单位ms
     */
    public static now(): number {
        return this._nowTimestamp() + this.netTimeDiff;
    }

    /**
     * 将毫秒转换为秒
     * @param ms 毫秒
     */
    public static msTos(ms: number): number {
        return Math.floor((ms || 0) / 1000);
    }

    /**
     * 将秒转换为毫秒
     */
    public static sToMs(s: number): number {
        return (s || 0) * 1000;
    }

    /**
     * 获取年份
     * @param timestamp 时间戳 (ms)
     * @returns 年份
     */
    public static getYear(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        return TimeCache.getFullYear();
    }

    /**
     * 获取月份
     * @param timestamp 时间戳 (ms)
     * @returns 月份
     */
    public static getMonth(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        return TimeCache.getMonth() + 1;
    }

    /**
     * 获取日期
     * @param timestamp 时间戳 (ms)
     * @returns 日期
     */
    public static getDay(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        return TimeCache.getDate();
    }

    /**
     * 获取小时
     * @param timestamp 时间戳 (ms)
     * @returns 小时
     */
    public static getHour(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        return TimeCache.getHours();
    }

    /**
     * 获取分钟
     * @param timestamp 时间戳 (ms)
     * @returns 分钟
     */
    public static getMinute(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        return TimeCache.getMinutes();
    }

    /**
     * 获取秒
     * @param timestamp 时间戳 (ms)
     * @returns 秒
     */
    public static getSecond(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        return TimeCache.getSeconds();
    }

    /**
     * 获取当天开始时间
     * @param timestamp 时间戳 (ms)
     * @returns 时间戳 (ms)
     */
    public static getDayStartTime(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        TimeCache.setHours(0, 0, 0, 0);
        return TimeCache.getTime();
    }

    /** 
     * 获取当天的结束时间
     * @param timestamp 时间戳 (ms)
     * @returns 时间戳 (ms)
     */
    public static getDayEndTime(timestamp?: number): number {
        return this.getDayStartTime(timestamp) + 86400000;
    }

    /**
     * 获取传入时间是周几
     * @param {number} [time] (ms)
     * @returns {number}
     */
    public static getWeekDay(time?: number): number {
        TimeCache.setTime(time || Time.now());
        return TimeCache.getDay() || 7;
    }

    /**
     * 获取当前周的开始时间
     * @param timestamp 时间戳 (ms)
     * @returns 时间戳 (ms)
     */
    public static getWeekStartTime(timestamp?: number): number {
        return this.getDayStartTime(timestamp - this.getWeekDay(timestamp) * 86400000);
    }

    public static getWeekEndTime(timestamp?: number): number {
        return this.getWeekStartTime(timestamp) + 86400000 * 7;
    }

    /**
     * 获取当前月开始时间
     * @param timestamp 时间戳 (ms)
     * @returns 时间戳 (ms)
     */
    public static getMonthStartTime(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        TimeCache.setDate(1);
        TimeCache.setHours(0, 0, 0, 0);
        return TimeCache.getTime();
    }

    /**
     * 获取当前月结束时间
     * @param timestamp 时间戳 (ms)
     * @returns 时间戳 (ms)
     */
    public static getMonthEndTime(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        TimeCache.setDate(1);
        TimeCache.setHours(0, 0, 0, 0);
        TimeCache.setMonth(TimeCache.getMonth() + 1);
        return TimeCache.getTime();
    }

    /**
     * 获取当前年份开始时间
     * @param timestamp 时间戳 (ms)
     * @returns 时间戳 (ms)
     */
    public static getYearStartTime(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        TimeCache.setMonth(0);
        TimeCache.setDate(1);
        TimeCache.setHours(0, 0, 0, 0);
        return TimeCache.getTime();
    }

    /**
     * 获取当前年份结束时间
     * @param timestamp 时间戳 (ms)
     * @returns 时间戳 (ms)
     */
    public static getYearEndTime(timestamp?: number): number {
        TimeCache.setTime(timestamp || this.now());
        TimeCache.setMonth(0);
        TimeCache.setDate(1);
        TimeCache.setHours(0, 0, 0, 0);
        TimeCache.setFullYear(TimeCache.getFullYear() + 1);
        return TimeCache.getTime();
    }

    /**
     * 获取当前月的天数
     * @param timestamp 时间戳 (ms)
     * @returns 天数
     */
    public static getMonthDays(timestamp?: number): number {
        const monthEndTime = this.getMonthEndTime(timestamp);
        const monthStartTime = this.getMonthStartTime(timestamp);
        return Math.round((monthEndTime - monthStartTime) / 86400000);
    }

    /** 
     * 是否是同一天
     * @param timestamp1 时间戳1 (ms)
     * @param now 时间戳2 (ms) 如果不传，则和当前时间比较
     * @returns 是否是同一天
     */
    public static isSameDay(timestamp1: number, now?: number): boolean {
        now = now || this.now();
        if (now - timestamp1 > 86400000) {
            return false;
        }
        return this.getDayStartTime(timestamp1) === this.getDayStartTime(now);
    }

    /** 
     * 是否是同一周
     * @param timestamp1 时间戳1 (ms)
     * @param now 时间戳2 (ms) 如果不传，则和当前时间比较
     * @returns 是否是同一周
     */
    public static isSameWeek(timestamp1: number, now?: number): boolean {
        now = now || this.now();
        if (now - timestamp1 > 86400000 * 7) {
            return false;
        }
        return this.getWeekStartTime(timestamp1) === this.getWeekStartTime(now);
    }

    /** 
     * 是否是同一月
     * @param timestamp1 时间戳1 (ms)
     * @param now 时间戳2 (ms) 如果不传，则和当前时间比较
     * @returns 是否是同一月
     */
    public static isSameMonth(timestamp1: number, now?: number): boolean {
        now = now || this.now();
        TimeCache.setTime(timestamp1);
        const month1 = TimeCache.getMonth();
        const year1 = TimeCache.getFullYear();
        TimeCache.setTime(now);
        const month2 = TimeCache.getMonth();
        const year2 = TimeCache.getFullYear();
        return month1 === month2 && year1 === year2;
    }

    /**
     * 是否是同一年
     * @param timestamp1 时间戳1 (ms)
     * @param now 时间戳2 (ms) 如果不传，则和当前时间比较
     * @returns 是否是同一年
     */
    public static isSameYear(timestamp1: number, now?: number): boolean {
        now = now || this.now();
        // 直接比较年份，避免使用天数计算可能出现的边界错误
        TimeCache.setTime(timestamp1);
        const year1 = TimeCache.getFullYear();
        TimeCache.setTime(now);
        const year2 = TimeCache.getFullYear();
        return year1 === year2;
    }

    /**
     * 通用时间格式化方法
     * @param timestamp 时间戳 (ms)
     * @param pattern 格式化模板
     * 
     * 支持的占位符(大写补零,小写不补零):
     * - YYYY: 四位年份 (2025) | YY: 两位年份 (25)
     * - MM: 两位月份 (01-12) | M: 月份 (1-12)
     * - DD: 两位日期 (01-31) | D: 日期 (1-31)
     * - hh: 两位小时 (00-23) | h: 小时 (0-23)
     * - mm: 两位分钟 (00-59) | m: 分钟 (0-59)
     * - ss: 两位秒 (00-59) | s: 秒 (0-59)
     * 
     * @example
     * Time.format(timestamp, 'YYYY-MM-DD hh:mm:ss') // "2025-01-05 14:30:45"
     * Time.format(timestamp, 'YYYY年MM月DD日 hh:mm') // "2025年01月05日 14:30"
     * Time.format(timestamp, 'M月D日 h时m分') // "1月5日 14时30分"
     */
    public static format(timestamp: number, pattern: string): string {
        TimeCache.setTime(timestamp);

        const year = TimeCache.getFullYear();
        const month = TimeCache.getMonth() + 1;
        const day = TimeCache.getDate();
        const hour = TimeCache.getHours();
        const minute = TimeCache.getMinutes();
        const second = TimeCache.getSeconds();

        const pad = (n: number): string => n < 10 ? `0${n}` : `${n}`;

        return pattern
            .replace(/YYYY/g, `${year}`)
            .replace(/YY/g, pad(year % 100))
            .replace(/MM/g, pad(month))
            .replace(/M/g, `${month}`)
            .replace(/DD/g, pad(day))
            .replace(/D/g, `${day}`)
            .replace(/hh/g, pad(hour))
            .replace(/h/g, `${hour}`)
            .replace(/mm/g, pad(minute))
            .replace(/m/g, `${minute}`)
            .replace(/ss/g, pad(second))
            .replace(/s/g, `${second}`);
    }

    /**
     * 格式化时间 格式: xxxx-xx-xx hh:mm:ss
     * @param timestamp 时间戳 (ms)
     */
    public static formatTime(timestamp: number): string {
        return this.format(timestamp, 'YYYY-MM-DD hh:mm:ss');
    }

    /**
     * 格式化时间 格式: xxxx年xx月xx日 hh:mm:ss
     * @param timestamp 时间戳 (ms)
     */
    public static formatTimeChinese(timestamp: number): string {
        return this.format(timestamp, 'YYYY年MM月DD日 hh:mm:ss');
    }

    /**
     * 通用时长格式化方法
     * @param seconds 时长(秒)
     * @param pattern 格式化模板
     * @param options 格式化选项
     * 
     * 支持的占位符(大写补零,小写不补零):
     * - DD/D: 天数
     * - HH/H: 总小时数(可超过24)
     * - hh/h: 小时数(0-23范围)
     * - MM/M: 总分钟数(可超过60)
     * - mm/m: 分钟数(0-59范围)
     * - ss/s: 秒数(0-59范围)
     * 
     * options.autoHide: 自动隐藏为0的高位单位(默认false)
     * 
     * @example
     * Time.formatDuration(3661, 'HH:mm:ss')     // "01:01:01"
     * Time.formatDuration(3661, 'MM:ss')        // "61:01"
     * Time.formatDuration(3661, 'H小时m分s秒')   // "1小时1分1秒"
     * Time.formatDuration(90061, 'DD天hh:mm:ss') // "1天01:01:01"
     * Time.formatDuration(125, 'HH:mm:ss', { autoHide: true }) // "02:05"
     * Time.formatDuration(3661, 'DD天HH时mm分ss秒', { autoHide: true }) // "1时1分1秒"
     */
    public static formatDuration(seconds: number, pattern: string, options?: { autoHide?: boolean }): string {
        const time = Math.floor(seconds < 0 ? 0 : seconds);

        const day = Math.floor(time / 86400);
        const totalHours = Math.floor(time / 3600);
        const totalMinutes = Math.floor(time / 60);
        const hour = Math.floor((time % 86400) / 3600);
        const minute = Math.floor((time % 3600) / 60);
        const second = time % 60;

        const pad = (n: number): string => n < 10 ? `0${n}` : `${n}`;

        // 如果启用自动隐藏，移除值为0的高位单位
        let result = pattern;
        if (options?.autoHide) {
            // 检测天数
            if (day === 0) {
                result = result.replace(/DD天?|D天?/g, '');
            }
            // 检测小时（需要天数为0时才隐藏）
            if (day === 0 && hour === 0 && totalHours === 0) {
                result = result.replace(/HH[时:]?|H[时:]?|hh[时:]?|h[时:]?/g, '');
            }
            // 检测分钟（需要天数和小时都为0时才隐藏）
            if (day === 0 && hour === 0 && totalHours === 0 && minute === 0 && totalMinutes === 0) {
                result = result.replace(/MM[分:]?|M[分:]?|mm[分:]?|m[分:]?/g, '');
            }
            // 清理多余的分隔符
            result = result.replace(/^[:\s]+|[:\s]+$/g, '').replace(/\s{2,}/g, ' ');
        }

        return result
            .replace(/DD/g, pad(day))
            .replace(/D/g, `${day}`)
            .replace(/HH/g, pad(totalHours))
            .replace(/H/g, `${totalHours}`)
            .replace(/hh/g, pad(hour))
            .replace(/h/g, `${hour}`)
            .replace(/MM/g, pad(totalMinutes))
            .replace(/M/g, `${totalMinutes}`)
            .replace(/mm/g, pad(minute))
            .replace(/m/g, `${minute}`)
            .replace(/ss/g, pad(second))
            .replace(/s/g, `${second}`);
    }

    /**
     * 智能格式化时长 - 自动隐藏为0的高位单位
     * @param time 时间 (s)
     * @param pattern 格式化模板，默认 'D天h小时m分s秒'
     * 
     * @example
     * Time.formatSmart(86461)  // "1天1小时1分1秒"
     * Time.formatSmart(3661)   // "1小时1分1秒"
     * Time.formatSmart(61)     // "1分1秒"
     * Time.formatSmart(1)      // "1秒"
     */
    public static formatSmart(time: number, pattern: string = 'D天h小时m分s秒'): string {
        return this.formatDuration(time, pattern, { autoHide: true });
    }

    /**
     * 智能格式化时长(简化版) - 只显示最大的两个单位，较小单位向上取整
     * @param time 时间 (s)
     * @param pattern 格式化模板，默认 'D天h小时|h小时m分|m分s秒'，用 | 分隔不同级别
     * 
     * @example
     * Time.formatSmartSimple(90061)  // "1天2小时" (1.04小时向上取整为2)
     * Time.formatSmartSimple(3661)   // "1小时2分" (1.02分钟向上取整为2)
     * Time.formatSmartSimple(61)     // "1分2秒" (1.02秒向上取整为2)
     * Time.formatSmartSimple(1)      // "1秒"
     * Time.formatSmartSimple(90061, 'D天h时|h时m分|m分s秒')  // "1天2时"
     */
    public static formatSmartSimple(time: number, pattern: string = 'D天h小时|h小时m分|m分s秒'): string {
        const curTime = Math.floor(time < 0 ? 0 : time);
        const [dayPattern = 'D天h小时', hourPattern = 'h小时m分', minutePattern = 'm分s秒', secondPattern = 's秒'] = pattern.split('|');

        if (curTime >= 86400) {
            const day = Math.floor(curTime / 86400);
            const hour = Math.ceil((curTime % 86400) / 3600);
            return this.formatDuration(day * 86400 + hour * 3600, dayPattern);
        } else if (curTime >= 3600) {
            const hour = Math.floor(curTime / 3600);
            const minute = Math.ceil((curTime % 3600) / 60);
            return this.formatDuration(hour * 3600 + minute * 60, hourPattern);
        } else if (curTime >= 60) {
            const minute = Math.floor(curTime / 60);
            const second = Math.ceil(curTime % 60);
            return this.formatDuration(minute * 60 + second, minutePattern);
        } else {
            return this.formatDuration(curTime, secondPattern);
        }
    }
}