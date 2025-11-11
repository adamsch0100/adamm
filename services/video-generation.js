import axios from 'axios';

/**
 * AI Video Generation Service
 * Supports both OpenAI Sora 2 and Google Veo 3
 */
class VideoGenerationService {
  constructor(openaiApiKey, googleApiKey) {
    this.openaiApiKey = openaiApiKey;
    this.googleApiKey = googleApiKey;
  }

  /**
   * Generate video with Sora 2 (OpenAI)
   * Best for: Physics/realism, creative scenarios
   */
  async generateWithSora2(prompt, options = {}) {
    const {
      duration = 5, // seconds
      resolution = '1080p',
      aspectRatio = '9:16' // TikTok/Instagram vertical
    } = options;

    try {
      console.log('Generating video with Sora 2...');
      
      const response = await axios.post(
        'https://api.openai.com/v1/videos/generations',
        {
          model: 'sora-1.0',
          prompt: prompt,
          duration: duration,
          resolution: resolution,
          aspect_ratio: aspectRatio
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        generator: 'sora-2',
        videoId: response.data.id,
        videoUrl: response.data.video_url,
        thumbnailUrl: response.data.thumbnail_url,
        duration: duration,
        prompt: prompt,
        status: response.data.status,
        metadata: {
          resolution,
          aspectRatio,
          hasAudio: true // Sora 2 generates with native audio
        }
      };

    } catch (error) {
      console.error('Sora 2 generation error:', error.response?.data || error.message);
      throw new Error(`Sora 2 failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Generate video with Veo 3 (Google)
   * Best for: Cinematic quality, text rendering, professional look
   */
  async generateWithVeo3(prompt, options = {}) {
    const {
      duration = 5,
      resolution = '1080p',
      aspectRatio = '9:16',
      style = 'realistic' // realistic, cinematic, animated
    } = options;

    try {
      console.log('Generating video with Veo 3...');
      
      // Google Veo 3 API (Vertex AI)
      const response = await axios.post(
        `https://aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-003:predict`,
        {
          instances: [{
            prompt: prompt,
            parameters: {
              duration: duration,
              resolution: resolution,
              aspectRatio: aspectRatio,
              style: style,
              fps: 30
            }
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.googleApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const prediction = response.data.predictions[0];

      return {
        success: true,
        generator: 'veo-3',
        videoId: prediction.id,
        videoUrl: prediction.videoUri,
        thumbnailUrl: prediction.thumbnailUri,
        duration: duration,
        prompt: prompt,
        status: prediction.status,
        metadata: {
          resolution,
          aspectRatio,
          style,
          hasAudio: true, // Veo 3 also has native audio
          textRendering: 'excellent' // Veo 3 strength
        }
      };

    } catch (error) {
      console.error('Veo 3 generation error:', error.response?.data || error.message);
      throw new Error(`Veo 3 failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Auto-select best generator for prompt
   * Uses heuristics to choose Sora 2 vs Veo 3
   */
  async generateAuto(prompt, options = {}) {
    const lowerPrompt = prompt.toLowerCase();

    // Veo 3 is better for:
    const veo3Indicators = [
      'professional', 'corporate', 'business', 'commercial',
      'text', 'logo', 'brand', 'cinematic', 'advertisement',
      'product', 'showcase', 'presentation'
    ];

    // Sora 2 is better for:
    const sora2Indicators = [
      'physics', 'water', 'fire', 'explosion', 'movement',
      'creative', 'abstract', 'surreal', 'artistic', 'nature',
      'realistic', 'lifelike', 'photorealistic'
    ];

    const veo3Score = veo3Indicators.filter(word => lowerPrompt.includes(word)).length;
    const sora2Score = sora2Indicators.filter(word => lowerPrompt.includes(word)).length;

    if (veo3Score > sora2Score && this.googleApiKey) {
      console.log('Auto-selected Veo 3 based on prompt analysis');
      return await this.generateWithVeo3(prompt, options);
    } else if (this.openaiApiKey) {
      console.log('Auto-selected Sora 2 based on prompt analysis');
      return await this.generateWithSora2(prompt, options);
    } else if (this.googleApiKey) {
      // Fallback to Veo 3 if only Google key available
      return await this.generateWithVeo3(prompt, options);
    } else {
      throw new Error('No video generation API keys configured');
    }
  }

  /**
   * Generate with fallback
   * Try primary generator, fallback to secondary if it fails
   */
  async generateWithFallback(prompt, options = {}) {
    const { preferredGenerator = 'sora-2' } = options;

    try {
      if (preferredGenerator === 'sora-2') {
        return await this.generateWithSora2(prompt, options);
      } else {
        return await this.generateWithVeo3(prompt, options);
      }
    } catch (primaryError) {
      console.warn(`Primary generator (${preferredGenerator}) failed, trying fallback...`);
      
      try {
        if (preferredGenerator === 'sora-2' && this.googleApiKey) {
          return await this.generateWithVeo3(prompt, options);
        } else if (this.openaiApiKey) {
          return await this.generateWithSora2(prompt, options);
        } else {
          throw primaryError;
        }
      } catch (fallbackError) {
        throw new Error(`Both generators failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Check generation status (for async processing)
   */
  async checkStatus(generator, videoId) {
    if (generator === 'sora-2') {
      const response = await axios.get(
        `https://api.openai.com/v1/videos/generations/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`
          }
        }
      );
      return response.data;
    } else if (generator === 'veo-3') {
      // Google Veo 3 status check
      const response = await axios.get(
        `https://aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_PROJECT_ID}/locations/us-central1/operations/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.googleApiKey}`
          }
        }
      );
      return response.data;
    }
  }

  /**
   * Optimize video for platform
   * Different platforms have different requirements
   */
  getOptimalSettings(platform) {
    const settings = {
      tiktok: {
        aspectRatio: '9:16',
        resolution: '1080p',
        duration: 15, // max 60s, but 15-30s performs best
        fps: 30
      },
      instagram: {
        aspectRatio: '9:16', // Reels
        resolution: '1080p',
        duration: 30, // max 90s
        fps: 30
      },
      youtube: {
        aspectRatio: '9:16', // Shorts
        resolution: '1080p',
        duration: 45, // max 60s
        fps: 60
      },
      facebook: {
        aspectRatio: '16:9', // Can be vertical too
        resolution: '1080p',
        duration: 30,
        fps: 30
      },
      linkedin: {
        aspectRatio: '16:9', // Professional horizontal
        resolution: '1080p',
        duration: 30,
        fps: 30
      },
      twitter: {
        aspectRatio: '16:9',
        resolution: '720p', // Twitter compresses heavily
        duration: 30, // max 140s
        fps: 30
      }
    };

    return settings[platform.toLowerCase()] || settings.tiktok;
  }

  /**
   * Enhance prompt for better video quality
   */
  enhancePrompt(basePrompt, platform, style = 'engaging') {
    const enhancements = {
      engaging: 'dynamic camera movement, vibrant colors, high energy,',
      professional: 'clean composition, professional lighting, corporate aesthetic,',
      creative: 'artistic flair, unique perspective, visually striking,',
      trending: 'viral-worthy, attention-grabbing, trendy aesthetic,'
    };

    const platformTips = {
      tiktok: 'fast-paced, trend-focused,',
      instagram: 'aesthetic, visually appealing,',
      youtube: 'high production value,',
      linkedin: 'professional, polished,',
      facebook: 'relatable, shareable,',
      twitter: 'newsworthy, concise,'
    };

    const enhancement = enhancements[style] || '';
    const platformTip = platformTips[platform] || '';

    return `${enhancement} ${platformTip} ${basePrompt}`;
  }
}

export default VideoGenerationService;
















