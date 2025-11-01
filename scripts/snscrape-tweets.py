#!/usr/bin/env python3
import subprocess
import json
import sys
import os

def scrape_tweets(topic, min_engagement=10000, max_tweets=50):
    """
    Scrape tweets using snscrape CLI
    """
    tweets = []
    
    try:
        # Build query with engagement filter
        query = f"{topic} min_retweets:{min_engagement // 10}"
        
        # Use full path to snscrape executable
        snscrape_cmd = r'C:\Users\adamm\AppData\Roaming\Python\Python312\Scripts\snscrape.exe'
        
        if not os.path.exists(snscrape_cmd):
            raise Exception(f"Snscrape not found at: {snscrape_cmd}")
        
        # Use snscrape CLI command
        cmd = [
            snscrape_cmd,
            '--jsonl',
            '--max-results', str(max_tweets * 2),
            'twitter-search', query
        ]
        
        print(f"DEBUG: Running command: {' '.join(cmd)}", file=sys.stderr)
        
        # Execute snscrape CLI
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            shell=True  # Use shell on Windows
        )
        
        if result.returncode != 0:
            raise Exception(f"Snscrape error (code {result.returncode}): {result.stderr}")
        
        # Parse JSONL output
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue
                
            try:
                tweet = json.loads(line)
                
                # Calculate total engagement
                total_engagement = (
                    (tweet.get('retweetCount') or 0) + 
                    (tweet.get('likeCount') or 0) + 
                    (tweet.get('replyCount') or 0)
                )
                
                # Only include if meets engagement threshold
                if total_engagement >= min_engagement:
                    tweets.append({
                        'text': tweet.get('content') or tweet.get('rawContent', ''),
                        'author': tweet.get('user', {}).get('username', 'unknown'),
                        'engagement': total_engagement,
                        'retweets': tweet.get('retweetCount') or 0,
                        'likes': tweet.get('likeCount') or 0,
                        'replies': tweet.get('replyCount') or 0,
                        'url': tweet.get('url', ''),
                        'created_at': tweet.get('date', '')
                    })
                    
                # Stop if we have enough
                if len(tweets) >= max_tweets:
                    break
                    
            except json.JSONDecodeError as e:
                print(f"DEBUG: JSON decode error: {e}", file=sys.stderr)
                continue
        
        print(json.dumps({'success': True, 'tweets': tweets, 'count': len(tweets)}))
        
    except subprocess.TimeoutExpired:
        print(json.dumps({'error': 'Snscrape timeout - try a more specific query'}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python snscrape-tweets.py <topic> [min_engagement] [max_tweets]'}))
        sys.exit(1)
    
    topic = sys.argv[1]
    min_engagement = int(sys.argv[2]) if len(sys.argv) > 2 else 10000
    max_tweets = int(sys.argv[3]) if len(sys.argv) > 3 else 50
    
    scrape_tweets(topic, min_engagement, max_tweets)
