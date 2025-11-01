import { createClient } from '@supabase/supabase-js';

/**
 * Funnel Tracker Service
 * Tracks complete user journey: views → clicks → leads → sales
 */
class FunnelTrackerService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Create funnel
   */
  async createFunnel(userId, funnelData) {
    const {
      name,
      description,
      steps,
      conversionGoals
    } = funnelData;

    if (!name || !steps) {
      throw new Error('name and steps are required');
    }

    const { data, error } = await this.supabase
      .from('funnels')
      .insert({
        user_id: userId,
        name,
        description,
        steps,
        conversion_goals: conversionGoals || {},
        active: true
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Track event in funnel
   */
  async trackEvent(eventData) {
    const {
      funnelId,
      leadId,
      eventType,
      eventData: customData = {},
      eventValue = 0,
      postId,
      accountId
    } = eventData;

    // Create event
    const { data, error } = await this.supabase
      .from('funnel_events')
      .insert({
        funnel_id: funnelId,
        lead_id: leadId,
        event_type: eventType,
        event_data: customData,
        event_value: eventValue,
        post_id: postId,
        social_account_id: accountId
      })
      .select()
      .single();

    if (error) throw error;

    // Update related records based on event type
    if (eventType === 'view' && postId) {
      await this.supabase
        .from('content_posts')
        .update({
          view_count: this.supabase.rpc('increment', { x: 1 })
        })
        .eq('id', postId);
    }

    if (eventType === 'bio_click' && postId) {
      await this.supabase
        .from('content_posts')
        .update({
          bio_clicks: this.supabase.rpc('increment', { x: 1 })
        })
        .eq('id', postId);
    }

    if (eventType === 'purchase' && postId) {
      await this.supabase
        .from('content_posts')
        .update({
          conversion_count: this.supabase.rpc('increment', { x: 1 }),
          revenue_generated: this.supabase.rpc('increment', { x: eventValue })
        })
        .eq('id', postId);
    }

    return data;
  }

  /**
   * Get funnel analytics
   */
  async getFunnelAnalytics(funnelId) {
    // Get funnel details
    const { data: funnel, error: funnelError } = await this.supabase
      .from('funnels')
      .select('*')
      .eq('id', funnelId)
      .single();

    if (funnelError || !funnel) {
      throw new Error('Funnel not found');
    }

    // Get all events for this funnel
    const { data: events, error: eventsError } = await this.supabase
      .from('funnel_events')
      .select('*')
      .eq('funnel_id', funnelId)
      .order('occurred_at', { ascending: true });

    if (eventsError) throw eventsError;

    // Calculate metrics by stage
    const eventsByType = {};
    events.forEach(event => {
      if (!eventsByType[event.event_type]) {
        eventsByType[event.event_type] = [];
      }
      eventsByType[event.event_type].push(event);
    });

    // Calculate conversion rates
    const totalViews = (eventsByType['view'] || []).length;
    const totalClicks = (eventsByType['bio_click'] || []).length;
    const totalDMOpens = (eventsByType['dm_open'] || []).length;
    const totalLinkClicks = (eventsByType['link_click'] || []).length;
    const totalPurchases = (eventsByType['purchase'] || []).length;

    const analytics = {
      funnel_id: funnelId,
      funnel_name: funnel.name,
      total_events: events.length,
      stages: {
        views: {
          count: totalViews,
          conversion_to_next: totalViews > 0 ? (totalClicks / totalViews * 100).toFixed(2) : 0
        },
        bio_clicks: {
          count: totalClicks,
          conversion_from_views: totalViews > 0 ? (totalClicks / totalViews * 100).toFixed(2) : 0,
          conversion_to_next: totalClicks > 0 ? (totalDMOpens / totalClicks * 100).toFixed(2) : 0
        },
        dm_opens: {
          count: totalDMOpens,
          open_rate: totalClicks > 0 ? (totalDMOpens / totalClicks * 100).toFixed(2) : 0,
          conversion_to_next: totalDMOpens > 0 ? (totalLinkClicks / totalDMOpens * 100).toFixed(2) : 0
        },
        link_clicks: {
          count: totalLinkClicks,
          click_rate: totalDMOpens > 0 ? (totalLinkClicks / totalDMOpens * 100).toFixed(2) : 0,
          conversion_to_next: totalLinkClicks > 0 ? (totalPurchases / totalLinkClicks * 100).toFixed(2) : 0
        },
        purchases: {
          count: totalPurchases,
          conversion_rate: totalViews > 0 ? (totalPurchases / totalViews * 100).toFixed(2) : 0,
          total_revenue: (eventsByType['purchase'] || []).reduce((sum, e) => sum + parseFloat(e.event_value || 0), 0)
        }
      },
      overall: {
        total_views: totalViews,
        total_conversions: totalPurchases,
        conversion_rate: totalViews > 0 ? (totalPurchases / totalViews * 100).toFixed(2) : 0,
        total_revenue: (eventsByType['purchase'] || []).reduce((sum, e) => sum + parseFloat(e.event_value || 0), 0),
        avg_revenue_per_conversion: totalPurchases > 0 ? 
          ((eventsByType['purchase'] || []).reduce((sum, e) => sum + parseFloat(e.event_value || 0), 0) / totalPurchases).toFixed(2) : 0
      }
    };

    return analytics;
  }

  /**
   * Get user's funnels
   */
  async getUserFunnels(userId) {
    const { data, error } = await this.supabase
      .from('funnels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  /**
   * Track post attribution (which post led to sale)
   */
  async getPostAttribution(userId, timeframe = '30days') {
    let dateFilter = null;
    if (timeframe !== 'all') {
      const date = new Date();
      if (timeframe === '7days') {
        date.setDate(date.getDate() - 7);
      } else if (timeframe === '30days') {
        date.setDate(date.getDate() - 30);
      }
      dateFilter = date.toISOString();
    }

    // Get posts with their performance
    let query = this.supabase
      .from('content_posts')
      .select('*')
      .eq('user_id', userId)
      .order('revenue_generated', { ascending: false });

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: posts, error } = await query.limit(50);

    if (error) throw error;

    const attribution = posts.map(post => ({
      post_id: post.id,
      topic: post.topic,
      platforms: post.target_platforms,
      views: post.view_count || 0,
      bio_clicks: post.bio_clicks || 0,
      conversions: post.conversion_count || 0,
      revenue: parseFloat(post.revenue_generated || 0),
      click_rate: post.view_count > 0 ? (post.bio_clicks / post.view_count * 100).toFixed(2) : 0,
      conversion_rate: post.bio_clicks > 0 ? (post.conversion_count / post.bio_clicks * 100).toFixed(2) : 0,
      revenue_per_view: post.view_count > 0 ? (parseFloat(post.revenue_generated || 0) / post.view_count).toFixed(4) : 0
    }));

    const totals = {
      total_posts: posts.length,
      total_views: posts.reduce((sum, p) => sum + (p.view_count || 0), 0),
      total_clicks: posts.reduce((sum, p) => sum + (p.bio_clicks || 0), 0),
      total_conversions: posts.reduce((sum, p) => sum + (p.conversion_count || 0), 0),
      total_revenue: posts.reduce((sum, p) => sum + parseFloat(p.revenue_generated || 0), 0)
    };

    return {
      posts: attribution,
      totals
    };
  }
}

export default FunnelTrackerService;


