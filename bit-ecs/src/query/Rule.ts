/**
 * @Author: Gongxh
 * @Date: 2025-05-23
 * @Description: 查询规则
 */

import { ComponentType } from "../component/ComponentType";
import { IComponent } from "../component/IComponent";
import { createMask, IMask } from "../utils/IMask";

export enum RuleType {
    None = 0,
    AllOf = 1,
    AnyOf = 2,
    ExcludeOf = 3,
    OptionalOf = 4,
    Last,
}

export abstract class BaseRule {
    public type: RuleType = RuleType.None;
    /** 包含的值 */
    public indices: number[] = [];
    protected _mask: IMask = createMask();
    private _key: string = "";

    constructor(...args: ComponentType<IComponent>[]) {
        this.add(...args);
    }

    public add(...args: ComponentType<IComponent>[]): void {
        let len = args.length;
        for (let i = 0; i < len; i++) {
            let ctype = args[i].ctype;
            if (ctype == 0) {
                console.error(`存在未注册的组件！${args[i].cname}`);
            }
            if (!this._mask.has(ctype)) {
                this._mask.set(ctype);
                this.indices.push(ctype);
            }
        }

        len > 0 && this.indices.sort((a, b) => a - b);
        this._key = this.indices.join('-');
    }

    public abstract isMatch(mask: IMask): boolean;

    public get key(): string {
        return this._key;
    }

    public get isEmpty(): boolean {
        return this.indices.length === 0;
    }
}

/**
 * 必须全部包含
 */
export class AllOf extends BaseRule {
    public type: RuleType = RuleType.AllOf;
    public isMatch(mask: IMask): boolean {
        return mask.include(this._mask);
    }
}

/**
 * 包含任意一个就行
 */
export class AnyOf extends BaseRule {
    public type: RuleType = RuleType.AnyOf;
    public isMatch(mask: IMask): boolean {
        return mask.any(this._mask);
    }
}

/** 
 * 必须排除的
 */
export class ExcludeOf extends BaseRule {
    public type: RuleType = RuleType.ExcludeOf;
    public isMatch(mask: IMask): boolean {
        return !mask.any(this._mask);
    }
}

/**
 * 可选的
 */
export class OptionalOf extends BaseRule {
    public type: RuleType = RuleType.OptionalOf;
    public isMatch(mask: IMask): boolean {
        return true;
    }
}

// class Test1 implements IComponent {
//     static ctype: number = 1;
//     static cname: string = "Test1";
//     reset(): void {
//     }
// }

// class Test2 implements IComponent {
//     static ctype: number = 2;
//     static cname: string = "Test2";
//     reset(): void {
//     }
// }
// let aaaa = new ExcludeOf(Test1, Test2);
// console.log("aaaa", aaaa.type);