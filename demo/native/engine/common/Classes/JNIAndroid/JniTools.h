//
//  JniTools.hpp
//  ZumaGame
//
//  Created by GongXH on 2021/3/26.
//

#ifndef JniTools_hpp
#define JniTools_hpp
#include "cocos.h"
class JniTools
{
public:
    //调用Java的方法
    static std::string getVersionCode();
    static int getBuildCode();
};
#endif /* JniTools_hpp */
