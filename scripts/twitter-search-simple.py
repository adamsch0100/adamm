"""
Simple Twitter search using httpx with authentication
Works around Cloudflare by using proper headers and cookies
"""
import asyncio
import sys
import json
import httpx
from datetime import datetime

# Guest token approach for unauthenticated search
async def get_guest_token():
    """Get a guest token from Twitter"""
    async with httpx.AsyncClient() as client:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        }
        
        response = await client.post(
            'https://api.twitter.com/1.1/guest/activate.json',
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()['guest_token']
        else:
            raise Exception(f"Failed to get guest token: {response.status_code}")

async def search_tweets(query, limit=100):
    """Search tweets using Twitter's GraphQL API"""
    try:
        guest_token = await get_guest_token()
        
        async with httpx.AsyncClient() as client:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
                'x-guest-token': guest_token,
                'x-twitter-active-user': 'yes',
                'x-twitter-client-language': 'en',
            }
            
            # Use SearchTimeline endpoint
            variables = {
                "rawQuery": query,
                "count": min(limit, 100),
                "querySource": "typed_query",
                "product": "Top"
            }
            
            features = {
                "rweb_tipjar_consumption_enabled": True,
                "responsive_web_graphql_exclude_directive_enabled": True,
                "verified_phone_label_enabled": False,
                "creator_subscriptions_tweet_preview_api_enabled": True,
                "responsive_web_graphql_timeline_navigation_enabled": True,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
                "communities_web_enable_tweet_community_results_fetch": True,
                "c9s_tweet_anatomy_moderator_badge_enabled": True,
                "articles_preview_enabled": True,
                "responsive_web_edit_tweet_api_enabled": True,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
                "view_counts_everywhere_api_enabled": True,
                "longform_notetweets_consumption_enabled": True,
                "responsive_web_twitter_article_tweet_consumption_enabled": True,
                "tweet_awards_web_tipping_enabled": False,
                "creator_subscriptions_quote_tweet_preview_enabled": False,
                "freedom_of_speech_not_reach_fetch_enabled": True,
                "standardized_nudges_misinfo": True,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
                "rweb_video_timestamps_enabled": True,
                "longform_notetweets_rich_text_read_enabled": True,
                "longform_notetweets_inline_media_enabled": True,
                "responsive_web_enhance_cards_enabled": False
            }
            
            params = {
                'variables': json.dumps(variables),
                'features': json.dumps(features)
            }
            
            response = await client.get(
                'https://twitter.com/i/api/graphql/lZ0GCEojmtQfiUQa5oJSEw/SearchTimeline',
                headers=headers,
                params=params
            )
            
            if response.status_code != 200:
                return {"error": f"Twitter API returned {response.status_code}: {response.text[:200]}"}
            
            data = response.json()
            tweets = []
            
            # Parse the complex Twitter GraphQL response
            instructions = data.get('data', {}).get('search_by_raw_query', {}).get('search_timeline', {}).get('timeline', {}).get('instructions', [])
            
            for instruction in instructions:
                if instruction.get('type') == 'TimelineAddEntries':
                    entries = instruction.get('entries', [])
                    for entry in entries:
                        content = entry.get('content', {})
                        if content.get('entryType') == 'TimelineTimelineItem':
                            item_content = content.get('itemContent', {})
                            if item_content.get('itemType') == 'TimelineTweet':
                                tweet_results = item_content.get('tweet_results', {}).get('result', {})
                                if tweet_results.get('__typename') == 'Tweet':
                                    legacy = tweet_results.get('legacy', {})
                                    user = tweet_results.get('core', {}).get('user_results', {}).get('result', {}).get('legacy', {})
                                    
                                    tweet_id = tweet_results.get('rest_id', '')
                                    text = legacy.get('full_text', '')
                                    likes = legacy.get('favorite_count', 0)
                                    retweets = legacy.get('retweet_count', 0)
                                    replies = legacy.get('reply_count', 0)
                                    username = user.get('screen_name', 'unknown')
                                    
                                    tweets.append({
                                        "id": tweet_id,
                                        "text": text,
                                        "author": username,
                                        "engagement": likes + retweets + replies,
                                        "likes": likes,
                                        "retweets": retweets,
                                        "replies": replies,
                                        "url": f"https://twitter.com/{username}/status/{tweet_id}",
                                        "created_at": legacy.get('created_at', '')
                                    })
            
            return {"tweets": tweets, "count": len(tweets)}
            
    except Exception as e:
        return {"error": f"Search failed: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python twitter-search-simple.py <query> [limit]"}))
        sys.exit(1)
    
    query = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    
    result = asyncio.run(search_tweets(query, limit))
    print(json.dumps(result))




