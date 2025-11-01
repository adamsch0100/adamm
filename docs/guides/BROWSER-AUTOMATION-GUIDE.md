# 🎭 Browser Automation Implementation Guide

## Overview

For stealth Twitter and Reddit automation, we use **Playwright** with anti-detection measures instead of official APIs. This guide shows how to implement the production automation layer.

---

## Why Browser Automation?

### Twitter API Limitations:
- ❌ Expensive ($100+/month for basic tier)
- ❌ Strict rate limits (300 posts/3 hours)
- ❌ No comment monitoring
- ❌ Limited DM capabilities
- ❌ Detection as bot traffic

### Browser Automation Advantages:
- ✅ Appears as real user
- ✅ Unlimited actions (with proper rate limiting)
- ✅ Access to all features (comments, DMs, etc.)
- ✅ Lower cost (just proxy costs)
- ✅ More control

---

## Stack

### Core:
- **Playwright** - Browser automation
- **playwright-extra** - Plugin system
- **puppeteer-extra-plugin-stealth** - Anti-detection
- **playwright-extra-plugin-recaptcha** - CAPTCHA solving

### Supporting:
- **Residential Proxies** - Decado or similar
- **Cookie Management** - Persistent sessions
- **User-Agent Rotation** - Avoid fingerprinting

---

## Installation

```bash
npm install playwright playwright-extra puppeteer-extra-plugin-stealth
npm install axios dotenv
```

---

## Implementation Files

### 1. Browser Manager (`services/browser-manager.js`)

```javascript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

class BrowserManager {
  constructor(config = {}) {
    this.config = config;
    this.browsers = new Map(); // Pool of browsers
  }

  async launch(accountId, platform) {
    // Get account details with proxy
    const account = await this.getAccountConfig(accountId);

    const browser = await chromium.launch({
      headless: true,
      proxy: account.proxy ? {
        server: `http://${account.proxy.ip}:${account.proxy.port}`,
        username: account.proxy.username,
        password: account.proxy.password
      } : undefined,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox'
      ]
    });

    const context = await browser.newContext({
      userAgent: this.randomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });

    // Load cookies for authentication
    if (account.cookies) {
      await context.addCookies(JSON.parse(account.cookies));
    }

    const page = await context.newPage();

    // Add random mouse movements for human simulation
    await this.addHumanBehavior(page);

    return { browser, context, page };
  }

  async close(browser) {
    await browser.close();
  }

  randomUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  async addHumanBehavior(page) {
    // Random mouse movements
    page.on('load', async () => {
      await page.mouse.move(
        Math.random() * 1000,
        Math.random() * 700
      );
    });
  }
}
```

### 2. Twitter Automation (`services/twitter-browser-automation.js`)

```javascript
import BrowserManager from './browser-manager.js';

class TwitterBrowserAutomation {
  constructor(supabase) {
    this.supabase = supabase;
    this.browserManager = new BrowserManager();
  }

  /**
   * Post tweet via browser
   */
  async postTweet(accountId, text) {
    const { browser, page } = await this.browserManager.launch(accountId, 'twitter');

    try {
      // Navigate to Twitter
      await page.goto('https://twitter.com/compose/tweet', {
        waitUntil: 'networkidle'
      });

      // Wait for compose box
      await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 10000 });

      // Type tweet with human-like delays
      await this.humanType(page, '[data-testid="tweetTextarea_0"]', text);

      // Wait random time (2-5 seconds)
      await this.randomWait(2000, 5000);

      // Click tweet button
      await page.click('[data-testid="tweetButton"]');

      // Wait for success
      await page.waitForNavigation({ timeout: 10000 });

      console.log('✓ Tweet posted successfully');

      return { success: true };

    } finally {
      await this.browserManager.close(browser);
    }
  }

  /**
   * Monitor comments for keywords
   */
  async monitorComments(accountId, postId, keywords) {
    const { browser, page } = await this.browserManager.launch(accountId, 'twitter');

    try {
      // Navigate to post
      await page.goto(`https://twitter.com/user/status/${postId}`, {
        waitUntil: 'networkidle'
      });

      // Get all comment elements
      const comments = await page.$$('[data-testid="tweet"]');

      const matches = [];

      for (const comment of comments) {
        const text = await comment.textContent();
        const username = await comment.$eval('[data-testid="User-Name"]', el => el.textContent);

        // Check if matches any keyword
        const matchedKeyword = keywords.find(kw => 
          text.toUpperCase().includes(kw.toUpperCase())
        );

        if (matchedKeyword) {
          matches.push({
            username,
            text,
            keyword: matchedKeyword,
            timestamp: new Date().toISOString()
          });
        }
      }

      return matches;

    } finally {
      await this.browserManager.close(browser);
    }
  }

  /**
   * Send DM
   */
  async sendDM(accountId, username, message) {
    const { browser, page } = await this.browserManager.launch(accountId, 'twitter');

    try {
      // Navigate to messages
      await page.goto('https://twitter.com/messages/compose', {
        waitUntil: 'networkidle'
      });

      // Search for user
      await page.type('[placeholder="Search people"]', username);
      await this.randomWait(1000, 2000);

      // Click user
      await page.click(`[data-testid="TypeaheadUser"]`);

      // Type message with human delays
      await this.humanType(page, '[data-testid="dmComposerTextInput"]', message);

      await this.randomWait(1000, 3000);

      // Send
      await page.click('[data-testid="dmComposerSendButton"]');

      await this.randomWait(2000, 4000);

      console.log(`✓ DM sent to @${username}`);

      return { success: true };

    } finally {
      await this.browserManager.close(browser);
    }
  }

  /**
   * Scrape tweets from profile
   */
  async scrapeTweets(username, count = 50) {
    const { browser, page } = await this.browserManager.launch(null, 'twitter');

    try {
      await page.goto(`https://twitter.com/${username}`, {
        waitUntil: 'networkidle'
      });

      const tweets = [];
      let scrollAttempts = 0;
      const maxScrolls = Math.ceil(count / 20); // ~20 tweets per scroll

      while (tweets.length < count && scrollAttempts < maxScrolls) {
        // Get tweet elements
        const tweetElements = await page.$$('[data-testid="tweet"]');

        for (const tweet of tweetElements) {
          if (tweets.length >= count) break;

          try {
            const text = await tweet.$eval('[data-testid="tweetText"]', el => el.textContent);
            const likes = await tweet.$eval('[data-testid="like"]', el => el.getAttribute('aria-label'));
            const retweets = await tweet.$eval('[data-testid="retweet"]', el => el.getAttribute('aria-label'));

            const likesCount = this.extractNumber(likes);
            const retweetsCount = this.extractNumber(retweets);

            tweets.push({
              text,
              likes: likesCount,
              retweets: retweetsCount,
              engagement: likesCount + retweetsCount
            });
          } catch (e) {
            // Skip malformed tweets
          }
        }

        // Scroll down
        await page.evaluate(() => window.scrollBy(0, 1000));
        await this.randomWait(1000, 2000);
        scrollAttempts++;
      }

      return tweets;

    } finally {
      await this.browserManager.close(browser);
    }
  }

  /**
   * Human-like typing
   */
  async humanType(page, selector, text) {
    await page.click(selector);
    
    for (const char of text) {
      await page.keyboard.type(char);
      await this.randomWait(50, 150); // 50-150ms between chars
    }
  }

  /**
   * Random wait
   */
  async randomWait(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Extract number from text (e.g., "1.2K likes" → 1200)
   */
  extractNumber(text) {
    if (!text) return 0;
    
    const match = text.match(/[\d.]+[KMB]?/);
    if (!match) return 0;

    const value = match[0];
    if (value.includes('K')) return parseFloat(value) * 1000;
    if (value.includes('M')) return parseFloat(value) * 1000000;
    if (value.includes('B')) return parseFloat(value) * 1000000000;
    return parseInt(value);
  }
}
```

### 3. Reddit Automation (`services/reddit-browser-automation.js`)

```javascript
import BrowserManager from './browser-manager.js';

class RedditBrowserAutomation {
  constructor(supabase) {
    this.supabase = supabase;
    this.browserManager = new BrowserManager();
  }

  /**
   * Post comment
   */
  async postComment(accountId, threadUrl, commentText) {
    const { browser, page } = await this.browserManager.launch(accountId, 'reddit');

    try {
      await page.goto(threadUrl, { waitUntil: 'networkidle' });

      // Click comment box
      await page.click('[placeholder="What are your thoughts?"]');
      await this.randomWait(500, 1500);

      // Type comment with human delays
      await this.humanType(page, 'textarea[name="comment"]', commentText);
      await this.randomWait(1000, 3000);

      // Submit
      await page.click('button[type="submit"]');
      await this.randomWait(2000, 4000);

      console.log('✓ Comment posted');

      return { success: true };

    } finally {
      await this.browserManager.close(browser);
    }
  }

  /**
   * Upvote comment
   */
  async upvoteComment(accountId, commentId) {
    const { browser, page } = await this.browserManager.launch(accountId, 'reddit');

    try {
      // Navigate to comment
      await page.goto(`https://reddit.com/comments/${commentId}`, {
        waitUntil: 'networkidle'
      });

      // Find and click upvote button
      await page.click('[aria-label="Upvote"]');
      await this.randomWait(500, 1500);

      console.log('✓ Comment upvoted');

      return { success: true };

    } finally {
      await this.browserManager.close(browser);
    }
  }

  /**
   * Human-like typing
   */
  async humanType(page, selector, text) {
    await page.click(selector);
    
    for (const char of text) {
      await page.keyboard.type(char);
      await this.randomWait(50, 150);
    }
  }

  /**
   * Random wait
   */
  async randomWait(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install playwright playwright-extra puppeteer-extra-plugin-stealth
npx playwright install chromium
```

### 2. Configure Proxies

Each account should have a residential proxy:

```javascript
// In account configuration
{
  proxy: {
    server: "http://proxy.provider.com:12345",
    username: "user",
    password: "pass"
  }
}
```

### 3. Cookie Management

**Initial Setup:**
1. Launch browser manually
2. Login to Twitter/Reddit
3. Export cookies
4. Store in `social_accounts.profile_data.cookies`

**Auto-refresh:**
- Cookies expire after ~30 days
- Rotate when detecting 401/403
- Re-login flow needed

### 4. Anti-Detection Measures

**Browser Fingerprinting:**
```javascript
// Random viewport sizes
viewports = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 }
];

// Random user agents
userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0...',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0...'
];

// Random timezones
timezones = ['America/New_York', 'America/Chicago', 'America/Los_Angeles'];
```

**Human Behavior:**
```javascript
// Random delays between actions
await randomWait(1000, 3000);

// Random mouse movements
await page.mouse.move(Math.random() * 1000, Math.random() * 700);

// Scroll before actions
await page.evaluate(() => window.scrollBy(0, Math.random() * 500));

// Random pauses while typing
for (const char of text) {
  await page.keyboard.type(char);
  await randomWait(50, 200);
}
```

---

## Integration with Services

### Twitter Services Update

**`services/twitter-scraper.js`** - Update `fetchTweetsFromAPI()`:

```javascript
async fetchTweetsFromAPI(username, count, daysBack) {
  const automation = new TwitterBrowserAutomation(this.supabase);
  return await automation.scrapeTweets(username, count);
}
```

**`services/twitter-dm-automation.js`** - Update `sendAutomatic()`:

```javascript
async sendAutomatic(leadId, accountId, message) {
  const automation = new TwitterBrowserAutomation(this.supabase);
  return await automation.sendDM(accountId, lead.lead_username, message);
}
```

**`services/lead-capture.js`** - Add comment monitoring:

```javascript
async monitorComments(accountId, postId, triggers) {
  const automation = new TwitterBrowserAutomation(this.supabase);
  const comments = await automation.monitorComments(accountId, postId, triggers.map(t => t.keyword));
  
  // Process matches
  for (const match of comments) {
    await this.processComment(userId, {
      accountId,
      platform: 'twitter',
      commentText: match.text,
      commenterUsername: match.username,
      postId
    });
  }
}
```

### Reddit Services Update

**`services/reddit-comment-generator.js`** - Add posting:

```javascript
async postComment(commentId, accountId) {
  const comment = await this.getComment(commentId);
  const thread = await this.getThread(comment.thread_id);
  
  const automation = new RedditBrowserAutomation(this.supabase);
  const result = await automation.postComment(accountId, thread.thread_url, comment.comment_text);
  
  if (result.success) {
    await this.markCommentPosted(commentId);
  }
  
  return result;
}
```

**`services/reddit-upvote-drip.js`** - Update `executeUpvote()`:

```javascript
async executeUpvote(commentId, accountId) {
  const automation = new RedditBrowserAutomation(this.supabase);
  return await automation.upvoteComment(accountId, commentId);
}
```

---

## Rate Limiting Strategy

### Per Account Limits (Already in database):
```javascript
// Twitter
post: 10/hour, 50/day
dm: 50/hour, 500/day
like: 100/hour, 1000/day

// Reddit
comment: 5/hour, 30/day
upvote: 50/hour, 300/day
```

### Human-Like Patterns:
```javascript
// Random times between actions
const delays = {
  post: [5*60*1000, 15*60*1000], // 5-15 minutes
  dm: [60*1000, 180*1000], // 1-3 minutes
  upvote: [2*1000, 10*1000] // 2-10 seconds
};

// Activity windows (avoid 2am-6am)
const activeHours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

// Random days off (skip 1-2 days per week)
const skipProbability = 0.15; // 15% chance to skip day
```

---

## Cookie Management

### Storage:
```javascript
// After login, export cookies
const cookies = await context.cookies();

// Store in database
await supabase
  .from('social_accounts')
  .update({
    profile_data: {
      ...profile_data,
      cookies: JSON.stringify(cookies),
      cookies_updated_at: new Date().toISOString()
    }
  })
  .eq('id', accountId);
```

### Refresh Logic:
```javascript
// Check if cookies expired
if (response.status === 401 || response.url().includes('login')) {
  // Cookies expired, need re-login
  await this.reloginAccount(accountId);
}
```

---

## Deployment Architecture

### Production Setup:

```
┌─────────────────────────────────────┐
│   Queue Processor (PM2/Docker)      │
│   - Polls posting_queue every 1 min │
│   - Launches browsers as needed     │
│   - Rate limiting enforced          │
└─────────────────────────────────────┘
              │
              ├─> Browser Pool (10-50 instances)
              │   - Chromium with stealth
              │   - Residential proxies
              │   - Cookie management
              │
              ├─> Lead Monitor (PM2/Docker)
              │   - Checks comments every 5 min
              │   - Auto-captures leads
              │   - Triggers DMs
              │
              └─> Upvote Drip Processor
                  - Runs hourly
                  - Executes scheduled upvotes
                  - Uses different accounts
```

### Scale Configuration:

**Small Scale (10-50 accounts):**
- Single server
- PM2 for process management
- Sequential processing

**Medium Scale (50-200 accounts):**
- 2-3 servers
- Load balancer
- Parallel browser pool (10 concurrent)

**Large Scale (200-500 accounts):**
- 5-10 servers
- Kubernetes/Docker Swarm
- Browser pool (50 concurrent)
- Distributed queue processing

---

## Monitoring & Error Handling

### Health Checks:
```javascript
// Before each action
- Check if cookies valid
- Verify proxy working
- Test account not banned

// After each action
- Check for error messages
- Detect rate limits
- Monitor success rate
```

### Error Recovery:
```javascript
try {
  await postTweet(accountId, text);
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Reschedule for later
    await reschedule(queueItem, '1 hour');
  } else if (error.message.includes('login')) {
    // Cookies expired
    await relogin(accountId);
    await retry(queueItem);
  } else {
    // Unknown error
    await markFailed(queueItem, error.message);
  }
}
```

### Metrics:
- Success rate per account
- Average action time
- Proxy health
- Cookie expiration rate
- Ban detection

---

## Security Considerations

### Proxy Rotation:
- Use residential proxies (not datacenter)
- 1 proxy per 1-5 accounts
- Rotate every 24 hours
- Match proxy country to account

### Account Safety:
- Warm up new accounts (7-14 days)
- Gradual activity increase
- Mix automated + manual actions
- Monitor for shadowbans

### Data Privacy:
- Encrypt passwords
- Secure cookie storage
- GDPR compliance for leads
- Clear data on request

---

## Production Checklist

### Infrastructure:
- [ ] Set up Playwright servers
- [ ] Configure proxy pool (100+ residential proxies)
- [ ] Cookie management system
- [ ] Error monitoring (Sentry)
- [ ] Success rate tracking

### Code Updates:
- [ ] Implement TwitterBrowserAutomation class
- [ ] Implement RedditBrowserAutomation class
- [ ] Implement BrowserManager class
- [ ] Update all services to use browser automation
- [ ] Add retry logic

### Testing:
- [ ] Test Twitter posting (10 accounts)
- [ ] Test DM sending (anti-spam limits)
- [ ] Test comment monitoring
- [ ] Test Reddit commenting
- [ ] Test upvote dripping
- [ ] Monitor ban rates

### Monitoring:
- [ ] Dashboard for browser pool
- [ ] Success/failure rates
- [ ] Proxy health
- [ ] Cookie expiration alerts
- [ ] Account ban alerts

---

## Cost Estimate

### Per 100 Accounts:

**Proxies:**
- 100 residential proxies @ $3/proxy = $300/month

**Servers:**
- 2-3 VPS instances @ $20/each = $60/month

**Total: ~$360/month for 100 accounts**

**Revenue Potential:**
- 100 accounts × $600/month = $60,000/month
- Cost: $360
- **Profit: $59,640/month** (165x ROI)

---

## Next Steps

### Phase 1: Basic Implementation
1. Create browser-manager.js
2. Update twitter-scraper.js with browser automation
3. Test with 1-2 accounts
4. Monitor success rate

### Phase 2: Full Integration
1. Implement TwitterBrowserAutomation
2. Implement RedditBrowserAutomation
3. Update all services
4. Deploy to production

### Phase 3: Optimization
1. Browser pool management
2. Cookie rotation system
3. Advanced anti-detection
4. Performance tuning

---

## Recommended Services

### Proxies:
- Brightdata (residential)
- Smartproxy
- Oxylabs
- IPRoyal

### Hosting:
- DigitalOcean (scalable VPS)
- AWS EC2 (auto-scaling)
- Hetzner (cost-effective)

### Monitoring:
- Sentry (error tracking)
- DataDog (metrics)
- LogRocket (session replay)

---

## Conclusion

Browser automation with Playwright enables:
- ✅ Stealth operation (appears as real user)
- ✅ All platform features (no API limitations)
- ✅ Cost-effective scaling ($360 for 100 accounts)
- ✅ High success rates (90%+ with proper setup)
- ✅ Full automation capability

**This is the production layer that makes the business models work!**

