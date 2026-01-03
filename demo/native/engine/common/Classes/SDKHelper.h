/** 
 * @Author: Gongxh
 * @Date: 2025-03-21
 * @Description: 
 */

#pragma once
#include "cocos/cocos.h"

namespace KunpoSDK {

    class SDKHelper {
    public:
        /** 单例 */
        static SDKHelper * getInstance();

        SDKHelper();

        /** 获取系统信息 */
        void getSystemInfo();
        /** 获取版本号 */
        std::string getVersionCode();
        /** 获取build号 */
        int getBuildCode();
        
        /**
         * c++ 回调 js
         * 参数：jsonString  格式 { function: string, args: string }
         */
        void callJS(const char* jsonString);
    private:
        
    };
}
