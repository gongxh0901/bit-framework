/**
 * @Author: Gongxh
 * @Date: 2025-01-09
 * @Description: 属性辅助类
 */

import { GComponent } from "fairygui-cc";
export interface IPropsConfig {
    [packageName: string]: { [componentName: string]: IPropsInfo };
}

interface IPropsInfo {
    props: (string | number)[];
    callbacks: (string | number)[];
    controls: string[];
    transitions: string[];
}

/** @internal */
export class PropsHelper {
    /** @internal */
    private static _config: IPropsConfig = {};

    /** @internal */
    public static setConfig(config: IPropsConfig): void {
        this._config = config;
    }

    /** 序列化属性 @internal */
    public static serializeProps(component: GComponent, packageName: string, componentName?: string): void {
        if (!this._config) {
            return;
        }
        const config = this._config[packageName];
        if (!config) {
            return;
        }
        componentName = componentName || component.name;
        const propsInfo = config[componentName];
        if (!propsInfo) {
            return;
        }
        // 设置属性
        const props = propsInfo.props;
        this.serializationPropsNode(component, props);

        // 设置回调
        const callbacks = propsInfo.callbacks;
        this.serializationCallbacksNode(component, callbacks);

        // 设置控制器
        const controls = propsInfo.controls;
        this.serializationControlsNode(component, controls);

        // 设置动画
        const transitions = propsInfo.transitions;
        this.serializationTransitionsNode(component, transitions);
    }

    /** 给界面中定义的属性赋值 @internal */
    private static serializationPropsNode(component: GComponent, props: (string | number)[]) {
        const propsCount = props.length;
        // [name1, len, ...props1, name2, len, ...props2, ...]
        let index = 0;
        while (index < propsCount) {
            const propName = props[index++] as string;
            const endIndex = index + (props[index] as number);
            let uinode = component;
            while (++index <= endIndex) {
                uinode = uinode.getChildAt(props[index] as number);
                if (!uinode) {
                    console.warn(`无法对UI类（${component.name}）属性（${propName}）赋值，请检查节点配置是否正确`);
                    break;
                }
            }
            (component as any)[propName] = (uinode == component ? null : uinode);
        }
    }

    /** 给界面中定义的回调赋值 @internal */
    private static serializationCallbacksNode(component: GComponent, callbacks: (string | number)[]) {
        const propsCount = callbacks.length;
        // [name1, len, ...props1, name2, len, ...props2, ...]
        let index = 0;
        while (index < propsCount) {
            const propName = callbacks[index++] as string;
            const endIndex = index + (callbacks[index] as number);
            let uinode = component;
            while (++index <= endIndex) {
                uinode = uinode.getChildAt(callbacks[index] as number);
                if (!uinode) {
                    console.warn(`无法对UI类（${component.name}）的（${propName}）设置回调，请检查节点配置是否正确`);
                    break;
                }
            }
            if (uinode != component) {
                uinode.onClick((component as any)[propName], component);
            }
        }
    }

    /** 给界面中定义的控制器赋值 @internal */
    private static serializationControlsNode(component: GComponent, controls: string[]) {
        const controlsCount = controls.length;
        let index = 0;
        while (index < controlsCount) {
            const propName = controls[index] as string;
            const controlName = controls[index + 1] as string;
            const controller = component.getController(controlName);
            if (!controller) {
                console.warn(`无法对UI类（${component.name}）的（${propName}）设置控制器，请检查配置是否正确`);
                break;
            }
            (component as any)[propName] = controller;
            index += 2;
        }
    }

    /** 给界面中定义的动画赋值 @internal */
    private static serializationTransitionsNode(component: GComponent, transitions: string[]) {
        const transitionsCount = transitions.length;
        let index = 0;
        while (index < transitionsCount) {
            const propName = transitions[index] as string;
            const transitionName = transitions[index + 1] as string;
            const transition = component.getTransition(transitionName);
            if (!transition) {
                console.warn(`无法对UI类（${component.name}）的（${propName}）设置动画，请检查配置是否正确`);
                break;
            }
            (component as any)[propName] = transition;
            index += 2;
        }
    }
}

