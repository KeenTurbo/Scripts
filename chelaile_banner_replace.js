/*
[Script]
# 车来了顶部横幅广告图片替换 (Response Body) - 强制替换版
# 拦截指定的广告图片请求，返回一个1x1透明PNG，避免空白区域，即使原始响应不完整
# 注意：此脚本会强制替换，即使原始请求被其他规则(如reject)中断，可能影响日志准确性。
^https:\/\/image3\.chelaile\.net\.cn\/77a42D3P\.jpg url script-response-body https://raw.githubusercontent.com/KeenTurbo/Scripts/refs/heads/master/chelaile_banner_replace.js

[MITM]
hostname = image3.chelaile.net.cn
*/

// 脚本代码开始
const version = 'V1.1'; // 更新版本号以区分

// 1x1 透明 PNG 图片的 Base64 编码
const tinyTransparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUAAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

console.log(`Chelaile Banner Replace Script ${version}: Intercepted response for ${$request.url}`);

// --- 强制替换逻辑 ---
// 无论原始响应状态如何，都强制返回一个成功的图片响应
console.log("Chelaile Banner Replace Script: Forcing replacement of response body with tiny transparent PNG.");

// 构造一个新的、模拟成功的图片响应对象
let modifiedResponse = {
    status: 200, // 模拟 HTTP 状态码 200 OK
    headers: {
        'Content-Type': 'image/png', // 告诉应用这是一个 PNG 图片
        // 可以根据需要添加其他头部，但 Content-Type 是最关键的
        // 'Content-Length': base64ToArrayBuffer(tinyTransparentPngBase64).byteLength // 可选，更准确
    },
    body: tinyTransparentPngBase64 // 将响应体设置为透明 PNG 的 Base64 数据
};

// 使用 $done() 返回我们构造的响应
$done(modifiedResponse);

// --- 强制替换逻辑结束 ---

// 原始脚本中检查 status 的 if/else 逻辑被移除