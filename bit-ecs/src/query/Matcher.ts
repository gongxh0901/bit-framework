/**
 * @Author: Gongxh
 * @Date: 2025-05-15
 * @Description: 查询构建器模式
 */

import { Component } from "../component/Component";
import { ComponentType } from "../component/ComponentType";
import { IMask } from "../utils/IMask";
import { Query } from "./Query";
import { QueryPool } from "./QueryPool";
import { AllOf, AnyOf, BaseRule, ExcludeOf, OptionalOf, RuleType } from "./Rule";

export class Matcher {
    /** @internal */
    private queryPool: QueryPool;
    /** @internal */
    protected rules: BaseRule[] = [];

    /** @internal */
    public ruleAllOf: BaseRule = null;
    /** @internal */
    public ruleAnyOf: BaseRule = null;

    /** @internal */
    protected _indices: number[] = null;
    /** @internal */
    protected _components: number[] = null;

    /** @internal */
    constructor(queryPool: QueryPool) {
        this.queryPool = queryPool;
    }

    /**
     * 匹配器关注的所有组件类型
     */
    public get indices(): number[] {
        if (this._indices == null) {
            this.buildIndices();
        }
        return this._indices;
    }

    /**
     * 匹配器需要获取的组件类型
     */
    public get components(): number[] {
        if (this._components == null) {
            this.buildIndices();
        }
        return this._components;
    }

    /**
     * 必须包含的组件
     * @param componentTypes 组件类型
     */
    public allOf(...componentTypes: ComponentType<Component>[]): Matcher {
        let rule = this.rules.find(rule => rule.type === RuleType.AllOf);
        if (rule) {
            rule.add(...componentTypes);
        } else {
            rule = new AllOf(...componentTypes);
            this.rules.push(rule);
            this.ruleAllOf = rule;
        }
        return this;
    }

    /**
     * 必须包含其中任意一个 性能消耗比较大 慎用
     * 如果要用, 最好和 allOf 一起使用
     * @param componentTypes 组件类型
     */
    public anyOf(...componentTypes: ComponentType<Component>[]): Matcher {
        let rule = this.rules.find(rule => rule.type === RuleType.AnyOf);
        if (rule) {
            rule.add(...componentTypes);
        } else {
            rule = new AnyOf(...componentTypes);
            this.rules.push(rule);
            this.ruleAnyOf = rule;
        }
        return this;
    }

    /**
     * 必须排除
     * @param componentTypes 组件类型
     */
    public excludeOf(...componentTypes: ComponentType<Component>[]): Matcher {
        let rule = this.rules.find(rule => rule.type === RuleType.ExcludeOf);
        rule ? rule.add(...componentTypes) : this.rules.push(new ExcludeOf(...componentTypes));
        return this;
    }

    /**
     * 可选的组件
     * @param componentTypes 组件类型
     */
    public optionalOf(...componentTypes: ComponentType<Component>[]): Matcher {
        let rule = this.rules.find(rule => rule.type === RuleType.OptionalOf);
        rule ? rule.add(...componentTypes) : this.rules.push(new OptionalOf(...componentTypes));
        return this;
    }

    /**
     * 判断是否匹配
     * @param mask 组件掩码
     * @returns 是否匹配
     */
    public isMatch(mask: IMask): boolean {
        for (let i = 0; i < this.rules.length; i++) {
            let rule = this.rules[i];
            if (rule && !rule.isMatch(mask)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 构建并返回查询结果
     * @returns 查询结果
     * @internal
     */
    public build(): Query {
        if (this.rules.length === 0) {
            return null;
        }
        // 从小到大排序
        this.rules.sort((a, b) => a.type - b.type);
        // 然后生成key
        let key = this.generateKey();
        if (!this.ruleAllOf && !this.ruleAnyOf) {
            throw new Error("必须包含至少一个必选规则 allOf 或 anyOf");
        }
        // 最后添加到查询池
        return this.queryPool.add(key, this);
    }

    /**
     * 创建关注的和需要获取的组件类型 
     * @internal
     */
    private buildIndices(): void {
        this._indices = [];
        this._components = [];
        this.rules.forEach((rule) => {
            Array.prototype.push.apply(this._indices, rule.indices);
            if (rule.type !== RuleType.ExcludeOf) {
                Array.prototype.push.apply(this._components, rule.indices);
            }
        });
    }

    /** 
     * 对查询器生成唯一识别码
     * @returns 唯一识别码
     * @internal
     */
    private generateKey(): string {
        let key = "";
        for (let i = 0; i < RuleType.Last; i++) {
            let rule = this.rules[i];
            if (i != 0) {
                key += "|";
            }
            if (rule) {
                key += rule.key;
            }
        }
        return key;
    }
}