import { createClient } from '@supabase/supabase-js';

/**
 * Account Health Monitor Service
 * Detects shadowbans, reach declines, and alerts on suspicious patterns
 */
class AccountHealthMonitorService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Check health for all active accounts
   */
  async checkAllAccounts() {
    const { data: accounts, error } = await this.supabase
      .from('social_accounts')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    console.log(`Checking health for ${accounts.length} accounts`);

    const results = [];
    for (const account of accounts) {
      try {
        const health = await this.checkAccountHealth(account.id);
        results.push({
          accountId: account.id,
          username: account.username,
          platform: account.platform,
          health
        });
      } catch (error) {
        console.error(`Error checking account ${account.id}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Check health for specific account
   */
  async checkAccountHealth(accountId) {
    // Get or create health record
    let { data: health, error: healthError } = await this.supabase
      .from('account_health')
      .select('*')
      .eq('social_account_id', accountId)
      .single();

    if (healthError && healthError.code !== 'PGRST116') { // Not "not found"
      throw healthError;
    }

    if (!health) {
      // Create initial health record
      const { data: newHealth, error: createError } = await this.supabase
        .from('account_health')
        .insert({
          social_account_id: accountId,
          status: 'healthy',
          health_score: 100,
          metrics: {},
          alerts: []
        })
        .select()
        .single();

      if (createError) throw createError;
      health = newHealth;
    }

    // Get account data
    const { data: account, error: accountError } = await this.supabase
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError) throw accountError;

    // Get recent posts (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: recentPosts, error: postsError } = await this.supabase
      .from('content_posts')
      .select('*')
      .eq('user_id', account.user_id)
      .contains('target_platforms', [account.platform])
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // Analyze metrics
    const analysis = await this.analyzeAccountMetrics(account, recentPosts, health);

    // Update health record
    const updates = {
      last_check: new Date().toISOString(),
      status: analysis.status,
      metrics: analysis.metrics,
      alerts: analysis.alerts,
      health_score: analysis.health_score,
      auto_paused: analysis.should_pause,
      updated_at: new Date().toISOString()
    };

    const { data: updatedHealth, error: updateError } = await this.supabase
      .from('account_health')
      .update(updates)
      .eq('social_account_id', accountId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Auto-pause account if needed
    if (analysis.should_pause && account.status === 'active') {
      await this.supabase
        .from('social_accounts')
        .update({ status: 'suspended' })
        .eq('id', accountId);

      console.log(`⚠️ Auto-paused account ${accountId} due to health issues`);
    }

    return updatedHealth;
  }

  /**
   * Analyze account metrics
   */
  async analyzeAccountMetrics(account, recentPosts, previousHealth) {
    const alerts = [];
    const metrics = previousHealth.metrics || {};
    let health_score = 100;
    let status = 'healthy';
    let should_pause = false;

    // Calculate average views/engagement
    if (recentPosts && recentPosts.length >= 5) {
      const avgViews = recentPosts.reduce((sum, p) => sum + (p.total_views || 0), 0) / recentPosts.length;
      const avgLikes = recentPosts.reduce((sum, p) => sum + (p.total_likes || 0), 0) / recentPosts.length;
      const avgComments = recentPosts.reduce((sum, p) => sum + (p.total_comments || 0), 0) / recentPosts.length;

      metrics.avg_views = Math.round(avgViews);
      metrics.avg_likes = Math.round(avgLikes);
      metrics.avg_comments = Math.round(avgComments);
      metrics.engagement_rate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews * 100).toFixed(2) : 0;

      // Check for reach decline (compared to previous average)
      if (metrics.previous_avg_views) {
        const reachDecline = ((metrics.previous_avg_views - avgViews) / metrics.previous_avg_views) * 100;

        if (reachDecline > 50) {
          // 50%+ reach decline = likely shadowban
          alerts.push({
            type: 'reach_decline',
            severity: 'high',
            message: `Reach declined by ${reachDecline.toFixed(1)}% - possible shadowban`,
            detected_at: new Date().toISOString()
          });
          health_score -= 40;
          status = 'shadowban';
          should_pause = true;
        } else if (reachDecline > 30) {
          // 30-50% decline = warning
          alerts.push({
            type: 'reach_decline',
            severity: 'medium',
            message: `Reach declined by ${reachDecline.toFixed(1)}%`,
            detected_at: new Date().toISOString()
          });
          health_score -= 20;
          status = 'warning';
        }

        metrics.reach_decline_pct = reachDecline.toFixed(1);
      }

      // Update previous average for next comparison
      metrics.previous_avg_views = avgViews;

      // Check for engagement drop
      if (metrics.previous_engagement_rate) {
        const engagementDrop = metrics.previous_engagement_rate - metrics.engagement_rate;

        if (engagementDrop > 50) {
          alerts.push({
            type: 'engagement_drop',
            severity: 'medium',
            message: `Engagement dropped ${engagementDrop.toFixed(1)}%`,
            detected_at: new Date().toISOString()
          });
          health_score -= 15;
          if (status === 'healthy') status = 'warning';
        }
      }

      metrics.previous_engagement_rate = parseFloat(metrics.engagement_rate);

      // Check for follower loss
      const previousFollowers = metrics.previous_followers || account.followers_count;
      if (previousFollowers && account.followers_count) {
        const followerLoss = previousFollowers - account.followers_count;

        if (followerLoss > 100) {
          alerts.push({
            type: 'follower_loss',
            severity: 'medium',
            message: `Lost ${followerLoss} followers`,
            detected_at: new Date().toISOString()
          });
          health_score -= 10;
          if (status === 'healthy') status = 'warning';
        }

        metrics.follower_loss = followerLoss;
      }

      metrics.previous_followers = account.followers_count;

    } else {
      // Not enough data yet
      metrics.note = 'Insufficient data for analysis (need 5+ posts)';
    }

    // Check for posting frequency issues
    const daysSinceLastPost = recentPosts && recentPosts.length > 0
      ? Math.floor((Date.now() - new Date(recentPosts[0].created_at).getTime()) / (24 * 60 * 60 * 1000))
      : null;

    if (daysSinceLastPost !== null) {
      metrics.days_since_last_post = daysSinceLastPost;

      if (daysSinceLastPost > 7) {
        alerts.push({
          type: 'inactivity',
          severity: 'low',
          message: `No posts in ${daysSinceLastPost} days`,
          detected_at: new Date().toISOString()
        });
        health_score -= 5;
      }
    }

    // Check failed posts in queue
    const { count: failedCount, error: failedError } = await this.supabase
      .from('posting_queue')
      .select('*', { count: 'exact', head: true })
      .eq('social_account_id', account.id)
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!failedError && failedCount > 5) {
      alerts.push({
        type: 'posting_failures',
        severity: 'high',
        message: `${failedCount} failed posts in last 7 days`,
        detected_at: new Date().toISOString()
      });
      health_score -= 20;
      status = 'warning';
    }

    metrics.failed_posts_7d = failedCount || 0;

    // Keep only last 10 alerts
    const allAlerts = [...alerts, ...(previousHealth.alerts || [])].slice(0, 10);

    return {
      status,
      metrics,
      alerts: allAlerts,
      health_score: Math.max(0, Math.min(100, health_score)),
      should_pause
    };
  }

  /**
   * Get health summary for user
   */
  async getHealthSummary(userId) {
    const { data: accounts, error: accountsError } = await this.supabase
      .from('social_accounts')
      .select(`
        id,
        platform,
        username,
        status,
        account_health (
          status,
          health_score,
          alerts,
          last_check
        )
      `)
      .eq('user_id', userId);

    if (accountsError) throw accountsError;

    const summary = {
      total: accounts.length,
      healthy: 0,
      warning: 0,
      shadowbanned: 0,
      banned: 0,
      suspended: 0,
      unchecked: 0,
      critical_alerts: []
    };

    accounts.forEach(account => {
      if (account.account_health && account.account_health.length > 0) {
        const health = account.account_health[0];
        summary[health.status]++;

        // Collect critical alerts
        if (health.alerts) {
          health.alerts.forEach(alert => {
            if (alert.severity === 'high') {
              summary.critical_alerts.push({
                accountId: account.id,
                username: account.username,
                platform: account.platform,
                alert
              });
            }
          });
        }
      } else {
        summary.unchecked++;
      }
    });

    return summary;
  }

  /**
   * Pause all at-risk accounts
   */
  async pauseAtRiskAccounts(userId) {
    // Get accounts with warning or worse health
    const { data: accounts, error } = await this.supabase
      .from('social_accounts')
      .select(`
        id,
        username,
        account_health!inner (
          status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('account_health.status', ['warning', 'shadowban', 'banned']);

    if (error) throw error;

    const pausedAccounts = [];
    for (const account of accounts) {
      await this.supabase
        .from('social_accounts')
        .update({ status: 'suspended' })
        .eq('id', account.id);

      pausedAccounts.push({
        id: account.id,
        username: account.username
      });
    }

    return {
      paused: pausedAccounts.length,
      accounts: pausedAccounts
    };
  }

  /**
   * Resume account (clear auto-pause)
   */
  async resumeAccount(accountId) {
    // Reset health status
    await this.supabase
      .from('account_health')
      .update({
        auto_paused: false,
        alerts: [],
        updated_at: new Date().toISOString()
      })
      .eq('social_account_id', accountId);

    // Reactivate account
    await this.supabase
      .from('social_accounts')
      .update({ status: 'active' })
      .eq('id', accountId);

    return { success: true };
  }
}

export default AccountHealthMonitorService;


