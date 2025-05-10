/*
[Script]
# 车来了广告API拦截 (Response Body) - 清空广告数据
# 拦截广告API响应，修改JSON数据，清空 ads 数组，阻止广告显示和空白区域
# 匹配 URL: ^https:\/\/cdn\.api\.chelaileapp\.cn\/adpub\/.*
^https:\/\/cdn\.api\.chelaileapp\.cn\/adpub\/.* url script-response-body https://raw.githubusercontent.com/KeenTurbo/Scripts/refs/heads/master/chelaile_banner_replace.js

[MITM]
hostname = cdn.api.chelaileapp.cn
*/

// 脚本代码开始
const version = 'API_V1.1'; // 更新版本号

console.log(`Chelaile Ad API Modify Script ${version}: Intercepted response for ${$request.url}`);

let response = $response;
let body = response.body;

// 检查并处理 YGKJ...## 格式的响应体
if (body && body.startsWith('YGKJ') && body.endsWith('##')) {
    console.log("Chelaile Ad API Modify Script: Detected YGKJ...## format.");
    try {
        // 提取核心 JSON 字符串
        const jsonString = body.substring(4, body.length - 2);
        console.log("Chelaile Ad API Modify Script: Extracted JSON string.");

        // 解析 JSON
        let obj = JSON.parse(jsonString);
        console.log("Chelaile Ad API Modify Script: Parsed JSON.");

        // 检查并清空 ads 数组
        if (obj && obj.jsonr && obj.jsonr.data && Array.isArray(obj.jsonr.data.ads)) {
             if (obj.jsonr.data.ads.length > 0) {
                console.log(`Chelaile Ad API Modify Script: Clearing ads array (original length: ${obj.jsonr.data.ads.length}).`);
                obj.jsonr.data.ads = []; // 清空广告数组
             } else {
                 console.log("Chelaile Ad API Modify Script: Ads array is already empty.");
             }
        } else {
            console.log("Chelaile Ad API Modify Script: ads array path not found or not an array.");
        }

        // 将修改后的对象转回 JSON 字符串
        const modifiedJsonString = JSON.stringify(obj);
        console.log("Chelaile Ad API Modify Script: Stringified modified JSON.");

        // 重新包裹在 YGKJ 和 ## 之间
        const modifiedBody = 'YGKJ' + modifiedJsonString + '##';
        console.log(`Chelaile Ad API Modify Script: Re-wrapped body. Original length: ${body.length}, Modified length: ${modifiedBody.length}`);

        // 更新响应体
        response.body = modifiedBody;
        console.log("Chelaile Ad API Modify Script: Response body updated.");

        // 使用 $done() 返回修改后的响应
        $done(response);

    } catch (e) {
        console.error("Chelaile Ad API Modify Script: Error processing YGKJ...## body: " + e.message);
        // 如果出错，放行原始响应
        $done(response);
    }
} else {
    console.log("Chelaile Ad API Modify Script: Body does not match YGKJ...## format. Passing through.");
    // 如果不是预期的格式，直接放行原始响应
    $done(response);
}

// 脚本代码结束