import { createClient } from '@supabase/supabase-js';

/**
 * Posting Queue Service
 * Manages mass posting with rate limiting, priority scheduling, and retry logic
 */
class PostingQueueService {
  constructor(supabase) {
    this.supabase = supabase;
    this.processing = false;
    this.batchSize = 100;
  }

  /**
   * Add single post to queue
   */
  async addToQueue(userId, accountId, contentData, options = {}) {
    const {
      contentType = 'post',
      scheduledFor = new Date(),
      priority = 5,
      maxAttempts = 3
    } = options;

    const { data, error } = await this.supabase
      .from('posting_queue')
      .insert({
        user_id: userId,
        social_account_id: accountId,
        content_type: contentType,
        content_data: contentData,
        scheduled_for: scheduledFor,
        priority,
        max_attempts: maxAttempts,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add bulk posts to queue (for mass posting)
   */
  async bulkAddToQueue(userId, posts) {
    // Validate and format posts
    const formattedPosts = posts.map(post => ({
      user_id: userId,
      social_account_id: post.accountId,
      content_type: post.contentType || 'post',
      content_data: post.contentData,
      scheduled_for: post.scheduledFor || new Date(),
      priority: post.priority || 5,
      max_attempts: post.maxAttempts || 3,
      status: 'pending'
    }));

    // Insert in batches of 1000 (Supabase limit)
    const batches = [];
    for (let i = 0; i < formattedPosts.length; i += 1000) {
      batches.push(formattedPosts.slice(i, i + 1000));
    }

    const results = [];
    for (const batch of batches) {
      const { data, error } = await this.supabase
        .from('posting_queue')
        .insert(batch)
        .select();

      if (error) throw error;
      results.push(...data);
    }

    return {
      total: results.length,
      queued: results
    };
  }

  /**
   * Start the queue processor (runs every 60 seconds)
   */
  startProcessor() {
    console.log('🚀 Starting posting queue processor...');
    
    // Run immediately (with error handling)
    this.processQueue().catch(err => {
      console.error('Error in initial queue processing:', err);
    });
    
    // Then run every 60 seconds (with error handling)
    this.processorInterval = setInterval(() => {
      this.processQueue().catch(err => {
        console.error('Error in queue processing:', err);
      });
    }, 60000); // 60 seconds
  }

  /**
   * Stop the processor
   */
  stopProcessor() {
    if (this.processorInterval) {
      clearInterval(this.processorInterval);
      this.processorInterval = null;
      console.log('⏹️ Posting queue processor stopped');
    }
  }

  /**
   * Process queue (should be called periodically)
   */
  async processQueue() {
    if (this.processing) {
      console.log('Queue processing already in progress');
      return;
    }

    this.processing = true;

    try {
      // Get pending posts that are due
      const now = new Date().toISOString();
      
      // First get pending posts
      const { data: pendingPosts, error: postsError } = await this.supabase
        .from('posting_queue')
        .select('*')
        .in('status', ['pending', 'rate_limited'])
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(this.batchSize);

      if (postsError) throw postsError;
      
      if (!pendingPosts || pendingPosts.length === 0) {
        console.log('No posts to process');
        return;
      }

      // Get account details for each post
      const accountIds = [...new Set(pendingPosts.map(p => p.social_account_id || p.account_id).filter(Boolean))];
      const { data: accounts, error: accountsError } = await this.supabase
        .from('social_accounts')
        .select('id, platform, user_id, username, status, auth_data')
        .in('id', accountIds)
        .eq('status', 'active');

      if (accountsError) throw accountsError;

      // Create account lookup map
      const accountMap = new Map(accounts.map(a => [a.id, a]));
      
      // Filter posts to only those with active accounts and enrich with account data
      const pendingPostsWithAccounts = pendingPosts
        .filter(p => {
          const accountId = p.social_account_id || p.account_id;
          const account = accountMap.get(accountId);
          return account && account.status === 'active';
        })
        .map(p => {
          const accountId = p.social_account_id || p.account_id;
          return {
            ...p,
            social_accounts: accountMap.get(accountId)
          };
        });

      if (pendingPostsWithAccounts.length === 0) {
        console.log('No posts to process (no active accounts)');
        return;
      }

      console.log(`Processing ${pendingPostsWithAccounts.length} posts from queue`);

      // Process each post
      for (const post of pendingPostsWithAccounts) {
        try {
          // Check rate limits
          const canPost = await this.checkRateLimits(
            post.social_accounts.platform,
            post.content_type,
            post.social_account_id
          );

          if (!canPost) {
            // Mark as rate-limited and reschedule
            await this.updateQueueItem(post.id, {
              status: 'rate_limited',
              scheduled_for: new Date(Date.now() + 5 * 60 * 1000) // Retry in 5 min
            });
            continue;
          }

          // Mark as processing
          await this.updateQueueItem(post.id, { status: 'processing' });

          // Extract content from content_data (could be text, video_url, etc.)
          const content = post.content_data?.text || post.content_data?.content || post.content || '';
          const platform = post.social_accounts.platform;

          // Post the content
          await this.postContent({
            ...post,
            content,
            platform
          });

          // Mark as posted
          await this.updateQueueItem(post.id, {
            status: 'posted',
            posted_at: new Date().toISOString()
          });

          console.log(`✓ Posted to ${post.social_accounts.platform} account ${post.social_account_id}`);

        } catch (error) {
          console.error(`Error posting ${post.id}:`, error.message);

          // Increment attempts
          const newAttempts = (post.attempts || 0) + 1;

          if (newAttempts >= post.max_attempts) {
            // Max attempts reached, mark as failed
            await this.updateQueueItem(post.id, {
              status: 'failed',
              attempts: newAttempts,
              error_message: error.message
            });
          } else {
            // Retry with exponential backoff
            const backoffMinutes = Math.pow(2, newAttempts) * 5; // 10, 20, 40 minutes
            await this.updateQueueItem(post.id, {
              status: 'pending',
              attempts: newAttempts,
              error_message: error.message,
              scheduled_for: new Date(Date.now() + backoffMinutes * 60 * 1000)
            });
          }
        }

        // Small delay between posts to avoid hammering APIs
        await this.sleep(1000);
      }

    } finally {
      this.processing = false;
    }
  }

  /**
   * Check if account can perform action based on rate limits
   */
  async checkRateLimits(platform, actionType, accountId) {
    // Get rate limits for platform and action
    const { data: limits, error: limitsError } = await this.supabase
      .from('rate_limits')
      .select('*')
      .eq('platform', platform)
      .eq('action_type', actionType)
      .single();

    if (limitsError || !limits) {
      console.warn(`No rate limits found for ${platform}/${actionType}, allowing`);
      return true;
    }

    // Check how many actions in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { count: hourCount, error: hourError } = await this.supabase
      .from('posting_queue')
      .select('*', { count: 'exact', head: true })
      .eq('social_account_id', accountId)
      .eq('content_type', actionType)
      .eq('status', 'posted')
      .gte('posted_at', oneHourAgo.toISOString());

    if (hourError) throw hourError;

    if (hourCount >= limits.max_per_hour) {
      console.log(`Rate limit hit: ${hourCount}/${limits.max_per_hour} per hour`);
      return false;
    }

    // Check how many actions in last day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { count: dayCount, error: dayError } = await this.supabase
      .from('posting_queue')
      .select('*', { count: 'exact', head: true })
      .eq('social_account_id', accountId)
      .eq('content_type', actionType)
      .eq('status', 'posted')
      .gte('posted_at', oneDayAgo.toISOString());

    if (dayError) throw dayError;

    if (dayCount >= limits.max_per_day) {
      console.log(`Rate limit hit: ${dayCount}/${limits.max_per_day} per day`);
      return false;
    }

    // Check cooldown (last action time)
    const { data: lastAction, error: lastError } = await this.supabase
      .from('posting_queue')
      .select('posted_at')
      .eq('social_account_id', accountId)
      .eq('content_type', actionType)
      .eq('status', 'posted')
      .order('posted_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastError && lastAction) {
      const timeSinceLastAction = Date.now() - new Date(lastAction.posted_at).getTime();
      const cooldownMs = limits.cooldown_seconds * 1000;

      if (timeSinceLastAction < cooldownMs) {
        console.log(`Cooldown active: ${timeSinceLastAction}ms < ${cooldownMs}ms`);
        return false;
      }
    }

    return true;
  }

  /**
   * Post content to platform
   */
  async postContent(queueItem) {
    const { social_accounts, content, platform } = queueItem;

    // For Twitter text posts (from AI generation)
    if (platform === 'twitter' || social_accounts.platform === 'twitter') {
      // Use Twitter ADB automation if cloud_phone_id is set
      if (social_accounts.cloud_phone_id) {
        return await this.postViaTwitterADB(social_accounts.cloud_phone_id, content);
      }

      // Check if account has both Twitter AND TikTok connected (same account)
      const twitterProfileKey = social_accounts.auth_data?.uploadpost_profile_key_twitter;
      const tiktokProfileKey = social_accounts.auth_data?.uploadpost_profile_key_tiktok;

      // If both platforms are connected, post to both simultaneously
      if (twitterProfileKey && tiktokProfileKey) {
        return await this.postViaUploadPostMultiPlatform(
          social_accounts, 
          content, 
          ['twitter', 'tiktok'],
          [twitterProfileKey, tiktokProfileKey]
        );
      }

      // Otherwise just post to Twitter
      return await this.postViaUploadPost(social_accounts, content, 'twitter', twitterProfileKey);
    }

    // For other platforms, use upload-post
    const profileKey = social_accounts.auth_data?.uploadpost_profile_key || 
                      social_accounts.auth_data?.uploadpost_profile_key_tiktok;
    return await this.postViaUploadPost(social_accounts, content, social_accounts.platform, profileKey);
  }

  /**
   * Post via Upload-post.com API (single platform)
   */
  async postViaUploadPost(account, content, platform, profileKey = null) {
    try {
      // Get operator's Upload-post API key
      const { data: apiKey, error: keyError } = await this.supabase
        .from('operator_settings')
        .select('api_key_encrypted')
        .eq('service', 'uploadpost')
        .in('status', ['configured', 'active'])
        .single();

      if (keyError || !apiKey) {
        throw new Error('Upload-post API key not configured in operator_settings');
      }

      // Get account's upload-post profile key from auth_data (use provided or fallback)
      const key = profileKey || 
                  account.auth_data?.uploadpost_profile_key ||
                  account.auth_data?.[`uploadpost_profile_key_${platform}`];
      
      if (!key) {
        throw new Error(`Upload-post profile key not set for @${account.username} (${platform})`);
      }

      // Initialize upload-post service
      const UploadPostService = (await import('./upload-post.js')).default;
      const uploadPost = new UploadPostService(apiKey.api_key_encrypted);

      // Post text-only (for tweets) or text caption (for TikTok)
      // With User Profile Integration, the username IS the profile key
      const result = await uploadPost.postTextOnly({
        text: platform === 'twitter' ? content.substring(0, 280) : content.substring(0, 2200), // Platform limits
        username: key, // Use username as 'user' parameter for User Profile Integration API
        platform: platform
      });

      console.log(`✅ Posted to ${platform} @${account.username}: "${content.substring(0, 50)}..."`);
      
      return result;

    } catch (error) {
      console.error(`❌ Upload-post error for @${account.username} (${platform}):`, error.message);
      throw error;
    }
  }

  /**
   * Post to multiple platforms simultaneously (Twitter + TikTok)
   */
  async postViaUploadPostMultiPlatform(account, content, platforms, profileKeys) {
    try {
      // Get operator's Upload-post API key
      const { data: apiKey, error: keyError } = await this.supabase
        .from('operator_settings')
        .select('api_key_encrypted')
        .eq('service', 'uploadpost')
        .in('status', ['configured', 'active'])
        .single();

      if (keyError || !apiKey) {
        throw new Error('Upload-post API key not configured in operator_settings');
      }

      // Initialize upload-post service
      const UploadPostService = (await import('./upload-post.js')).default;
      const uploadPost = new UploadPostService(apiKey.api_key_encrypted);

      // Create platform-specific captions
      const captions = {
        twitter: content.substring(0, 280), // Twitter limit
        tiktok: content.substring(0, 2200) // TikTok caption limit
      };

      // Post to multiple platforms simultaneously
      const result = await uploadPost.postToMultiplePlatforms({
        text: content,
        profileKeys: profileKeys,
        platforms: platforms,
        captions: captions
      });

      console.log(`✅ Posted to ${platforms.join(' + ')} @${account.username}: "${content.substring(0, 50)}..."`);
      
      return result;

    } catch (error) {
      console.error(`❌ Upload-post multi-platform error for @${account.username}:`, error.message);
      throw error;
    }
  }

  /**
   * Post via Twitter ADB (MoreLogin mobile device)
   */
  async postViaTwitterADB(cloudPhoneId, text) {
    try {
      // Call Twitter ADB automation endpoint
      const response = await fetch('http://localhost:3000/api/twitter/adb/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cloudPhoneId,
          text
        })
      });

      if (!response.ok) {
        throw new Error('ADB posting failed');
      }

      return await response.json();

    } catch (error) {
      console.error('Twitter ADB posting error:', error);
      throw error;
    }
  }

  /**
   * Update queue item
   */
  async updateQueueItem(id, updates) {
    updates.updated_at = new Date().toISOString();

    const { error } = await this.supabase
      .from('posting_queue')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get queue status for user
   */
  async getQueueStatus(userId) {
    const { data, error } = await this.supabase
      .from('posting_queue')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      pending: 0,
      processing: 0,
      posted: 0,
      failed: 0,
      rate_limited: 0,
      cancelled: 0
    };

    data.forEach(item => {
      stats[item.status]++;
    });

    stats.total = data.length;

    return stats;
  }

  /**
   * Cancel queued posts
   */
  async cancelQueuedPosts(userId, filters = {}) {
    let query = this.supabase
      .from('posting_queue')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('status', ['pending', 'rate_limited']);

    if (filters.accountId) {
      query = query.eq('social_account_id', filters.accountId);
    }

    if (filters.platform) {
      // Need to join with social_accounts
      const { data: accounts } = await this.supabase
        .from('social_accounts')
        .select('id')
        .eq('platform', filters.platform)
        .eq('user_id', userId);

      const accountIds = accounts.map(a => a.id);
      query = query.in('social_account_id', accountIds);
    }

    const { data, error } = await query.select();

    if (error) throw error;

    return {
      cancelled: data.length
    };
  }

  /**
   * Helper: Sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default PostingQueueService;

