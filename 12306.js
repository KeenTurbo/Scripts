/*
[Script]
# 12306 开屏广告跳过优化 (Request Body)
# 拦截开屏广告请求 (placementNo 0007)，伪造响应，设置极短等待时间并隐藏跳过按钮
^https:\/\/ad\.12306\.cn\/ad\/ser\/getAdList url script-request-body https://raw.githubusercontent.com/your_github_repo/12306_splash_ad_skip.js

[MITM]
hostname = ad.12306.cn
*/

// 脚本代码开始
const version = 'V1.1'; // 更新版本号

let requestBody = $request.body;
let requestObj = {};

try {
    requestObj = JSON.parse(requestBody);

    // 检查请求体中的 placementNo 是否是开屏广告 (0007)
    if (requestObj && requestObj.placementNo === "0007") {
        console.log(`12306 Ad Request Script: Matched splash ad request (placementNo: ${requestObj.placementNo}). Forging response.`);

        // 构造伪造的响应体
        let forgedResponseBody = {
            code: "00", // 成功码
            rid: "fake_splash_rid_" + Date.now(), // 伪造一个随机ID
            materialsList: [], // 清空广告素材列表，确保不显示任何广告内容
            advertParam: {
                // 参考响应体 3 的结构，但修改关键参数
                chacheTime: 600000,
                index: 0,
                showSkipBtn: 0, // 隐藏跳过按钮
                displayNumDi: 0, // 不显示
                bs: 2,
                isAfc: 1,
                skipTime: 1, // 设置等待时间为1毫秒，理论上最短
                isDefault: 0,
                marginBottom: 15,
                fixedscreen: 3,
                skipTimeAgain: 0, // 设置为0或一个很小的值
                isFullScreen: 0
            },
            message: "Fake splash ad response by script" // 添加一个消息说明
        };

        console.log("12306 Ad Request Script: Forged response with skipTime=1, showSkipBtn=0, empty materialsList.");

        // 使用 $done({response: {body: ...}}) 返回伪造的响应
        // 这会阻止原始请求发送到服务器，并立即将伪造的响应返回给应用
        $done({ response: { body: JSON.stringify(forgedResponseBody) } });

    } else {
        // 如果不是开屏广告请求 (placementNo 不是 0007, 或者请求体结构不符)，
        // 则让原始请求正常发送到服务器。
        if (requestObj && requestObj.placementNo) {
             console.log(`12306 Ad Request Script: Not splash ad request (placementNo: ${requestObj.placementNo}). Passing request through.`);
        } else {
             console.log("12306 Ad Request Script: Request body structure unexpected or placementNo missing. Passing request through.");
        }
        $done({}); // $done({}) 表示不修改请求，让它继续发送
    }

} catch (e) {
    console.error("12306 Ad Request Script Error:", e);
    // 发生错误时，让请求正常发送，避免应用崩溃
    $done({});
}
// 脚本代码结束