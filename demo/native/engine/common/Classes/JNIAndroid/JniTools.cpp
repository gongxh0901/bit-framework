//
//  JniTools.cpp
//  kungpowGame
//
//  Created by GongXH on 2021/3/26.
//

#include "JniTools.h"
#include "../SDKHelper.h"
#include <jni.h>
#include <android/log.h>
#include <java/jni/JniHelper.h>
#include "application/ApplicationManager.h"
using namespace cc;

#define KUNPO_HELPER "com/kunpo/KunpoHelper"

std::string JniTools::getVersionCode() {
    return JniHelper::callStaticStringMethod(KUNPO_HELPER,"getVersionCode");
}

int JniTools::getBuildCode() {
    return JniHelper::callStaticIntMethod(KUNPO_HELPER,"getBuildCode");
}

#pragma -mark java回调c++
#if (CC_PLATFORM == CC_PLATFORM_ANDROID)
extern "C"
{
    JNIEXPORT void Java_com_kunpo_KunpoHelper_CallJS(JNIEnv* env, jclass thiz, jstring jsjson)
    {
        std::string json = JniHelper::jstring2string(jsjson);
        CC_CURRENT_ENGINE()->getScheduler()->performFunctionInCocosThread([=]() {
             KunpoSDK::SDKHelper::getInstance()->callJS(json.c_str());
        });
    }
}
#endif
