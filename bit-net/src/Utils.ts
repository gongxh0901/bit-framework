/**
 * @Author: Gongxh
 * @Date: 2025-04-11
 * @Description: 
 */

export class Utils {
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

        let paramPairs: string[] = [];
        for (let paramKey in urlData.params) {
            if (urlData.params.hasOwnProperty(paramKey)) {
                paramPairs.push(`${paramKey}=${urlData.params[paramKey]}`);
            }
        }
        return urlData.url + "?" + paramPairs.join("&");
    }
}