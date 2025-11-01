import { createClient } from '@supabase/supabase-js';

/**
 * Lead Capture Service
 * Monitors comments for keywords and triggers auto-DMs with lead magnets
 */
class LeadCaptureService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Create lead trigger
   */
  async createTrigger(userId, triggerData) {
    const {
      platform = 'twitter',
      keyword,
      triggerType = 'comment',
      responseAction = 'auto_dm',
      responseTemplate,
      leadMagnetUrl,
      requireFollow = true,
      requireLike = false,
      requireRepost = false
    } = triggerData;

    if (!keyword) {
      throw new Error('Trigger keyword is required');
    }

    const { data, error } = await this.supabase
      .from('lead_triggers')
      .insert({
        user_id: userId,
        platform,
        trigger_keyword: keyword.toUpperCase(), // Standardize to uppercase
        trigger_type: triggerType,
        response_action: responseAction,
        response_template: responseTemplate || this.getDefaultTemplate(keyword, leadMagnetUrl),
        lead_magnet_url: leadMagnetUrl,
        require_follow: requireFollow,
        require_like: requireLike,
        require_repost: requireRepost,
        active: true
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get default DM template
   */
  getDefaultTemplate(keyword, url) {
    return `Hey {username}! 👋

Thanks for commenting "${keyword}"!

Here's your free guide: ${url || '{link}'}

Let me know if you have any questions! 🚀`;
  }

  /**
   * Capture lead from comment/mention
   */
  async captureLead(userId, leadData) {
    const {
      accountId,
      leadUsername,
      platform,
      keyword,
      triggerId,
      metadata = {}
    } = leadData;

    // Check if lead already exists
    const { data: existing, error: checkError } = await this.supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('lead_username', leadUsername)
      .eq('lead_platform', platform)
      .single();

    if (existing && !checkError) {
      console.log(`Lead @${leadUsername} already captured`);
      return {
        lead: existing,
        alreadyExists: true
      };
    }

    // Create new lead
    const { data, error } = await this.supabase
      .from('leads')
      .insert({
        user_id: userId,
        social_account_id: accountId,
        lead_username: leadUsername,
        lead_platform: platform,
        trigger_id: triggerId,
        trigger_keyword: keyword,
        funnel_stage: 'lead',
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✓ Captured lead: @${leadUsername}`);

    return {
      lead: data,
      alreadyExists: false
    };
  }

  /**
   * Process comment and capture lead if matches trigger
   */
  async processComment(userId, commentData) {
    const {
      accountId,
      platform,
      commentText,
      commenterUsername,
      commenterFollows = false,
      commenterLiked = false,
      commenterReposted = false,
      postId
    } = commentData;

    // Get active triggers for this platform
    const { data: triggers, error: triggersError } = await this.supabase
      .from('lead_triggers')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('active', true);

    if (triggersError || !triggers || triggers.length === 0) {
      return { matched: false };
    }

    // Check if comment matches any trigger
    const matchedTrigger = triggers.find(trigger => {
      const commentUpper = commentText.toUpperCase();
      return commentUpper.includes(trigger.trigger_keyword);
    });

    if (!matchedTrigger) {
      return { matched: false };
    }

    console.log(`Comment matches trigger: ${matchedTrigger.trigger_keyword}`);

    // Check requirements
    const meetsRequirements = 
      (!matchedTrigger.require_follow || commenterFollows) &&
      (!matchedTrigger.require_like || commenterLiked) &&
      (!matchedTrigger.require_repost || commenterReposted);

    if (!meetsRequirements) {
      console.log(`User @${commenterUsername} doesn't meet requirements`);
      return {
        matched: true,
        trigger: matchedTrigger,
        meetsRequirements: false,
        requirements: {
          follow: matchedTrigger.require_follow,
          like: matchedTrigger.require_like,
          repost: matchedTrigger.require_repost
        }
      };
    }

    // Capture lead
    const { lead, alreadyExists } = await this.captureLead(userId, {
      accountId,
      leadUsername: commenterUsername,
      platform,
      keyword: matchedTrigger.trigger_keyword,
      triggerId: matchedTrigger.id,
      metadata: {
        post_id: postId,
        comment_text: commentText
      }
    });

    return {
      matched: true,
      trigger: matchedTrigger,
      meetsRequirements: true,
      lead,
      alreadyExists
    };
  }

  /**
   * Get leads for user
   */
  async getLeads(userId, filters = {}) {
    let query = this.supabase
      .from('leads')
      .select(`
        *,
        social_accounts (
          platform,
          username
        ),
        lead_triggers (
          trigger_keyword,
          response_template
        )
      `)
      .eq('user_id', userId);

    if (filters.stage) {
      query = query.eq('funnel_stage', filters.stage);
    }

    if (filters.platform) {
      query = query.eq('lead_platform', filters.platform);
    }

    if (filters.converted !== undefined) {
      query = query.eq('converted', filters.converted);
    }

    query = query.order('captured_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  /**
   * Update lead stage
   */
  async updateLeadStage(leadId, stage, additionalData = {}) {
    const updates = {
      funnel_stage: stage,
      ...additionalData
    };

    const { data, error } = await this.supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Mark lead as converted
   */
  async markLeadConverted(leadId, conversionValue = 0) {
    const updates = {
      converted: true,
      converted_at: new Date().toISOString(),
      conversion_value: conversionValue,
      funnel_stage: 'converted'
    };

    const { data, error } = await this.supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(userId, timeframe = 'all') {
    let query = this.supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);

    // Apply timeframe filter
    if (timeframe !== 'all') {
      const date = new Date();
      if (timeframe === 'today') {
        date.setHours(0, 0, 0, 0);
      } else if (timeframe === '7days') {
        date.setDate(date.getDate() - 7);
      } else if (timeframe === '30days') {
        date.setDate(date.getDate() - 30);
      }
      query = query.gte('captured_at', date.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      total_leads: data.length,
      by_stage: {
        lead: data.filter(l => l.funnel_stage === 'lead').length,
        engaged: data.filter(l => l.funnel_stage === 'engaged').length,
        converted: data.filter(l => l.funnel_stage === 'converted').length,
        lost: data.filter(l => l.funnel_stage === 'lost').length
      },
      dm_metrics: {
        sent: data.filter(l => l.dm_sent).length,
        opened: data.filter(l => l.dm_opened).length,
        clicked: data.filter(l => l.link_clicked).length,
        open_rate: 0,
        click_rate: 0
      },
      conversions: {
        count: data.filter(l => l.converted).length,
        total_value: data.reduce((sum, l) => sum + parseFloat(l.conversion_value || 0), 0),
        conversion_rate: 0
      },
      by_platform: {}
    };

    // Calculate rates
    if (stats.dm_metrics.sent > 0) {
      stats.dm_metrics.open_rate = (stats.dm_metrics.opened / stats.dm_metrics.sent * 100).toFixed(2);
      stats.dm_metrics.click_rate = (stats.dm_metrics.clicked / stats.dm_metrics.sent * 100).toFixed(2);
    }

    if (stats.total_leads > 0) {
      stats.conversions.conversion_rate = (stats.conversions.count / stats.total_leads * 100).toFixed(2);
    }

    // Group by platform
    const platforms = [...new Set(data.map(l => l.lead_platform))];
    platforms.forEach(platform => {
      const platformLeads = data.filter(l => l.lead_platform === platform);
      stats.by_platform[platform] = {
        total: platformLeads.length,
        converted: platformLeads.filter(l => l.converted).length
      };
    });

    return stats;
  }

  /**
   * Get active triggers
   */
  async getActiveTriggers(userId, platform = null) {
    let query = this.supabase
      .from('lead_triggers')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (platform) {
      query = query.eq('platform', platform);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  /**
   * Toggle trigger active status
   */
  async toggleTrigger(triggerId, active) {
    const { data, error } = await this.supabase
      .from('lead_triggers')
      .update({ 
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', triggerId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete trigger
   */
  async deleteTrigger(triggerId) {
    const { error } = await this.supabase
      .from('lead_triggers')
      .delete()
      .eq('id', triggerId);

    if (error) throw error;

    return { success: true };
  }
}

export default LeadCaptureService;


