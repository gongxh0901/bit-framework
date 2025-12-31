/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 
 */

/** @internal */
export class Event {
    public id: number;
    public name: string;
    public target: any;
    public once: boolean = false;
    public callback: (...arg: any[]) => void;
}