/**
 * VMOS TikTok Automation Scripts
 * 
 * These are Android automation scripts that run ON the VMOS virtual device
 * to control the TikTok app. They use Android accessibility services and
 * UI automation to simulate human interactions.
 * 
 * IMPORTANT: These scripts need to be deployed to VMOS Cloud via their
 * automation API. They cannot run directly from your PC.
 * 
 * Usage:
 * 1. Upload these scripts to VMOS Cloud dashboard
 * 2. Configure them as automation tasks
 * 3. Call them via the VMOS API from n8n workflows
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  const start = new Date().getTime();
  while (new Date().getTime() < start + ms);
}

/**
 * Random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random delay to mimic human behavior
 */
function humanDelay(minMs = 2000, maxMs = 5000) {
  sleep(randomInt(minMs, maxMs));
}

/**
 * Launch TikTok app
 * Note: This uses VMOS/Android-specific APIs
 */
function launchTikTok() {
  const packageName = "com.zhiliaoapp.musically"; // TikTok package name
  
  // Using Android shell command
  shell("am start -n " + packageName + "/.splash.SplashActivity", true);
  
  // Wait for app to load
  sleep(5000);
  
  return true;
}

/**
 * Simulate swipe gesture
 * @param {number} x1 - Start X coordinate
 * @param {number} y1 - Start Y coordinate
 * @param {number} x2 - End X coordinate
 * @param {number} y2 - End Y coordinate
 * @param {number} duration - Swipe duration in milliseconds
 */
function swipe(x1, y1, x2, y2, duration = 300) {
  // Using Android input swipe command
  const cmd = `input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`;
  shell(cmd, true);
}

/**
 * Simulate tap gesture
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function tap(x, y) {
  const cmd = `input tap ${x} ${y}`;
  shell(cmd, true);
}

/**
 * Input text
 * @param {string} text - Text to input
 */
function inputText(text) {
  const cmd = `input text "${text.replace(/\s/g, '%s')}"`;
  shell(cmd, true);
}

// ============================================================================
// TIKTOK AUTOMATION ACTIONS
// ============================================================================

/**
 * Action 1: Scroll TikTok Feed
 * Scrolls through the For You page watching videos
 */
function scrollFeed(count = 10) {
  console.log("Starting TikTok feed scroll...");
  
  // Launch TikTok
  if (!launchTikTok()) {
    console.error("Failed to launch TikTok");
    return false;
  }
  
  // Screen dimensions (adjust for your device resolution)
  const screenWidth = 1080;
  const screenHeight = 1920;
  
  // Scroll area (middle of screen, swipe up)
  const centerX = screenWidth / 2;
  const startY = screenHeight * 0.75;
  const endY = screenHeight * 0.25;
  
  for (let i = 0; i < count; i++) {
    console.log(`Scrolling video ${i + 1}/${count}`);
    
    // Watch video for random duration (3-8 seconds)
    const watchTime = randomInt(3000, 8000);
    sleep(watchTime);
    
    // Swipe up to next video
    const swipeDuration = randomInt(300, 600);
    swipe(centerX, startY, centerX, endY, swipeDuration);
    
    // Random delay before next action
    humanDelay(1000, 3000);
  }
  
  console.log("Feed scroll completed");
  return true;
}

/**
 * Action 2: Like Videos
 * Randomly likes videos while scrolling
 */
function likeVideos(count = 5) {
  console.log("Starting TikTok like action...");
  
  // Launch TikTok
  if (!launchTikTok()) {
    console.error("Failed to launch TikTok");
    return false;
  }
  
  // Screen dimensions
  const screenWidth = 1080;
  const screenHeight = 1920;
  
  // Like button position (right side, lower third of screen)
  const likeX = screenWidth * 0.9;
  const likeY = screenHeight * 0.6;
  
  const centerX = screenWidth / 2;
  const startY = screenHeight * 0.75;
  const endY = screenHeight * 0.25;
  
  for (let i = 0; i < count; i++) {
    console.log(`Liking video ${i + 1}/${count}`);
    
    // Watch video briefly
    sleep(randomInt(2000, 5000));
    
    // Tap like button
    tap(likeX, likeY);
    console.log("Tapped like button");
    
    // Wait after liking
    humanDelay(1500, 3000);
    
    // Scroll to next video
    swipe(centerX, startY, centerX, endY, randomInt(300, 500));
    
    // Random delay
    humanDelay(2000, 4000);
  }
  
  console.log("Like action completed");
  return true;
}

/**
 * Action 3: Search for Content
 * Searches for specific keywords and browses results
 */
function searchContent(query = "crypto mining", scrollCount = 3) {
  console.log(`Starting TikTok search for: ${query}`);
  
  // Launch TikTok
  if (!launchTikTok()) {
    console.error("Failed to launch TikTok");
    return false;
  }
  
  sleep(3000);
  
  // Screen dimensions
  const screenWidth = 1080;
  const screenHeight = 1920;
  
  // Tap search/discover button (bottom nav, second icon)
  const discoverX = screenWidth * 0.3;
  const discoverY = screenHeight * 0.95;
  tap(discoverX, discoverY);
  
  sleep(2000);
  
  // Tap search bar (top of screen)
  const searchX = screenWidth * 0.5;
  const searchY = screenHeight * 0.08;
  tap(searchX, searchY);
  
  sleep(1500);
  
  // Input search query
  inputText(query);
  sleep(1000);
  
  // Press enter/search button
  shell("input keyevent 66", true); // 66 = Enter key
  
  sleep(3000);
  
  // Scroll through search results
  const startY = screenHeight * 0.7;
  const endY = screenHeight * 0.3;
  const centerX = screenWidth / 2;
  
  for (let i = 0; i < scrollCount; i++) {
    console.log(`Scrolling search results ${i + 1}/${scrollCount}`);
    
    // Random tap on a video (to view it)
    const videoX = randomInt(screenWidth * 0.2, screenWidth * 0.8);
    const videoY = randomInt(screenHeight * 0.3, screenHeight * 0.6);
    tap(videoX, videoY);
    
    sleep(randomInt(5000, 10000)); // Watch video
    
    // Go back
    shell("input keyevent 4", true); // 4 = Back button
    
    sleep(2000);
    
    // Scroll to see more results
    swipe(centerX, startY, centerX, endY, randomInt(400, 700));
    
    humanDelay(2000, 4000);
  }
  
  console.log("Search action completed");
  return true;
}

/**
 * Action 4: Watch Videos Completely
 * Watches videos to completion to improve engagement
 */
function watchVideos(count = 3) {
  console.log("Starting TikTok watch action...");
  
  // Launch TikTok
  if (!launchTikTok()) {
    console.error("Failed to launch TikTok");
    return false;
  }
  
  const screenWidth = 1080;
  const screenHeight = 1920;
  const centerX = screenWidth / 2;
  const startY = screenHeight * 0.75;
  const endY = screenHeight * 0.25;
  
  for (let i = 0; i < count; i++) {
    console.log(`Watching video ${i + 1}/${count} completely`);
    
    // Watch video for longer duration (10-20 seconds)
    const watchTime = randomInt(10000, 20000);
    sleep(watchTime);
    
    // Random interaction during watch
    const rand = randomInt(1, 3);
    if (rand === 1) {
      // Pause and resume (tap center)
      tap(centerX, screenHeight * 0.5);
      sleep(randomInt(1000, 3000));
      tap(centerX, screenHeight * 0.5);
    } else if (rand === 2) {
      // Double tap to like
      tap(centerX, screenHeight * 0.5);
      sleep(100);
      tap(centerX, screenHeight * 0.5);
    }
    
    sleep(randomInt(2000, 4000));
    
    // Scroll to next video
    swipe(centerX, startY, centerX, endY, randomInt(400, 600));
    
    humanDelay(1000, 2000);
  }
  
  console.log("Watch action completed");
  return true;
}

/**
 * Action 5: Follow Accounts
 * Follows crypto-related accounts
 */
function followAccounts(count = 2) {
  console.log("Starting TikTok follow action...");
  
  // First search for crypto content
  searchContent("crypto", 1);
  
  sleep(2000);
  
  const screenWidth = 1080;
  const screenHeight = 1920;
  
  // Follow button position (varies, but typically right side or on profile)
  const followX = screenWidth * 0.85;
  const followY = screenHeight * 0.15;
  
  for (let i = 0; i < count; i++) {
    console.log(`Following account ${i + 1}/${count}`);
    
    // Tap on a video to view
    const videoX = randomInt(screenWidth * 0.3, screenWidth * 0.7);
    const videoY = randomInt(screenHeight * 0.4, screenHeight * 0.6);
    tap(videoX, videoY);
    
    sleep(3000);
    
    // Tap profile icon (left side, typically has avatar)
    const profileX = screenWidth * 0.1;
    const profileY = screenHeight * 0.2;
    tap(profileX, profileY);
    
    sleep(2000);
    
    // Tap follow button (typically top right)
    tap(followX, followY);
    console.log("Tapped follow button");
    
    sleep(randomInt(1500, 3000));
    
    // Go back twice (to profile, then to feed)
    shell("input keyevent 4", true);
    sleep(1000);
    shell("input keyevent 4", true);
    
    sleep(2000);
    
    // Scroll to find next account
    const centerX = screenWidth / 2;
    const startY = screenHeight * 0.7;
    const endY = screenHeight * 0.3;
    swipe(centerX, startY, centerX, endY, randomInt(400, 600));
    
    humanDelay(3000, 5000);
  }
  
  console.log("Follow action completed");
  return true;
}

/**
 * Action 6: Post Video to TikTok
 * Posts a video that's already on the device
 */
function postVideo(videoPath, caption, hashtags = []) {
  console.log("Starting TikTok post action...");
  
  // Launch TikTok
  if (!launchTikTok()) {
    console.error("Failed to launch TikTok");
    return false;
  }
  
  sleep(3000);
  
  const screenWidth = 1080;
  const screenHeight = 1920;
  
  // Tap the '+' button (center bottom nav)
  const plusX = screenWidth * 0.5;
  const plusY = screenHeight * 0.95;
  tap(plusX, plusY);
  
  sleep(3000);
  
  // Tap 'Upload' button (usually bottom)
  const uploadX = screenWidth * 0.8;
  const uploadY = screenHeight * 0.9;
  tap(uploadX, uploadY);
  
  sleep(2000);
  
  // Select video from gallery
  // Note: This assumes the video is the first item in gallery
  // You may need to adjust based on actual gallery layout
  const videoThumbX = screenWidth * 0.25;
  const videoThumbY = screenHeight * 0.25;
  tap(videoThumbX, videoThumbY);
  
  sleep(1000);
  
  // Tap 'Next' button
  const nextX = screenWidth * 0.9;
  const nextY = screenHeight * 0.05;
  tap(nextX, nextY);
  
  sleep(3000);
  
  // Tap caption field
  const captionX = screenWidth * 0.5;
  const captionY = screenHeight * 0.3;
  tap(captionX, captionY);
  
  sleep(1000);
  
  // Build full caption with hashtags
  let fullCaption = caption;
  if (hashtags && hashtags.length > 0) {
    fullCaption += " " + hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ');
  }
  
  // Input caption
  inputText(fullCaption);
  
  sleep(2000);
  
  // Tap 'Post' button (usually top right)
  const postX = screenWidth * 0.9;
  const postY = screenHeight * 0.05;
  tap(postX, postY);
  
  console.log("Post action completed");
  
  sleep(5000); // Wait for post to upload
  
  return true;
}

// ============================================================================
// MAIN EXECUTION WRAPPER
// ============================================================================

/**
 * Main function to execute specific action
 * This is called by VMOS automation API with action parameters
 */
function executeAction(action, params = {}) {
  console.log(`Executing action: ${action}`);
  console.log(`Parameters: ${JSON.stringify(params)}`);
  
  let result = false;
  
  try {
    switch (action) {
      case 'scroll_feed':
        result = scrollFeed(params.count || 10);
        break;
        
      case 'like_videos':
        result = likeVideos(params.count || 5);
        break;
        
      case 'search':
        result = searchContent(params.query || "crypto mining", params.scrollCount || 3);
        break;
        
      case 'watch_video':
        result = watchVideos(params.count || 3);
        break;
        
      case 'follow_account':
        result = followAccounts(params.count || 2);
        break;
        
      case 'post_video':
        result = postVideo(
          params.videoPath,
          params.caption,
          params.hashtags || []
        );
        break;
        
      default:
        console.error(`Unknown action: ${action}`);
        return false;
    }
    
    return result;
    
  } catch (error) {
    console.error(`Error executing action ${action}: ${error.message}`);
    return false;
  }
}

// Export for VMOS usage
module.exports = {
  executeAction,
  scrollFeed,
  likeVideos,
  searchContent,
  watchVideos,
  followAccounts,
  postVideo
};




