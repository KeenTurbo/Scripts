/*
[Script]
# 12306 开屏广告跳过优化
# 修改广告响应，将等待时间设置为极短
^https:\/\/ad\.12306\.cn\/ad\/ser\/getAdList url script-response-body https://raw.githubusercontent.com/KeenTurbo/Scripts/refs/heads/master/12306.js

[MITM]
hostname = ad.12306.cn
*/

let body = $response.body;
let obj = {};

try {
    obj = JSON.parse(body);

    // 检查是否存在 advertParam 结构
    if (obj && obj.advertParam) {
        console.log("12306 Ad Response: Found advertParam. Original skipTime:", obj.advertParam.skipTime);

        // 修改 skipTime 为极小值 (0 或 1)
        obj.advertParam.skipTime = 0; // 设置为1毫秒，避免设置为0可能引起的其他问题

        // 可选：清空 materialsList，确保不显示任何广告内容
        obj.materialsList = [];
        console.log("12306 Ad Response: materialsList cleared.");

        console.log("12306 Ad Response: Modified skipTime to", obj.advertParam.skipTime);

        // 将修改后的对象转回 JSON 字符串
        body = JSON.stringify(obj);

        // 返回修改后的响应体
        $done({body});

    } else {
        console.log("12306 Ad Response: advertParam not found or response structure unexpected. Passing through.");
        // 如果结构不符合预期，则不修改，直接返回原始响应
        $done({body});
    }

} catch (e) {
    console.error("12306 Ad Response Script Error:", e);
    // 发生错误时，也直接返回原始响应
    $done({body});
}