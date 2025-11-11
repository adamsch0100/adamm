import axios from 'axios';
import crypto from 'crypto';

/**
 * Platform Warmup Service
 * Executes platform-specific warmup actions to build account trust
 */
class WarmupService {
  constructor(moreloginApiUrl, moreloginApiId, moreloginSecretKey) {
    this.moreloginApiUrl = moreloginApiUrl;
    this.apiId = moreloginApiId;
    this.secretKey = moreloginSecretKey;
  }

  /**
   * Generate MoreLogin API headers
   */
  generateHeaders() {
    const nonceId = `${Date.now()}:${Math.random().toString(36).substring(7)}`;
    const authString = this.apiId + nonceId + this.secretKey;
    const authorization = crypto.createHash('md5').update(authString).digest('hex');
    
    return {
      'Content-Type': 'application/json',
      'X-Api-Id': this.apiId,
      'X-Nonce-Id': nonceId,
      'Authorization': authorization
    };
  }

  /**
   * Platform-specific warmup strategies
   */
  getWarmupStrategy(platform) {
    const strategies = {
      tiktok: {
        name: 'TikTok Standard Warmup',
        actions: [
          { action: 'scroll_feed', weight: 0.6, count: [8, 12], duration: [2000, 4000] },
          { action: 'like_video', weight: 0.25, tapCoords: [972, 998] }, // 90% width, 52% height (1080x1920)
          { action: 'search', weight: 0.1, topics: ['make money online', 'passive income', 'side hustle', 'financial freedom', 'entrepreneurship'] },
          { action: 'follow_account', weight: 0.05, count: [0, 2] }
        ],
        sessionDuration: [180000, 420000], // 3-7 minutes
        frequency: 2 // times per day
      },
      instagram: {
        name: 'Instagram Engagement',
        actions: [
          { action: 'view_stories', weight: 0.4, count: [5, 10] },
          { action: 'like_post', weight: 0.3, count: [8, 15] },
          { action: 'explore_feed', weight: 0.2, scrollCount: [10, 20] },
          { action: 'follow_account', weight: 0.1, count: [1, 3] }
        ],
        sessionDuration: [120000, 300000], // 2-5 minutes
        frequency: 3
      },
      youtube: {
        name: 'YouTube Viewer',
        actions: [
          { action: 'watch_shorts', weight: 0.5, count: [5, 10], watchTime: [5000, 15000] },
          { action: 'like_video', weight: 0.25 },
          { action: 'subscribe', weight: 0.15, count: [1, 3] },
          { action: 'comment', weight: 0.1 }
        ],
        sessionDuration: [240000, 480000], // 4-8 minutes
        frequency: 2
      }
    };

    return strategies[platform.toLowerCase()] || strategies.tiktok;
  }

  /**
   * Select random action based on weights
   */
  selectWeightedAction(strategy) {
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const actionConfig of strategy.actions) {
      cumulativeWeight += actionConfig.weight;
      if (random <= cumulativeWeight) {
        return actionConfig;
      }
    }

    return strategy.actions[0];
  }

  /**
   * Get random value from range
   */
  randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Execute warmup session for a platform account
   * @param {Object} params - Warmup parameters
   * @returns {Promise<Object>} Warmup session results
   */
  async executeWarmupSession(params) {
    const {
      cloudPhoneId,
      platform,
      accountId,
      adbHelper
    } = params;

    console.log(`Starting warmup session for ${platform} account ${accountId} on device ${cloudPhoneId}...`);

    const strategy = this.getWarmupStrategy(platform);
    const sessionDuration = this.randomInRange(...strategy.sessionDuration);
    const startTime = Date.now();
    const actionsPerformed = [];

    try {
      // Launch platform app
      const appPackages = {
        tiktok: 'com.zhiliaoapp.musically/.MainActivity',
        instagram: 'com.instagram.android/com.instagram.android.activity.MainTabActivity',
        youtube: 'com.google.android.youtube/com.google.android.youtube.HomeActivity',
        facebook: 'com.facebook.katana/com.facebook.katana.LoginActivity',
        linkedin: 'com.linkedin.android/com.linkedin.android.authenticator.LaunchActivity',
        twitter: 'com.twitter.android/com.twitter.android.StartActivity'
      };

      console.log(`Launching ${platform} app...`);
      await adbHelper.launchApp(appPackages[platform.toLowerCase()]);
      await this.sleep(this.randomInRange(3000, 6000));

      // Execute actions until session duration is reached
      while (Date.now() - startTime < sessionDuration) {
        const actionConfig = this.selectWeightedAction(strategy);
        
        try {
          await this.performAction(actionConfig, adbHelper, platform);
          actionsPerformed.push({
            action: actionConfig.action,
            timestamp: new Date().toISOString()
          });

          // Random delay between actions (1-3 seconds)
          await this.sleep(this.randomInRange(1000, 3000));
        } catch (error) {
          console.error(`Error performing action ${actionConfig.action}:`, error.message);
        }
      }

      console.log(`Warmup session completed. Performed ${actionsPerformed.length} actions in ${Math.round(sessionDuration / 1000)} seconds.`);

      return {
        success: true,
        platform,
        accountId,
        cloudPhoneId,
        actionsPerformed: actionsPerformed.length,
        actions: actionsPerformed,
        duration: Date.now() - startTime,
        strategy: strategy.name
      };

    } catch (error) {
      console.error('Warmup session error:', error);
      throw error;
    }
  }

  /**
   * Perform specific warmup action
   */
  async performAction(actionConfig, adbHelper, platform) {
    const { action } = actionConfig;

    switch (action) {
      case 'scroll_feed':
        await this.scrollFeed(adbHelper, actionConfig);
        break;

      case 'like_video':
      case 'like_post':
        await this.likeContent(adbHelper, actionConfig, platform);
        break;

      case 'search':
        await this.performSearch(adbHelper, actionConfig);
        break;

      case 'follow_account':
        await this.followAccount(adbHelper, actionConfig);
        break;

      case 'view_stories':
        await this.viewStories(adbHelper, actionConfig);
        break;

      case 'explore_feed':
        await this.exploreFeed(adbHelper, actionConfig);
        break;

      case 'watch_shorts':
        await this.watchShorts(adbHelper, actionConfig);
        break;

      case 'subscribe':
        await this.subscribe(adbHelper);
        break;

      case 'comment':
        await this.postComment(adbHelper);
        break;

      // Twitter-specific actions
      case 'like_tweet':
        await this.likeTweet(adbHelper, actionConfig);
        break;

      case 'retweet':
        await this.retweet(adbHelper, actionConfig);
        break;

      default:
        console.log(`Unknown action: ${action}`);
    }
  }

  /**
   * Twitter-specific warmup actions
   */

  async likeTweet(adbHelper, config) {
    // Heart icon on right side of tweet
    await adbHelper.tap(970, 1200);
    await this.sleep(this.randomInRange(500, 1500));
  }

  async retweet(adbHelper, config) {
    // Retweet icon (middle-right)
    await adbHelper.tap(820, 1200);
    await this.sleep(1000);

    // Confirm retweet
    await adbHelper.tap(540, 1100);
    await this.sleep(this.randomInRange(1000, 2000));
  }

  /**
   * Warmup action implementations
   */

  async scrollFeed(adbHelper, config) {
    const scrollCount = config.count ? this.randomInRange(...config.count) : 10;
    const duration = config.duration ? this.randomInRange(...config.duration) : 400;

    for (let i = 0; i < scrollCount; i++) {
      // TikTok feed scroll: 50% width, 75% to 25% height (1080x1920)
      await adbHelper.swipe(540, 1440, 540, 480, duration);
      await this.sleep(this.randomInRange(500, 1500));
    }
  }

  async likeContent(adbHelper, config, platform) {
    const coords = config.tapCoords || [540, 1200];
    
    // Random chance to like (30-50%)
    if (Math.random() < (config.likeRate || 0.4)) {
      await adbHelper.tap(coords[0], coords[1]);
      await this.sleep(500);
    }
  }

  async performSearch(adbHelper, config) {
    // Tap search icon: 90% width, 8% height (1080x1920)
    await adbHelper.tap(972, 154);
    await this.sleep(1000);

    // Random topic
    const topics = config.topics || ['trending', 'funny', 'music'];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    await adbHelper.inputText(topic);
    await this.sleep(1000);
    await adbHelper.keyEvent(66); // Enter key
    await this.sleep(2000);

    // Scroll through search results
    await this.scrollFeed(adbHelper, { count: [3, 6], duration: [2000, 3000] });

    // Go back
    await adbHelper.keyEvent(4); // Back button
  }

  async followAccount(adbHelper, config) {
    const count = config.count ? this.randomInRange(...config.count) : 1;
    
    for (let i = 0; i < count; i++) {
      // Tap follow button (approximate coords vary by platform)
      await adbHelper.tap(850, 200);
      await this.sleep(this.randomInRange(500, 1000));
    }
  }

  async viewStories(adbHelper, config) {
    const count = config.count ? this.randomInRange(...config.count) : 5;

    // Tap first story
    await adbHelper.tap(200, 200);
    await this.sleep(2000);

    for (let i = 0; i < count; i++) {
      // Watch story for random duration (3-7 seconds)
      await this.sleep(this.randomInRange(3000, 7000));
      
      // Tap to next story
      await adbHelper.tap(800, 800);
      await this.sleep(500);
    }

    // Close stories
    await adbHelper.keyEvent(4); // Back
  }

  async exploreFeed(adbHelper, config) {
    // Tap explore tab
    await adbHelper.tap(540, 2200);
    await this.sleep(1500);

    // Scroll through explore
    await this.scrollFeed(adbHelper, config);
  }

  async watchShorts(adbHelper, config) {
    const count = config.count ? this.randomInRange(...config.count) : 8;
    const watchTime = config.watchTime || [5000, 15000];

    for (let i = 0; i < count; i++) {
      // Watch short for random duration
      await this.sleep(this.randomInRange(...watchTime));
      
      // Swipe to next short
      await adbHelper.swipe(540, 1400, 540, 400, 300);
      await this.sleep(500);
    }
  }

  async subscribe(adbHelper) {
    // Tap subscribe button (approximate)
    await adbHelper.tap(850, 250);
    await this.sleep(1000);
  }

  async postComment(adbHelper) {
    const comments = ['Nice!', '😍', '🔥', 'Love this!', 'Great content!'];
    const comment = comments[Math.floor(Math.random() * comments.length)];

    // Tap comment button
    await adbHelper.tap(750, 1200);
    await this.sleep(1000);

    await adbHelper.inputText(comment);
    await this.sleep(500);

    // Post comment
    await adbHelper.tap(900, 150);
    await this.sleep(1000);

    // Close keyboard / go back
    await adbHelper.keyEvent(4);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default WarmupService;



