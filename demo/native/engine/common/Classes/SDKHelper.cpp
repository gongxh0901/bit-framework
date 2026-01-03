/** 
 * @Author: Gongxh
 * @Date: 2025-03-21
 * @Description: 
 */
#include "SDKHelper.h"
#if (CC_PLATFORM == CC_PLATFORM_ANDROID)
#include "JNIAndroid/JniTools.h"
#elif (CC_PLATFORM == CC_PLATFORM_IOS)

#endif

using namespace KunpoSDK;
namespace KunpoSDK {
}

static SDKHelper helper;

SDKHelper * SDKHelper::getInstance() {
    return &helper;
}

SDKHelper::SDKHelper() { 

}

/** 获取系统信息 */
void SDKHelper::getSystemInfo() {
#if (CC_PLATFORM == CC_PLATFORM_ANDROID)
//    return JniTools::getSystemInfo();
#elif (CC_PLATFORM == CC_PLATFORM_IOS)

#endif
}

std::string SDKHelper::getVersionCode() {
    CC_LOG_DEBUG("SDKHelper 获取版本号");
#if (CC_PLATFORM == CC_PLATFORM_ANDROID)
    return JniTools::getVersionCode();
#elif (CC_PLATFORM == CC_PLATFORM_IOS)

#endif
    
    return "0.0.1";
}

int SDKHelper::getBuildCode() {
    CC_LOG_DEBUG("SDKHelper 获取Build号");
#if (CC_PLATFORM == CC_PLATFORM_ANDROID)
    return JniTools::getBuildCode();
#elif (CC_PLATFORM == CC_PLATFORM_IOS)

#endif
    return 0;
}


void SDKHelper::callJS(const char *jsonString) {
    se::Value callJsHandler;
    if (se::ScriptEngine::getInstance()->getGlobalObject()->getProperty("KunpoNativeCallJsHandler", &callJsHandler) && callJsHandler.isObject()) {
        se::ValueArray args;
        args.push_back(se::Value(jsonString));
        callJsHandler.toObject()->call(args, callJsHandler.toObject());
    }
}
