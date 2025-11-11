/**
 * Twitter Poster Service v2
 * Posts tweets using MoreLogin browser automation with Playwright
 */

import { chromium } from 'playwright';

class TwitterPosterService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Post a tweet via MoreLogin browser automation
   * @param {string} userId - User ID
   * @param {number} accountId - Social account ID
   * @param {string} tweetText - Tweet content
   * @param {string[]} mediaUrls - Optional media URLs
   * @returns {Promise<{success: boolean, tweetUrl?: string}>}
   */
  async postTweet(userId, accountId, tweetText, mediaUrls = []) {
    try {
      // Get account details
      const { data: account, error: accountError } = await this.supabase
        .from('social_accounts')
        .select('*, cloud_phones(*)')
        .eq('id', accountId)
        .single();

      if (accountError || !account) {
        throw new Error('Account not found');
      }

      if (account.platform !== 'twitter') {
        throw new Error('Account is not a Twitter account');
      }

      console.log(`Posting tweet for @${account.username}...`);

      // Connect to MoreLogin browser
      const browser = await this.connectToMoreLoginBrowser(account.cloud_phones);
      const page = await browser.newPage();

      try {
        // Navigate to Twitter
        await page.goto('https://twitter.com/compose/tweet', {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Wait for compose area
        await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 10000 });

        // Type tweet with human-like delays
        await this.humanTypeText(page, '[data-testid="tweetTextarea_0"]', tweetText);

        // Upload media if provided
        if (mediaUrls.length > 0) {
          // TODO: Implement media upload
          console.log('Media upload not yet implemented');
        }

        // Wait a random amount (1-3 seconds) before posting
        await page.waitForTimeout(1000 + Math.random() * 2000);

        // Click post button
        await page.click('[data-testid="tweetButtonInline"]');

        // Wait for tweet to be posted
        await page.waitForTimeout(3000);

        // Get tweet URL from address bar or response
        const currentUrl = page.url();
        const tweetUrl = currentUrl.includes('/status/') ? currentUrl : null;

        // Log to content_posts table
        await this.logPost(userId, accountId, tweetText, tweetUrl);

        console.log(`✅ Tweet posted successfully: ${tweetUrl || 'URL not captured'}`);

        await browser.close();

        return {
          success: true,
          tweetUrl
        };

      } catch (error) {
        await browser.close();
        throw error;
      }

    } catch (error) {
      console.error('Twitter poster error:', error);
      throw new Error(`Failed to post tweet: ${error.message}`);
    }
  }

  /**
   * Connect to MoreLogin browser instance
   * @private
   */
  async connectToMoreLoginBrowser(cloudPhone) {
    // For now, launch a regular browser
    // TODO: Connect to actual MoreLogin browser via CDP
    const browser = await chromium.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox']
    });

    return browser;
  }

  /**
   * Type text with human-like delays
   * @private
   */
  async humanTypeText(page, selector, text) {
    await page.click(selector);
    
    for (const char of text) {
      await page.keyboard.type(char);
      // Random delay between 50-150ms per character
      await page.waitForTimeout(50 + Math.random() * 100);
    }
  }

  /**
   * Log post to database
   * @private
   */
  async logPost(userId, accountId, content, postUrl) {
    const { error } = await this.supabase
      .from('content_posts')
      .insert({
        user_id: userId,
        social_account_id: accountId,
        platform: 'twitter',
        content_text: content,
        post_url: postUrl,
        status: 'published',
        posted_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging post:', error);
    }
  }

  /**
   * Schedule tweets for auto-posting
   * @param {string} userId - User ID
   * @param {number} accountId - Social account ID
   * @param {number} postsPerDay - How many posts per day
   * @returns {Promise<{scheduled: number}>}
   */
  async scheduleAutoPosts(userId, accountId, postsPerDay = 10) {
    try {
      // Get unused tweet variations
      const { data: variations, error } = await this.supabase
        .from('twitter_rewrites')
        .select('*')
        .eq('user_id', userId)
        .eq('used', false)
        .limit(postsPerDay * 7); // Schedule for a week

      if (error) throw error;

      if (!variations || variations.length === 0) {
        throw new Error('No unused tweet variations available. Generate more content first.');
      }

      // Calculate posting schedule (spread throughout the day)
      const hoursPerPost = 24 / postsPerDay;
      const scheduledTweets = [];

      for (let i = 0; i < Math.min(postsPerDay, variations.length); i++) {
        const variation = variations[i];
        const postTime = new Date();
        postTime.setHours(postTime.getHours() + (i * hoursPerPost));

        // Add to posting queue
        const { data: queued } = await this.supabase
          .from('posting_queue')
          .insert({
            user_id: userId,
            social_account_id: accountId,
            platform: 'twitter',
            content_text: variation.rewritten_text,
            scheduled_for: postTime.toISOString(),
            status: 'scheduled',
            priority: 5
          })
          .select()
          .single();

        if (queued) {
          scheduledTweets.push(queued);
          
          // Mark variation as used
          await this.supabase
            .from('twitter_rewrites')
            .update({ used: true })
            .eq('id', variation.id);
        }
      }

      return {
        scheduled: scheduledTweets.length,
        nextPost: scheduledTweets[0]?.scheduled_for
      };

    } catch (error) {
      console.error('Schedule auto-posts error:', error);
      throw error;
    }
  }

  /**
   * Get posting stats for an account
   * @param {string} userId - User ID
   * @param {number} accountId - Social account ID
   */
  async getPostingStats(userId, accountId) {
    const { data, error } = await this.supabase
      .from('content_posts')
      .select('views_count, likes_count, shares_count, comments_count')
      .eq('user_id', userId)
      .eq('social_account_id', accountId)
      .eq('platform', 'twitter');

    if (error) throw error;

    const stats = {
      totalPosts: data.length,
      totalViews: data.reduce((sum, post) => sum + (post.views_count || 0), 0),
      totalLikes: data.reduce((sum, post) => sum + (post.likes_count || 0), 0),
      totalShares: data.reduce((sum, post) => sum + (post.shares_count || 0), 0),
      totalComments: data.reduce((sum, post) => sum + (post.comments_count || 0), 0)
    };

    return stats;
  }
}

export default TwitterPosterService;









