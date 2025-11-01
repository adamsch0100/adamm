import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Bio Link Tracker Service
 * Creates trackable short links for bio/profile links
 */
class BioLinkTrackerService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Create trackable bio link
   */
  async createBioLink(userId, linkData) {
    const {
      destinationUrl,
      title,
      accountId,
      funnelId,
      utmParams = {}
    } = linkData;

    if (!destinationUrl) {
      throw new Error('destinationUrl is required');
    }

    // Generate short code
    const shortCode = this.generateShortCode();

    // Add UTM parameters to destination URL
    const trackedUrl = this.addUTMParams(destinationUrl, {
      utm_source: utmParams.source || 'social',
      utm_medium: utmParams.medium || 'bio_link',
      utm_campaign: utmParams.campaign || 'organic',
      ...utmParams
    });

    const { data, error } = await this.supabase
      .from('bio_links')
      .insert({
        user_id: userId,
        social_account_id: accountId,
        short_code: shortCode,
        destination_url: trackedUrl,
        title: title || 'Bio Link',
        funnel_id: funnelId,
        utm_params: utmParams,
        active: true
      })
      .select()
      .single();

    if (error) throw error;

    return {
      linkId: data.id,
      shortCode,
      shortUrl: `https://yourapp.com/l/${shortCode}`,
      destinationUrl: trackedUrl
    };
  }

  /**
   * Track bio link click
   */
  async trackClick(shortCode, clickData = {}) {
    // Get bio link
    const { data: bioLink, error: linkError } = await this.supabase
      .from('bio_links')
      .select('*')
      .eq('short_code', shortCode)
      .eq('active', true)
      .single();

    if (linkError || !bioLink) {
      throw new Error('Link not found or inactive');
    }

    // Record click
    const { data: click, error: clickError } = await this.supabase
      .from('bio_link_clicks')
      .insert({
        bio_link_id: bioLink.id,
        lead_id: clickData.leadId,
        ip_address: clickData.ip,
        user_agent: clickData.userAgent,
        referrer: clickData.referrer,
        country: clickData.country,
        city: clickData.city
      })
      .select()
      .single();

    if (clickError) throw clickError;

    // Update bio link stats
    await this.supabase
      .from('bio_links')
      .update({
        total_clicks: bioLink.total_clicks + 1,
        unique_visitors: bioLink.unique_visitors + (clickData.isUnique ? 1 : 0)
      })
      .eq('id', bioLink.id);

    // Track in funnel if applicable
    if (bioLink.funnel_id) {
      await this.supabase
        .from('funnel_events')
        .insert({
          funnel_id: bioLink.funnel_id,
          lead_id: clickData.leadId,
          event_type: 'bio_click',
          event_data: {
            bio_link_id: bioLink.id,
            short_code: shortCode,
            referrer: clickData.referrer
          },
          social_account_id: bioLink.social_account_id
        });
    }

    return {
      destination: bioLink.destination_url,
      clickId: click.id
    };
  }

  /**
   * Get bio link statistics
   */
  async getBioLinkStats(userId, linkId = null) {
    let query = this.supabase
      .from('bio_links')
      .select(`
        *,
        bio_link_clicks (count)
      `)
      .eq('user_id', userId);

    if (linkId) {
      query = query.eq('id', linkId);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (linkId) {
      // Detailed stats for single link
      const link = data[0];
      if (!link) throw new Error('Link not found');

      // Get click details
      const { data: clicks } = await this.supabase
        .from('bio_link_clicks')
        .select('*')
        .eq('bio_link_id', linkId)
        .order('clicked_at', { ascending: false });

      // Calculate conversion rate
      const { data: purchases } = await this.supabase
        .from('funnel_events')
        .select('*')
        .eq('funnel_id', link.funnel_id)
        .eq('event_type', 'purchase');

      return {
        link,
        total_clicks: link.total_clicks,
        unique_visitors: link.unique_visitors,
        purchases: (purchases || []).length,
        conversion_rate: link.total_clicks > 0 
          ? ((purchases || []).length / link.total_clicks * 100).toFixed(2)
          : 0,
        recent_clicks: (clicks || []).slice(0, 100)
      };

    } else {
      // Summary for all links
      const summary = {
        total_links: data.length,
        total_clicks: data.reduce((sum, l) => sum + l.total_clicks, 0),
        total_unique_visitors: data.reduce((sum, l) => sum + l.unique_visitors, 0),
        top_links: data
          .sort((a, b) => b.total_clicks - a.total_clicks)
          .slice(0, 10)
      };

      return summary;
    }
  }

  /**
   * Generate short code
   */
  generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Add UTM parameters to URL
   */
  addUTMParams(url, params) {
    const urlObj = new URL(url);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlObj.searchParams.set(key, value);
      }
    });

    return urlObj.toString();
  }
}

export default BioLinkTrackerService;


