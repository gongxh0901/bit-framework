/**
 * @Author: Gongxh
 * @Date: 2025-05-15
 * @Description: 
 */

import { World } from "../World";
import { System } from "./System";

export interface SystemType<T extends System> {
    new(world: World, name: string): T;
    cname: string;
}