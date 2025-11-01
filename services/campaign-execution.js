import axios from 'axios';
import VideoGenerationService from './video-generation.js';

/**
 * Campaign Execution Service
 * Handles flexible campaign creation with video generation and posting
 */
class CampaignExecutionService {
  constructor(supabase, config) {
    this.supabase = supabase;
    this.config = config;
    this.videoGen = new VideoGenerationService(config.openaiApiKey, config.googleApiKey);
  }

  /**
   * Create and execute a campaign
   */
  async executeCampaign(campaignId) {
    try {
      // Fetch campaign details
      const { data: campaign, error } = await this.supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      // Step 1: Fetch topic if auto
      if (campaign.topic_source === 'auto') {
        await this.updateStatus(campaignId, 'generating_script', 5, 'Fetching trending crypto topic');
        const topic = await this.fetchTrendingTopic();
        campaign.topic = topic.name;
        campaign.topic_metadata = topic;
      } else {
        await this.updateStatus(campaignId, 'generating_script', 5, 'Using custom topic');
      }

      // Step 2: Generate script
      await this.updateStatus(campaignId, 'generating_script', 10, 'Generating script for topic');
      const script = await this.generateScript(campaign.topic, campaign.topic_metadata);
      
      await this.supabase
        .from('campaigns')
        .update({ script, started_at: new Date().toISOString() })
        .eq('id', campaignId);

      // Step 3: Generate video variations
      await this.updateStatus(campaignId, 'generating_videos', 15, `Starting generation of ${campaign.video_count} videos`);
      const videos = await this.generateVideos(campaignId, campaign, script);

      // Step 4: Download videos
      await this.updateStatus(campaignId, 'downloading', 90, 'Downloading completed videos');
      const downloadedVideos = await this.downloadVideos(campaignId, videos);

      // Update campaign with video data
      await this.supabase
        .from('campaigns')
        .update({
          video_ids: downloadedVideos.map(v => v.id),
          videos_status: downloadedVideos.map((v, i) => ({
            id: v.id,
            status: 'completed',
            progress: 100,
            url: v.url,
            thumbnail: v.thumbnail,
            approved: false,
            rejected: false,
            index: i
          }))
        })
        .eq('id', campaignId);

      // Check if approval required
      if (campaign.require_approval) {
        await this.updateStatus(campaignId, 'pending_review', 95, 'Waiting for video approval');
        return { success: true, status: 'pending_review', campaignId };
      }

      // Step 5: Post to accounts
      await this.postToAccounts(campaignId, campaign, downloadedVideos);

      await this.updateStatus(campaignId, 'completed', 100, 'Campaign completed successfully');
      await this.supabase
        .from('campaigns')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', campaignId);

      return { success: true, status: 'completed', campaignId };

    } catch (error) {
      console.error(`Campaign ${campaignId} execution error:`, error);
      await this.updateStatus(campaignId, 'failed', 0, 'Campaign failed', error.message);
      throw error;
    }
  }

  /**
   * Fetch trending crypto topic from CoinMarketCap
   */
  async fetchTrendingTopic() {
    try {
      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': this.config.coinmarketcapApiKey
        },
        params: {
          start: 1,
          limit: 5,
          sort: 'percent_change_24h',
          sort_dir: 'desc'
        }
      });

      const topCrypto = response.data.data[0];
      return {
        name: topCrypto.name,
        symbol: topCrypto.symbol,
        price: topCrypto.quote?.USD?.price || 0,
        percentChange24h: topCrypto.quote?.USD?.percent_change_24h || 0,
        marketCap: topCrypto.quote?.USD?.market_cap || 0,
        volume24h: topCrypto.quote?.USD?.volume_24h || 0
      };
    } catch (error) {
      console.error('Failed to fetch trending topic:', error);
      throw new Error('Failed to fetch trending crypto topic');
    }
  }

  /**
   * Generate script using OpenAI
   */
  async generateScript(topic, metadata = {}) {
    try {
      const prompt = `Create an engaging TikTok script about ${topic}. 
${metadata.percentChange24h ? `Current price movement: ${metadata.percentChange24h > 0 ? '+' : ''}${metadata.percentChange24h.toFixed(2)}%` : ''}

Format as JSON:
{
  "hook": "attention-grabbing first line",
  "facts": ["fact 1", "fact 2", "fact 3"],
  "cta": "call to action"
}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Script generation error:', error);
      throw new Error('Failed to generate script');
    }
  }

  /**
   * Generate multiple video variations
   */
  async generateVideos(campaignId, campaign, script) {
    const videoPrompts = await this.generateVideoPrompts(campaign.topic, script, campaign.video_count);
    const videos = [];

    for (let i = 0; i < campaign.video_count; i++) {
      const progress = 15 + ((i / campaign.video_count) * 70);
      await this.updateStatus(
        campaignId,
        'generating_videos',
        Math.round(progress),
        `Generating video ${i + 1} of ${campaign.video_count}`
      );

      try {
        const video = await this.videoGen.generateWithSora2(videoPrompts[i], {
          duration: 8,
          resolution: '1080p',
          aspectRatio: '9:16'
        });

        videos.push(video);

        // Update individual video status
        await this.updateVideoStatus(campaignId, i, video.videoId, 'queued', 0);

        // Poll until complete
        await this.pollVideoCompletion(campaignId, i, video.videoId);

      } catch (error) {
        console.error(`Failed to generate video ${i + 1}:`, error);
        await this.updateVideoStatus(campaignId, i, null, 'failed', 0);
      }
    }

    return videos;
  }

  /**
   * Generate video prompts with variations
   */
  async generateVideoPrompts(topic, script, count) {
    const styles = [
      'spinning coin with charts background',
      'chart animation with rising line',
      'crypto mining visualization',
      'digital particles forming logo',
      'dynamic market data overlay',
      'futuristic holographic display',
      'coins raining with effects',
      'blockchain network visualization',
      'price surge rocket trajectory',
      'candlestick patterns animation'
    ];

    const prompts = [];
    for (let i = 0; i < count; i++) {
      const style = styles[i % styles.length];
      prompts.push(`Wide vertical shot of ${topic} cryptocurrency, ${style}, cinematic lighting, ${script.hook.toLowerCase()}, optimized for TikTok vertical format 9:16`);
    }

    return prompts;
  }

  /**
   * Poll video generation status
   */
  async pollVideoCompletion(campaignId, videoIndex, videoId) {
    const maxAttempts = 120; // 10 minutes (5 second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      try {
        const status = await this.videoGen.checkStatus('sora-2', videoId);

        if (status.status === 'completed') {
          await this.updateVideoStatus(campaignId, videoIndex, videoId, 'completed', 100);
          return status;
        } else if (status.status === 'failed') {
          await this.updateVideoStatus(campaignId, videoIndex, videoId, 'failed', 0);
          throw new Error('Video generation failed');
        } else {
          // Still processing
          const progress = Math.min(95, attempts * 2); // Rough progress estimate
          await this.updateVideoStatus(campaignId, videoIndex, videoId, 'in_progress', progress);
        }

        attempts++;
      } catch (error) {
        console.error(`Error polling video ${videoId}:`, error);
        attempts++;
      }
    }

    throw new Error(`Video ${videoId} generation timed out`);
  }

  /**
   * Download generated videos
   */
  async downloadVideos(campaignId, videos) {
    const downloaded = [];

    for (const video of videos) {
      try {
        downloaded.push({
          id: video.videoId,
          url: video.videoUrl,
          thumbnail: video.thumbnailUrl,
          generator: video.generator
        });
      } catch (error) {
        console.error(`Failed to download video ${video.videoId}:`, error);
      }
    }

    return downloaded;
  }

  /**
   * Post videos to selected accounts
   */
  async postToAccounts(campaignId, campaign, videos) {
    await this.updateStatus(campaignId, 'posting', 95, 'Posting to accounts');

    const postingStatus = [];
    let successCount = 0;
    let failCount = 0;

    // Fetch target accounts
    const { data: accounts } = await this.supabase
      .from('social_accounts')
      .select('*')
      .in('id', campaign.target_accounts);

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const videoIndex = i % videos.length; // Cycle through videos
      const video = videos[videoIndex];

      try {
        // Call posting endpoint (implement based on your posting logic)
        const result = await this.postVideo(account, video, campaign.captions[videoIndex]);

        postingStatus.push({
          account_id: account.id,
          account_username: account.username,
          platform: account.platform,
          video_index: videoIndex,
          status: 'posted',
          posted_at: new Date().toISOString()
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to post to account ${account.id}:`, error);
        postingStatus.push({
          account_id: account.id,
          account_username: account.username,
          platform: account.platform,
          video_index: videoIndex,
          status: 'failed',
          error: error.message
        });

        failCount++;
      }
    }

    // Update campaign with results
    await this.supabase
      .from('campaigns')
      .update({
        posting_status: postingStatus,
        total_posted: successCount,
        total_failed: failCount
      })
      .eq('id', campaignId);
  }

  /**
   * Post single video to account
   */
  async postVideo(account, video, caption) {
    // Implement based on your platform-specific posting logic
    // This is a placeholder
    console.log(`Posting video ${video.id} to ${account.platform} account ${account.username}`);
    return { success: true };
  }

  /**
   * Update campaign status
   */
  async updateStatus(campaignId, status, progress, currentStep, errorMessage = null) {
    const update = {
      status,
      progress,
      current_step: currentStep
    };

    if (errorMessage) {
      update.error_message = errorMessage;
    }

    await this.supabase
      .from('campaigns')
      .update(update)
      .eq('id', campaignId);
  }

  /**
   * Update individual video status
   */
  async updateVideoStatus(campaignId, videoIndex, videoId, status, progress) {
    const { data: campaign } = await this.supabase
      .from('campaigns')
      .select('videos_status')
      .eq('id', campaignId)
      .single();

    const videosStatus = campaign?.videos_status || [];
    videosStatus[videoIndex] = {
      id: videoId,
      status,
      progress,
      index: videoIndex
    };

    await this.supabase
      .from('campaigns')
      .update({ videos_status: videosStatus })
      .eq('id', campaignId);
  }

  /**
   * Approve videos and trigger posting
   */
  async approveVideos(campaignId, approvedIndices) {
    const { data: campaign } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) throw new Error('Campaign not found');

    // Update video approval status
    const videosStatus = campaign.videos_status.map((v, i) => ({
      ...v,
      approved: approvedIndices.includes(i),
      rejected: !approvedIndices.includes(i)
    }));

    await this.supabase
      .from('campaigns')
      .update({
        videos_status: videosStatus,
        approved_video_count: approvedIndices.length,
        rejected_video_count: campaign.video_count - approvedIndices.length,
        reviewed_at: new Date().toISOString(),
        status: 'approved'
      })
      .eq('id', campaignId);

    // If auto-post enabled, start posting
    if (campaign.auto_post_on_approval) {
      const approvedVideos = campaign.videos_status.filter((_, i) => approvedIndices.includes(i));
      await this.postToAccounts(campaignId, campaign, approvedVideos);
      await this.updateStatus(campaignId, 'completed', 100, 'Campaign completed');
    }
  }
}

export default CampaignExecutionService;




