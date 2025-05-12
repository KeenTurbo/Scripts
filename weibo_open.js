
# 微博开屏广告屏蔽及加速脚本 (整合版)
# 作者: 基于ddgksf2013脚本和用户提供的JSON分析编写
# 版本: 1.1

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

let obj = null;
let originalBody = body; // 保存原始响应体，用于处理特殊情况

try {
  // 尝试从响应体中提取 JSON 部分
  const jsonMatch = body.match(/\{.*\}/);
  if (jsonMatch && jsonMatch[0]) {
      obj = JSON.parse(jsonMatch[0]);
      log("Successfully parsed JSON from body.");
  } else {
      log("No JSON object found in body.");
      // 如果没有找到JSON，可能是非JSON响应，直接返回原始body
      $done({ body: originalBody });
      return;
  }

  let modified = false;

  // --- 处理 JSON 结构 1 (包含 realtime_video_stall_time 和 ads 数组) ---
  // 常见于 /ad/realtime 接口
  if (obj && obj.ads !== undefined && obj.realtime_video_stall_time !== undefined) {
      log("Matched JSON structure 1 (realtime ad)");
      obj.realtime_video_stall_time = 0; // 将等待时间设置为 0
      obj.ads = []; // 清空广告数组
      modified = true;
      log("Modified JSON structure 1: cleared ads and set stall time to 0");
  }
  // --- 处理 JSON 结构 2 (包含 data.display_ad, data.ad_cd_interval 等) ---
  // 常见于 /interface/sdk/sdkad.php, /wbapplua/wbpullad.lua 等接口
  else if (obj && obj.data && obj.data.display_ad !== undefined && obj.data.ad_cd_interval !== undefined) {
      log("Matched JSON structure 2 (splash config with display_ad)");
      obj.data.display_ad = 0;       // 不展示广告
      obj.data.ad_cd_interval = 0;   // 消除冷却间隔
      obj.data.ad_duration = 0;      // 广告时长设为0
      obj.data.ad_list = [];         // 清空广告列表
      obj.data.gdt_video_ad_ios = []; // 清空GDT iOS配置
      obj.data.gdt_video_ad_android = {}; // 清空GDT Android配置 (注意它是对象)
      obj.data.pic_ad = [];          // 清空图片广告配置
      obj.data.close_cyt = 1;        // 尝试设置为关闭状态

      // 清空其他 ad 相关的字段
      if (obj.data.reserve_ad_android_id !== undefined) obj.data.reserve_ad_android_id = "";
      if (obj.data.reserve_ad_ios_id !== undefined) obj.data.reserve_ad_ios_id = "";
      if (obj.data.app_ad_android_id !== undefined) obj.data.app_ad_android_id = "";
      if (obj.data.app_ad_ios_id !== undefined) obj.data.app_ad_ios_id = "";
      if (obj.data.ad_android_id !== undefined) obj.data.ad_android_id = "";
      if (obj.data.ad_ios_id !== undefined) obj.data.ad_ios_id = "";

      modified = true;
      log("Modified JSON structure 2: set display_ad=0, interval=0, duration=0, cleared ad lists/configs");
  }
  // --- 处理 JSON 结构 3 (包含大量功能开关的配置) ---
  // 常见于 /client/settings 或其他配置接口
  else if (obj && obj.data && obj.data.country !== undefined && obj.data.hot_search !== undefined && obj.data.translate !== undefined) {
      log("Matched JSON structure 3 (feature config)");

      const data = obj.data;

      // 禁用广告相关开关和配置
      if (data.ad_wrong_trigger !== undefined) data.ad_wrong_trigger = 0;
      if (data.uve_ad_scene !== undefined) data.uve_ad_scene = "";
      if (data.uve_feed_ad_block !== undefined) data.uve_feed_ad_block = 1; // 1 可能表示屏蔽
      if (data.uve_feed_ad !== undefined) data.uve_feed_ad = 0;
      if (data.uve_hot_ad !== undefined) data.uve_hot_ad = 0;
      if (data.sad_version !== undefined) data.sad_version = 0;
      if (data.new_ad_uve_android !== undefined) data.new_ad_uve_android = 0;
      if (data.new_ad_status_timeline !== undefined) data.new_ad_status_timeline = 0;
      if (data.new_ad_status_search !== undefined) data.new_ad_status_search = 0;
      if (data.new_ad_status_hot !== undefined) data.new_ad_status_hot = 0;
      if (data.cyt_feed_ad_show_search_feed !== undefined) data.cyt_feed_ad_show_search_feed = 0;
      if (data.vip_ad_duration !== undefined) data.vip_ad_duration = 0;
      if (data.vip_title_ad !== undefined) data.vip_title_ad = "";
      if (data.cytad_show_max_count !== undefined) data.cytad_show_max_count = 0;
      // ad_sync_monitor_disable 设置为 1 可能是禁用监控，保持 1
      // if (data.ad_sync_monitor_disable !== undefined) data.ad_sync_monitor_disable = 1;

      // 尝试禁用一些可能影响启动速度或后台活动的功能
      if (data.open_reload_duration !== undefined) data.open_reload_duration = 0;
      if (data.open_reload_url !== undefined) data.open_reload_url = "";
      if (data.agreement !== undefined) data.agreement = 1; // 尝试跳过协议弹窗
      if (data.close_ad_setting !== undefined) data.close_ad_setting = null; // 移除广告设置对象
      if (data.wbox_white_list !== undefined) data.wbox_white_list = []; // 清空白名单
      if (data.send_from !== undefined) data.send_from = "";
      if (data.assistant_name !== undefined) data.assistant_name = [];
      if (data.assistant_url !== undefined) data.assistant_url = [];
      if (data.cache_mid !== undefined) data.cache_mid = 0;
      if (data.test_vip !== undefined) data.test_vip = 0;
      if (data.vip_lite_is_enabled !== undefined) data.vip_lite_is_enabled = 0;
      if (data.jisuban !== undefined) data.jisuban = 0; // 禁用极速版相关？
      if (data["card_info.describe"] !== undefined) data["card_info.describe"] = 0;
      if (data["card_info.title"] !== undefined) data["card_info.title"] = 0;
      if (data.open_app_emitter_show !== undefined) data.open_app_emitter_show = "";
      if (data.test_zhuti !== undefined) data.test_zhuti = 0;
      if (data.lite_upgrade !== undefined) data.lite_upgrade = 0;
      if (data.open_comment_icon !== undefined) data.open_comment_icon = 0;
      if (data.only_tiefen !== undefined) data.only_tiefen = 0;
      if (data.comment_new_ui !== undefined) data.comment_new_ui = 0;
      if (data.super_topic_re_sign_open !== undefined) data.super_topic_re_sign_open = 0;
      if (data.open_geetest !== undefined) data.open_geetest = 0;
      if (data.search_recommended !== undefined) data.search_recommended = 0;
      if (data.ios_faxian !== undefined) data.ios_faxian = 0;
      if (data.ad_dynamic_ios_from !== undefined) data.ad_dynamic_ios_from = "";
      if (data.user_profile_new_enable !== undefined) data.user_profile_new_enable = 0;
      if (data.livephoto_download_free !== undefined) data.livephoto_download_free = 0;
      if (data.search_ai_tab_enable !== undefined) data.search_ai_tab_enable = 0;
      if (data.meike_search_test !== undefined) data.meike_search_test = 0;
      if (data.pic_tab_enable_test !== undefined) data.pic_tab_enable_test = 0;
      if (data.user_group_key !== undefined) data.user_group_key = "";
      // 禁用其他一些杂项功能
      if (data.hot_search !== undefined) data.hot_search = 0;
      if (data.translate !== undefined) data.translate = 0;
      if (data.gps !== undefined) data.gps = 0;
      if (data.is_topics !== undefined) data.is_topics = 0;
      if (data.is_ttarticle !== undefined) data.is_ttarticle = 0;
      if (data.message_bubble !== undefined) data.message_bubble = 0;
      if (data.is_follow_iweibo !== undefined) data.is_follow_iweibo = 0;
      if (data.show_web_bookmark !== undefined) data.show_web_bookmark = 0;
      if (data.sms_version !== undefined) data.sms_version = 0;
      if (data.tml_on !== undefined) data.tml_on = 0;
      if (data.video_window_on !== undefined) data.video_window_on = 0;
      if (data.show_review !== undefined) data.show_review = 0;
      if (data.weibo_source !== undefined) data.weibo_source = 0;
      if (data.is_omit_follow !== undefined) data.is_omit_follow = 0;
      if (data.article_native !== undefined) data.article_native = 0;
      if (data.is_shen_ping !== undefined) data.is_shen_ping = 0;
      if (data.is_android_debug !== undefined) data.is_android_debug = 0;
      if (data.funny_video !== undefined) data.funny_video = 0;
      if (data.new_video !== undefined) data.new_video = 0;
      if (data.api_error_json !== undefined) data.api_error_json = 0;
      if (data.t_send_pic !== undefined) data.t_send_pic = 0;
      if (data.display_video_button !== undefined) data.display_video_button = 0;
      if (data.new_emoj_keyboard !== undefined) data.new_emoj_keyboard = 0;
      if (data.search_hot !== undefined) data.search_hot = 0;
      if (data.new_pip !== undefined) data.new_pip = 0;
      if (data.new_share_activity !== undefined) data.new_share_activity = 0;
      if (data.small_video_v2 !== undefined) data.small_video_v2 = 0;
      if (data.geng_search_open !== undefined) data.geng_search_open = 0;
      if (data.amazing_comment_permission !== undefined) data.amazing_comment_permission = 0;
      if (data.image_emoji_add !== undefined) data.image_emoji_add = 0;
      if (data.image_emoji_add_new !== undefined) data.image_emoji_add_new = 0;
      if (data.comment_liked_open !== undefined) data.comment_liked_open = 0;
      if (data.special_push !== undefined) data.special_push = 0;
      if (data.special_push_test !== undefined) data.special_push_test = 0;
      if (data.gray_mode !== undefined) data.gray_mode = 0;
      if (data.index_full_refresh !== undefined) data.index_full_refresh = 0;
      if (data.update_expression !== undefined) data.update_expression = 0;
      if (data.share_long_img !== undefined) data.share_long_img = 0;
      if (data.at_trends_mode !== undefined) data.at_trends_mode = 0;
      if (data.share_img_comment !== undefined) data.share_img_comment = 0;
      if (data.vip_chang_app_icon !== undefined) data.vip_chang_app_icon = 0;
      if (data.share_img_orignal !== undefined) data.share_img_orignal = 0;
      if (data.vip_lead !== undefined) data.vip_lead = 0;
      if (data.like_comment_need_vip_open !== undefined) data.like_comment_need_vip_open = 0;
      if (data.open_my_controller !== undefined) data.open_my_controller = 0;
      if (data.history_tab !== undefined) data.history_tab = 0;
      if (data.download_video_button !== undefined) data.download_video_button = "";
      if (data.change_name !== undefined) data.change_name = 0;
      if (data.search_lead !== undefined) data.search_lead = 0;
      if (data.live_photo_upload_enable !== undefined) data.live_photo_upload_enable = 0;
      if (data.profile_cover_upload_enable !== undefined) data.profile_cover_upload_enable = 0;
      // new_video_stream_disuse_tiny_stream_video_list 设置为 1 可能是禁用旧列表，保持 1
      // if (data.new_video_stream_disuse_tiny_stream_video_list !== undefined) data.new_video_stream_disuse_tiny_stream_video_list = 1;
      if (data.comments_accounts_enable !== undefined) data.comments_accounts_enable = 0;
      if (data.send_new_weibo_accounts_enable !== undefined) data.send_new_weibo_accounts_enable = 0;
      if (data.show_vipicon !== undefined) data.show_vipicon = 0;
      if (data.search_favorites !== undefined) data.search_favorites = 0;
      if (data.video_recommend_count !== undefined) data.video_recommend_count = 0;
      if (data.show_pdf_button !== undefined) data.show_pdf_button = 0;
      if (data.pat_word_segment !== undefined) data.pat_word_segment = 0;
      if (data.video_auto_play_next !== undefined) data.video_auto_play_next = 0;
      if (data.feed_vipicon_level !== undefined) data.feed_vipicon_level = 0;
      if (data.pat_notvip_desctext !== undefined) data.pat_notvip_desctext = "";
      if (data.pat_isvip_desctext !== undefined) data.pat_isvip_desctext = "";
      if (data.pat_isvip_button !== undefined) data.pat_isvip_button = "";
      if (data.pat_notvip_button !== undefined) data.pat_notvip_button = "";
      if (data.vip_download_img_orignal !== undefined) data.vip_download_img_orignal = 0;
      if (data.video_load_more_count !== undefined) data.video_load_more_count = 0;
      if (data.dynamic_ios_from !== undefined) data.dynamic_ios_from = "";
      if (data.me_isvip !== undefined) data.me_isvip = 0;
      if (data.intl_vip_lead !== undefined) data.intl_vip_lead = 0;
      if (data.show_intl_vip !== undefined) data.show_intl_vip = 0;
      if (data.test_vip !== undefined) data.test_vip = 0;
      if (data.vip_title_blog !== undefined) data.vip_title_blog = "";
      if (data.me_intlvip !== undefined) data.me_intlvip = 0;
      if (data.vip_lite_index_recommand !== undefined) data.vip_lite_index_recommand = 0;
      if (data.vip_lite_trend_recommand !== undefined) data.vip_lite_trend_recommand = 0;
      if (data.vip_lite_search_city !== undefined) data.vip_lite_search_city = 0;
      if (data.vip_lite_search_ent !== undefined) data.vip_lite_search_ent = 0;
      if (data.vip_lite_is_enabled !== undefined) data.vip_lite_is_enabled = 0;
      if (data.android_slide_drawer !== undefined) data.android_slide_drawer = 0;
      if (data.user_profile_new_enable !== undefined) data.user_profile_new_enable = 0;
      if (data.search_ai_tab_enable !== undefined) data.search_ai_tab_enable = 0;
      if (data.meike_search_test !== undefined) data.meike_search_test = 0;

      // 禁用网络/错误报告相关
      if (data.host_error !== undefined) data.host_error = 0;
      if (data.httpdns_enable_ios !== undefined) data.httpdns_enable_ios = 0;
      if (data.host_error_ios !== undefined) data.host_error_ios = 0;
      if (data.httpdns_enable !== undefined) data.httpdns_enable = 0;
      if (data.httpdns_weibo_enable !== undefined) data.httpdns_weibo_enable = 0;
      if (data.network_debug !== undefined) data.network_debug = 0;
      if (data.network_debug_qr !== undefined) data.network_debug_qr = 0;


      modified = true;
      log("Modified JSON structure 3: Disabled various features and ad configs.");
  }
  // --- 可以添加其他可能的 JSON 结构处理 ---
  // else if (...) { ... }

  // 如果有修改，将对象转回 JSON 字符串
  if (modified) {
    body = JSON.stringify(obj);
    log("Response body modified successfully.");

    // 特殊处理：如果原始响应体有 "OK" 后缀，且当前处理的是 sdkad.php 接口，则重新拼接 "OK"
    // 假设 sdkad.php 是唯一可能返回 "OK" 后缀的接口
    if (url.includes("/interface/sdk/sdkad.php") && originalBody.endsWith("OK")) {
        body += "OK";
        log("Re-added 'OK' suffix for sdkad.php.");
    }

  } else {
    log("No matching JSON structure found for modification. Returning original body.");
    body = originalBody; // 确保返回原始未修改的 body
  }

} catch (e) {
  // 如果解析或处理过程中出错，记录错误并返回原始响应体
  log("Error processing response: " + e.message);
  body = originalBody; // 确保返回原始未修改的 body
}

// 返回修改后的响应体
$done({ body });