// ==UserScript==
// @ScriptName        Reddit Enhanced (Fixed & Clarified)
// @Author            Original by @ddgksf2013, Modified by AI & User Request
// @Function          Remove Reddit feed ads, post page ads, CommentTreeAds, NSFW unmasking.
// @AddRequest        https://bit.ly/addRequestforAdBlock // Kept from original, purpose unclear for this script
// @LPAutoUpdate      true
// @LPScriptName      RedditEnhancedFixed
// @LPScriptVersion   1.0.5
// ==/UserScript==

// This script is designed for Quantumult X's script-response-body.
// Ensure the following is in your Quantumult X configuration:
// [MITM]
// hostname = gql-fed.reddit.com
//
// [Script]
// ^https?:\/\/gql-fed\.reddit\.com\/$ url script-response-body reddit_enhanced_fixed.js

(function() {
    const scriptName = 'Reddit Enhanced (Fixed & Clarified)';
    const version = 'V1.0.5'; // Based on Moyu V1.0.4
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
        $done({ body: responseBody }); // Pass through original body on parse error
        return;
    }

    // Determine operationName from request headers
    // Reddit's GraphQL API often uses this header.
    const operationName = $request.headers['x-apollo-operation-name'] || $request.headers['X-Apollo-Operation-Name'];

    if (!operationName) {
        console.log(`[${scriptName}] No operationName found in request headers. Passing through modified/original body.`);
        $done({ body: JSON.stringify(responseObject) });
        return;
    }
    console.log(`[${scriptName}] Intercepted operation: ${operationName}`);

    // --- Handler Functions ---

    /**
     * Handles HomeFeedSdui: Removes promoted content and unblurs NSFW media in the home feed.
     */
    function handleHomeFeed(obj) {
        try {
            const feedEdges = obj?.data?.homeV3?.feed?.edges;
            if (Array.isArray(feedEdges)) {
                obj.data.homeV3.feed.edges = feedEdges
                    .filter(edge => !edge?.node?.promotedContent) // Remove promoted posts
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

    /**
     * Processes individual cells in the home feed: Unblurs NSFW media.
     */
    function processHomeFeedCells(cells) {
        return cells.map(cell => {
            try {
                const sourceData = cell?.mediaCell?.sourceData;
                if (sourceData) {
                    // Unblur NSFW images/videos
                    if (sourceData.isObfuscated === true) {
                        sourceData.isObfuscated = false;
                        console.log(`[${scriptName}][processHomeFeedCells] Unblurred an item (isObfuscated).`);
                    }
                    if (sourceData.obfuscatedPath) {
                        sourceData.obfuscatedPath = null;
                        console.log(`[${scriptName}][processHomeFeedCells] Cleared obfuscatedPath for an item.`);
                    }
                }

                // Remove NSFW indicator tag if present
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

    /**
     * Handles FetchIdentityPreferences: Modifies user preferences to disable ad tracking and allow NSFW content.
     */
    function handleFetchIdentityPreferences(obj) {
        try {
            const preferences = obj?.data?.identity?.preferences;
            if (preferences) {
                preferences.isAdPersonalizationAllowed = false;
                preferences.isThirdPartySiteDataPersonalizationAllowed = false;
                preferences.isThirdPartySiteDataPersonalizationScreenAllowed = false; // May or may not exist
                preferences.isNsfwMediaBlocked = false; // Allow NSFW media
                console.log(`[${scriptName}][FetchIdentityPreferences] Updated identity preferences.`);
            }
        } catch (e) {
            console.error(`[${scriptName}][FetchIdentityPreferences] Error: ${e}`);
        }
    }

    /**
     * Handles FeedPostDetailsByIds: Unmarks posts as NSFW.
     * This function calls $done() itself, so it will be the final step for this operation.
     */
    function handleFeedPostDetailsByIds(obj) {
        try {
            // The original script stringifies, replaces, then $done.
            // This is a broad approach.
            let modifiedBody = JSON.stringify(obj);
            modifiedBody = modifiedBody.replace(/"isNsfw":true/g, '"isNsfw":false');
            console.log(`[${scriptName}][FeedPostDetailsByIds] Attempted to unmark NSFW posts. Calling $done.`);
            $done({ body: modifiedBody });
        } catch (e) {
            console.error(`[${scriptName}][FeedPostDetailsByIds] Error: ${e}. Passing original object.`);
            $done({ body: JSON.stringify(obj) });
        }
    }

    /**
     * Handles CommentTreeAds: Clears ads from the comment tree.
     */
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

    /**
     * Handles CommentsPageAds: Attempts to clear ad data.
     * The original script's flawed handleClearBody implied wanting to empty the response.
     * This version clears the 'data' part of the response.
     */
    function handleCommentsPageAds(obj) {
        try {
            if (obj && obj.data) {
                console.log(`[${scriptName}][CommentsPageAds] Clearing content under 'data' key.`);
                obj.data = {}; // Clears all content under the 'data' key
            } else {
                 console.log(`[${scriptName}][CommentsPageAds] No 'data' key found to clear.`);
            }
        } catch (e) {
            console.error(`[${scriptName}][CommentsPageAds] Error: ${e}`);
        }
    }

    // --- Processor Map ---
    // Maps operation names to their respective handler functions.
    const processorMap = {
        'HomeFeedSdui': handleHomeFeed,
        'CommentsPageAds': handleCommentsPageAds,         // Fixed handler
        'CommentTreeAds': handleCommentTreeAds,           // Fixed handler
        'FetchIdentityPreferences': handleFetchIdentityPreferences,
        'FeedPostDetailsByIds': handleFeedPostDetailsByIds // This handler calls $done() internally
    };

    // Execute the appropriate handler if one exists for the current operationName
    if (processorMap[operationName]) {
        console.log(`[${scriptName}] Processing ${operationName}...`);
        processorMap[operationName](responseObject); // Modify responseObject in place

        // If the handler was 'FeedPostDetailsByIds', it already called $done.
        // For other handlers, we proceed to the final $done call here.
        if (operationName !== 'FeedPostDetailsByIds') {
            $done({ body: JSON.stringify(responseObject) });
        }
    } else {
        console.log(`[${scriptName}] No specific handler for operation: ${operationName}. Passing through modified/original body.`);
        $done({ body: JSON.stringify(responseObject) });
    }

})();