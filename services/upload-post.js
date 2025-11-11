import axios from 'axios';

/**
 * Upload-post Service for Multi-Platform Social Media Posting
 * Supports: TikTok, Instagram, YouTube, Facebook, LinkedIn, X/Twitter
 */
class UploadPostService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.upload-post.com';
    // For user profile integration, use ApiKey auth
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    // For posting, use Bearer (if needed)
    this.postingClient = axios.create({
      baseURL: 'https://api.upload-post.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Upload video to multiple platforms simultaneously
   * @param {string} videoUrl - Publicly accessible video URL
   * @param {Object} options - Post options
   * @returns {Promise<Object>} Upload results per platform
   */
  async uploadToMultiplePlatforms(videoUrl, options) {
    const {
      platforms = ['tiktok'],
      captions = {},
      profileKeys = [],
      scheduleTime = null
    } = options;

    try {
      const payload = {
        url: videoUrl,
        platforms: platforms.map(p => p.toLowerCase()),
        profiles: profileKeys,
        schedule: scheduleTime,
        ...this.buildPlatformOptions(platforms, captions)
      };

      const response = await this.postingClient.post('/posts', payload);

      return {
        success: true,
        uploadId: response.data.id,
        status: response.data.status,
        postIds: response.data.post_ids || {},
        platforms: response.data.platforms || platforms,
        message: `Posted to ${platforms.length} platform(s)`
      };
    } catch (error) {
      console.error('Upload-post multi-platform error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to post to platforms');
    }
  }

  /**
   * Build platform-specific options from captions
   */
  buildPlatformOptions(platforms, captions) {
    const options = {};

    platforms.forEach(platform => {
      const caption = captions[platform] || captions.default || '';
      
      switch (platform.toLowerCase()) {
        case 'tiktok':
          options.tiktok_options = {
            description: caption,
            privacy: 'public',
            disable_comments: false,
            disable_duet: false,
            disable_stitch: false
          };
          break;

        case 'instagram':
          options.instagram_options = {
            caption: caption,
            location: null
          };
          break;

        case 'youtube':
          options.youtube_options = {
            title: caption.substring(0, 100),
            description: caption,
            privacy: 'public',
            category: 22, // People & Blogs
            tags: this.extractHashtags(caption)
          };
          break;

        case 'facebook':
          options.facebook_options = {
            message: caption,
            privacy: { value: 'EVERYONE' }
          };
          break;

        case 'linkedin':
          options.linkedin_options = {
            commentary: caption,
            visibility: 'PUBLIC'
          };
          break;

        case 'twitter':
        case 'x':
          options.twitter_options = {
            text: caption.substring(0, 280) // Twitter character limit
          };
          break;
      }
    });

    return options;
  }

  /**
   * Extract hashtags from caption
   */
  extractHashtags(caption) {
    const hashtags = caption.match(/#\w+/g);
    return hashtags ? hashtags.map(tag => tag.substring(1)) : [];
  }

  /**
   * Post text-only content to Twitter/X (for tweets)
   * @param {Object} options - Post options
   * @param {string} options.text - Tweet text (max 280 chars)
   * @param {Array<string>} options.profileKeys - Profile keys to post to
   * @param {string} options.platform - Platform name ('twitter' or 'x')
   * @param {Date} options.scheduleTime - Optional schedule time
   * @returns {Promise<Object>} Post result
   */
  async postTextOnly({ text, profileKeys, platform = 'twitter', scheduleTime = null, username = null }) {
    try {
      // User Profile Integration API uses 'user' parameter
      // Old API uses 'profiles' array
      const payload = {
        content: text.substring(0, 280), // Twitter limit
        platform: platform.toLowerCase(),
        ...(username ? { user: username } : { profiles: Array.isArray(profileKeys) ? profileKeys : [profileKeys] }),
        type: 'text',
        ...(scheduleTime && { schedule: scheduleTime.toISOString() })
      };

      const response = await this.postingClient.post('/posts/text', payload);

      return {
        success: true,
        postId: response.data.id,
        uploadId: response.data.upload_id || response.data.id,
        status: response.data.status,
        postIds: response.data.post_ids || {},
        platform: platform,
        message: `Posted text to ${platform}`
      };
    } catch (error) {
      console.error('Upload-post text post error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to post text to platform');
    }
  }

  /**
   * Post to multiple platforms simultaneously (text for Twitter, caption for TikTok)
   * @param {Object} options - Multi-platform post options
   * @param {string} options.text - Text content
   * @param {Array<string>} options.profileKeys - Profile keys to post to
   * @param {Array<string>} options.platforms - Platforms to post to ['twitter', 'tiktok']
   * @param {Object} options.captions - Platform-specific captions { twitter: "...", tiktok: "..." }
   * @param {Date} options.scheduleTime - Optional schedule time
   * @returns {Promise<Object>} Post results
   */
  async postToMultiplePlatforms({ text, profileKeys, platforms, captions = {}, scheduleTime = null }) {
    try {
      const payload = {
        content: text,
        platforms: platforms.map(p => p.toLowerCase()),
        profiles: Array.isArray(profileKeys) ? profileKeys : [profileKeys],
        type: 'text',
        ...(scheduleTime && { schedule: scheduleTime.toISOString() }),
        ...this.buildPlatformOptions(platforms, captions)
      };

      const response = await this.postingClient.post('/posts/multi', payload);

      return {
        success: true,
        uploadId: response.data.id,
        status: response.data.status,
        postIds: response.data.post_ids || {},
        platforms: response.data.platforms || platforms,
        message: `Posted to ${platforms.length} platform(s)`
      };
    } catch (error) {
      console.error('Upload-post multi-platform error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to post to multiple platforms');
    }
  }

  /**
   * Check upload status (for async processing)
   * @param {string} uploadId - Upload-post upload ID
   * @returns {Promise<Object>} Status information
   */
  async checkStatus(uploadId) {
    try {
      const response = await this.postingClient.get(`/posts/${uploadId}`);
      
      return {
        uploadId: uploadId,
        status: response.data.status,
        platformStatuses: response.data.platform_statuses || {},
        postIds: response.data.post_ids || {},
        errors: response.data.errors || {},
        completedAt: response.data.completed_at
      };
    } catch (error) {
      console.error('Status check error:', error.response?.data || error.message);
      throw new Error('Failed to check upload status');
    }
  }

  /**
   * Connect new social account to Upload-post profile
   * @param {string} platform - Platform name (tiktok, instagram, etc.)
   * @returns {Promise<Object>} OAuth URL and profile info
   */
  async getOAuthUrl(platform) {
    try {
      const response = await this.client.post('/profiles/connect', {
        platform: platform.toLowerCase(),
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/upload-post/callback`
      });

      return {
        authUrl: response.data.auth_url,
        profileKey: response.data.profile_key,
        expiresAt: response.data.expires_at
      };
    } catch (error) {
      console.error('OAuth URL error:', error.response?.data || error.message);
      throw new Error('Failed to generate OAuth URL');
    }
  }

  /**
   * Complete OAuth flow and get profile key
   * @param {string} code - OAuth authorization code
   * @param {string} state - OAuth state parameter
   * @returns {Promise<Object>} Profile information
   */
  async completeOAuth(code, state) {
    try {
      const response = await this.client.post('/profiles/callback', {
        code,
        state
      });

      return {
        profileKey: response.data.profile_key,
        platform: response.data.platform,
        username: response.data.username,
        profileId: response.data.profile_id,
        connected: true
      };
    } catch (error) {
      console.error('OAuth callback error:', error.response?.data || error.message);
      throw new Error('Failed to complete OAuth flow');
    }
  }

  /**
   * Get list of connected profiles
   * @returns {Promise<Array>} Connected profiles
   */
  async getProfiles() {
    try {
      const response = await this.client.get('/profiles');
      
      return response.data.profiles.map(profile => ({
        profileKey: profile.key,
        platform: profile.platform,
        username: profile.username,
        connected: profile.status === 'active',
        connectedAt: profile.connected_at
      }));
    } catch (error) {
      console.error('Get profiles error:', error.response?.data || error.message);
      throw new Error('Failed to fetch profiles');
    }
  }

  /**
   * Disconnect a profile
   * @param {string} profileKey - Profile key to disconnect
   * @returns {Promise<Object>} Disconnect result
   */
  async disconnectProfile(profileKey) {
    try {
      await this.client.delete(`/profiles/${profileKey}`);
      
      return {
        success: true,
        profileKey,
        message: 'Profile disconnected successfully'
      };
    } catch (error) {
      console.error('Disconnect profile error:', error.response?.data || error.message);
      throw new Error('Failed to disconnect profile');
    }
  }

  /**
   * Get analytics for a post
   * @param {string} postId - Upload-post post ID
   * @returns {Promise<Object>} Post analytics
   */
  async getPostAnalytics(postId) {
    try {
      const response = await this.postingClient.get(`/posts/${postId}/analytics`);
      
      return {
        postId,
        platforms: response.data.platforms || {},
        totalViews: response.data.total_views || 0,
        totalLikes: response.data.total_likes || 0,
        totalComments: response.data.total_comments || 0,
        totalShares: response.data.total_shares || 0,
        lastUpdated: response.data.last_updated
      };
    } catch (error) {
      console.error('Analytics error:', error.response?.data || error.message);
      return null; // Analytics may not be available for all platforms
    }
  }

  /**
   * Create user profile (User Profile Integration API)
   * @param {string} username - Unique username identifier
   * @returns {Promise<Object>} Created profile info
   */
  async createUserProfile(username) {
    try {
      const response = await this.client.post('/api/uploadposts/users', {
        username: username
      });
      
      return {
        success: true,
        username: response.data.username || username,
        profile: response.data
      };
    } catch (error) {
      console.error('Create user profile error:', error.response?.data || error.message);
      // If profile already exists, that's okay
      if (error.response?.status === 409 || error.response?.data?.message?.includes('exists')) {
        return {
          success: true,
          username: username,
          alreadyExists: true
        };
      }
      throw new Error(error.response?.data?.message || 'Failed to create user profile');
    }
  }

  /**
   * Generate JWT URL for connecting social accounts (User Profile Integration API)
   * @param {string} username - Username from createUserProfile
   * @param {Object} options - Optional settings
   * @param {string} options.redirect_url - URL to redirect after connection
   * @param {Array<string>} options.platforms - Platforms to show (default: all)
   * @param {string} options.logo_image - Logo URL for branding
   * @param {string} options.redirect_button_text - Button text
   * @returns {Promise<Object>} JWT URL and access info
   */
  async generateJwtUrl(username, options = {}) {
    try {
      const payload = {
        username: username,
        ...(options.redirect_url && { redirect_url: options.redirect_url }),
        ...(options.platforms && { platforms: options.platforms }),
        ...(options.logo_image && { logo_image: options.logo_image }),
        ...(options.redirect_button_text && { redirect_button_text: options.redirect_button_text })
      };

      const response = await this.client.post('/api/uploadposts/users/generate-jwt', payload);
      
      return {
        success: true,
        access_url: response.data.access_url,
        username: username,
        expires_at: response.data.expires_at
      };
    } catch (error) {
      console.error('Generate JWT URL error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to generate JWT URL');
    }
  }

  /**
   * Get user profiles and their connected accounts
   * @returns {Promise<Array>} List of user profiles with connected accounts
   */
  async getUserProfiles() {
    try {
      const response = await this.client.get('/api/uploadposts/users');
      
      return response.data.profiles || response.data.users || response.data || [];
    } catch (error) {
      console.error('Get user profiles error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get user profiles');
    }
  }

  /**
   * Alias for getUserProfiles for consistency
   * @returns {Promise<Array>} List of user profiles
   */
  async listProfiles() {
    return this.getUserProfiles();
  }

  /**
   * Delete user profile
   * @param {string} username - Username to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteProfile(username) {
    try {
      const response = await this.client.delete('/api/uploadposts/users', {
        data: { username }
      });
      
      return {
        success: true,
        username: username,
        message: response.data?.message || 'Profile deleted successfully'
      };
    } catch (error) {
      console.error('Delete profile error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete profile');
    }
  }

  /**
   * Get Facebook pages for a profile
   * @param {string} profile - Optional profile username
   * @returns {Promise<Array>} List of Facebook pages
   */
  async getFacebookPages(profile = null) {
    try {
      const url = profile ? `/api/uploadposts/facebook/pages?profile=${profile}` : '/api/uploadposts/facebook/pages';
      const response = await this.client.get(url);
      
      return response.data.pages || response.data || [];
    } catch (error) {
      console.error('Get Facebook pages error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get Facebook pages');
    }
  }

  /**
   * Get LinkedIn pages for a profile
   * @param {string} profile - Optional profile username
   * @returns {Promise<Array>} List of LinkedIn pages
   */
  async getLinkedInPages(profile = null) {
    try {
      const url = profile ? `/api/uploadposts/linkedin/pages?profile=${profile}` : '/api/uploadposts/linkedin/pages';
      const response = await this.client.get(url);
      
      return response.data.pages || response.data || [];
    } catch (error) {
      console.error('Get LinkedIn pages error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get LinkedIn pages');
    }
  }

  /**
   * Get Pinterest boards for a profile
   * @param {string} profile - Optional profile username
   * @returns {Promise<Array>} List of Pinterest boards
   */
  async getPinterestBoards(profile = null) {
    try {
      const url = profile ? `/api/uploadposts/pinterest/boards?profile=${profile}` : '/api/uploadposts/pinterest/boards';
      const response = await this.client.get(url);
      
      return response.data.boards || response.data || [];
    } catch (error) {
      console.error('Get Pinterest boards error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get Pinterest boards');
    }
  }
}

export default UploadPostService;













