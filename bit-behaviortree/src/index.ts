
/** 行为树 */
export { BehaviorTree } from "./behaviortree/BehaviorTree";
export { Blackboard, globalBlackboard } from "./behaviortree/Blackboard";
export * from "./behaviortree/BTNode/Action";
export { IBTNode } from "./behaviortree/BTNode/BTNode";
export * from "./behaviortree/BTNode/Composite";
export * from "./behaviortree/BTNode/Condition";
export * from "./behaviortree/BTNode/Decorator";
export { createBehaviorTree, INodeConfig } from "./behaviortree/Factory";
export { Status } from "./behaviortree/header";

// 导出装饰器内容
import { BT } from "./behaviortree/BT";
export const { ClassAction, ClassCondition, ClassComposite, ClassDecorator, prop, ParamType } = BT;