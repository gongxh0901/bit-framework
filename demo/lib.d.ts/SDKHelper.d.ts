/**
 * @Author: Gongxh
 * @Date: 2025-03-21
 * @Description: 
 */

declare namespace KunpoSDK {
    class SDKHelper {
        static getInstance(): SDKHelper;

        public getSystemInfo(): void;
        public getVersionCode(): string;
        public getBuildCode(): number;

    }
}
