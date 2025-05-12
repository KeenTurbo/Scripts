
# 微博开屏广告屏蔽及加速脚本
# 作者: 基于ddgksf2013脚本和用户提供的JSON分析编写
# 版本: 1.0


const isDebug = true; // 设置为 true 可以在 Quantumult X 日志中看到详细处理信息

function log(message) {
  if (isDebug) {
    console.log("[WeiboSplashAdRemover] " + message);
  }
}

// 获取请求 URL 和响应体
const url = $request.url;
let body = $response.body;

log("Processing URL: " + url);

try {
  // 尝试解析响应体为 JSON
  // 注意：有些接口响应可能不是纯JSON，例如原始脚本中的 sdkad.php 会追加 "OK"
  // 这里先尝试直接解析，如果失败再考虑其他方法
  let obj = JSON.parse(body);

  let modified = false;

  // --- 处理第一种 JSON 结构 (包含 realtime_video_stall_time 和 ads 数组) ---
  // 这种结构常见于 /ad/realtime 接口
  if (obj && obj.ads !== undefined && obj.realtime_video_stall_time !== undefined) {
      log("Matched JSON structure 1 (realtime ad)");
      obj.realtime_video_stall_time = 0; // 将等待时间设置为 0
      obj.ads = []; // 清空广告数组
      modified = true;
      log("Modified JSON structure 1: cleared ads and set stall time to 0");
  }
  // --- 处理第二种 JSON 结构 (包含 data.display_ad, data.ad_cd_interval 等) ---
  // 这种结构常见于 /interface/sdk/sdkad.php, /wbapplua/wbpullad.lua 或其他配置接口
  else if (obj && obj.data && obj.data.display_ad !== undefined && obj.data.ad_cd_interval !== undefined) {
      log("Matched JSON structure 2 (splash config)");
      obj.data.display_ad = 0;       // 不展示广告
      obj.data.ad_cd_interval = 0;   // 消除冷却间隔
      obj.data.ad_duration = 0;      // 广告时长设为0
      obj.data.ad_list = [];         // 清空广告列表
      obj.data.gdt_video_ad_ios = []; // 清空GDT iOS配置
      obj.data.gdt_video_ad_android = {}; // 清空GDT Android配置 (注意它是对象)
      obj.data.pic_ad = [];          // 清空图片广告配置
      obj.data.close_cyt = 1;        // 尝试设置为关闭状态

      // 可以根据需要清空其他 ad 相关的字段
      if (obj.data.reserve_ad_android_id !== undefined) obj.data.reserve_ad_android_id = "";
      if (obj.data.reserve_ad_ios_id !== undefined) obj.data.reserve_ad_ios_id = "";
      if (obj.data.app_ad_android_id !== undefined) obj.data.app_ad_android_id = "";
      if (obj.data.app_ad_ios_id !== undefined) obj.data.app_ad_ios_id = "";
      if (obj.data.ad_android_id !== undefined) obj.data.ad_android_id = "";
      if (obj.data.ad_ios_id !== undefined) obj.data.ad_ios_id = "";


      modified = true;
      log("Modified JSON structure 2: set display_ad=0, interval=0, duration=0, cleared ad lists/configs");
  }
  // --- 可以添加其他可能的 JSON 结构处理 ---
  // else if (...) { ... }

  // 如果有修改，将对象转回 JSON 字符串
  if (modified) {
    body = JSON.stringify(obj);
    log("Response body modified successfully.");
  } else {
    log("No matching JSON structure found for modification.");
  }

} catch (e) {
  // 如果解析或处理过程中出错，记录错误并返回原始响应体
  log("Error processing response: " + e.message);
  // 检查原始响应体末尾是否有 "OK"，这是 sdkad.php 接口的特殊处理
  if (body && body.endsWith("OK")) {
      log("Original body ends with 'OK', keeping it.");
      // 尝试只处理JSON部分，然后重新拼接"OK"
      try {
          const jsonPart = body.substring(0, body.length - 2); // 移除末尾的"OK"
          let obj = JSON.parse(jsonPart);
          // 再次尝试匹配和修改 JSON 结构 2
          if (obj && obj.data && obj.data.display_ad !== undefined && obj.data.ad_cd_interval !== undefined) {
              log("Matched JSON structure 2 with 'OK' suffix.");
              obj.data.display_ad = 0;
              obj.data.ad_cd_interval = 0;
              obj.data.ad_duration = 0;
              obj.data.ad_list = [];
              obj.data.gdt_video_ad_ios = [];
              obj.data.gdt_video_ad_android = {};
              obj.data.pic_ad = [];
              obj.data.close_cyt = 1;
              if (obj.data.reserve_ad_android_id !== undefined) obj.data.reserve_ad_android_id = "";
              if (obj.data.reserve_ad_ios_id !== undefined) obj.data.reserve_ad_ios_id = "";
              if (obj.data.app_ad_android_id !== undefined) obj.data.app_ad_android_id = "";
              if (obj.data.app_ad_ios_id !== undefined) obj.data.app_ad_ios_id = "";
              if (obj.data.ad_android_id !== undefined) obj.data.ad_android_id = "";
              if (obj.data.ad_ios_id !== undefined) obj.data.ad_ios_id = "";

              body = JSON.stringify(obj) + "OK"; // 重新拼接"OK"
              log("Modified JSON structure 2 with 'OK' suffix successfully.");
          } else {
              log("Could not match JSON structure 2 even after removing 'OK'. Returning original body.");
          }
      } catch (e2) {
          log("Error processing body with 'OK' suffix: " + e2.message);
          // 如果处理带"OK"的也失败，则返回原始body
      }
  }
  // 如果不是带"OK"的错误，或者带"OK"的处理也失败了，返回原始body
  // body 变量此时已经是原始的或者带"OK"处理失败后的状态
}

// 返回修改后的响应体
$done({ body });