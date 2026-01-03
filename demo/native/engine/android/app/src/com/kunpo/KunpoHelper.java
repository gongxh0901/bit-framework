package com.kunpo;

import android.app.Activity;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.util.Log;

public class KunpoHelper {
    private static final String TAG = "kunpo helper::";

    private static Activity _activity = null;
    public static void setActivity(Activity activity) {
        _activity = activity;
    }

    public static void getSystemInfo() {
        
    }

    public static String getVersionCode() {
        String localVersion = "0.0.1";
        try {
            PackageInfo packageInfo = _activity.getApplicationContext().getPackageManager().getPackageInfo(_activity.getPackageName(), 0);
            localVersion = packageInfo.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return localVersion;
    }

    public static int getBuildCode() {
        int localVersion = 0;
        try {
            PackageInfo packageInfo = _activity.getApplicationContext().getPackageManager().getPackageInfo(_activity.getPackageName(), 0);
            localVersion = packageInfo.versionCode;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return localVersion;
    }

    /**
     * 回调给JS层的接口
     * @param json 格式 { function: string, args: string }
     */
    public static native void CallJS(String json);
}
