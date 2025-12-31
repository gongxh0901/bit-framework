/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 
 */

export class Utils {
    /**
     * 版本号比较
     * @param version1 本地版本号
     * @param version2 远程版本号
     * 如果返回值大于0，则version1大于version2
     * 如果返回值等于0，则version1等于version2
     * 如果返回值小于0，则version1小于version2
     */
    public static compareVersion(version1: string, version2: string): number {
        let v1 = version1.split('.');
        let v2 = version2.split('.');
        const len = Math.max(v1.length, v2.length);
        while (v1.length < len) {
            v1.push('0');
        }
        while (v2.length < len) {
            v2.push('0');
        }

        for (let i = 0; i < len; ++i) {
            let num1 = parseInt(v1[i]);
            let num2 = parseInt(v2[i]);
            if (num1 > num2) {
                return 1;
            } else if (num1 < num2) {
                return -1;
            }
        }
        return 0;
    }

    /** 
     * 判断传入的字符串是否是json格式的字符串
     */
    public static isJsonString(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 获取url参数
     * @param url 
     */
    public static getUrlParam(url: string): { url: string, params: { [key: string]: string } } {
        let result = { url: "", params: {} as { [key: string]: string } };
        let urlArr = url.split('?');
        result.url = urlArr[0];
        if (urlArr.length > 1) {
            let paramsArr = urlArr[1].split("&");
            for (let i = 0; i < paramsArr.length; i++) {
                let item = paramsArr[i];
                let [key, value] = item.split("=");
                result.params[key] = value;
            }
        }
        return result;
    }

    /**
     * 给url添加参数
     * @param url 
     * @returns 新的url
     */
    public static addUrlParam(url: string, key: string, value: string): string {
        let urlData = this.getUrlParam(url);
        urlData.params[key] = value;
        return urlData.url + "?" + Object.entries(urlData.params).map(([key, value]) => `${key}=${value}`).join("&");
    }
}