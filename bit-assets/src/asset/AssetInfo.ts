/**
 * @Author: Gongxh
 * @Date: 2025-10-21
 * @Description: 
 */

import { Asset, AssetManager, resources } from "cc";
import { IAssetConfig, StateType } from "./header";

export class AssetInfo implements IAssetConfig {
    /** @internal */
    public _type: typeof Asset = Asset;

    /** @internal */
    public _path: string = "";

    /** @internal */
    public _isFile: boolean = false;

    /** @internal */
    public _bundle: string = "resources";

    /** @internal */
    public _assetBundle: AssetManager.Bundle = resources;

    /** @internal */
    public _status: StateType = StateType.Wait;

    /**
     * @param info IAssetConfig 资源配置
     * @param count number 资源数量
     * 
     * @internal
     */
    constructor(info: IAssetConfig, bundle: AssetManager.Bundle, status: StateType = StateType.Wait) {
        this._type = info.type || Asset;
        this._path = info.path;
        this._isFile = info.isFile || false;
        this._bundle = info.bundle || "resources";
        this._assetBundle = bundle;

        this._status = status;
    }

    /** 固定的属性 */
    public get type(): typeof Asset { return this._type; }
    public get path(): string { return this._path; }
    public get isFile(): boolean { return this._isFile; }
    public get bundle(): string { return this._bundle; }
    public get assetBundle(): AssetManager.Bundle { return this._assetBundle; }


    /** 可变的属性 */
    public get status(): StateType { return this._status; }
    public set status(status: StateType) { this._status = status; }
}