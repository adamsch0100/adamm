import { createClient } from '@supabase/supabase-js';

/**
 * Analytics Aggregator Service
 * Daily rollup of metrics, ROI calculations, revenue per account
 */
class AnalyticsAggregatorService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Get comprehensive analytics overview
   */
  async getOverview(userId, timeframe = '30days') {
    const dateFilter = this.getDateFilter(timeframe);

    // Get all metrics in parallel
    const [
      postMetrics,
      leadMetrics,
      revenueMetrics,
      accountMetrics,
      queueMetrics
    ] = await Promise.all([
      this.getPostMetrics(userId, dateFilter),
      this.getLeadMetrics(userId, dateFilter),
      this.getRevenueMetrics(userId, dateFilter),
      this.getAccountMetrics(userId),
      this.getQueueMetrics(userId, dateFilter)
    ]);

    // Calculate ROI
    const roi = this.calculateROI(revenueMetrics, accountMetrics);

    return {
      timeframe,
      posts: postMetrics,
      leads: leadMetrics,
      revenue: revenueMetrics,
      accounts: accountMetrics,
      queue: queueMetrics,
      roi
    };
  }

  /**
   * Get post metrics
   */
  async getPostMetrics(userId, dateFilter) {
    let query = this.supabase
      .from('content_posts')
      .select('*')
      .eq('user_id', userId);

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      total_posts: data.length,
      total_views: data.reduce((sum, p) => sum + (p.total_views || 0), 0),
      total_likes: data.reduce((sum, p) => sum + (p.total_likes || 0), 0),
      total_comments: data.reduce((sum, p) => sum + (p.total_comments || 0), 0),
      total_shares: data.reduce((sum, p) => sum + (p.total_shares || 0), 0),
      bio_clicks: data.reduce((sum, p) => sum + (p.bio_clicks || 0), 0),
      conversions: data.reduce((sum, p) => sum + (p.conversion_count || 0), 0),
      avg_views: data.length > 0 ? data.reduce((sum, p) => sum + (p.total_views || 0), 0) / data.length : 0,
      engagement_rate: this.calculateEngagementRate(data)
    };
  }

  /**
   * Get lead metrics
   */
  async getLeadMetrics(userId, dateFilter) {
    let query = this.supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);

    if (dateFilter) {
      query = query.gte('captured_at', dateFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      total_leads: data.length,
      dm_sent: data.filter(l => l.dm_sent).length,
      dm_opened: data.filter(l => l.dm_opened).length,
      link_clicked: data.filter(l => l.link_clicked).length,
      converted: data.filter(l => l.converted).length,
      open_rate: data.filter(l => l.dm_sent).length > 0 
        ? (data.filter(l => l.dm_opened).length / data.filter(l => l.dm_sent).length * 100).toFixed(2)
        : 0,
      click_rate: data.filter(l => l.dm_opened).length > 0
        ? (data.filter(l => l.link_clicked).length / data.filter(l => l.dm_opened).length * 100).toFixed(2)
        : 0,
      conversion_rate: data.length > 0
        ? (data.filter(l => l.converted).length / data.length * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(userId, dateFilter) {
    let query = this.supabase
      .from('product_sales')
      .select('*')
      .eq('user_id', userId);

    if (dateFilter) {
      query = query.gte('purchased_at', dateFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    const totalRevenue = data.reduce((sum, s) => sum + parseFloat(s.amount_usd), 0);

    return {
      total_sales: data.length,
      total_revenue: totalRevenue,
      avg_sale_value: data.length > 0 ? totalRevenue / data.length : 0,
      sales_with_attribution: data.filter(s => s.lead_id).length
    };
  }

  /**
   * Get account metrics
   */
  async getAccountMetrics(userId) {
    const { data: accounts, error } = await this.supabase
      .from('social_accounts')
      .select(`
        *,
        account_health (status, health_score)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const byPlatform = {};
    accounts.forEach(acc => {
      if (!byPlatform[acc.platform]) {
        byPlatform[acc.platform] = { total: 0, active: 0, healthy: 0 };
      }
      byPlatform[acc.platform].total++;
      if (acc.status === 'active') byPlatform[acc.platform].active++;
      if (acc.account_health && acc.account_health[0]?.status === 'healthy') {
        byPlatform[acc.platform].healthy++;
      }
    });

    return {
      total_accounts: accounts.length,
      active_accounts: accounts.filter(a => a.status === 'active').length,
      by_platform: byPlatform,
      avg_health_score: accounts
        .filter(a => a.account_health && a.account_health[0])
        .reduce((sum, a) => sum + (a.account_health[0].health_score || 0), 0) / accounts.length || 0
    };
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(userId, dateFilter) {
    let query = this.supabase
      .from('posting_queue')
      .select('*')
      .eq('user_id', userId);

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      total_queued: data.length,
      posted: data.filter(q => q.status === 'posted').length,
      failed: data.filter(q => q.status === 'failed').length,
      success_rate: data.length > 0
        ? (data.filter(q => q.status === 'posted').length / data.length * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Calculate ROI
   */
  calculateROI(revenue, accounts) {
    // Estimate costs
    const costPerAccount = 3; // $3/month for proxy
    const totalCost = accounts.total_accounts * costPerAccount;

    return {
      estimated_costs: totalCost,
      total_revenue: revenue.total_revenue,
      profit: revenue.total_revenue - totalCost,
      roi_percentage: totalCost > 0 
        ? ((revenue.total_revenue - totalCost) / totalCost * 100).toFixed(2)
        : 0,
      revenue_per_account: accounts.total_accounts > 0
        ? (revenue.total_revenue / accounts.total_accounts).toFixed(2)
        : 0
    };
  }

  /**
   * Calculate engagement rate
   */
  calculateEngagementRate(posts) {
    const totalViews = posts.reduce((sum, p) => sum + (p.total_views || 0), 0);
    const totalEngagements = posts.reduce((sum, p) => 
      sum + (p.total_likes || 0) + (p.total_comments || 0) + (p.total_shares || 0), 0
    );

    return totalViews > 0 ? (totalEngagements / totalViews * 100).toFixed(2) : 0;
  }

  /**
   * Get date filter for timeframe
   */
  getDateFilter(timeframe) {
    if (timeframe === 'all') return null;

    const date = new Date();
    if (timeframe === '7days') {
      date.setDate(date.getDate() - 7);
    } else if (timeframe === '30days') {
      date.setDate(date.getDate() - 30);
    } else if (timeframe === '90days') {
      date.setDate(date.getDate() - 90);
    }

    return date.toISOString();
  }
}

export default AnalyticsAggregatorService;


