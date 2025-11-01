import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

/**
 * Reddit Thread Finder Service
 * Discovers high-ranking Reddit threads via Google Search (Jacky Chou's $45k/month model)
 */
class RedditThreadFinderService {
  constructor(supabase, config = {}) {
    this.supabase = supabase;
    this.googleApiKey = config.googleApiKey;
    this.googleSearchEngineId = config.googleSearchEngineId;
  }

  /**
   * Search for ranking Reddit threads
   */
  async searchThreads(userId, searchQuery, options = {}) {
    const {
      maxResults = 20,
      minUpvotes = 10,
      minComments = 5
    } = options;

    console.log(`Searching Google for: ${searchQuery} site:reddit.com`);

    try {
      // Search Google for ranking Reddit threads
      const googleQuery = `${searchQuery} site:reddit.com`;
      const threads = await this.searchGoogle(googleQuery, maxResults);

      // Store discovered threads
      const storedThreads = [];
      for (const thread of threads) {
        // Parse Reddit URL to extract thread info
        const threadInfo = this.parseRedditUrl(thread.url);

        if (!threadInfo) continue;

        // Fetch thread details from Reddit
        const details = await this.fetchRedditThreadDetails(threadInfo.threadId);

        // Filter by engagement
        if (details.upvotes < minUpvotes || details.commentCount < minComments) {
          continue;
        }

        // Analyze sentiment
        const sentiment = await this.analyzeSentiment(details.title, details.topComments);

        // Store thread
        const { data, error } = await this.supabase
          .from('reddit_target_threads')
          .upsert({
            user_id: userId,
            search_query: searchQuery,
            thread_url: thread.url,
            thread_id: threadInfo.threadId,
            subreddit: threadInfo.subreddit,
            thread_title: details.title,
            google_rank: thread.rank,
            upvotes: details.upvotes,
            comment_count: details.commentCount,
            sentiment,
            target_priority: this.calculatePriority(thread.rank, details.upvotes, sentiment),
            discovered_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,thread_url'
          })
          .select()
          .single();

        if (!error) {
          storedThreads.push(data);
        }

        // Small delay
        await this.sleep(500);
      }

      return {
        searched: searchQuery,
        found: threads.length,
        stored: storedThreads.length,
        threads: storedThreads
      };

    } catch (error) {
      console.error('Thread search error:', error);
      throw error;
    }
  }

  /**
   * Search Google using Custom Search API
   */
  async searchGoogle(query, maxResults) {
    if (!this.googleApiKey) {
      console.warn('Google API key not configured, using mock data');
      return this.getMockGoogleResults(query, maxResults);
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.googleApiKey,
          cx: this.googleSearchEngineId,
          q: query,
          num: Math.min(maxResults, 10)
        }
      });

      return response.data.items.map((item, index) => ({
        url: item.link,
        title: item.title,
        snippet: item.snippet,
        rank: index + 1
      }));

    } catch (error) {
      console.error('Google Search API error:', error);
      return this.getMockGoogleResults(query, maxResults);
    }
  }

  /**
   * Mock Google results for development
   */
  getMockGoogleResults(query, count) {
    return Array.from({ length: count }, (_, i) => ({
      url: `https://reddit.com/r/technology/comments/abc${i}/discussion_about_${query.replace(/\s+/g, '_')}`,
      title: `Discussion about ${query} - r/technology`,
      snippet: `Great discussion about ${query}...`,
      rank: i + 1
    }));
  }

  /**
   * Parse Reddit URL
   */
  parseRedditUrl(url) {
    // Example: https://reddit.com/r/technology/comments/abc123/post_title/
    const match = url.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)\//);
    
    if (!match) return null;

    return {
      subreddit: match[1],
      threadId: match[2]
    };
  }

  /**
   * Fetch thread details from Reddit
   * In production: use Reddit API or scraping
   */
  async fetchRedditThreadDetails(threadId) {
    // Mock data for development
    return {
      title: 'Discussion about topic',
      upvotes: Math.floor(Math.random() * 1000) + 100,
      commentCount: Math.floor(Math.random() * 200) + 50,
      topComments: [
        'This is great!',
        'I disagree with this',
        'Here\'s my experience...'
      ]
    };
  }

  /**
   * Analyze sentiment of thread
   */
  async analyzeSentiment(title, comments) {
    // Simple keyword-based sentiment for now
    // In production: use AI sentiment analysis

    const positiveWords = ['great', 'awesome', 'love', 'best', 'excellent', 'perfect'];
    const negativeWords = ['bad', 'worst', 'hate', 'terrible', 'awful', 'horrible'];

    const text = `${title} ${comments.join(' ')}`.toLowerCase();

    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > 0 || negativeCount > 0) return 'mixed';
    return 'neutral';
  }

  /**
   * Calculate thread priority (1-10)
   */
  calculatePriority(googleRank, upvotes, sentiment) {
    let priority = 5;

    // Higher Google rank = higher priority
    if (googleRank <= 3) priority += 3;
    else if (googleRank <= 10) priority += 2;
    else if (googleRank <= 20) priority += 1;

    // More upvotes = higher priority
    if (upvotes >= 1000) priority += 2;
    else if (upvotes >= 500) priority += 1;

    // Negative sentiment = higher priority (opportunity to flip)
    if (sentiment === 'negative') priority += 1;

    return Math.min(10, Math.max(1, priority));
  }

  /**
   * Get target threads
   */
  async getTargetThreads(userId, filters = {}) {
    let query = this.supabase
      .from('reddit_target_threads')
      .select('*')
      .eq('user_id', userId);

    if (filters.sentiment) {
      query = query.eq('sentiment', filters.sentiment);
    }

    if (filters.minPriority) {
      query = query.gte('target_priority', filters.minPriority);
    }

    query = query.order('target_priority', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  /**
   * Helper: Sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default RedditThreadFinderService;


