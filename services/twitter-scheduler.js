import { createClient } from '@supabase/supabase-js';

/**
 * Twitter Scheduler Service
 * Schedule mass tweets across all accounts with optimal timing
 */
class TwitterSchedulerService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Schedule mass tweets to all accounts
   */
  async scheduleMassTweets(userId, options = {}) {
    const {
      accountIds = [],
      tweetsPerAccount = 10,
      startDate = new Date(),
      endDate = null,
      useOptimalTimes = true,
      randomizeOrder = true
    } = options;

    console.log(`Scheduling tweets for ${accountIds.length} accounts`);

    // Get unused rewrites
    const { data: rewrites, error: rewritesError } = await this.supabase
      .from('twitter_rewrites')
      .select('*')
      .eq('user_id', userId)
      .eq('used', false)
      .order('quality_score', { ascending: false })
      .limit(accountIds.length * tweetsPerAccount);

    if (rewritesError) throw rewritesError;

    if (!rewrites || rewrites.length === 0) {
      throw new Error('No unused tweet variations available. Generate more first.');
    }

    console.log(`Using ${rewrites.length} tweet variations`);

    // Shuffle rewrites if randomize
    if (randomizeOrder) {
      this.shuffleArray(rewrites);
    }

    // Get accounts
    const { data: accounts, error: accountsError } = await this.supabase
      .from('social_accounts')
      .select('*')
      .in('id', accountIds)
      .eq('platform', 'twitter')
      .eq('status', 'active');

    if (accountsError) throw accountsError;

    if (!accounts || accounts.length === 0) {
      throw new Error('No active Twitter accounts found');
    }

    // Generate posting schedule
    const schedule = this.generateSchedule(
      accounts,
      rewrites,
      tweetsPerAccount,
      startDate,
      endDate,
      useOptimalTimes
    );

    // Add to posting queue
    const queueItems = [];
    for (const item of schedule) {
      queueItems.push({
        user_id: userId,
        social_account_id: item.accountId,
        content_type: 'post',
        content_data: {
          text: item.tweet.rewritten_text,
          tweet_variation_id: item.tweet.id
        },
        scheduled_for: item.scheduledFor,
        priority: 5,
        status: 'pending'
      });
    }

    // Insert in batches
    const batchSize = 1000;
    let inserted = 0;
    for (let i = 0; i < queueItems.length; i += batchSize) {
      const batch = queueItems.slice(i, i + batchSize);
      const { error } = await this.supabase
        .from('posting_queue')
        .insert(batch);

      if (error) throw error;
      inserted += batch.length;
    }

    // Mark rewrites as used
    const usedRewriteIds = schedule.map(s => s.tweet.id);
    const usedByAccount = {};
    schedule.forEach(s => {
      if (!usedByAccount[s.tweet.id]) usedByAccount[s.tweet.id] = [];
      usedByAccount[s.tweet.id].push(s.accountId);
    });

    for (const rewriteId of usedRewriteIds) {
      await this.supabase
        .from('twitter_rewrites')
        .update({
          used: true,
          posted_to_accounts: usedByAccount[rewriteId]
        })
        .eq('id', rewriteId);
    }

    return {
      scheduled: inserted,
      accounts: accounts.length,
      tweets_per_account: tweetsPerAccount,
      total_posts: schedule.length,
      start_date: startDate,
      end_date: endDate || 'ongoing'
    };
  }

  /**
   * Generate posting schedule
   */
  generateSchedule(accounts, rewrites, tweetsPerAccount, startDate, endDate, useOptimalTimes) {
    const schedule = [];
    let rewriteIndex = 0;

    // Optimal posting times (based on engagement data)
    const optimalHours = [9, 12, 15, 18, 21]; // 9am, noon, 3pm, 6pm, 9pm

    for (const account of accounts) {
      const currentDate = new Date(startDate);

      for (let tweetNum = 0; tweetNum < tweetsPerAccount; tweetNum++) {
        if (rewriteIndex >= rewrites.length) {
          console.warn('Ran out of tweet variations');
          break;
        }

        let scheduledTime;

        if (useOptimalTimes) {
          // Schedule at optimal times
          const hour = optimalHours[tweetNum % optimalHours.length];
          scheduledTime = new Date(currentDate);
          scheduledTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        } else {
          // Random time distribution
          scheduledTime = new Date(currentDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        }

        // Add some randomness (+/- 30 minutes)
        scheduledTime = new Date(scheduledTime.getTime() + (Math.random() - 0.5) * 60 * 60 * 1000);

        schedule.push({
          accountId: account.id,
          tweet: rewrites[rewriteIndex],
          scheduledFor: scheduledTime.toISOString()
        });

        rewriteIndex++;

        // Move to next day for next batch
        if ((tweetNum + 1) % optimalHours.length === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Check end date
        if (endDate && currentDate > endDate) {
          break;
        }
      }
    }

    // Sort by scheduled time
    schedule.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

    return schedule;
  }

  /**
   * Get posting schedule for user
   */
  async getSchedule(userId, filters = {}) {
    let query = this.supabase
      .from('posting_queue')
      .select(`
        *,
        social_accounts (
          platform,
          username
        )
      `)
      .eq('user_id', userId)
      .eq('content_type', 'post')
      .in('status', ['pending', 'rate_limited']);

    if (filters.accountId) {
      query = query.eq('social_account_id', filters.accountId);
    }

    if (filters.startDate) {
      query = query.gte('scheduled_for', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('scheduled_for', filters.endDate);
    }

    query = query.order('scheduled_for', { ascending: true });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  /**
   * Cancel scheduled tweets
   */
  async cancelScheduled(userId, filters = {}) {
    let query = this.supabase
      .from('posting_queue')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('content_type', 'post')
      .in('status', ['pending', 'rate_limited']);

    if (filters.accountId) {
      query = query.eq('social_account_id', filters.accountId);
    }

    if (filters.beforeDate) {
      query = query.lte('scheduled_for', filters.beforeDate);
    }

    const { data, error } = await query.select();

    if (error) throw error;

    return {
      cancelled: data.length
    };
  }

  /**
   * Reschedule tweets to different times
   */
  async reschedule(userId, accountId, newStartDate) {
    // Get pending tweets
    const { data: pending, error: fetchError } = await this.supabase
      .from('posting_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('social_account_id', accountId)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true });

    if (fetchError) throw fetchError;

    if (!pending || pending.length === 0) {
      return { rescheduled: 0 };
    }

    // Generate new schedule
    const optimalHours = [9, 12, 15, 18, 21];
    const currentDate = new Date(newStartDate);

    for (let i = 0; i < pending.length; i++) {
      const hour = optimalHours[i % optimalHours.length];
      const newTime = new Date(currentDate);
      newTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

      // Add randomness
      newTime.setTime(newTime.getTime() + (Math.random() - 0.5) * 60 * 60 * 1000);

      await this.supabase
        .from('posting_queue')
        .update({ scheduled_for: newTime.toISOString() })
        .eq('id', pending[i].id);

      // Move to next day after full cycle
      if ((i + 1) % optimalHours.length === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return {
      rescheduled: pending.length,
      new_start: newStartDate
    };
  }

  /**
   * Shuffle array in place
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export default TwitterSchedulerService;


