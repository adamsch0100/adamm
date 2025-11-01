import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

/**
 * Twitter ADB Automation Service
 * Controls Twitter Android app via ADB on MoreLogin cloud phones
 * Reuses existing TikTok ADB infrastructure for stealth mobile automation
 */
class TwitterADBAutomationService {
  constructor(supabase, moreloginConfig) {
    this.supabase = supabase;
    this.moreloginApiUrl = moreloginConfig.apiUrl;
    this.moreloginApiId = moreloginConfig.apiId;
    this.moreloginSecretKey = moreloginConfig.secretKey;
  }

  /**
   * Post tweet via ADB
   */
  async postTweet(cloudPhoneId, text, options = {}) {
    const {
      screenWidth = 1080,
      screenHeight = 1920
    } = options;

    console.log(`Posting tweet via ADB on device ${cloudPhoneId}`);

    try {
      // Get ADB connection
      const adb = await this.getADBConnection(cloudPhoneId);

      // Launch Twitter app
      console.log('Launching Twitter app...');
      await adb.launchApp('com.twitter.android/.StartActivity');
      await this.sleep(3000);

      // Tap compose button (floating action button, bottom right)
      console.log('Tapping compose button...');
      await adb.tap(screenWidth * 0.9, screenHeight * 0.91); // Bottom right
      await this.sleep(2000);

      // Type tweet text
      console.log('Typing tweet...');
      await adb.inputText(text);
      await this.sleep(this.randomDelay(1500, 3000));

      // Tap Tweet button (top right)
      console.log('Sending tweet...');
      await adb.tap(screenWidth * 0.88, screenHeight * 0.08); // Top right
      await this.sleep(3000);

      console.log('✓ Tweet posted successfully');

      return {
        success: true,
        text,
        cloudPhoneId
      };

    } catch (error) {
      console.error('Twitter post error:', error);
      throw error;
    }
  }

  /**
   * Send DM via ADB
   */
  async sendDM(cloudPhoneId, username, message, options = {}) {
    const {
      screenWidth = 1080,
      screenHeight = 1920
    } = options;

    console.log(`Sending DM to @${username} via ADB on device ${cloudPhoneId}`);

    try {
      const adb = await this.getADBConnection(cloudPhoneId);

      // Launch Twitter app
      await adb.launchApp('com.twitter.android/.StartActivity');
      await this.sleep(3000);

      // Tap messages icon (bottom nav, 2nd from right)
      console.log('Opening messages...');
      await adb.tap(screenWidth * 0.7, screenHeight * 0.96);
      await this.sleep(2000);

      // Tap compose message (floating action button)
      console.log('Tapping compose message...');
      await adb.tap(screenWidth * 0.9, screenHeight * 0.91);
      await this.sleep(2000);

      // Type username in search
      console.log(`Searching for @${username}...`);
      await adb.inputText(username);
      await this.sleep(2000);

      // Tap first result
      await adb.tap(screenWidth * 0.5, screenHeight * 0.25);
      await this.sleep(1500);

      // Type message
      console.log('Typing message...');
      await adb.inputText(message);
      await this.sleep(this.randomDelay(1500, 3000));

      // Send button (bottom right)
      console.log('Sending DM...');
      await adb.tap(screenWidth * 0.9, screenHeight * 0.92);
      await this.sleep(3000);

      console.log('✓ DM sent successfully');

      return {
        success: true,
        recipient: username,
        cloudPhoneId
      };

    } catch (error) {
      console.error('Twitter DM error:', error);
      throw error;
    }
  }

  /**
   * Scroll feed (for warmup)
   */
  async scrollFeed(adb, count = 10, screenHeight = 1920, screenWidth = 1080) {
    for (let i = 0; i < count; i++) {
      // Swipe up
      await adb.swipe(
        screenWidth * 0.5,
        screenHeight * 0.7,
        screenWidth * 0.5,
        screenHeight * 0.3,
        this.randomDelay(300, 500)
      );
      await this.sleep(this.randomDelay(1000, 3000));
    }
  }

  /**
   * Like tweet (for warmup)
   */
  async likeTweet(adb, screenHeight = 1920, screenWidth = 1080) {
    // Like button is on right side of tweet
    await adb.tap(screenWidth * 0.82, screenHeight * 0.5);
    await this.sleep(this.randomDelay(500, 1500));
  }

  /**
   * Retweet (for warmup)
   */
  async retweet(adb, screenHeight = 1920, screenWidth = 1080) {
    // Retweet button
    await adb.tap(screenWidth * 0.63, screenHeight * 0.5);
    await this.sleep(1000);

    // Confirm retweet
    await adb.tap(screenWidth * 0.5, screenHeight * 0.52);
    await this.sleep(this.randomDelay(1000, 2000));
  }

  /**
   * Follow account (for warmup)
   */
  async followAccount(adb, screenHeight = 1920, screenWidth = 1080) {
    // Follow button (varies, but usually top right)
    await adb.tap(screenWidth * 0.85, screenHeight * 0.12);
    await this.sleep(this.randomDelay(1000, 2000));
  }

  /**
   * Get ADB connection for cloud phone
   */
  async getADBConnection(cloudPhoneId) {
    // Get cloud phone details
    const headers = this.generateMoreLoginHeaders();
    
    const instanceResponse = await axios.post(
      `${this.moreloginApiUrl}/api/cloudphone/page`,
      { pageNo: 1, pageSize: 100 },
      { headers }
    );

    if (instanceResponse.data.code !== 0) {
      throw new Error('Failed to fetch cloud phone details');
    }

    const instance = instanceResponse.data.data.dataList.find(p => p.id === cloudPhoneId);

    if (!instance) {
      throw new Error(`Cloud phone ${cloudPhoneId} not found`);
    }

    // Enable ADB if not already enabled
    if (!instance.enableAdb || !instance.adbInfo || instance.adbInfo.success !== 1) {
      await this.enableADB(cloudPhoneId, headers);
      await this.sleep(3000);

      // Refetch instance info
      const refreshResponse = await axios.post(
        `${this.moreloginApiUrl}/api/cloudphone/page`,
        { pageNo: 1, pageSize: 100 },
        { headers }
      );

      const refreshedInstance = refreshResponse.data.data.dataList.find(p => p.id === cloudPhoneId);
      if (!refreshedInstance?.adbInfo) {
        throw new Error('Failed to enable ADB');
      }

      return refreshedInstance.adbInfo;
    }

    return instance.adbInfo;
  }

  /**
   * Enable ADB on cloud phone
   */
  async enableADB(cloudPhoneId, headers) {
    await axios.post(
      `${this.moreloginApiUrl}/vcpcloud/api/cloudPhoneAdb/enable`,
      { cloud_phone_id: cloudPhoneId },
      { headers }
    );
  }

  /**
   * Generate MoreLogin API headers
   */
  generateMoreLoginHeaders() {
    const crypto = require('crypto');
    const timestamp = Date.now();
    const signStr = `${this.moreloginApiId}${timestamp}${this.moreloginSecretKey}`;
    const sign = crypto.createHash('md5').update(signStr).digest('hex');

    return {
      'api-id': this.moreloginApiId,
      'timestamp': timestamp.toString(),
      'sign': sign,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Random delay for human-like behavior
   */
  randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default TwitterADBAutomationService;


