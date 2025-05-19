// ==UserScript==
// @ScriptName        Reddit Enhanced (Fixed & Clarified v2)
// @Author            Original by @ddgksf2013, Modified by AI & User Request
// @Function          Remove Reddit feed ads, post page ads, CommentTreeAds, NSFW unmasking.
// @AddRequest        https://bit.ly/addRequestforAdBlock // Kept from original
// @LPAutoUpdate      true
// @LPScriptName      RedditEnhancedFixedV2
// @LPScriptVersion   1.0.6
// ==/UserScript==

// This script is designed for Quantumult X's script-response-body.
// Ensure the following is in your Quantumult X configuration:
// [MITM]
// hostname = gql-fed.reddit.com
//
// [Script]
// ^https?:\/\/gql-fed\.reddit\.com\/$ url script-response-body reddit_enhanced_fixed_v2.js // 请确保文件名匹配

(function() {
    const scriptName = 'Reddit Enhanced (Fixed & Clarified v2)';
    const version = 'V1.0.6';
    console.log(`[${scriptName}] ${version} starting.`);

    let responseBody = $response.body;
    let responseObject;

    if (!responseBody) {
        console.log(`[${scriptName}] No response body. Exiting.`);
        $done({});
        return;
    }

    try {
        responseObject = JSON.parse(responseBody);
    } catch (e) {
        console.error(`[${scriptName}] JSON parsing error: ${e}. Passing original body.`);
        $done({ body: responseBody });
        return;
    }

    // 尝试从请求头获取 operationName
    let operationName = $request.headers['x-apollo-operation-name'] || $request.headers['X-Apollo-Operation-Name'];

    // 如果请求头中没有，并且是 POST 请求，尝试从请求体中获取
    if (!operationName && $request.method === 'POST' && $request.body) {
        console.log(`[${scriptName}] 'x-apollo-operation-name' header not found. Checking request body for POST request.`);
        try {
            // $request.body 在 Quantumult X 中可能是 Uint8Array 或 String
            let requestBodyStr;
            if (typeof $request.body === 'string') {
                requestBodyStr = $request.body;
            } else if (typeof $request.body === 'object' && $request.body.buffer instanceof ArrayBuffer) { // Uint8Array
                requestBodyStr = new TextDecoder().decode($request.body);
            }

            if (requestBodyStr) {
                const requestBodyData = JSON.parse(requestBodyStr);
                if (requestBodyData && requestBodyData.operationName) {
                    operationName = requestBodyData.operationName;
                    console.log(`[${scriptName}] Found operationName in request body: ${operationName}`);
                } else {
                    console.log(`[${scriptName}] 'operationName' not found in parsed request body or request body is not as expected.`);
                    console.log(`[${scriptName}] Request Body (parsed structure): ${JSON.stringify(requestBodyData)}`);
                }
            } else {
                 console.log(`[${scriptName}] Request body is not a string or decodable Uint8Array.`);
            }
        } catch (e) {
            console.error(`[${scriptName}] Error parsing request body: ${e}`);
            let bodyPreview = typeof $request.body === 'string' ? $request.body.substring(0, 500) : '[Non-string or complex body]';
            if (typeof $request.body === 'object' && $request.body.buffer instanceof ArrayBuffer) {
                try {
                    bodyPreview = new TextDecoder("utf-8", { fatal: false }).decode($request.body.slice(0,500));
                } catch (decodeError) {
                    bodyPreview = "[Error decoding Uint8Array body]";
                }
            }
            console.log(`[${scriptName}] Request Body (raw snippet on error): ${bodyPreview}...`);
        }
    }


    if (!operationName) {
        console.log(`[${scriptName}] No operationName found in headers or request body. Passing through modified/original body.`);
        // 记录详细信息以便调试
        console.log(`[${scriptName}] Final Check - Request Method: ${$request.method}`);
        console.log(`[${scriptName}] Final Check - Request URL: ${$request.url}`);
        console.log(`[${scriptName}] Final Check - Request Headers: ${JSON.stringify($request.headers)}`);
        if ($request.method === 'POST' && $request.body) {
            let bodyPreview = typeof $request.body === 'string' ? $request.body.substring(0, 500) : '[Non-string or complex body]';
             if (typeof $request.body === 'object' && $request.body.buffer instanceof ArrayBuffer) {
                try {
                    bodyPreview = new TextDecoder("utf-8", { fatal: false }).decode($request.body.slice(0,500));
                } catch (decodeError) {
                    bodyPreview = "[Error decoding Uint8Array body]";
                }
            }
            console.log(`[${scriptName}] Final Check - Request Body (snippet): ${bodyPreview}...`);
        }
        $done({ body: JSON.stringify(responseObject) }); // 返回原始解析后的响应体
        return;
    }
    console.log(`[${scriptName}] Intercepted operation: ${operationName}`);

    // --- 处理函数部分 (与 V1.0.5 相同，此处省略以保持简洁，实际使用时请包含完整代码) ---
    function handleHomeFeed(obj) {
        try {
            const feedEdges = obj?.data?.homeV3?.feed?.edges;
            if (Array.isArray(feedEdges)) {
                obj.data.homeV3.feed.edges = feedEdges
                    .filter(edge => !edge?.node?.promotedContent) // 移除推广帖子
                    .map(edge => {
                        if (edge?.node?.cells && Array.isArray(edge.node.cells)) {
                            edge.node.cells = processHomeFeedCells(edge.node.cells);
                        }
                        return edge;
                    });
                console.log(`[${scriptName}][HomeFeedSdui] Processed home feed edges.`);
            }
        } catch (e) {
            console.error(`[${scriptName}][HomeFeedSdui] Error: ${e}`);
        }
    }

    function processHomeFeedCells(cells) {
        return cells.map(cell => {
            try {
                const sourceData = cell?.mediaCell?.sourceData;
                if (sourceData) {
                    // 解除 NSFW 图片/视频的模糊
                    if (sourceData.isObfuscated === true) {
                        sourceData.isObfuscated = false;
                        console.log(`[${scriptName}][processHomeFeedCells] Unblurred an item (isObfuscated).`);
                    }
                    if (sourceData.obfuscatedPath) {
                        sourceData.obfuscatedPath = null;
                        console.log(`[${scriptName}][processHomeFeedCells] Cleared obfuscatedPath for an item.`);
                    }
                }

                // 移除 NSFW 标签
                const indicators = cell?.indicatorsCell?.indicators;
                if (Array.isArray(indicators)) {
                    cell.indicatorsCell.indicators = indicators.filter(indicator => indicator !== 'NSFW');
                }
            } catch (e) {
                console.error(`[${scriptName}][processHomeFeedCells] Error processing cell: ${e}`);
            }
            return cell;
        });
    }

    function handleFetchIdentityPreferences(obj) {
        try {
            const preferences = obj?.data?.identity?.preferences;
            if (preferences) {
                preferences.isAdPersonalizationAllowed = false;
                preferences.isThirdPartySiteDataPersonalizationAllowed = false;
                preferences.isThirdPartySiteDataPersonalizationScreenAllowed = false; // 可能不存在
                preferences.isNsfwMediaBlocked = false; // 允许 NSFW 内容
                console.log(`[${scriptName}][FetchIdentityPreferences] Updated identity preferences.`);
            }
        } catch (e) {
            console.error(`[${scriptName}][FetchIdentityPreferences] Error: ${e}`);
        }
    }

    function handleFeedPostDetailsByIds(obj) {
        try {
            let modifiedBody = JSON.stringify(obj);
            modifiedBody = modifiedBody.replace(/"isNsfw":true/g, '"isNsfw":false');
            console.log(`[${scriptName}][FeedPostDetailsByIds] Attempted to unmark NSFW posts. Calling $done.`);
            $done({ body: modifiedBody });
        } catch (e) {
            console.error(`[${scriptName}][FeedPostDetailsByIds] Error: ${e}. Passing original object.`);
            $done({ body: JSON.stringify(obj) });
        }
    }

    function handleCommentTreeAds(obj) {
        try {
            if (obj?.data?.postInfoById?.commentTreeAds) {
                if (Array.isArray(obj.data.postInfoById.commentTreeAds) && obj.data.postInfoById.commentTreeAds.length > 0) {
                    console.log(`[${scriptName}][CommentTreeAds] Found ${obj.data.postInfoById.commentTreeAds.length} ad(s). Clearing.`);
                    obj.data.postInfoById.commentTreeAds = [];
                } else {
                     console.log(`[${scriptName}][CommentTreeAds] commentTreeAds already empty or not an array.`);
                }
            } else {
                console.log(`[${scriptName}][CommentTreeAds] Path data.postInfoById.commentTreeAds not found.`);
            }
        } catch (e) {
            console.error(`[${scriptName}][CommentTreeAds] Error: ${e}`);
        }
    }

    function handleCommentsPageAds(obj) { // 用于其他评论页广告
        try {
            if (obj && obj.data) {
                console.log(`[${scriptName}][CommentsPageAds] Clearing content under 'data' key.`);
                obj.data = {}; // 清空 'data' 下的内容
            } else {
                 console.log(`[${scriptName}][CommentsPageAds] No 'data' key found to clear.`);
            }
        } catch (e) {
            console.error(`[${scriptName}][CommentsPageAds] Error: ${e}`);
        }
    }
    // --- 处理器映射 ---
    const processorMap = {
        'HomeFeedSdui': handleHomeFeed,
        'CommentsPageAds': handleCommentsPageAds,
        'CommentTreeAds': handleCommentTreeAds,
        'FetchIdentityPreferences': handleFetchIdentityPreferences,
        'FeedPostDetailsByIds': handleFeedPostDetailsByIds // 这个处理器内部会调用 $done()
    };

    // 执行对应的处理函数
    if (processorMap[operationName]) {
        console.log(`[${scriptName}] Processing ${operationName}...`);
        processorMap[operationName](responseObject); // 原地修改 responseObject

        // 如果不是 FeedPostDetailsByIds (它自己会调用 $done), 则在这里调用 $done
        if (operationName !== 'FeedPostDetailsByIds') {
            $done({ body: JSON.stringify(responseObject) });
        }
    } else {
        console.log(`[${scriptName}] No specific handler for operation: ${operationName}. Passing through modified/original body.`);
        $done({ body: JSON.stringify(responseObject) }); // 返回原始解析后的响应体
    }

})();