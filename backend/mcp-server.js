/**
 * n8n MCP Server for TikTok Automation
 * 
 * This server provides endpoints for n8n workflows to interact with:
 * - MoreLogin Cloud Phone API for virtual phone management
 * - ADB for TikTok automation
 * - OpenAI for content generation
 * - CoinMarketCap for crypto trends
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import UploadPostService from '../services/upload-post.js';
import WarmupService from '../services/warmup.js';
import VideoGenerationService from '../services/video-generation.js';
import CampaignExecutionService from '../services/campaign-execution.js';
import PostingQueueService from '../services/posting-queue.js';
import AccountHealthMonitorService from '../services/account-health-monitor.js';
// import TwitterScraperService from '../services/twitter-scraper.js'; // File removed - using viral-tweet-generator instead
// import TwitterRewriterService from '../services/twitter-rewriter.js'; // File removed - using viral-tweet-generator instead
import TwitterSchedulerService from '../services/twitter-scheduler.js';
import LeadCaptureService from '../services/lead-capture.js';
import TwitterDMAutomationService from '../services/twitter-dm-automation.js';
import CarouselCreatorService from '../services/carousel-creator.js';
import YouTubeSplitterService from '../services/youtube-splitter.js';
import SlideshowMakerService from '../services/slideshow-maker.js';
import RedditThreadFinderService from '../services/reddit-thread-finder.js';
import RedditCommentGeneratorService from '../services/reddit-comment-generator.js';
import RedditUpvoteDripService from '../services/reddit-upvote-drip.js';
import EbookGeneratorService from '../services/ebook-generator.js';
import ProductBundlerService from '../services/product-bundler.js';
import StripeProductManagerService from '../services/stripe-product-manager.js';
import FunnelTrackerService from '../services/funnel-tracker.js';
import BioLinkTrackerService from '../services/bio-link-tracker.js';
import AnalyticsAggregatorService from '../services/analytics-aggregator.js';
import WhopIntegrationService from '../services/whop-integration.js';
import TwitterADBAutomationService from '../services/twitter-adb-automation.js';

const execPromise = promisify(exec);

// Load environment variables
dotenv.config();

// Initialize Supabase client (service role for backend access)
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// API Key cache (5 minute TTL)
const apiKeyCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get operator API key from Supabase with caching
 * @param {string} service - Service name (e.g., 'openai', 'morelogin')
 * @param {string} field - Field to retrieve ('api_key_encrypted' or 'api_secret_encrypted')
 * @returns {Promise<string>} Decrypted API key
 */
async function getOperatorApiKey(service, field = 'api_key_encrypted') {
  const cacheKey = `${service}:${field}`;

  // Check cache first
  const cached = apiKeyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    // Fetch from Supabase
    const { data, error } = await supabase
      .from('operator_settings')
      .select(field)
      .eq('service', service)
      .eq('status', 'configured')
      .single();

    if (error) {
      console.error(`Error fetching operator key for ${service}:`, error);
      return null;
    }

    if (!data || !data[field]) {
      console.warn(`No ${field} found for service: ${service}`);
      return null;
    }

    const storedValue = data[field];

    // Check if the value looks like it's already plain text (for backward compatibility)
    // API keys are typically alphanumeric, secrets are hex strings
    const looksLikePlainText = /^[a-zA-Z0-9\-_\.]+$/.test(storedValue);

    let finalKey;
    if (looksLikePlainText) {
      // Value appears to be plain text, use as-is
      finalKey = storedValue.trim();
      console.log(`Using plain text key for ${service}:${field}`);
    } else {
      // Value appears encrypted, decrypt it
      finalKey = decrypt(storedValue).trim();
      console.log(`Decrypted key for ${service}:${field}`);
    }

    // Cache the result
    apiKeyCache.set(cacheKey, {
      value: finalKey,
      timestamp: Date.now()
    });

    return finalKey;
  } catch (error) {
    console.error(`Failed to get operator API key for ${service}:`, error);
    return null;
  }
}

/**
 * Simple XOR encryption/decryption utility
 */
function encrypt(text) {
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  const textBuffer = Buffer.from(text, 'utf8');
  const keyBuffer = Buffer.from(key, 'utf8');
  const encrypted = Buffer.alloc(textBuffer.length);
  
  for (let i = 0; i < textBuffer.length; i++) {
    encrypted[i] = textBuffer[i] ^ keyBuffer[i % keyBuffer.length];
  }
  
  return encrypted.toString('base64');
}

function decrypt(encryptedText) {
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  const encryptedBuffer = Buffer.from(encryptedText, 'base64');
  const keyBuffer = Buffer.from(key, 'utf8');
  const decrypted = Buffer.alloc(encryptedBuffer.length);
  
  for (let i = 0; i < encryptedBuffer.length; i++) {
    decrypted[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length];
  }
  
  return decrypted.toString('utf8');
}

const app = express();
const PORT = process.env.MCP_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const config = {
  moreloginApiUrl: process.env.MORELOGIN_API_URL || 'http://127.0.0.1:40000',
  // API keys now stored in operator_settings table
  videoStrategy: process.env.VIDEO_STRATEGY || 'unique',
  ctaMode: process.env.CTA_MODE || 'both',
  videosPerTopic: parseInt(process.env.VIDEOS_PER_TOPIC) || 10
};

// Video usage tracking for cost monitoring
let videoUsageStats = {
  unique_videos: 0,
  remix_videos: 0,
  total_videos: 0,
  last_reset: new Date().toISOString()
};

// Crypto topics for warm-up search automation
const cryptoTopics = [
  'bitcoin', 'ethereum', 'crypto', 'blockchain', 'mining',
  'cryptocurrency', 'defi', 'nft', 'web3', 'altcoin',
  'dogecoin', 'cardano', 'solana', 'polkadot', 'binance',
  'crypto news', 'bitcoin mining', 'ethereum staking', 'defi yields',
  'nft marketplace', 'web3 projects'
];

function getRandomCryptoTopic() {
  return cryptoTopics[Math.floor(Math.random() * cryptoTopics.length)];
}

/**
 * Generate MoreLogin API Authentication Headers
 * Uses MD5 hash: MD5(API_ID + NonceId + SecretKey)
 * Now fetches keys from Supabase operator_settings
 */
async function generateMoreLoginHeaders() {
  // Fetch MoreLogin credentials from Supabase (with fallback to env)
  const apiId = await getOperatorApiKey('morelogin', 'api_key_encrypted') || config.moreloginApiId || '';
  const secretKey = await getOperatorApiKey('morelogin', 'api_secret_encrypted') || config.moreloginSecretKey || '';
  
  if (!apiId || !secretKey) {
    throw new Error('MoreLogin API credentials not configured. Please add them to operator_settings table.');
  }
  
  const nonceId = `${Date.now()}:${Math.random().toString(36).substring(7)}`;
  const authString = apiId + nonceId + secretKey;
  const authorization = crypto.createHash('md5').update(authString).digest('hex');
  
  return {
    'Content-Type': 'application/json',
    'X-Api-Id': apiId,
    'X-Nonce-Id': nonceId,
    'Authorization': authorization
  };
}

/**
 * Handle database queries gracefully when tables don't exist yet
 * Returns empty/default data instead of crashing
 */
async function safeDbQuery(queryFn, defaultValue = null) {
  try {
    return await queryFn();
  } catch (error) {
    // Table doesn't exist or other DB error
    if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      console.warn('Table not found (will be created by migration):', error.message);
      return defaultValue;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * ADB Helper Class
 * Handles all ADB commands for device automation
 */
class ADBHelper {
  constructor(adbIp, adbPort, adbPassword) {
    this.device = `${adbIp}:${adbPort}`;
    this.adbIp = adbIp;
    this.adbPort = adbPort;
    this.adbPassword = adbPassword;
    this.connected = false;
  }

  async connect() {
    try {
      // Add timeout to prevent hanging (5 seconds)
      const { stdout } = await execPromise(`adb connect ${this.device}`, { timeout: 5000 });
      console.log(`ADB connect result: ${stdout.trim()}`);
      
      // Authenticate with password if provided (MoreLogin requirement)
      if (this.adbPassword) {
        console.log(`Authenticating ADB connection...`);
        try {
          await execPromise(`adb -s ${this.device} shell ${this.adbPassword}`, { timeout: 3000 });
        } catch (authError) {
          console.log(`Auth command returned: ${authError.message} (this is normal)`);
        }
      }
      
      // Test connection with a simple command
      await execPromise(`adb -s ${this.device} shell echo "connected"`, { timeout: 3000 });
      
      this.connected = true;
      console.log(`✓ ADB connected to ${this.device}`);
      return true;
    } catch (error) {
      // If connection fails, it might already be connected - try to use it anyway
      console.log(`ADB connect error (may already be connected): ${error.message}`);
      try {
        if (this.adbPassword) {
          await execPromise(`adb -s ${this.device} shell ${this.adbPassword}`, { timeout: 3000 }).catch(() => {});
        }
        await execPromise(`adb -s ${this.device} shell echo "test"`, { timeout: 3000 });
        this.connected = true;
        console.log(`✓ ADB device ${this.device} is available`);
        return true;
      } catch (testError) {
        console.error(`✗ ADB connection failed: ${testError.message}`);
        this.connected = false;
        return false;
      }
    }
  }

  async tap(x, y) {
    try {
      await execPromise(`adb -s ${this.device} shell input tap ${Math.round(x)} ${Math.round(y)}`, { timeout: 5000 });
    } catch (error) {
      if (error.message.includes('closed') || error.message.includes('offline')) {
        console.log('Device closed during tap, reconnecting...');
        await this.connect();
        await execPromise(`adb -s ${this.device} shell input tap ${Math.round(x)} ${Math.round(y)}`, { timeout: 5000 });
      } else {
        throw error;
      }
    }
  }

  async swipe(x1, y1, x2, y2, duration = 400) {
    try {
      await execPromise(
        `adb -s ${this.device} shell input swipe ${Math.round(x1)} ${Math.round(y1)} ${Math.round(x2)} ${Math.round(y2)} ${duration}`,
        { timeout: 5000 }
      );
    } catch (error) {
      if (error.message.includes('closed') || error.message.includes('offline')) {
        console.log('Device closed during swipe, reconnecting...');
        await this.connect();
        await execPromise(
          `adb -s ${this.device} shell input swipe ${Math.round(x1)} ${Math.round(y1)} ${Math.round(x2)} ${Math.round(y2)} ${duration}`,
          { timeout: 5000 }
        );
      } else {
        throw error;
      }
    }
  }

  async inputText(text) {
    const escapedText = text.replace(/\s/g, '%s').replace(/"/g, '\\"');
    try {
      await execPromise(`adb -s ${this.device} shell input text "${escapedText}"`, { timeout: 5000 });
    } catch (error) {
      if (error.message.includes('closed') || error.message.includes('offline')) {
        console.log('Device closed during input, reconnecting...');
        await this.connect();
        await execPromise(`adb -s ${this.device} shell input text "${escapedText}"`, { timeout: 5000 });
      } else {
        throw error;
      }
    }
  }

  async keyEvent(keyCode) {
    await execPromise(`adb -s ${this.device} shell input keyevent ${keyCode}`);
  }

  async launchApp(packageName) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await execPromise(`adb -s ${this.device} shell am start -n ${packageName}`, { timeout: 10000 });
        return;
      } catch (error) {
        console.log(`Launch attempt ${i + 1}/${maxRetries} failed: ${error.message}`);
        if (error.message.includes('closed') || error.message.includes('offline')) {
          console.log('Device connection closed, reconnecting...');
          await this.connect();
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          }
        } else {
          throw error;
        }
      }
    }
    throw new Error('Failed to launch app after retries');
  }

  async uploadFile(localPath, remotePath) {
    await execPromise(`adb -s ${this.device} push "${localPath}" "${remotePath}"`);
  }

  async screenshot(savePath) {
    await execPromise(`adb -s ${this.device} shell screencap -p /sdcard/screenshot.png`);
    await execPromise(`adb -s ${this.device} pull /sdcard/screenshot.png "${savePath}"`);
    await execPromise(`adb -s ${this.device} shell rm /sdcard/screenshot.png`);
  }
}

// Helper sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: 'MoreLogin'
  });
});

// ===================================
// MORELOGIN API ENDPOINTS
// ===================================

// ===================================
// MORELOGIN BROWSER PROFILE ENDPOINTS
// ===================================

// Start MoreLogin browser profile
app.post('/api/morelogin/browser/start', async (req, res) => {
  try {
    const { envId, isHeadless = false, cdpEvasion = true } = req.body;
    
    if (!envId) {
      return res.status(400).json({
        success: false,
        error: 'envId (profile ID) is required'
      });
    }

    const response = await axios.post(
      `${config.moreloginApiUrl}/api/env/start`, // MoreLogin local API
      {
        envId: envId,
        isHeadless: isHeadless,
        cdpEvasion: cdpEvasion
      }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        data: {
          envId: response.data.data.envId,
          debugPort: response.data.data.debugPort,
          cdpEndpoint: `http://localhost:${response.data.data.debugPort}`
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg,
        code: response.data.code
      });
    }
  } catch (error) {
    console.error('Error starting MoreLogin browser profile:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Stop MoreLogin browser profile
app.post('/api/morelogin/browser/stop', async (req, res) => {
  try {
    const { envId } = req.body;
    
    if (!envId) {
      return res.status(400).json({
        success: false,
        error: 'envId (profile ID) is required'
      });
    }

    const response = await axios.post(
      `${config.moreloginApiUrl}/api/env/close`,
      { envId: envId }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        data: { envId: response.data.data.envId }
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg,
        code: response.data.code
      });
    }
  } catch (error) {
    console.error('Error stopping MoreLogin browser profile:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Create MoreLogin browser profile (quick)
app.post('/api/morelogin/browser/create', async (req, res) => {
  try {
    const { 
      browserTypeId = 1, // Chrome
      operatorSystemId = 1, // Windows
      quantity = 1,
      groupId = 0
    } = req.body;

    const response = await axios.post(
      `${config.moreloginApiUrl}/api/env/create/quick`,
      {
        browserTypeId,
        operatorSystemId,
        quantity,
        groupId
      }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        data: response.data.data, // Array of profile IDs
        message: `Created ${quantity} browser profile(s)`
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg,
        code: response.data.code
      });
    }
  } catch (error) {
    console.error('Error creating MoreLogin browser profile:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// List existing MoreLogin browser profiles
app.get('/api/morelogin/browser/list', async (req, res) => {
  try {
    const pageNo = parseInt(req.query.pageNo) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    
    const response = await axios.post(
      `${config.moreloginApiUrl}/api/env/list`,
      {
        pageNo: pageNo,
        pageSize: pageSize
      }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        profiles: response.data.data || [],
        totalCount: response.data.totalCount || 0,
        page: pageNo
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg,
        code: response.data.code
      });
    }
  } catch (error) {
    console.error('Error listing MoreLogin browser profiles:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Check MoreLogin browser profile status
app.post('/api/morelogin/browser/status', async (req, res) => {
  try {
    const { envId } = req.body;
    
    if (!envId) {
      return res.status(400).json({
        success: false,
        error: 'envId (profile ID) is required'
      });
    }

    const response = await axios.post(
      `${config.moreloginApiUrl}/api/env/status`,
      { envId: envId }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        data: response.data.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg,
        code: response.data.code
      });
    }
  } catch (error) {
    console.error('Error checking MoreLogin browser status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// ===================================
// TWITTER VERIFICATION ENDPOINTS
// ===================================

// Get scraped tweets for verification
app.get('/api/twitter/scraped-tweets/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const { data, error } = await supabase
      .from('twitter_scraped_tweets')
      .select('*')
      .eq('user_id', userId)
      .order('scraped_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching scraped tweets:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({
      success: true,
      count: data?.length || 0,
      tweets: data || [],
      isMockData: data?.length === 0 || data?.some(tweet => tweet.tweet_text?.includes('Mock tweet'))
    });
    
  } catch (error) {
    console.error('Error in scraped tweets endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get generated tweet variations for verification  
app.get('/api/twitter/generated-tweets/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const { data, error } = await supabase
      .from('twitter_rewrites')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching generated tweets:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({
      success: true,
      count: data?.length || 0,
      variations: data || [],
      isMockData: data?.length === 0 || data?.some(tweet => tweet.rewritten_text?.includes('Generated variation'))
    });
    
  } catch (error) {
    console.error('Error in generated tweets endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// System health check with real data verification
app.get('/api/twitter/system-status', async (req, res) => {
  try {
    // Check MoreLogin connection
    let moreLoginStatus = 'disconnected';
    try {
      const response = await axios.post(`${config.moreloginApiUrl}/api/env/create/quick`, {
        browserTypeId: 1,
        operatorSystemId: 1, 
        quantity: 1,
        groupId: 0
      });
      moreLoginStatus = response.data?.code === 0 ? 'connected' : 'error';
    } catch (error) {
      console.log('MoreLogin connection test failed:', error.message);
    }
    
    // Check database tables
    const { data: scrapedCount, error: scrapedError } = await supabase
      .from('twitter_scraped_tweets')
      .select('id', { count: 'exact' });
      
    const { data: generatedCount, error: generatedError } = await supabase
      .from('twitter_rewrites') 
      .select('id', { count: 'exact' });
    
    res.json({
      success: true,
      status: {
        moreLogin: {
          connected: moreLoginStatus === 'connected',
          status: moreLoginStatus,
          port: config.moreloginApiUrl
        },
        database: {
          scrapedTweets: scrapedError ? 'table_missing' : scrapedCount?.length || 0,
          generatedTweets: generatedError ? 'table_missing' : generatedCount?.length || 0,
          errors: [scrapedError, generatedError].filter(Boolean)
        },
        integration: {
          realDataAvailable: !scrapedError && (scrapedCount?.length || 0) > 0,
          usingMockData: moreLoginStatus !== 'connected'
        }
      }
    });
    
  } catch (error) {
    console.error('System status check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// MORELOGIN CLOUD PHONE ENDPOINTS
// ===================================

// Get all cloud phone instances from MoreLogin
app.get('/api/morelogin/instances', async (req, res) => {
  try {
    const pageNo = parseInt(req.query.pageNo) || 1;
    const pageSize = parseInt(req.query.pageSize) || 100;
    
    const response = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/page`,
      {
        pageNo: pageNo,
        pageSize: pageSize
      },
      {
        headers: await generateMoreLoginHeaders()
      }
    );
    
    if (response.data.code === 0) {
      const instances = response.data.data?.dataList || [];
      res.json({
        success: true,
        instances: instances,
        count: instances.length,
        total: response.data.data?.total || 0,
        page: pageNo
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg,
        code: response.data.code
      });
    }
  } catch (error) {
    console.error('Error fetching MoreLogin instances:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Alias for cloud phones - syncs with MoreLogin and returns merged data
app.get('/api/cloud-phones', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Step 1: Get devices from MoreLogin
    let moreloginDevices = [];
    try {
      const mlResponse = await axios.post(
        `${config.moreloginApiUrl}/api/cloudphone/page`,
        { pageNo: 1, pageSize: 100 },
        { headers: await generateMoreLoginHeaders() }
      );
      
      if (mlResponse.data.code === 0 && mlResponse.data.data?.dataList) {
        moreloginDevices = mlResponse.data.data.dataList;
      }
    } catch (mlError) {
      console.error('Error fetching from MoreLogin:', mlError.message);
    }

    // Step 2: Get devices from our database
    const { data: dbPhones, error: dbError } = await supabase
      .from('cloud_phones')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }

    // Step 3: Merge data - Update DB with latest MoreLogin data
    const mergedPhones = [];
    
    for (const mlDevice of moreloginDevices) {
      const dbDevice = (dbPhones || []).find(p => p.morelogin_id === mlDevice.id.toString());
      
      // Prepare merged device data
      const mergedDevice = {
        id: dbDevice?.id || null,
        morelogin_id: mlDevice.id.toString(),
        name: mlDevice.envName || mlDevice.envRemark || 'Unnamed Device',
        status: ['new', 'failed', 'stopped', 'starting', 'running', 'resetting'][mlDevice.envStatus] || 'unknown',
        adb_enabled: mlDevice.enableAdb || false,
        adb_ip: mlDevice.adbInfo?.adbIp || null,
        adb_port: mlDevice.adbInfo?.adbPort || null,
        adb_password: mlDevice.adbInfo?.adbPassword || null,
        proxy_id: mlDevice.proxy?.id || null,
        country: mlDevice.country || null,
        created_at: dbDevice?.created_at || new Date().toISOString()
      };
      
      // Update or insert in database
      if (dbDevice) {
        await supabase
          .from('cloud_phones')
          .update({
            name: mergedDevice.name,
            status: mergedDevice.status,
            adb_enabled: mergedDevice.adb_enabled,
            adb_ip: mergedDevice.adb_ip,
            adb_port: mergedDevice.adb_port,
            proxy_id: mergedDevice.proxy_id
          })
          .eq('id', dbDevice.id);
      } else {
        // New device not in our DB yet - add it
        const { data: newDevice } = await supabase
          .from('cloud_phones')
          .insert({
            user_id: user.id,
            ...mergedDevice
          })
          .select()
          .single();
        
        mergedDevice.id = newDevice?.id;
      }
      
      mergedPhones.push(mergedDevice);
    }

    res.json({
      success: true,
      cloud_phones: mergedPhones,
      count: mergedPhones.length
    });

  } catch (error) {
    console.error('Error fetching cloud phones:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch cloud phones'
    });
  }
});

// Create new cloud phone with auto-proxy assignment
app.post('/api/morelogin/create', async (req, res) => {
  try {
    const { userId, name, country, skuId, autoProxy } = req.body;
    
    console.log('📱 Creating cloud phone:', { userId, name, country, skuId, autoProxy });
    
    // Step 1: Get available proxy if autoProxy is true
    let proxyId = 0;
    if (autoProxy) {
      try {
        const proxyResponse = await axios.post(
          `${config.moreloginApiUrl}/api/proxyInfo/page`,
          { pageNo: 1, pageSize: 1, isCloudPhoneProxy: true },
          { headers: await generateMoreLoginHeaders() }
        );
        
        if (proxyResponse.data.code === 0 && proxyResponse.data.data?.dataList?.length > 0) {
          proxyId = proxyResponse.data.data.dataList[0].id;
          console.log('✅ Found proxy:', proxyId);
        }
      } catch (proxyError) {
        console.log('⚠️ No proxies available, creating without proxy');
      }
    }
    
    // Step 2: Create cloud phone
    // SKU IDs: 10002 = Android 12 (Model X), 10004 = Android 14, try different values for Android 15
    const deviceSkuId = skuId || 10002; // Default to Android 12
    
    console.log('🔧 Creating with SKU:', deviceSkuId, 'Proxy:', proxyId);
    
    const response = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/create`,
      {
        quantity: 1,
        skuId: deviceSkuId,
        country: country || 'us',
        proxyId: proxyId,
        envRemark: name || 'Auto-created device',
        automaticGeo: true,
        automaticLanguage: true,
        automaticLocation: true
      },
      {
        headers: await generateMoreLoginHeaders()
      }
    );
    
    console.log('📡 MoreLogin response:', JSON.stringify(response.data));
    
    // Check response - it might succeed even if code !== 0
    const cloudPhoneIds = response.data.data || response.data;
    
    if (!cloudPhoneIds || (Array.isArray(cloudPhoneIds) && cloudPhoneIds.length === 0)) {
      throw new Error(response.data.msg || 'Failed to create cloud phone');
    }
    
    // Step 3: Save to database
    const phoneId = Array.isArray(cloudPhoneIds) ? cloudPhoneIds[0] : cloudPhoneIds;
    
    if (userId) {
      const { data: dbData, error: dbError } = await supabase
        .from('cloud_phones')
        .insert({
          user_id: userId,
          morelogin_id: phoneId.toString(),
          name: name || 'Auto-created device',
          country: country || 'us',
          status: 'new',
          adb_enabled: false,
          proxy_id: proxyId || null
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('❌ Database save error:', dbError);
      } else {
        console.log('✅ Saved to database:', dbData.id);
      }
    }
    
    res.json({
      success: true,
      cloudPhoneId: phoneId,
      proxyAssigned: proxyId > 0,
      message: `Created cloud phone successfully`
    });
    
  } catch (error) {
    console.error('❌ Error creating cloud phone:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// List all proxies
app.get('/api/morelogin/proxies', async (req, res) => {
  try {
    const response = await axios.post(
      `${config.moreloginApiUrl}/api/proxyInfo/page`,
      {
        pageNo: 1,
        pageSize: 100,
        isCloudPhoneProxy: true
      },
      {
        headers: await generateMoreLoginHeaders()
      }
    );
    
    if (response.data.code === 0) {
      const proxies = response.data.data?.dataList || [];
      res.json({
        success: true,
        proxies: proxies,
        count: proxies.length,
        total: response.data.data?.total || 0
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg
      });
    }
  } catch (error) {
    console.error('Error listing proxies:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Enable ADB for cloud phone
app.post('/api/morelogin/adb/enable', async (req, res) => {
  try {
    const { cloudPhoneIds } = req.body;
    
    if (!cloudPhoneIds || !Array.isArray(cloudPhoneIds)) {
      return res.status(400).json({
        success: false,
        error: 'cloudPhoneIds array is required'
      });
    }
    
    const response = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/updateAdb`,
      {
        enableAdb: true,
        ids: cloudPhoneIds
      },
      {
        headers: await generateMoreLoginHeaders()
      }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        message: 'ADB enabled successfully',
        note: 'Fetch cloud phone list to get ADB connection details'
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg
      });
    }
  } catch (error) {
    console.error('Error enabling ADB:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Power on cloud phone
app.post('/api/morelogin/poweron', async (req, res) => {
  try {
    const { cloudPhoneId } = req.body;
    
    const response = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/powerOn`,
      { id: cloudPhoneId },
      {
        headers: await generateMoreLoginHeaders()
      }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        message: 'Cloud phone powered on'
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg
      });
    }
  } catch (error) {
    console.error('Error powering on cloud phone:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Power off cloud phone
app.post('/api/morelogin/poweroff', async (req, res) => {
  try {
    const { cloudPhoneId } = req.body;
    
    if (!cloudPhoneId) {
      return res.status(400).json({
        success: false,
        error: 'cloudPhoneId is required'
      });
    }
    
    const response = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/powerOff`,
      { id: cloudPhoneId }, // Correct parameter name is 'id'
      {
        headers: await generateMoreLoginHeaders()
      }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        message: 'Cloud phone powered off successfully',
        cloudPhoneId: cloudPhoneId
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg || 'Failed to power off cloud phone'
      });
    }
  } catch (error) {
    console.error('Error powering off cloud phone:', error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.msg || error.message
    });
  }
});

// Add proxy
app.post('/api/morelogin/proxy/add', async (req, res) => {
  try {
    const { proxyName, proxyIp, proxyPort, username, password, country } = req.body;
    
    if (!proxyName || !proxyIp || !proxyPort) {
      return res.status(400).json({
        success: false,
        error: 'proxyName, proxyIp, and proxyPort are required'
      });
    }
    
    const response = await axios.post(
      `${config.moreloginApiUrl}/api/proxyInfo/add`,
      {
        proxyName,
        proxyIp,
        proxyPort,
        username: username || '',
        password: password || '',
        proxyProvider: 0, // HTTP
        proxyType: 0, // HTTP
        country: country || ''
      },
      {
        headers: await generateMoreLoginHeaders()
      }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        proxyId: response.data.data,
        message: 'Proxy added successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg
      });
    }
  } catch (error) {
    console.error('Error adding proxy:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Assign proxy to cloud phone
app.post('/api/morelogin/proxy/assign', async (req, res) => {
  try {
    const { cloudPhoneIds, proxyId } = req.body;
    
    if (!cloudPhoneIds || !proxyId) {
      return res.status(400).json({
        success: false,
        error: 'cloudPhoneIds and proxyId are required'
      });
    }
    
    const response = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/edit/batch`,
      {
        id: Array.isArray(cloudPhoneIds) ? cloudPhoneIds : [cloudPhoneIds],
        proxyId: proxyId
      },
      {
        headers: await generateMoreLoginHeaders()
      }
    );
    
    if (response.data.code === 0) {
      res.json({
        success: true,
        message: 'Proxy assigned successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.data.msg
      });
    }
  } catch (error) {
    console.error('Error assigning proxy:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload file to cloud phone
app.post('/api/morelogin/upload', async (req, res) => {
  try {
    const { cloudPhoneId, fileUrl, fileName, uploadDest } = req.body;
    
    if (!cloudPhoneId || !fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'cloudPhoneId and fileUrl are required'
      });
    }

    // For URL-based uploads, we need to download then upload via multipart
    // This is a simplified version - for production, implement proper file handling
    const destination = uploadDest || '/sdcard/DCIM/';
    const filename = fileName || 'video.mp4';
    
    // Note: MoreLogin uploadFile endpoint requires multipart/form-data
    // For now, return instructions for manual upload via ADB
    res.json({
      success: true,
      message: 'File upload prepared',
      instructions: {
        method: 'ADB',
        command: `adb -s {device} push local_file.mp4 ${destination}${filename}`,
        note: 'Download the file from fileUrl first, then use ADB push command'
      },
      fileUrl,
      destination: `${destination}${filename}`
    });
    
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// TIKTOK AUTOMATION VIA ADB
// ===================================

// Execute TikTok automation action via ADB
app.post('/api/tiktok/action', async (req, res) => {
  try {
    const { cloudPhoneId, action, params } = req.body;
    
    if (!cloudPhoneId || !action) {
      return res.status(400).json({
        success: false,
        error: 'cloudPhoneId and action are required'
      });
    }

    // First, get ADB connection info for this cloud phone
    const instanceResponse = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/page`,
      { pageNo: 1, pageSize: 100 },
      { headers: await generateMoreLoginHeaders() }
    );
    
    if (instanceResponse.data.code !== 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch cloud phone details'
      });
    }
    
    const instance = instanceResponse.data.data.dataList.find(p => p.id === cloudPhoneId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: `Cloud phone with ID ${cloudPhoneId} not found`
      });
    }
    
    if (!instance.enableAdb || !instance.adbInfo || instance.adbInfo.success !== 1) {
      return res.status(400).json({
        success: false,
        error: 'ADB not enabled or not available for this cloud phone'
      });
    }
    
    const { adbIp, adbPort, adbPassword } = instance.adbInfo;
    const adb = new ADBHelper(adbIp, adbPort, adbPassword);
    
    // Connect to device
    await adb.connect();

    // Screen dimensions (adjust if needed)
    const screenWidth = params?.screenWidth || 1080;
    const screenHeight = params?.screenHeight || 1920;

    let result = {};
    
    // Execute action
    switch (action) {
      case 'scroll_feed':
        // Swipe up (scroll to next video)
        const centerX = screenWidth / 2;
        const startY = screenHeight * 0.75;
        const endY = screenHeight * 0.25;
        await adb.swipe(centerX, startY, centerX, endY, 400);
        result = { action: 'scroll_feed', executed: true };
        break;
        
      case 'like_video':
        // Tap like button (right side, middle-right area)
        const likeX = screenWidth * 0.9;
        const likeY = screenHeight * 0.52;
        await adb.tap(likeX, likeY);
        result = { action: 'like_video', executed: true };
        break;
        
      case 'tap_search':
        // Tap search icon (top right corner)
        const searchX = screenWidth * 0.9;
        const searchY = screenHeight * 0.08;
        await adb.tap(searchX, searchY);
        result = { action: 'tap_search', executed: true };
        break;
        
      case 'tap_search_enter':
        // Tap search/enter button (top right, same position as search icon)
        const searchEnterX = screenWidth * 0.9;
        const searchEnterY = screenHeight * 0.08;
        await adb.tap(searchEnterX, searchEnterY);
        result = { action: 'tap_search_enter', executed: true };
        break;
        
      case 'type_text':
        // Type text into focused field with human-like delays
        if (!params.text) {
          return res.status(400).json({
            success: false,
            error: 'text parameter required for type_text'
          });
        }
        
        // Type in chunks (words) to avoid glitches while still being human-like
        const text = params.text;
        const words = text.split(' ');
        
        for (let i = 0; i < words.length; i++) {
          // Type each word
          await adb.inputText(words[i]);
          
          // Add space between words (except last word)
          if (i < words.length - 1) {
            await adb.inputText(' ');
            // Random delay between words (200-500ms) - human-like pause
            const wordDelay = Math.floor(Math.random() * 300) + 200;
            await new Promise(resolve => setTimeout(resolve, wordDelay));
          }
        }
        
        result = { action: 'type_text', text: params.text, executed: true };
        break;
        
      case 'tap_search_tab':
        // Tap search result tabs (Top, Users, LIVE, Videos, Shop)
        if (!params.tab) {
          return res.status(400).json({
            success: false,
            error: 'tab parameter required (top, users, live, videos, shop)'
          });
        }
        const tabPositions = {
          'top': 0.2,
          'videos': 0.37,
          'users': 0.5,
          'live': 0.63,
          'shop': 0.76
        };
        const tabX = screenWidth * tabPositions[params.tab.toLowerCase()];
        const tabY = screenHeight * 0.15;
        await adb.tap(tabX, tabY);
        result = { action: 'tap_search_tab', tab: params.tab, executed: true };
        break;
        
      case 'tap_video_result':
        // Tap on a video in search results (grid position)
        if (!params.position) {
          return res.status(400).json({
            success: false,
            error: 'position parameter required (1-6 for grid positions)'
          });
        }
        const positions = {
          1: { x: 0.25, y: 0.35 },   // Top left
          2: { x: 0.75, y: 0.35 },   // Top right
          3: { x: 0.25, y: 0.55 },   // Middle left
          4: { x: 0.75, y: 0.55 },   // Middle right
          5: { x: 0.25, y: 0.75 },   // Bottom left
          6: { x: 0.75, y: 0.75 }    // Bottom right
        };
        const pos = positions[params.position];
        if (!pos) {
          return res.status(400).json({
            success: false,
            error: 'position must be 1-6'
          });
        }
        const videoX = screenWidth * pos.x;
        const videoY = screenHeight * pos.y;
        await adb.tap(videoX, videoY);
        result = { action: 'tap_video_result', position: params.position, executed: true };
        break;
        
      case 'tap_back':
        // Tap back button (top left)
        const backX = screenWidth * 0.1;
        const backY = screenHeight * 0.08;
        await adb.tap(backX, backY);
        result = { action: 'tap_back', executed: true };
        break;
        
      case 'exit_tiktok':
        // Exit TikTok app (press home button)
        await adb.keyEvent(3); // KEYCODE_HOME = 3
        result = { action: 'exit_tiktok', executed: true };
        break;
        
      case 'tap_user_profile':
        // Tap on a user profile in the users list
        if (!params.position) {
          return res.status(400).json({
            success: false,
            error: 'position parameter required (1-7 for user list positions)'
          });
        }
        const userPositions = {
          1: { x: 0.5, y: 0.25 },   // First user
          2: { x: 0.5, y: 0.35 },   // Second user
          3: { x: 0.5, y: 0.45 },   // Third user
          4: { x: 0.5, y: 0.55 },   // Fourth user
          5: { x: 0.5, y: 0.65 },   // Fifth user
          6: { x: 0.5, y: 0.75 },   // Sixth user
          7: { x: 0.5, y: 0.85 }    // Seventh user
        };
        const userPos = userPositions[params.position];
        if (!userPos) {
          return res.status(400).json({
            success: false,
            error: 'position must be 1-7'
          });
        }
        const userX = screenWidth * userPos.x;
        const userY = screenHeight * userPos.y;
        await adb.tap(userX, userY);
        result = { action: 'tap_user_profile', position: params.position, executed: true };
        break;
        
      case 'tap_follow_button':
        // Tap follow button for a user (right side of profile)
        if (!params.position) {
          return res.status(400).json({
            success: false,
            error: 'position parameter required (1-7 for user list positions)'
          });
        }
        const followPositions = {
          1: { x: 0.85, y: 0.25 },   // First user follow button
          2: { x: 0.85, y: 0.35 },   // Second user follow button
          3: { x: 0.85, y: 0.45 },   // Third user follow button
          4: { x: 0.85, y: 0.55 },   // Fourth user follow button
          5: { x: 0.85, y: 0.65 },   // Fifth user follow button
          6: { x: 0.85, y: 0.75 },   // Sixth user follow button
          7: { x: 0.85, y: 0.85 }    // Seventh user follow button
        };
        const followPos = followPositions[params.position];
        if (!followPos) {
          return res.status(400).json({
            success: false,
            error: 'position must be 1-7'
          });
        }
        const followX = screenWidth * followPos.x;
        const followY = screenHeight * followPos.y;
        await adb.tap(followX, followY);
        result = { action: 'tap_follow_button', position: params.position, executed: true };
        break;
        
      case 'scroll_users':
        // Scroll down in the users list
        const scrollCenterX = screenWidth / 2;
        const scrollStartY = screenHeight * 0.8;
        const scrollEndY = screenHeight * 0.2;
        await adb.swipe(scrollCenterX, scrollStartY, scrollCenterX, scrollEndY, 400);
        result = { action: 'scroll_users', executed: true };
        break;
        
      case 'tap_custom':
        // Custom tap at specified coordinates
        if (!params.x || !params.y) {
          return res.status(400).json({
            success: false,
            error: 'x and y coordinates required for tap_custom'
          });
        }
        await adb.tap(params.x, params.y);
        result = { action: 'tap_custom', x: params.x, y: params.y, executed: true };
        break;
        
      case 'swipe_custom':
        // Custom swipe
        if (!params.x1 || !params.y1 || !params.x2 || !params.y2) {
          return res.status(400).json({
            success: false,
            error: 'x1, y1, x2, y2 required for swipe_custom'
          });
        }
        await adb.swipe(params.x1, params.y1, params.x2, params.y2, params.duration || 400);
        result = { action: 'swipe_custom', executed: true };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`
        });
    }

    // Add random human-like delay after action (3-15 seconds)
    if (params && params.addDelay !== false) {
      const randomDelay = Math.floor(Math.random() * 12000) + 3000; // 3-15 seconds
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      result.delayMs = randomDelay;
    }

    res.json({
      success: true,
      cloudPhoneId,
      result,
      device: `${adbIp}:${adbPort}`
    });
    
  } catch (error) {
    console.error('Error executing TikTok action:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Check ADB connection status
app.post('/api/morelogin/adb/check', async (req, res) => {
  try {
    const { cloudPhoneId } = req.body;
    
    if (!cloudPhoneId) {
      return res.status(400).json({
        success: false,
        error: 'cloudPhoneId is required'
      });
    }

    const instanceResponse = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/page`,
      { pageNo: 1, pageSize: 100 },
      { headers: await generateMoreLoginHeaders() }
    );
    
    const instance = instanceResponse.data.data.dataList.find(p => p.id === cloudPhoneId);
    
    if (!instance || !instance.adbInfo || instance.adbInfo.success !== 1) {
      return res.json({
        success: false,
        connected: false,
        message: 'ADB not enabled or device not ready'
      });
    }
    
    const { adbIp, adbPort, adbPassword } = instance.adbInfo;
    
    // Use ADBHelper for proper connection with authentication
    const adb = new ADBHelper(adbIp, adbPort, adbPassword);
    
    try {
      // Connect with authentication
      const connected = await adb.connect();
      
      if (connected) {
        res.json({
          success: true,
          connected: true,
          device: `${adbIp}:${adbPort}`,
          message: 'ADB connection active'
        });
      } else {
        res.json({
          success: false,
          connected: false,
          device: `${adbIp}:${adbPort}`,
          message: 'ADB connection failed'
        });
      }
    } catch (error) {
      res.json({
        success: false,
        connected: false,
        device: `${adbIp}:${adbPort}`,
        message: 'ADB connection error',
        error: error.message
      });
    }
    
  } catch (error) {
    console.error('Error checking ADB:', error.message);
    res.status(500).json({
      success: false,
      connected: false,
      error: error.message
    });
  }
});

// Start TikTok app via ADB
app.post('/api/tiktok/start', async (req, res) => {
  try {
    const { cloudPhoneId } = req.body;
    
    if (!cloudPhoneId) {
      return res.status(400).json({
        success: false,
        error: 'cloudPhoneId is required'
      });
    }

    // Get ADB connection info
    const instanceResponse = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/page`,
      { pageNo: 1, pageSize: 100 },
      { headers: await generateMoreLoginHeaders() }
    );
    
    const instance = instanceResponse.data.data.dataList.find(p => p.id === cloudPhoneId);
    
    if (!instance || !instance.adbInfo || instance.adbInfo.success !== 1) {
      return res.status(400).json({
        success: false,
        error: 'ADB not available for this cloud phone'
      });
    }
    
    const { adbIp, adbPort, adbPassword } = instance.adbInfo;
    const adb = new ADBHelper(adbIp, adbPort, adbPassword);
    
    // Connect and verify ADB is actually working
    console.log('Connecting to ADB...');
    await adb.connect();
    
    // Verify connection with a test command
    console.log('Verifying ADB connection is live...');
    try {
      await execPromise(`adb -s ${adbIp}:${adbPort} shell echo "test"`, { timeout: 5000 });
      console.log('✓ ADB connection verified');
    } catch (verifyError) {
      console.log('Connection verification failed, reconnecting...');
      await adb.connect();
      await execPromise(`adb -s ${adbIp}:${adbPort} shell echo "test"`, { timeout: 5000 });
    }
    
    console.log('Launching TikTok...');
    await adb.launchApp('com.zhiliaoapp.musically/com.ss.android.ugc.aweme.splash.SplashActivity');
    
    res.json({
      success: true,
      message: 'TikTok app started',
      device: `${adbIp}:${adbPort}`
    });
    
  } catch (error) {
    console.error('Error starting TikTok:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete TikTok posting sequence via ADB
app.post('/api/tiktok/post-sequence', async (req, res) => {
  try {
    const { cloudPhoneId, videoFilePath, caption, hashtags, screenWidth, screenHeight } = req.body;
    
    if (!cloudPhoneId || !videoFilePath || !caption) {
      return res.status(400).json({
        success: false,
        error: 'cloudPhoneId, videoFilePath, and caption are required'
      });
    }

    const width = screenWidth || 1080;
    const height = screenHeight || 1920;
    const fullCaption = hashtags 
      ? `${caption} ${hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ')}`
      : caption;

    // Get ADB connection info
    const instanceResponse = await axios.post(
      `${config.moreloginApiUrl}/api/cloudphone/page`,
      { pageNo: 1, pageSize: 100 },
      { headers: await generateMoreLoginHeaders() }
    );
    
    const instance = instanceResponse.data.data.dataList.find(p => p.id === cloudPhoneId);
    
    if (!instance || !instance.adbInfo || instance.adbInfo.success !== 1) {
      return res.status(400).json({
        success: false,
        error: 'ADB not available for this cloud phone'
      });
    }
    
    const { adbIp, adbPort, adbPassword } = instance.adbInfo;
    const adb = new ADBHelper(adbIp, adbPort, adbPassword);
    
    await adb.connect();
    
    const results = [];
    
    // Step 1: Start TikTok
    console.log('Step 1: Starting TikTok...');
    await adb.launchApp('com.zhiliaoapp.musically/.MainActivity');
    results.push({ step: 'start_tiktok', success: true });
    await sleep(3000);
    
    // Step 2: Tap the '+' button
    console.log('Step 2: Tapping + button...');
    await adb.tap(width * 0.5, height * 0.95);
    results.push({ step: 'tap_plus', success: true });
    await sleep(2000);
    
    // Step 3: Tap Upload
    console.log('Step 3: Tapping Upload...');
    await adb.tap(width * 0.8, height * 0.9);
    results.push({ step: 'tap_upload', success: true });
    await sleep(1500);
    
    // Step 4: Select video (first in gallery)
    console.log('Step 4: Selecting video...');
    await adb.tap(width * 0.25, height * 0.25);
    results.push({ step: 'select_video', success: true });
    await sleep(1000);
    
    // Step 5: Tap Next
    console.log('Step 5: Tapping Next...');
    await adb.tap(width * 0.9, height * 0.05);
    results.push({ step: 'tap_next', success: true });
    await sleep(2000);
    
    // Step 6: Tap caption field
    console.log('Step 6: Tapping caption field...');
    await adb.tap(width * 0.5, height * 0.3);
    results.push({ step: 'tap_caption_field', success: true });
    await sleep(1000);
    
    // Step 7: Input caption
    console.log('Step 7: Inputting caption...');
    await adb.inputText(fullCaption);
    results.push({ step: 'input_caption', success: true });
    await sleep(1000);
    
    // Step 8: Tap Post
    console.log('Step 8: Tapping Post...');
    await adb.tap(width * 0.9, height * 0.05);
    results.push({ step: 'tap_post', success: true });
    
    res.json({
      success: true,
      message: 'TikTok posting sequence executed',
      steps: results,
      caption: fullCaption,
      device: `${adbIp}:${adbPort}`,
      note: 'Verify post was created in TikTok app'
    });
    
  } catch (error) {
    console.error('Error executing posting sequence:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// CONTENT GENERATION ENDPOINTS
// (Unchanged from original)
// ===================================

// Get trending crypto topics from CoinMarketCap
app.get('/api/crypto/trending', async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const coinmarketcapApiKey = await getOperatorApiKey('coinmarketcap', 'api_key_encrypted');
    
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': coinmarketcapApiKey,
          'Accept': 'application/json'
        },
        params: {
          start: 1,
          limit: limit,
          convert: 'USD',
          sort: 'market_cap',
          sort_dir: 'desc'
        }
      }
    );
    
    res.json({
      success: true,
      trending: response.data.data,
      count: response.data.data?.length || 0,
      status: response.data.status
    });
  } catch (error) {
    console.error('Error fetching trending crypto:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Generate TikTok script using OpenAI
app.post('/api/openai/generate-script', async (req, res) => {
  try {
    const { topic, keywords } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'topic is required'
      });
    }

    const prompt = `Create a compelling 30-second TikTok script about ${topic}. 
    
Requirements:
- Start with an attention-grabbing hook (3-5 seconds)
- Include 2-3 interesting facts about the topic
- Add a clear call-to-action: "Visit minehedge.com for mining tips!"
- Suggest 5 relevant hashtags including #Crypto #Mining #MineHedge
- Keep it conversational and engaging
- Format as JSON with keys: hook, facts (array), cta, hashtags (array)

${keywords ? `Focus on these keywords: ${keywords.join(', ')}` : ''}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a TikTok content creator specializing in crypto and mining content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const scriptData = JSON.parse(response.data.choices[0].message.content);
    
    res.json({
      success: true,
      script: scriptData,
      fullText: `${scriptData.hook} ${scriptData.facts.join(' ')} ${scriptData.cta}`
    });
  } catch (error) {
    console.error('Error generating script:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Generate video using OpenAI Sora 2 (Async)
app.post('/api/openai/generate-video', async (req, res) => {
  try {
    const { prompt, model, size, seconds, inputReference } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required'
      });
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', model || 'sora-2');
    formData.append('size', size || '1280x720');
    formData.append('seconds', seconds || '8');
    
    if (inputReference) {
      formData.append('input_reference', inputReference);
    }

    const response = await axios.post(
      'https://api.openai.com/v1/videos',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          ...formData.getHeaders()
        }
      }
    );
    
    res.json({
      success: true,
      videoId: response.data.id,
      status: response.data.status,
      progress: response.data.progress || 0,
      model: response.data.model,
      created_at: response.data.created_at,
      note: 'Video generation started. Poll /api/openai/video-status/{videoId} for updates'
    });
  } catch (error) {
    console.error('Error starting video generation:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Check Sora 2 video generation status
app.get('/api/openai/video-status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const response = await axios.get(
      `https://api.openai.com/v1/videos/${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`
        }
      }
    );
    
    res.json({
      success: true,
      videoId: response.data.id,
      status: response.data.status,
      progress: response.data.progress || 0,
      model: response.data.model,
      created_at: response.data.created_at,
      error: response.data.error || null
    });
  } catch (error) {
    console.error('Error checking video status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Download completed Sora 2 video
app.get('/api/openai/video-download/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { variant } = req.query;
    
    const url = variant 
      ? `https://api.openai.com/v1/videos/${videoId}/content?variant=${variant}`
      : `https://api.openai.com/v1/videos/${videoId}/content`;
    
    res.json({
      success: true,
      videoId: videoId,
      downloadUrl: url,
      note: 'Use this URL to download the video file (valid for 1 hour)'
    });
  } catch (error) {
    console.error('Error downloading video:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Generate video and poll until complete (helper endpoint)
app.post('/api/openai/generate-video-complete', async (req, res) => {
  try {
    const { prompt, model, size, seconds } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required'
      });
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', model || 'sora-2');
    formData.append('size', size || '1280x720');
    formData.append('seconds', seconds || '8');

    const createResponse = await axios.post(
      'https://api.openai.com/v1/videos',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          ...formData.getHeaders()
        }
      }
    );
    
    const videoId = createResponse.data.id;
    console.log(`Video generation started: ${videoId}`);
    
    let status = createResponse.data.status;
    let progress = createResponse.data.progress || 0;
    
    while (status === 'queued' || status === 'in_progress') {
      await sleep(10000);
      
      const statusResponse = await axios.get(
        `https://api.openai.com/v1/videos/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.openaiApiKey}`
          }
        }
      );
      
      status = statusResponse.data.status;
      progress = statusResponse.data.progress || 0;
      
      console.log(`Video ${videoId} - Status: ${status}, Progress: ${progress}%`);
    }
    
    if (status === 'failed') {
      return res.status(500).json({
        success: false,
        error: 'Video generation failed',
        videoId: videoId
      });
    }
    
    const downloadUrl = `https://api.openai.com/v1/videos/${videoId}/content`;
    
    res.json({
      success: true,
      videoId: videoId,
      status: status,
      downloadUrl: downloadUrl,
      thumbnailUrl: `https://api.openai.com/v1/videos/${videoId}/content?variant=thumbnail`,
      note: 'Video generation complete. URLs valid for 1 hour.'
    });
    
  } catch (error) {
    console.error('Error in complete video generation:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Generate 10 unique Sora 2 video prompts for same topic
app.post('/api/openai/generate-video-variations', async (req, res) => {
  try {
    const { cryptoTopic, baseScript, ctaMode } = req.body;
    
    if (!cryptoTopic || !baseScript) {
      return res.status(400).json({
        success: false,
        error: 'cryptoTopic and baseScript are required'
      });
    }

    const mode = ctaMode || config.ctaMode;
    
    let ctaInstruction = '';
    if (mode === 'video_overlay') {
      ctaInstruction = 'Include text overlay "Visit minehedge.com" prominently at the end (last 2 seconds)';
    } else if (mode === 'caption_only') {
      ctaInstruction = 'No text overlays, clean professional visuals only';
    } else if (mode === 'both') {
      ctaInstruction = 'Mix of videos: some with "Visit minehedge.com" text overlay at end, others without text overlays';
    }

    const systemPrompt = `You are a Sora 2 video prompt expert. Generate 10 unique video prompts for the same crypto topic.

Requirements:
- Each prompt must have DIFFERENT visual approach (spinning coin, chart animation, mining rig, rocket, particles, etc.)
- All optimized for TikTok vertical format (9:16 aspect ratio)
- Include: shot type, subject, action, setting, lighting
- 8 seconds duration
- Cinematic, professional quality
- ${ctaInstruction}

Return JSON: { "prompts": [ {"id": 1, "prompt": "...", "style": "..."}, ... ] }`;

    const userPrompt = `Topic: ${cryptoTopic.name} (${cryptoTopic.symbol})
Script Hook: ${baseScript.hook}
Key Facts: ${baseScript.facts ? baseScript.facts.join(', ') : ''}

Generate 10 unique Sora 2 prompts with different visual approaches.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const variations = JSON.parse(response.data.choices[0].message.content);
    
    res.json({
      success: true,
      variations: variations.prompts,
      count: variations.prompts?.length || 0,
      ctaMode: mode
    });

  } catch (error) {
    console.error('Error generating video variations:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Remix a Sora 2 video into multiple variations
app.post('/api/openai/remix-video', async (req, res) => {
  try {
    const { videoId, variationCount } = req.body;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'videoId is required'
      });
    }

    const count = variationCount || 9;
    
    const remixPrompts = [
      "Shift color palette to warm teal and orange tones, add golden backlight",
      "Change to cool blue and purple aesthetic, tech-focused lighting",
      "Add dramatic warm lighting, sunset golden hour feel",
      "Convert to high-contrast black and white with neon accents",
      "Brighten overall, add soft diffused lighting, clean modern feel",
      "Increase saturation, vibrant energetic colors, dynamic feel",
      "Desaturate slightly, add cinematic film grain, professional look",
      "Add particle effects, glowing elements, futuristic atmosphere",
      "Shift to earth tones, natural lighting, organic feel"
    ];

    const remixedVideos = [];
    
    for (let i = 0; i < Math.min(count, remixPrompts.length); i++) {
      const response = await axios.post(
        `https://api.openai.com/v1/videos/${videoId}/remix`,
        { prompt: remixPrompts[i] },
        {
          headers: {
            'Authorization': `Bearer ${config.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      remixedVideos.push({
        videoId: response.data.id,
        variation: i + 1,
        prompt: remixPrompts[i],
        status: response.data.status
      });
      
      videoUsageStats.remix_videos++;
      videoUsageStats.total_videos++;
    }

    res.json({
      success: true,
      originalVideoId: videoId,
      remixes: remixedVideos,
      count: remixedVideos.length
    });

  } catch (error) {
    console.error('Error remixing video:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Generate caption variations (1 base + 9 variations)
app.post('/api/openai/generate-caption-variations', async (req, res) => {
  try {
    const { cryptoTopic, baseScript } = req.body;
    
    if (!cryptoTopic || !baseScript) {
      return res.status(400).json({
        success: false,
        error: 'cryptoTopic and baseScript are required'
      });
    }

    const systemPrompt = `Generate 1 base TikTok caption + 9 variations for the same topic.

Requirements:
- All MUST include "Visit minehedge.com for mining tips!" or similar CTA
- Each variation should have different wording but same core message
- Include relevant hashtags (vary the order and combination)
- Always include: #Crypto #Mining #MineHedge + topic-specific hashtags
- Keep under 150 characters when possible
- Engaging, conversational tone

Return JSON: { "base": "...", "variations": ["...", "...", ...], "hashtags": {...} }`;

    const userPrompt = `Topic: ${cryptoTopic.name} (${cryptoTopic.symbol})
Price: $${cryptoTopic.price}
24h Change: ${cryptoTopic.percentChange24h}%
Script: ${baseScript.hook}

Generate 1 base caption + 9 unique variations.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const captions = JSON.parse(response.data.choices[0].message.content);
    
    res.json({
      success: true,
      base: captions.base,
      variations: captions.variations,
      hashtags: captions.hashtags,
      count: (captions.variations?.length || 0) + 1
    });

  } catch (error) {
    console.error('Error generating caption variations:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Generate content endpoint (matches frontend expectations)
app.post('/api/generate-content', async (req, res) => {
  try {
    const { userId, campaignId, contentType, platform, keywords, topics, count = 10 } = req.body;

    console.log(`Generating ${contentType} content for ${platform} platform`);

    if (!keywords && !topics) {
      return res.status(400).json({
        success: false,
        error: 'Keywords or topics are required'
      });
    }

    // Use ViralTweetGenerator for Twitter content
    if (platform === 'twitter' || platform === 'x') {
      const ViralTweetGenerator = (await import('../services/viral-tweet-generator.js')).default;
      const tweetGenerator = new ViralTweetGenerator();

      // Combine keywords and topics
      const allKeywords = [
        ...(keywords || []),
        ...(topics || [])
      ].filter(k => k && k.trim());

      const tweets = await tweetGenerator.generateTweets({
        keywords: allKeywords,
        count: count || 10,
        userId: userId
      });

      return res.json({
        success: true,
        content: {
          platform,
          contentType,
          items: tweets.map(tweet => ({
            text: tweet,
            platform: 'twitter',
            type: 'tweet'
          }))
        }
      });
    }

    // For other platforms, use OpenAI directly
    const OpenAIService = (await import('../services/openai-service.js')).default;
    const openai = new OpenAIService();

    const prompt = `Generate ${count} pieces of ${contentType} content for ${platform} about: ${[
      ...(keywords || []),
      ...(topics || [])
    ].join(', ')}. Make it engaging and platform-appropriate.`;

    const generatedContent = await openai.generateContent(prompt);

    return res.json({
      success: true,
      content: {
        platform,
        contentType,
        items: generatedContent.split('\n\n').filter(item => item.trim()).map(text => ({
          text: text.trim(),
          platform,
          type: contentType
        }))
      }
    });

  } catch (error) {
    console.error('Generate content error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unified endpoint: Generate complete campaign (videos + captions)
app.post('/api/content/generate-full-campaign', async (req, res) => {
  try {
    const { cryptoTopic, strategy } = req.body;
    
    if (!cryptoTopic) {
      return res.status(400).json({
        success: false,
        error: 'cryptoTopic is required'
      });
    }

    const useStrategy = strategy || config.videoStrategy;
    
    console.log(`Generating campaign for ${cryptoTopic.name} using strategy: ${useStrategy}`);
    
    // Step 1: Generate script
    const scriptResponse = await axios.post(
      'http://localhost:3000/api/openai/generate-script',
      {
        topic: `${cryptoTopic.name} (${cryptoTopic.symbol}) - Price: $${cryptoTopic.price}, 24h: ${cryptoTopic.percentChange24h}%`,
        keywords: [cryptoTopic.name, cryptoTopic.symbol, 'crypto', 'mining']
      }
    );
    
    const script = scriptResponse.data.script;
    let videos = [];
    
    if (useStrategy === 'unique') {
      // Step 2: Generate 10 unique video prompts
      const variationsResponse = await axios.post(
        'http://localhost:3000/api/openai/generate-video-variations',
        {
          cryptoTopic: cryptoTopic,
          baseScript: script,
          ctaMode: config.ctaMode
        }
      );
      
      const prompts = variationsResponse.data.variations;
      
      // Step 3: Generate all 10 videos
      console.log('Starting generation of 10 unique videos...');
      
      for (let i = 0; i < prompts.length; i++) {
        console.log(`Generating video ${i + 1}/10: ${prompts[i].style}`);
        
        const videoResponse = await axios.post(
          'http://localhost:3000/api/openai/generate-video',
          {
            prompt: prompts[i].prompt,
            model: 'sora-2',
            size: '1080x1920',
            seconds: '8'
          }
        );
        
        videos.push({
          videoId: videoResponse.data.videoId,
          status: videoResponse.data.status,
          style: prompts[i].style,
          variation: i + 1
        });
        
        videoUsageStats.unique_videos++;
        videoUsageStats.total_videos++;
      }
      
    } else if (useStrategy === 'remix') {
      // Step 2: Generate 1 master video
      const variationsResponse = await axios.post(
        'http://localhost:3000/api/openai/generate-video-variations',
        {
          cryptoTopic: cryptoTopic,
          baseScript: script,
          ctaMode: config.ctaMode
        }
      );
      
      const masterPrompt = variationsResponse.data.variations[0];
      
      console.log('Generating master video...');
      const masterVideoResponse = await axios.post(
        'http://localhost:3000/api/openai/generate-video',
        {
          prompt: masterPrompt.prompt,
          model: 'sora-2',
          size: '1080x1920',
          seconds: '8'
        }
      );
      
      const masterVideoId = masterVideoResponse.data.videoId;
      videos.push({
        videoId: masterVideoId,
        status: masterVideoResponse.data.status,
        style: 'master',
        variation: 0
      });
      
      videoUsageStats.unique_videos++;
      videoUsageStats.total_videos++;
      
      // Step 3: Create 9 remixes
      console.log('Creating 9 remix variations...');
      const remixResponse = await axios.post(
        'http://localhost:3000/api/openai/remix-video',
        {
          videoId: masterVideoId,
          variationCount: 9
        }
      );
      
      videos = videos.concat(remixResponse.data.remixes);
    }
    
    // Step 4: Generate caption variations
    const captionsResponse = await axios.post(
      'http://localhost:3000/api/openai/generate-caption-variations',
      {
        cryptoTopic: cryptoTopic,
        baseScript: script
      }
    );
    
    const allCaptions = [captionsResponse.data.base, ...captionsResponse.data.variations];
    
    res.json({
      success: true,
      strategy: useStrategy,
      cryptoTopic: cryptoTopic.name,
      script: script,
      videos: videos,
      captions: allCaptions,
      hashtags: captionsResponse.data.hashtags,
      count: videos.length,
      note: 'Videos are being generated. Poll status for each videoId to check completion.'
    });

  } catch (error) {
    console.error('Error generating full campaign:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get video generation cost statistics
app.get('/api/stats/video-costs', (req, res) => {
  const hoursElapsed = (new Date() - new Date(videoUsageStats.last_reset)) / (1000 * 60 * 60);
  
  const uniqueVideoCost = 0.10;
  const remixCost = 0.05;
  
  const totalCost = (videoUsageStats.unique_videos * uniqueVideoCost) + 
                    (videoUsageStats.remix_videos * remixCost);
  
  const dailyProjection = hoursElapsed > 0 ? (totalCost / hoursElapsed) * 24 : 0;
  
  res.json({
    success: true,
    stats: videoUsageStats,
    costs: {
      unique_video_cost: uniqueVideoCost,
      remix_cost: remixCost,
      total_cost: totalCost.toFixed(2),
      daily_projection: dailyProjection.toFixed(2),
      currency: 'USD'
    },
    time_period: {
      since: videoUsageStats.last_reset,
      hours_elapsed: hoursElapsed.toFixed(1)
    },
    current_strategy: config.videoStrategy,
    note: 'Costs are estimates. Check OpenAI dashboard for actual usage.'
  });
});

// Reset video usage stats
app.post('/api/stats/reset-video-costs', (req, res) => {
  videoUsageStats = {
    unique_videos: 0,
    remix_videos: 0,
    total_videos: 0,
    last_reset: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Video usage statistics reset',
    stats: videoUsageStats
  });
});

// Generate random delay (for mimicking human behavior)
app.get('/api/utils/random-delay', (req, res) => {
  const min = parseInt(req.query.min) || 5;
  const max = parseInt(req.query.max) || 10;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  
  res.json({
    success: true,
    delay: delay,
    milliseconds: delay * 1000
  });
});

// Get random crypto topic for warm-up searches
app.get('/api/utils/random-crypto-topic', (req, res) => {
  const topic = getRandomCryptoTopic();
  
  res.json({
    success: true,
    topic: topic
  });
});

// Webhook receiver for n8n callbacks
app.post('/webhook/:workflowId', (req, res) => {
  console.log(`Webhook received for workflow: ${req.params.workflowId}`);
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  
  res.json({
    success: true,
    received: true,
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// WARMUP AUTOMATION
// =============================================================================

/**
 * Execute warmup session for an account
 */
app.post('/api/warmup/execute', async (req, res) => {
  const { cloudPhoneId, platform, accountId } = req.body;

  try {
    console.log(`Starting warmup session for ${platform} account ${accountId}...`);

    // Initialize warmup service
    const warmupService = new WarmupService(
      config.moreloginApiUrl,
      config.moreloginApiId,
      config.moreloginSecretKey
    );

    // Power on device if not already running
    await axios.post(
      `${config.moreloginApiUrl}/vcpcloud/api/cloudPhone/powerOn`,
      { cloud_phone_id: cloudPhoneId },
      { headers: await generateMoreLoginHeaders() }
    );

    await new Promise(resolve => setTimeout(resolve, 10000));

    // Enable ADB
    const adbResponse = await axios.post(
      `${config.moreloginApiUrl}/vcpcloud/api/cloudPhoneAdb/enable`,
      { cloud_phone_id: cloudPhoneId },
      { headers: await generateMoreLoginHeaders() }
    );

    const adbInfo = adbResponse.data.data;

    // Connect ADB
    const adb = new ADBHelper(adbInfo.adb_ip, adbInfo.adb_port, adbInfo.adb_password);
    await adb.connect();

    // Execute warmup session
    const result = await warmupService.executeWarmupSession({
      cloudPhoneId,
      platform,
      accountId,
      adbHelper: adb
    });

    res.json({
      success: true,
      warmup: result,
      message: `Warmup session completed. Performed ${result.actionsPerformed} actions.`
    });

  } catch (error) {
    console.error('Warmup session error:', error);
    res.status(500).json({
      error: error.message || 'Failed to execute warmup session'
    });
  }
});

/**
 * Get warmup strategy for a platform
 */
app.get('/api/warmup/strategy/:platform', (req, res) => {
  const { platform } = req.params;

  try {
    const warmupService = new WarmupService();
    const strategy = warmupService.getWarmupStrategy(platform);

    res.json({
      success: true,
      platform,
      strategy
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get warmup strategy'
    });
  }
});

// =============================================================================
// VIDEO GENERATION - Sora 2 & Veo 3
// =============================================================================

/**
 * Generate video with AI (auto-select best generator)
 */
app.post('/api/video/generate', async (req, res) => {
  const { prompt, platform, style, preferredGenerator, openaiApiKey, googleApiKey } = req.body;

  try {
    const videoGen = new VideoGenerationService(openaiApiKey, googleApiKey);
    
    // Get optimal settings for platform
    const settings = videoGen.getOptimalSettings(platform || 'tiktok');
    
    // Enhance prompt
    const enhancedPrompt = videoGen.enhancePrompt(prompt, platform || 'tiktok', style || 'engaging');
    
    console.log(`Generating video for ${platform}: "${enhancedPrompt}"`);
    
    let result;
    if (preferredGenerator) {
      // Use specific generator with fallback
      result = await videoGen.generateWithFallback(enhancedPrompt, {
        ...settings,
        preferredGenerator
      });
    } else {
      // Auto-select best generator
      result = await videoGen.generateAuto(enhancedPrompt, settings);
    }

    res.json({
      success: true,
      video: result,
      enhancedPrompt,
      settings,
      message: `Video generated with ${result.generator}`
    });

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate video'
    });
  }
});

/**
 * Generate video with specific generator
 */
app.post('/api/video/generate/:generator', async (req, res) => {
  const { generator } = req.params; // sora-2 or veo-3
  const { prompt, platform, openaiApiKey, googleApiKey } = req.body;

  try {
    const videoGen = new VideoGenerationService(openaiApiKey, googleApiKey);
    const settings = videoGen.getOptimalSettings(platform || 'tiktok');
    const enhancedPrompt = videoGen.enhancePrompt(prompt, platform || 'tiktok');

    let result;
    if (generator === 'sora-2') {
      result = await videoGen.generateWithSora2(enhancedPrompt, settings);
    } else if (generator === 'veo-3') {
      result = await videoGen.generateWithVeo3(enhancedPrompt, settings);
    } else {
      return res.status(400).json({
        error: 'Invalid generator. Use sora-2 or veo-3'
      });
    }

    res.json({
      success: true,
      video: result,
      message: `Video generated with ${generator}`
    });

  } catch (error) {
    console.error(`${generator} generation error:`, error);
    res.status(500).json({
      error: error.message || `Failed to generate video with ${generator}`
    });
  }
});

/**
 * Check video generation status
 */
app.get('/api/video/status/:generator/:videoId', async (req, res) => {
  const { generator, videoId } = req.params;
  const { openaiApiKey, googleApiKey } = req.query;

  try {
    const videoGen = new VideoGenerationService(openaiApiKey, googleApiKey);
    const status = await videoGen.checkStatus(generator, videoId);

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to check video status'
    });
  }
});

// =============================================================================
// UPLOAD-POST INTEGRATION - Multi-Platform Posting
// =============================================================================

/**
 * Post content to multiple platforms simultaneously
 * Supports: TikTok, Instagram, YouTube, Facebook, LinkedIn, Twitter
 */
app.post('/api/content/post-multi-platform', async (req, res) => {
  const {
    videoUrl,
    platforms = ['tiktok'],
    captions = {},
    profileKeys = [],
    uploadPostApiKey
  } = req.body;

  try {
    if (!uploadPostApiKey) {
      return res.status(400).json({
        error: 'Upload-post API key is required'
      });
    }

    if (!videoUrl) {
      return res.status(400).json({
        error: 'Video URL is required'
      });
    }

    const uploadPost = new UploadPostService(uploadPostApiKey);

    // Upload to all selected platforms
    const result = await uploadPost.uploadToMultiplePlatforms(videoUrl, {
      platforms,
      captions,
      profileKeys
    });

    res.json({
      success: true,
      uploadId: result.uploadId,
      status: result.status,
      postIds: result.postIds,
      platforms: result.platforms,
      message: result.message
    });

  } catch (error) {
    console.error('Multi-platform post error:', error);
    res.status(500).json({
      error: error.message || 'Failed to post to platforms'
    });
  }
});

/**
 * Check status of Upload-post upload
 */
app.get('/api/upload-post/status/:uploadId', async (req, res) => {
  const { uploadId } = req.params;
  const { uploadPostApiKey } = req.query;

  try {
    if (!uploadPostApiKey) {
      return res.status(400).json({
        error: 'Upload-post API key is required'
      });
    }

    const uploadPost = new UploadPostService(uploadPostApiKey);
    const status = await uploadPost.checkStatus(uploadId);

    res.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: error.message || 'Failed to check upload status'
    });
  }
});

/**
 * Get OAuth URL for connecting social account
 */
app.post('/api/upload-post/connect-account', async (req, res) => {
  const { platform, uploadPostApiKey } = req.body;

  try {
    if (!uploadPostApiKey) {
      return res.status(400).json({
        error: 'Upload-post API key is required'
      });
    }

    if (!platform) {
      return res.status(400).json({
        error: 'Platform is required'
      });
    }

    const uploadPost = new UploadPostService(uploadPostApiKey);
    const oauthData = await uploadPost.getOAuthUrl(platform);

    res.json({
      success: true,
      authUrl: oauthData.authUrl,
      profileKey: oauthData.profileKey,
      expiresAt: oauthData.expiresAt,
      message: `Connect your ${platform} account using the provided URL`
    });

  } catch (error) {
    console.error('OAuth URL error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate OAuth URL'
    });
  }
});

/**
 * Complete OAuth callback
 */
app.post('/api/upload-post/callback', async (req, res) => {
  const { code, state, uploadPostApiKey } = req.body;

  try {
    if (!uploadPostApiKey) {
      return res.status(400).json({
        error: 'Upload-post API key is required'
      });
    }

    const uploadPost = new UploadPostService(uploadPostApiKey);
    const profile = await uploadPost.completeOAuth(code, state);

    res.json({
      success: true,
      profile: profile,
      message: `Successfully connected ${profile.platform} account: @${profile.username}`
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: error.message || 'Failed to complete OAuth flow'
    });
  }
});

/**
 * Get connected Upload-post profiles
 */
app.get('/api/upload-post/profiles', async (req, res) => {
  const { uploadPostApiKey } = req.query;

  try {
    if (!uploadPostApiKey) {
      return res.status(400).json({
        error: 'Upload-post API key is required'
      });
    }

    const uploadPost = new UploadPostService(uploadPostApiKey);
    const profiles = await uploadPost.getProfiles();

    res.json({
      success: true,
      profiles: profiles,
      count: profiles.length
    });

  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch profiles'
    });
  }
});

/**
 * Disconnect Upload-post profile
 */
app.delete('/api/upload-post/profiles/:profileKey', async (req, res) => {
  const { profileKey } = req.params;
  const { uploadPostApiKey } = req.body;

  try {
    if (!uploadPostApiKey) {
      return res.status(400).json({
        error: 'Upload-post API key is required'
      });
    }

    const uploadPost = new UploadPostService(uploadPostApiKey);
    const result = await uploadPost.disconnectProfile(profileKey);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Disconnect profile error:', error);
    res.status(500).json({
      error: error.message || 'Failed to disconnect profile'
    });
  }
});

/**
 * Get post analytics
 */
app.get('/api/upload-post/analytics/:postId', async (req, res) => {
  const { postId } = req.params;
  const { uploadPostApiKey } = req.query;

  try {
    if (!uploadPostApiKey) {
      return res.status(400).json({
        error: 'Upload-post API key is required'
      });
    }

    const uploadPost = new UploadPostService(uploadPostApiKey);
    const analytics = await uploadPost.getPostAnalytics(postId);

    if (!analytics) {
      return res.status(404).json({
        error: 'Analytics not available for this post'
      });
    }

    res.json({
      success: true,
      ...analytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch analytics'
    });
  }
});

// =============================================================================
// OPERATOR SETTINGS - Admin-only API Keys Management
// =============================================================================

/**
 * Get all operator settings (admin only)
 */
app.get('/api/operator-settings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Fetch all operator settings (RLS will enforce admin-only access)
    const { data, error } = await supabase
      .from('operator_settings')
      .select('id, service, status, last_verified, created_at, updated_at')
      .order('service');

    if (error) throw error;

    res.json({
      success: true,
      settings: data || []
    });

  } catch (error) {
    console.error('Get operator settings error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch operator settings'
    });
  }
});

/**
 * Add or update operator setting (admin only)
 */
app.post('/api/operator-settings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { service, apiKey, apiSecret } = req.body;

    if (!service || !apiKey) {
      return res.status(400).json({ error: 'Service and API key are required' });
    }

    // Encrypt the keys
    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = apiSecret ? encrypt(apiSecret) : null;

    // Upsert operator setting
    const { data, error } = await supabase
      .from('operator_settings')
      .upsert({
        service,
        api_key_encrypted: encryptedKey,
        api_secret_encrypted: encryptedSecret,
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'service'
      })
      .select()
      .single();

    if (error) throw error;

    // Clear cache for this service
    apiKeyCache.delete(`${service}:api_key_encrypted`);
    apiKeyCache.delete(`${service}:api_secret_encrypted`);

    res.json({
      success: true,
      setting: {
        id: data.id,
        service: data.service,
        status: data.status,
        updated_at: data.updated_at
      }
    });

  } catch (error) {
    console.error('Save operator setting error:', error);
    res.status(500).json({
      error: error.message || 'Failed to save operator setting'
    });
  }
});

/**
 * Delete operator setting (admin only)
 */
app.delete('/api/operator-settings/:service', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { service } = req.params;

    const { error } = await supabase
      .from('operator_settings')
      .delete()
      .eq('service', service);

    if (error) throw error;

    // Clear cache for this service
    apiKeyCache.delete(`${service}:api_key_encrypted`);
    apiKeyCache.delete(`${service}:api_secret_encrypted`);

    res.json({
      success: true,
      message: `Operator setting for ${service} deleted`
    });

  } catch (error) {
    console.error('Delete operator setting error:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete operator setting'
    });
  }
});

// =============================================================================
// UPLOAD-POST ENDPOINTS
// =============================================================================

/**
 * Create Upload-Post user profile
 * Creates a profile in Upload-Post system for a user
 */
app.post('/api/upload-post/create-profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get Upload-Post API key
    const uploadPostKey = await getOperatorApiKey('uploadpost', 'api_key_encrypted');
    if (!uploadPostKey) {
      return res.status(503).json({ error: 'Upload-Post API key not configured' });
    }

    const uploadPostService = new UploadPostService(uploadPostKey);

    // Use Supabase user ID as username for Upload-Post
    const username = user.id;
    
    const profile = await uploadPostService.createUserProfile(username);

    // Update user's profile in Supabase
    await supabase
      .from('profiles')
      .update({
        upload_post_username: username,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    res.json({
      success: true,
      profile,
      username
    });

  } catch (error) {
    console.error('Create Upload-Post profile error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create Upload-Post profile'
    });
  }
});

/**
 * Generate JWT URL for connecting social accounts
 * Returns a secure URL for users to connect their social media accounts
 */
app.post('/api/upload-post/generate-jwt-url', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get Upload-Post API key
    const uploadPostKey = await getOperatorApiKey('uploadpost', 'api_key_encrypted');
    if (!uploadPostKey) {
      return res.status(503).json({ error: 'Upload-Post API key not configured' });
    }

    const uploadPostService = new UploadPostService(uploadPostKey);
    const username = user.id;

    // Generate JWT URL with optional redirect
    const { redirect_url, platforms } = req.body;
    
    const result = await uploadPostService.generateJwtUrl(username, {
      redirect_url: redirect_url || `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/accounts`,
      platforms: platforms || ['tiktok', 'instagram', 'youtube', 'facebook', 'linkedin', 'twitter']
    });

    res.json({
      success: true,
      access_url: result.access_url
    });

  } catch (error) {
    console.error('Generate JWT URL error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate JWT URL'
    });
  }
});

/**
 * Get connected social accounts
 * Fetches the user's connected platforms from Upload-Post
 */
app.get('/api/upload-post/connected-accounts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get Upload-Post API key
    const uploadPostKey = await getOperatorApiKey('uploadpost', 'api_key_encrypted');
    if (!uploadPostKey) {
      return res.status(503).json({ error: 'Upload-Post API key not configured' });
    }

    const uploadPostService = new UploadPostService(uploadPostKey);
    const username = user.id;

    const connectedPlatforms = await uploadPostService.getConnectedPlatforms(username);

    res.json({
      success: true,
      platforms: connectedPlatforms
    });

  } catch (error) {
    console.error('Get connected accounts error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch connected accounts'
    });
  }
});

/**
 * Upload video to social platforms
 * Posts a video to selected social media platforms via Upload-Post
 */
app.post('/api/upload-post/upload-video', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get Upload-Post API key
    const uploadPostKey = await getOperatorApiKey('uploadpost', 'api_key_encrypted');
    if (!uploadPostKey) {
      return res.status(503).json({ error: 'Upload-Post API key not configured' });
    }

    const { video_url, title, description, platforms } = req.body;

    if (!video_url || !title || !platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: video_url, title, platforms' });
    }

    const uploadPostService = new UploadPostService(uploadPostKey);
    const username = user.id;

    // Download video from URL
    const videoResponse = await axios.get(video_url, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResponse.data);

    // Upload to social platforms
    const result = await uploadPostService.uploadVideo({
      username,
      video: videoBuffer,
      title,
      platforms,
      description: description || ''
    });

    // Update content_posts table
    await supabase
      .from('content_posts')
      .update({
        upload_post_status: result,
        status: 'posted',
        posted_at: new Date().toISOString()
      })
      .eq('video_url', video_url)
      .eq('user_id', user.id);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      error: error.message || 'Failed to upload video'
    });
  }
});

/**
 * Upload photo to social platforms
 * Posts a photo to selected social media platforms via Upload-Post
 */
app.post('/api/upload-post/upload-photo', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get Upload-Post API key
    const uploadPostKey = await getOperatorApiKey('uploadpost', 'api_key_encrypted');
    if (!uploadPostKey) {
      return res.status(503).json({ error: 'Upload-Post API key not configured' });
    }

    const { photo_url, title, description, platforms } = req.body;

    if (!photo_url || !title || !platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: photo_url, title, platforms' });
    }

    const uploadPostService = new UploadPostService(uploadPostKey);
    const username = user.id;

    // Download photo from URL
    const photoResponse = await axios.get(photo_url, { responseType: 'arraybuffer' });
    const photoBuffer = Buffer.from(photoResponse.data);

    // Upload to social platforms
    const result = await uploadPostService.uploadPhoto({
      username,
      photo: photoBuffer,
      title,
      platforms,
      description: description || ''
    });

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      error: error.message || 'Failed to upload photo'
    });
  }
});

// =============================================================================
// CAMPAIGNS - Video Generation & Posting Automation
// =============================================================================

/**
 * Create new campaign
 */
app.post('/api/campaigns/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const {
      name,
      topicSource,
      topic,
      videoCount,
      targetAccounts,
      targetPlatforms,
      requireApproval,
      autoPostOnApproval
    } = req.body;

    // Validation
    if (!topic && topicSource !== 'auto') {
      return res.status(400).json({ error: 'Topic is required for manual campaigns' });
    }

    if (!videoCount || videoCount < 1 || videoCount > 10) {
      return res.status(400).json({ error: 'Video count must be between 1 and 10' });
    }

    if (!targetAccounts || targetAccounts.length === 0) {
      return res.status(400).json({ error: 'At least one target account is required' });
    }

    // Create campaign in database
    const { data: campaign, error: createError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: name || `${topic || 'Auto'} Campaign`,
        topic_source: topicSource || 'manual',
        topic: topic || 'TBD',
        video_count: videoCount,
        target_accounts: targetAccounts,
        target_platforms: targetPlatforms || ['tiktok'],
        require_approval: requireApproval || false,
        auto_post_on_approval: autoPostOnApproval !== false,
        status: 'creating',
        progress: 0
      })
      .select()
      .single();

    if (createError) {
      console.error('Campaign creation error:', createError);
      return res.status(500).json({ error: 'Failed to create campaign' });
    }

    // Start campaign execution asynchronously
    const campaignService = new CampaignExecutionService(supabase, config);
    campaignService.executeCampaign(campaign.id).catch(err => {
      console.error(`Campaign ${campaign.id} execution failed:`, err);
    });

    res.json({
      success: true,
      campaignId: campaign.id,
      status: 'creating'
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create campaign'
    });
  }
});

/**
 * Get campaign status
 */
app.get('/api/campaigns/:campaignId/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { campaignId } = req.params;

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (error || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      progress: campaign.progress,
      currentStep: campaign.current_step,
      videosStatus: campaign.videos_status || [],
      postingStatus: campaign.posting_status || [],
      script: campaign.script,
      captions: campaign.captions,
      videoCount: campaign.video_count,
      requireApproval: campaign.require_approval,
      approvedVideoCount: campaign.approved_video_count,
      rejectedVideoCount: campaign.rejected_video_count,
      totalPosted: campaign.total_posted,
      totalFailed: campaign.total_failed,
      errorMessage: campaign.error_message,
      createdAt: campaign.created_at,
      completedAt: campaign.completed_at
    });

  } catch (error) {
    console.error('Get campaign status error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get campaign status'
    });
  }
});

/**
 * List user campaigns
 */
app.get('/api/campaigns', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { status, limit = 20 } = req.query;

    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data: campaigns, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }

    res.json({
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        topic: c.topic,
        status: c.status,
        progress: c.progress,
        videoCount: c.video_count,
        requireApproval: c.require_approval,
        totalPosted: c.total_posted,
        totalFailed: c.total_failed,
        createdAt: c.created_at,
        completedAt: c.completed_at
      }))
    });

  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({
      error: error.message || 'Failed to list campaigns'
    });
  }
});

/**
 * Cancel campaign
 */
app.post('/api/campaigns/:campaignId/cancel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { campaignId } = req.params;

    const { error } = await supabase
      .from('campaigns')
      .update({
        status: 'cancelled',
        current_step: 'Cancelled by user'
      })
      .eq('id', campaignId)
      .eq('user_id', user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to cancel campaign' });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Cancel campaign error:', error);
    res.status(500).json({
      error: error.message || 'Failed to cancel campaign'
    });
  }
});

/**
 * Approve videos in campaign
 */
app.post('/api/campaigns/:campaignId/approve', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { campaignId } = req.params;
    const { approvedIndices } = req.body;

    if (!approvedIndices || !Array.isArray(approvedIndices)) {
      return res.status(400).json({ error: 'approvedIndices array is required' });
    }

    // Verify ownership
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Execute approval
    const campaignService = new CampaignExecutionService(supabase, config);
    await campaignService.approveVideos(campaignId, approvedIndices);

    res.json({ success: true });

  } catch (error) {
    console.error('Approve videos error:', error);
    res.status(500).json({
      error: error.message || 'Failed to approve videos'
    });
  }
});

// =============================================================================
// PHASE 1: POSTING QUEUE & ACCOUNT HEALTH
// =============================================================================

/**
 * Bulk add posts to queue (mass posting)
 */
app.post('/api/queue/bulk-post', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { posts } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'posts array is required' });
    }

    const queueService = new PostingQueueService(supabase);
    const result = await queueService.bulkAddToQueue(user.id, posts);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Bulk post error:', error);
    res.status(500).json({
      error: error.message || 'Failed to queue posts'
    });
  }
});

/**
 * Add single post to queue
 */
app.post('/api/queue/add', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { accountId, contentData, options } = req.body;

    if (!accountId || !contentData) {
      return res.status(400).json({ error: 'accountId and contentData are required' });
    }

    const queueService = new PostingQueueService(supabase);
    const result = await queueService.addToQueue(user.id, accountId, contentData, options);

    res.json({
      success: true,
      queueItem: result
    });

  } catch (error) {
    console.error('Add to queue error:', error);
    res.status(500).json({
      error: error.message || 'Failed to queue post'
    });
  }
});

/**
 * Get queue status
 */
app.get('/api/queue/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const queueService = new PostingQueueService(supabase);
    const stats = await queueService.getQueueStatus(user.id);

    res.json(stats);

  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get queue status'
    });
  }
});

/**
 * Cancel queued posts
 */
app.post('/api/queue/cancel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { filters } = req.body;

    const queueService = new PostingQueueService(supabase);
    const result = await queueService.cancelQueuedPosts(user.id, filters || {});

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Cancel queue error:', error);
    res.status(500).json({
      error: error.message || 'Failed to cancel posts'
    });
  }
});

/**
 * Process queue (trigger manually or via cron)
 */
app.post('/api/queue/process', async (req, res) => {
  try {
    const queueService = new PostingQueueService(supabase);
    await queueService.processQueue();

    res.json({
      success: true,
      message: 'Queue processing initiated'
    });

  } catch (error) {
    console.error('Process queue error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process queue'
    });
  }
});

/**
 * Check all accounts health
 */
app.post('/api/accounts/health/check-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const healthService = new AccountHealthMonitorService(supabase);
    
    // Get user's accounts
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id);

    const results = [];
    for (const account of accounts) {
      const health = await healthService.checkAccountHealth(account.id);
      results.push(health);
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Check all accounts health error:', error);
    res.status(500).json({
      error: error.message || 'Failed to check account health'
    });
  }
});

/**
 * Get account health overview
 */
app.get('/api/accounts/health', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const healthService = new AccountHealthMonitorService(supabase);
    const summary = await healthService.getHealthSummary(user.id);

    res.json(summary);

  } catch (error) {
    console.error('Get health overview error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get health overview'
    });
  }
});

/**
 * Get health for specific account
 */
app.get('/api/accounts/health/:accountId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { accountId } = req.params;
    const healthService = new AccountHealthMonitorService(supabase);
    const health = await healthService.getAccountHealth(accountId, user.id);

    res.json(health);

  } catch (error) {
    console.error('Get account health error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get account health'
    });
  }
});

/**
 * Pause all at-risk accounts
 */
app.post('/api/accounts/pause-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const healthService = new AccountHealthMonitorService(supabase);
    const result = await healthService.pauseAtRiskAccounts(user.id);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Pause at-risk accounts error:', error);
    res.status(500).json({
      error: error.message || 'Failed to pause accounts'
    });
  }
});

/**
 * Resume specific account
 */
app.post('/api/accounts/:accountId/resume', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { accountId } = req.params;

    // Verify ownership
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const healthService = new AccountHealthMonitorService(supabase);
    const result = await healthService.resumeAccount(accountId);

    res.json(result);

  } catch (error) {
    console.error('Resume account error:', error);
    res.status(500).json({
      error: error.message || 'Failed to resume account'
    });
  }
});

// =============================================================================
// PHASE 2: X/TWITTER AUTOMATION
// =============================================================================

/**
 * Scrape tweets from influencer
 */
app.post('/api/twitter/scrape', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { username, count, minEngagement } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Use TwitterScraperV2 with MoreLogin browser profile integration
    const TwitterScraperV2 = (await import('./services/twitter-scraper-v2.js')).default;
    const scraperService = new TwitterScraperV2(supabase);
    const result = await scraperService.scrapeViralTweets(user.id, [username], minEngagement || 10000);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Twitter scrape error:', error);
    res.status(500).json({
      error: error.message || 'Failed to scrape tweets'
    });
  }
});

/**
 * Generate bulk tweet rewrites (500 variations)
 */
app.post('/api/twitter/rewrite-bulk', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { count } = req.body;

    // Get OpenAI API key
    const openaiKey = await getOperatorApiKey('openai', 'api_key_encrypted');
    
    if (!openaiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured. Add it in Settings.' });
    }
    
    // Use ViralTweetGenerator instead of TwitterRewriterService
    const ViralTweetGenerator = (await import('./services/viral-tweet-generator.js')).default;
    const generator = new ViralTweetGenerator(supabase, openaiKey);
    const result = await generator.generateViralTweets(user.id, 'AI side hustles to make money', count || 500);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Tweet rewrite error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate tweet variations'
    });
  }
});

/**
 * Get available tweet rewrites
 */
app.get('/api/twitter/rewrites', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { limit, minQuality, style } = req.query;

    // Get unused tweets from twitter_rewrites table (generated by viral-tweet-generator)
    const { data: rewrites, error } = await supabase
      .from('twitter_rewrites')
      .select('*')
      .eq('user_id', user.id)
      .eq('used', false)
      .order('quality_score', { ascending: false })
      .limit(parseInt(limit) || 100);

    if (error) throw error;
    
    // Filter by minQuality if provided
    const filteredRewrites = minQuality 
      ? rewrites.filter(r => (r.quality_score || 0) >= parseFloat(minQuality))
      : rewrites;

    res.json({
      rewrites,
      total: rewrites.length
    });

  } catch (error) {
    console.error('Get rewrites error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get rewrites'
    });
  }
});

/**
 * Schedule mass tweets to all accounts
 */
app.post('/api/twitter/schedule-mass', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { accountIds, tweetsPerAccount, startDate, endDate, useOptimalTimes, randomizeOrder } = req.body;

    if (!accountIds || accountIds.length === 0) {
      return res.status(400).json({ error: 'At least one account ID is required' });
    }

    const schedulerService = new TwitterSchedulerService(supabase);
    const result = await schedulerService.scheduleMassTweets(user.id, {
      accountIds,
      tweetsPerAccount: tweetsPerAccount || 10,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      useOptimalTimes: useOptimalTimes !== false,
      randomizeOrder: randomizeOrder !== false
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Schedule mass tweets error:', error);
    res.status(500).json({
      error: error.message || 'Failed to schedule tweets'
    });
  }
});

/**
 * Create lead trigger
 */
app.post('/api/lead-triggers/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const triggerData = req.body;

    const leadCaptureService = new LeadCaptureService(supabase);
    const trigger = await leadCaptureService.createTrigger(user.id, triggerData);

    res.json({
      success: true,
      trigger
    });

  } catch (error) {
    console.error('Create trigger error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create trigger'
    });
  }
});

// =============================================================================
// TWITTER EMPIRE V2 - Money-Making Automation
// =============================================================================

/**
 * Scrape viral tweets from influencers
 */
app.post('/api/twitter/scrape-tweets', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { usernames, minEngagement } = req.body;

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ error: 'Usernames array is required' });
    }

    // Lazy load service
    const TwitterScraperV2 = (await import('./services/twitter-scraper-v2.js')).default;
    const scraperService = new TwitterScraperV2(supabase);
    
    const result = await scraperService.scrapeViralTweets(
      user.id,
      usernames,
      minEngagement || 50000
    );

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Twitter scrape error:', error);
    res.status(500).json({
      error: error.message || 'Failed to scrape tweets'
    });
  }
});

/**
 * Generate viral tweets from niche (NEW - AI-first generation)
 */
app.post('/api/twitter/generate-viral', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { niche, count, style, targetAudience } = req.body;

    if (!niche) {
      return res.status(400).json({ error: 'Niche is required' });
    }

    // Get OpenAI API key
    const openaiKey = await getOperatorApiKey('openai', 'api_key_encrypted');
    
    if (!openaiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured. Add it in Settings.' });
    }

    // Use ViralTweetGenerator
    const ViralTweetGenerator = (await import('./services/viral-tweet-generator.js')).default;
    const generator = new ViralTweetGenerator(supabase, openaiKey);
    
    const result = await generator.generateViralTweets(
      user.id,
      niche.trim(),
      parseInt(count) || 50,
      {
        style: style || 'educational',
        targetAudience: targetAudience || 'General audience'
      }
    );

    res.json({
      success: true,
      generated: result.generated,
      tweets: result.tweets
    });

  } catch (error) {
    console.error('Generate viral tweets error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate viral tweets'
    });
  }
});

/**
 * Generate AI tweet variations (500 variations)
 */
app.post('/api/twitter/generate-variations', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { count } = req.body;

    const openaiKey = await getOperatorApiKey('openai', 'api_key_encrypted');
    if (!openaiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Lazy load service
    const TwitterRewriterV2 = (await import('./services/twitter-rewriter-v2.js')).default;
    const rewriterService = new TwitterRewriterV2(supabase, openaiKey);
    
    const result = await rewriterService.generateVariations(user.id, count || 500);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Generate variations error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate variations'
    });
  }
});

/**
 * Get Twitter stats (posts, leads, sales)
 */
app.get('/api/twitter/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get stats from various tables with graceful fallback
    const [scraped, rewrites, posts, leads, sales] = await Promise.all([
      safeDbQuery(async () => {
        const { data } = await supabase
          .from('twitter_scraped_tweets')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
        return data?.length || 0;
      }, 0),
      safeDbQuery(async () => {
        const { data } = await supabase
          .from('twitter_rewrites')
          .select('used')
          .eq('user_id', user.id);
        return {
          total: data?.length || 0,
          used: data?.filter(r => r.used).length || 0,
          unused: data?.filter(r => !r.used).length || 0
        };
      }, { total: 0, used: 0, unused: 0 }),
      safeDbQuery(async () => {
        const { data } = await supabase
          .from('content_posts')
          .select('views_count, likes_count')
          .eq('user_id', user.id)
          .eq('platform', 'twitter');
        return {
          count: data?.length || 0,
          impressions: data?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0
        };
      }, { count: 0, impressions: 0 }),
      safeDbQuery(async () => {
        const { data } = await supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('platform', 'twitter');
        return data?.length || 0;
      }, 0),
      safeDbQuery(async () => {
        const { data } = await supabase
          .from('product_sales')
          .select('amount')
          .eq('user_id', user.id);
        return {
          count: data?.length || 0,
          revenue: data?.reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0
        };
      }, { count: 0, revenue: 0 })
    ]);

    res.json({
      scrapedTweets: scraped,
      generatedVariations: rewrites.total,
      unusedVariations: rewrites.unused,
      posts: posts.count,
      impressions: posts.impressions,
      leads: leads,
      sales: sales.count,
      revenue: sales.revenue
    });

  } catch (error) {
    console.error('Get Twitter stats error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get stats'
    });
  }
});

/**
 * Start auto-posting for Twitter account
 */
app.post('/api/twitter/start-posting', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { accountId, postsPerDay } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Lazy load service
    const TwitterPosterV2 = (await import('./services/twitter-poster-v2.js')).default;
    const posterService = new TwitterPosterV2(supabase);
    
    const result = await posterService.scheduleAutoPosts(
      user.id,
      accountId,
      postsPerDay || 10
    );

    res.json({
      success: true,
      ...result,
      status: 'posting'
    });

  } catch (error) {
    console.error('Start posting error:', error);
    res.status(500).json({
      error: error.message || 'Failed to start posting'
    });
  }
});

/**
 * Get active triggers
 */
app.get('/api/lead-triggers', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { platform } = req.query;

    const leadCaptureService = new LeadCaptureService(supabase);
    const triggers = await leadCaptureService.getActiveTriggers(user.id, platform);

    res.json({
      triggers,
      total: triggers.length
    });

  } catch (error) {
    console.error('Get triggers error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get triggers'
    });
  }
});

/**
 * Capture lead manually
 */
app.post('/api/leads/capture', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const leadData = req.body;

    const leadCaptureService = new LeadCaptureService(supabase);
    const { lead, alreadyExists } = await leadCaptureService.captureLead(user.id, leadData);

    res.json({
      success: true,
      lead,
      alreadyExists
    });

  } catch (error) {
    console.error('Capture lead error:', error);
    res.status(500).json({
      error: error.message || 'Failed to capture lead'
    });
  }
});

/**
 * Get leads with filters
 */
app.get('/api/leads', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { stage, platform, converted, limit } = req.query;

    const leadCaptureService = new LeadCaptureService(supabase);
    const leads = await leadCaptureService.getLeads(user.id, {
      stage,
      platform,
      converted: converted !== undefined ? converted === 'true' : undefined,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({
      leads,
      total: leads.length
    });

  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get leads'
    });
  }
});

/**
 * Get lead statistics
 */
app.get('/api/leads/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { timeframe } = req.query;

    const leadCaptureService = new LeadCaptureService(supabase);
    const stats = await leadCaptureService.getLeadStats(user.id, timeframe || 'all');

    res.json(stats);

  } catch (error) {
    console.error('Get lead stats error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get lead statistics'
    });
  }
});

/**
 * Send auto-DM
 */
app.post('/api/twitter/dm-send', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { leadId, accountId, message } = req.body;

    if (!leadId || !accountId || !message) {
      return res.status(400).json({ error: 'leadId, accountId, and message are required' });
    }

    const dmService = new TwitterDMAutomationService(supabase);
    const result = await dmService.sendAutomatic(leadId, accountId, message);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Send DM error:', error);
    res.status(500).json({
      error: error.message || 'Failed to send DM'
    });
  }
});

/**
 * Create carousel
 */
app.post('/api/twitter/carousel/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const options = req.body;

    const openaiKey = await getOperatorApiKey('openai', 'api_key_encrypted');
    const carouselService = new CarouselCreatorService(supabase, openaiKey);
    
    const result = await carouselService.createCarousel(user.id, options);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Create carousel error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create carousel'
    });
  }
});

/**
 * Get carousels
 */
app.get('/api/twitter/carousels', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { limit } = req.query;

    const openaiKey = await getOperatorApiKey('openai', 'api_key_encrypted');
    const carouselService = new CarouselCreatorService(supabase, openaiKey);
    
    const carousels = await carouselService.getCarousels(user.id, limit ? parseInt(limit) : 50);

    res.json({
      carousels,
      total: carousels.length
    });

  } catch (error) {
    console.error('Get carousels error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get carousels'
    });
  }
});

// =============================================================================
// PHASE 3: CONTENT REPURPOSING
// =============================================================================

/**
 * Split YouTube video into Shorts
 */
app.post('/api/repurpose/youtube-split', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { youtubeUrl, options } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({ error: 'youtubeUrl is required' });
    }

    const splitterService = new YouTubeSplitterService(supabase);
    const result = await splitterService.splitVideo(user.id, youtubeUrl, options || {});

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('YouTube split error:', error);
    res.status(500).json({
      error: error.message || 'Failed to split video'
    });
  }
});

/**
 * Create slideshow from images
 */
app.post('/api/repurpose/slideshow-create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { images, options } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'images array is required' });
    }

    const slideshowService = new SlideshowMakerService(supabase);
    const result = await slideshowService.createSlideshow(user.id, images, options || {});

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Slideshow creation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create slideshow'
    });
  }
});

/**
 * Get repurposing jobs
 */
app.get('/api/repurpose/jobs', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { status, sourceType, limit } = req.query;

    const splitterService = new YouTubeSplitterService(supabase);
    const jobs = await splitterService.getJobs(user.id, {
      status,
      sourceType,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({
      jobs,
      total: jobs.length
    });

  } catch (error) {
    console.error('Get repurposing jobs error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get jobs'
    });
  }
});

// =============================================================================
// PHASE 4: REDDIT AUTOMATION
// =============================================================================

/**
 * Search for Reddit threads
 */
app.post('/api/reddit/search-threads', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { searchQuery, options } = req.body;

    if (!searchQuery) {
      return res.status(400).json({ error: 'searchQuery is required' });
    }

    const googleApiKey = await getOperatorApiKey('google', 'api_key_encrypted');
    const googleSearchEngineId = await getOperatorApiKey('google', 'api_secret_encrypted');
    
    const threadFinder = new RedditThreadFinderService(supabase, {
      googleApiKey,
      googleSearchEngineId
    });

    const result = await threadFinder.searchThreads(user.id, searchQuery, options || {});

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Reddit thread search error:', error);
    res.status(500).json({
      error: error.message || 'Failed to search threads'
    });
  }
});

/**
 * Get discovered threads
 */
app.get('/api/reddit/threads', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { sentiment, minPriority, limit } = req.query;

    const threadFinder = new RedditThreadFinderService(supabase);
    const threads = await threadFinder.getTargetThreads(user.id, {
      sentiment,
      minPriority: minPriority ? parseInt(minPriority) : undefined,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({
      threads,
      total: threads.length
    });

  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get threads'
    });
  }
});

/**
 * Generate comment for thread
 */
app.post('/api/reddit/comment/generate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { threadId, options } = req.body;

    if (!threadId) {
      return res.status(400).json({ error: 'threadId is required' });
    }

    const openaiKey = await getOperatorApiKey('openai', 'api_key_encrypted');
    const commentGen = new RedditCommentGeneratorService(supabase, openaiKey);
    
    const result = await commentGen.generateComment(user.id, threadId, options || {});

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Comment generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate comment'
    });
  }
});

/**
 * Schedule upvote drip
 */
app.post('/api/reddit/upvote/schedule', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { commentId, options } = req.body;

    if (!commentId) {
      return res.status(400).json({ error: 'commentId is required' });
    }

    const upvoteService = new RedditUpvoteDripService(supabase);
    const result = await upvoteService.scheduleUpvoteDrip(commentId, options || {});

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Upvote schedule error:', error);
    res.status(500).json({
      error: error.message || 'Failed to schedule upvotes'
    });
  }
});

/**
 * Get Reddit accounts
 */
app.get('/api/reddit/accounts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: accounts, error: accountsError } = await supabase
      .from('reddit_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (accountsError) throw accountsError;

    res.json({
      accounts: accounts || [],
      total: (accounts || []).length
    });

  } catch (error) {
    console.error('Get Reddit accounts error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get Reddit accounts'
    });
  }
});

// =============================================================================
// PHASE 5: DIGITAL PRODUCTS
// =============================================================================

/**
 * Generate ebook
 */
app.post('/api/products/ebook/generate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const options = req.body;

    if (!options.topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const openaiKey = await getOperatorApiKey('openai', 'api_key_encrypted');
    const ebookService = new EbookGeneratorService(supabase, openaiKey);
    
    const result = await ebookService.generateEbook(user.id, options);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Ebook generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate ebook'
    });
  }
});

/**
 * Get products
 */
app.get('/api/products', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { type, limit } = req.query;

    const result = await safeDbQuery(
      async () => {
        let query = supabase
          .from('digital_products')
          .select('*')
          .eq('user_id', user.id);

        if (type) {
          query = query.eq('product_type', type);
        }

        query = query.order('created_at', { ascending: false });

        if (limit) {
          query = query.limit(parseInt(limit));
        }

        const { data: products, error: productsError } = await query;

        if (productsError) throw productsError;

        return {
          products: products || [],
          total: (products || []).length
        };
      },
      { products: [], total: 0 }
    );

    res.json(result);

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get products'
    });
  }
});

/**
 * Create product bundle
 */
app.post('/api/products/bundle', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const options = req.body;

    const bundlerService = new ProductBundlerService(supabase);
    const result = await bundlerService.createBundle(user.id, options);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Create bundle error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create bundle'
    });
  }
});

/**
 * Generate payment link
 */
app.post('/api/products/payment-link', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { productId, bundleId } = req.body;

    if (!productId && !bundleId) {
      return res.status(400).json({ error: 'Either productId or bundleId is required' });
    }

    const stripeKey = await getOperatorApiKey('stripe', 'api_secret_encrypted');
    const stripeManager = new StripeProductManagerService(supabase, stripeKey);
    
    const result = await stripeManager.createPaymentLink(user.id, productId, bundleId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Payment link creation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment link'
    });
  }
});

/**
 * Get sales analytics
 */
app.get('/api/products/sales', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { timeframe } = req.query;

    // Gracefully handle if product_sales table doesn't exist yet
    const stats = await safeDbQuery(
      async () => {
        const { data, error } = await supabase
          .from('product_sales')
          .select('amount, sale_date')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        const totalRevenue = data.reduce((sum, sale) => sum + parseFloat(sale.amount), 0);
        const salesCount = data.length;
        
        return {
          totalRevenue,
          salesCount,
          sales: data
        };
      },
      { totalRevenue: 0, salesCount: 0, sales: [] }
    );

    res.json(stats);

  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get sales statistics'
    });
  }
});

// =============================================================================
// PHASE 6: FUNNEL TRACKING & ANALYTICS
// =============================================================================

/**
 * Create funnel
 */
app.post('/api/funnels/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const funnelData = req.body;

    const funnelService = new FunnelTrackerService(supabase);
    const funnel = await funnelService.createFunnel(user.id, funnelData);

    res.json({
      success: true,
      funnel
    });

  } catch (error) {
    console.error('Create funnel error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create funnel'
    });
  }
});

/**
 * Get user's funnels
 */
app.get('/api/funnels', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const funnelService = new FunnelTrackerService(supabase);
    const funnels = await funnelService.getUserFunnels(user.id);

    res.json({
      funnels,
      total: funnels.length
    });

  } catch (error) {
    console.error('Get funnels error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get funnels'
    });
  }
});

/**
 * Track funnel event
 */
app.post('/api/funnels/track-event', async (req, res) => {
  try {
    const eventData = req.body;

    const funnelService = new FunnelTrackerService(supabase);
    const event = await funnelService.trackEvent(eventData);

    res.json({
      success: true,
      event
    });

  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({
      error: error.message || 'Failed to track event'
    });
  }
});

/**
 * Get funnel analytics
 */
app.get('/api/funnels/:id/analytics', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.params;

    const funnelService = new FunnelTrackerService(supabase);
    const analytics = await funnelService.getFunnelAnalytics(parseInt(id));

    res.json(analytics);

  } catch (error) {
    console.error('Get funnel analytics error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get analytics'
    });
  }
});

/**
 * Get post attribution
 */
app.get('/api/analytics/attribution', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { timeframe } = req.query;

    const funnelService = new FunnelTrackerService(supabase);
    const attribution = await funnelService.getPostAttribution(user.id, timeframe || '30days');

    res.json(attribution);

  } catch (error) {
    console.error('Get attribution error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get attribution'
    });
  }
});

/**
 * Get comprehensive analytics overview
 */
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { timeframe } = req.query;

    const analyticsService = new AnalyticsAggregatorService(supabase);
    const overview = await analyticsService.getOverview(user.id, timeframe || '30days');

    res.json(overview);

  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get analytics'
    });
  }
});

/**
 * Create bio link
 */
app.post('/api/bio-links/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const linkData = req.body;

    const bioLinkService = new BioLinkTrackerService(supabase);
    const result = await bioLinkService.createBioLink(user.id, linkData);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Create bio link error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create bio link'
    });
  }
});

/**
 * Track bio link click (public endpoint)
 */
app.get('/l/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    const bioLinkService = new BioLinkTrackerService(supabase);
    const result = await bioLinkService.trackClick(shortCode, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      referrer: req.get('referer')
    });

    // Redirect to destination
    res.redirect(result.destination);

  } catch (error) {
    console.error('Bio link redirect error:', error);
    res.status(404).send('Link not found');
  }
});

// =============================================================================
// WHOP INTEGRATION
// =============================================================================

/**
 * Create product on Whop
 * Reference: https://docs.whop.com/apps/api/plans
 */
app.post('/api/whop/product/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const whopKey = await getOperatorApiKey('whop', 'api_key_encrypted');
    const whopAppId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
    const whopCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

    if (!whopKey || !whopAppId || !whopCompanyId) {
      return res.status(400).json({ error: 'Whop configuration not complete' });
    }

    const whopService = new WhopIntegrationService(supabase, whopKey, whopAppId, whopCompanyId);
    const result = await whopService.createWhopProduct(user.id, productId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Whop product creation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create Whop product'
    });
  }
});

/**
 * Whop webhook handler
 * Reference: https://docs.whop.com/apps/webhooks
 */
app.post('/api/webhooks/whop', async (req, res) => {
  try {
    const signature = req.get('X-Whop-Signature');
    const whopSecret = await getOperatorApiKey('whop', 'api_secret_encrypted');
    const whopKey = await getOperatorApiKey('whop', 'api_key_encrypted');
    const whopAppId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
    const whopCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

    // Verify signature if secret is configured
    if (whopSecret && signature) {
      const whopService = new WhopIntegrationService(supabase, whopKey, whopAppId, whopCompanyId);
      const isValid = whopService.verifyWebhookSignature(req.body, signature, whopSecret);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const whopService = new WhopIntegrationService(supabase, whopKey, whopAppId, whopCompanyId);
    const result = await whopService.handlePurchaseWebhook(req.body);

    res.json({ success: true, ...result });

  } catch (error) {
    console.error('Whop webhook error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process webhook'
    });
  }
});

// =============================================================================
// TWITTER ADB AUTOMATION (MORELOGIN MOBILE)
// =============================================================================

/**
 * Post tweet via ADB on MoreLogin device
 */
app.post('/api/twitter/adb/post', async (req, res) => {
  try {
    const { cloudPhoneId, text, options } = req.body;

    if (!cloudPhoneId || !text) {
      return res.status(400).json({ error: 'cloudPhoneId and text are required' });
    }

    const twitterADB = new TwitterADBAutomationService(supabase, {
      apiUrl: config.moreloginApiUrl,
      apiId: config.moreloginApiId,
      secretKey: config.moreloginSecretKey
    });

    const result = await twitterADB.postTweet(cloudPhoneId, text, options || {});

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Twitter ADB post error:', error);
    res.status(500).json({
      error: error.message || 'Failed to post tweet via ADB'
    });
  }
});

/**
 * Send DM via ADB on MoreLogin device
 */
app.post('/api/twitter/adb/dm', async (req, res) => {
  try {
    const { cloudPhoneId, username, message, options } = req.body;

    if (!cloudPhoneId || !username || !message) {
      return res.status(400).json({ error: 'cloudPhoneId, username, and message are required' });
    }

    const twitterADB = new TwitterADBAutomationService(supabase, {
      apiUrl: config.moreloginApiUrl,
      apiId: config.moreloginApiId,
      secretKey: config.moreloginSecretKey
    });

    const result = await twitterADB.sendDM(cloudPhoneId, username, message, options || {});

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Twitter ADB DM error:', error);
    res.status(500).json({
      error: error.message || 'Failed to send DM via ADB'
    });
  }
});

// =============================================================================
// SIMPLE ROUTES
// =============================================================================

/**
 * Root route - redirect to frontend
 */
app.get('/', (req, res) => {
  res.redirect('http://localhost:3001');
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// =============================================================================
// WARMUP ENDPOINTS - Account warmup automation
// =============================================================================

/**
 * Start warmup for a social account
 */
app.post('/api/warmup/start', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { accountId, platform, daysTotal } = req.body;

    if (!accountId || !platform || !daysTotal) {
      return res.status(400).json({ error: 'accountId, platform, and daysTotal are required' });
    }

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if warmup already exists
    const { data: existingWarmup } = await supabase
      .from('warmup_sessions')
      .select('*')
      .eq('social_account_id', accountId)
      .eq('status', 'in_progress')
      .single();

    if (existingWarmup) {
      return res.status(400).json({ error: 'Warmup already in progress for this account' });
    }

    // Create warmup session record
    const { data: warmupSession, error: warmupError } = await supabase
      .from('warmup_sessions')
      .insert({
        social_account_id: accountId,
        platform: platform,
        day_number: 1,
        total_days: daysTotal,
        actions_completed: 0,
        status: 'in_progress',
        next_session_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
      })
      .select()
      .single();

    if (warmupError) {
      console.error('Warmup session creation error:', warmupError);
      return res.status(500).json({ error: 'Failed to create warmup session' });
    }

    // Start warmup using existing warmup service
    const WarmupService = (await import('./services/warmup.js')).default;
    const warmupService = new WarmupService(
      config.moreloginApiUrl,
      await getOperatorApiKey('morelogin', 'api_id'),
      await getOperatorApiKey('morelogin', 'api_secret_encrypted')
    );

    // Execute first warmup session async (don't block response)
    warmupService.executeWarmup({
      cloudPhoneId: account.cloud_phone_id,
      platform: platform,
      sessionNumber: 1
    }).catch(err => {
      console.error('Warmup execution error:', err);
    });

    res.json({
      success: true,
      warmupId: warmupSession.id,
      status: 'started',
      dayNumber: 1,
      totalDays: daysTotal,
      nextSession: warmupSession.next_session_at
    });

  } catch (error) {
    console.error('Start warmup error:', error);
    res.status(500).json({
      error: error.message || 'Failed to start warmup'
    });
  }
});

/**
 * Get warmup status for an account
 */
app.get('/api/warmup/status/:accountId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { accountId } = req.params;

    // Get latest warmup session
    const { data: warmupSession, error: warmupError } = await supabase
      .from('warmup_sessions')
      .select('*')
      .eq('social_account_id', accountId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (warmupError || !warmupSession) {
      return res.json({
        accountId: parseInt(accountId),
        status: 'not_started',
        dayNumber: 0,
        totalDays: 0,
        actionsCompleted: 0,
        nextSessionAt: null
      });
    }

    res.json({
      accountId: parseInt(accountId),
      platform: warmupSession.platform,
      dayNumber: warmupSession.day_number,
      totalDays: warmupSession.total_days,
      status: warmupSession.status,
      actionsCompleted: warmupSession.actions_completed,
      nextSessionAt: warmupSession.next_session_at
    });

  } catch (error) {
    console.error('Get warmup status error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get warmup status'
    });
  }
});

/**
 * Pause warmup for an account
 */
app.post('/api/warmup/pause/:accountId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { accountId } = req.params;

    // Update warmup status to paused
    const { error: updateError } = await supabase
      .from('warmup_sessions')
      .update({ status: 'paused' })
      .eq('social_account_id', accountId)
      .eq('status', 'in_progress');

    if (updateError) {
      console.error('Pause warmup error:', updateError);
      return res.status(500).json({ error: 'Failed to pause warmup' });
    }

    res.json({
      success: true,
      status: 'paused'
    });

  } catch (error) {
    console.error('Pause warmup error:', error);
    res.status(500).json({
      error: error.message || 'Failed to pause warmup'
    });
  }
});

/**
 * GET /api/accounts - List user's social accounts
 */
app.get('/api/accounts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    res.json({ accounts: data || [] });

  } catch (error) {
    console.error('Fetch accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/accounts - Add new social account
 */
app.post('/api/accounts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { platform, username, displayName, twitterProfileKey, tiktokProfileKey, whopLink } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Validate profile keys based on platform
    if (platform === 'both' || platform === 'twitter') {
      if (!twitterProfileKey) {
        return res.status(400).json({ error: 'Twitter profile key is required' });
      }
    }
    if (platform === 'both' || platform === 'tiktok') {
      if (!tiktokProfileKey) {
        return res.status(400).json({ error: 'TikTok profile key is required' });
      }
    }

    // Store profile keys in auth_data
    const authData = {};
    if (twitterProfileKey) {
      authData.uploadpost_profile_key_twitter = twitterProfileKey;
    }
    if (tiktokProfileKey) {
      authData.uploadpost_profile_key_tiktok = tiktokProfileKey;
    }
    
    // If platform is 'both', store as 'twitter' (we'll detect TikTok from auth_data)
    const dbPlatform = platform === 'both' ? 'twitter' : platform;

    const { data, error } = await supabase
      .from('social_accounts')
      .insert({
        user_id: user.id,
        platform: dbPlatform,
        username: username.replace('@', ''),
        display_name: displayName,
        auth_data: authData,
        bio_link: whopLink, // Store Whop link as bio_link
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add account: ${error.message}`);
    }

    res.json({
      success: true,
      account: data
    });

  } catch (error) {
    console.error('Add account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/accounts/:id - Update account status
 */
app.patch('/api/accounts/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('social_accounts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update account: ${error.message}`);
    }

    res.json({
      success: true,
      account: data
    });

  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/accounts/:id - Delete account
 */
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the posting queue processor
const postingQueueService = new PostingQueueService(supabase);
postingQueueService.startProcessor();

// Reset daily counts at midnight
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    supabase
      .from('social_accounts')
      .update({ posts_today: 0 })
      .gte('posts_today', 1)
      .then(() => console.log('🔄 Daily post counts reset'));
  }
}, 60000); // Check every minute

console.log('✅ Posting queue processor started');

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 MCP Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`\n   ACCOUNT MANAGEMENT:`);
  console.log(`   GET    /api/accounts - List social accounts`);
  console.log(`   POST   /api/accounts - Add new account`);
  console.log(`   PATCH  /api/accounts/:id - Update account status`);
  console.log(`   DELETE /api/accounts/:id - Delete account`);
  console.log(`\n   WARMUP:`);
  console.log(`   POST /api/warmup/start - Start account warmup`);
  console.log(`   GET  /api/warmup/status/:accountId - Get warmup status`);
  console.log(`   POST /api/warmup/pause/:accountId - Pause warmup`);
  console.log(`\n   MORELOGIN MANAGEMENT:`);
  console.log(`   GET  /api/morelogin/instances - Fetch cloud phone list`);
  console.log(`   POST /api/morelogin/create - Create new cloud phone`);
  console.log(`   POST /api/morelogin/adb/enable - Enable ADB for cloud phone`);
  console.log(`   POST /api/morelogin/proxy/add - Add proxy`);
  console.log(`   POST /api/morelogin/proxy/assign - Assign proxy to cloud phone`);
  console.log(`\n   TIKTOK AUTOMATION (via ADB):`);
  console.log(`   POST /api/tiktok/action - Execute TikTok action (scroll, like, etc.)`);
  console.log(`   POST /api/tiktok/start - Start TikTok app`);
  console.log(`   POST /api/tiktok/post-sequence - Complete posting sequence`);
  console.log(`\n   CONTENT GENERATION:`);
  console.log(`   GET  /api/crypto/trending - Get trending crypto topics`);
  console.log(`   POST /api/openai/generate-script - Generate TikTok script`);
  console.log(`   POST /api/openai/generate-video - Generate video with Sora 2`);
  console.log(`   POST /api/content/generate-full-campaign - Generate complete campaign`);
  console.log(`   GET  /api/utils/random-delay - Get random delay for human-like behavior`);
  console.log(`\n⚙️  Configuration check:`);
  console.log(`   MoreLogin API ID: ${config.moreloginApiId ? '✓ Configured' : '✗ Missing'}`);
  console.log(`   MoreLogin Secret Key: ${config.moreloginSecretKey ? '✓ Configured' : '✗ Missing'}`);
  console.log(`   🔐 All API keys managed via operator_settings table in Supabase`);
  console.log(`\n💡 Configure API keys via the admin Settings page or Supabase SQL!`);
  console.log(`📖 MoreLogin API uses MD5 hash authentication`);
  console.log(`🔗 API Host: api.morelogin.com`);
  console.log(`🤖 TikTok automation via ADB (requires ADB enabled on cloud phones)\n`);
});

export default app;
