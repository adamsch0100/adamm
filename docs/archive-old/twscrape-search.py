import asyncio
import sys
import json
from twscrape import API

async def search_tweets(query, limit=100):
    api = API()
    
    # Check if we have logged-in accounts
    accounts = await api.pool.accounts_info()
    if not accounts:
        return {"error": "No Twitter accounts configured. Run: twscrape add_accounts"}
    
    tweets = []
    async for tweet in api.search(query, limit=limit):
        tweets.append({
            "id": tweet.id,
            "text": tweet.rawContent,
            "author": tweet.user.username,
            "engagement": tweet.likeCount + tweet.retweetCount + tweet.replyCount,
            "likes": tweet.likeCount,
            "retweets": tweet.retweetCount,
            "replies": tweet.replyCount,
            "url": tweet.url,
            "created_at": tweet.date.isoformat() if tweet.date else None
        })
    
    return {"tweets": tweets, "count": len(tweets)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python twscrape-search.py <query> [limit]"}))
        sys.exit(1)
    
    query = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    
    result = asyncio.run(search_tweets(query, limit))
    print(json.dumps(result))






