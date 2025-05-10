/*
[Script]
# 车来了顶部横幅广告图片替换 (Response Body)
# 拦截指定的广告图片请求，返回一个1x1透明PNG，避免空白区域
^https:\/\/image3\.chelaile\.net\.cn\/77a42D3P\.jpg url script-response-body https://raw.githubusercontent.com/KeenTurbo/Scripts/refs/heads/master/chelaile_banner_replace.js

[MITM]
hostname = image3.chelaile.net.cn
*/

// 脚本代码开始
const version = 'V1.0'; // 版本号

// 1x1 透明 PNG 图片的 Base64 编码
const tinyTransparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUAAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// 将 Base64 编码转换为二进制数据 (ArrayBuffer)
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

console.log(`Chelaile Banner Replace Script ${version}: Intercepted response for ${$request.url}`);

// 获取原始响应对象
let response = $response;

// 检查响应是否成功 (可选，但推荐)
if (response.status === 200) {
    console.log("Chelaile Banner Replace Script: Original response status is 200. Replacing body.");

    // 设置响应状态码为 200 OK
    response.status = 200;
    // 设置 Content-Type 为 image/png
    response.headers['Content-Type'] = 'image/png';
    // 设置 Content-Length 为替换图片的数据长度 (可选，但更规范)
    // response.headers['Content-Length'] = base64ToArrayBuffer(tinyTransparentPngBase64).byteLength; // 需要 ArrayBuffer 长度
    // 或者直接使用 Base64 字符串长度 (不准确，但有时也行)
    // response.headers['Content-Length'] = tinyTransparentPngBase64.length; // 不推荐

    // 将响应体替换为透明图片数据 (Base64 编码)
    response.body = tinyTransparentPngBase64;

    console.log("Chelaile Banner Replace Script: Response body replaced with tiny transparent PNG.");

    // 使用 $done() 返回修改后的响应
    $done(response);

} else {
    // 如果原始响应不是 200，可能加载失败了，直接放行原始响应
    console.log(`Chelaile Banner Replace Script: Original response status is ${response.status}. Passing through.`);
    $done(response);
}

// 脚本代码结束