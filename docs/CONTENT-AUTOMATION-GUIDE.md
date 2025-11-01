# 🎥 TikTok Content Automation - Complete Guide

## 📋 Overview

The content automation workflow has **two main parts**:

1. **Content Generation** (Easy - fully automated via APIs)
2. **Content Posting** (Requires touch simulation sequence)

## 🤖 Part 1: Content Generation (100% Automated)

This part is **completely automated** and works perfectly:

### The Flow:

```
1. CoinMarketCap API → Get trending crypto
2. OpenAI GPT-4o → Generate TikTok script
3. OpenAI Sora 2 → Generate video (when available)
4. Upload video to VMOS devices
```

### Example n8n Workflow:

```javascript
// 1. Get trending crypto
GET http://localhost:3000/api/crypto/trending?limit=5
→ Returns: Bitcoin, Ethereum, etc. with prices and 24h changes

// 2. Generate script
POST http://localhost:3000/api/openai/generate-script
{
  "topic": "Bitcoin surges past $50k",
  "keywords": ["Bitcoin", "crypto", "BTC"]
}
→ Returns: {
  "hook": "Bitcoin just broke $50,000! Here's what you need to know...",
  "facts": ["Fact 1", "Fact 2", "Fact 3"],
  "cta": "Visit minehedge.com for mining tips!",
  "hashtags": ["#Bitcoin", "#Crypto", "#Mining", "#MineHedge", "#BTC"]
}

// 3. Generate video (when Sora 2 is available)
POST http://localhost:3000/api/openai/generate-video
{
  "prompt": "Professional crypto video about Bitcoin...",
  "duration": 30
}
→ Returns: { "videoUrl": "https://..." }

// 4. Upload to all devices
POST http://localhost:3000/api/vmos/upload
{
  "instanceId": "DEVICE_ID",
  "fileUrl": "https://video-url.com/video.mp4",
  "fileName": "bitcoin_50k.mp4"
}
→ Video is now on the device at /sdcard/DCIM/bitcoin_50k.mp4
```

**This part works NOW** (except Sora 2 which is pending OpenAI release).

## 📱 Part 2: Content Posting (Touch Simulation)

This is where we use VMOS's touch simulation API to actually post the video to TikTok.

### The Posting Sequence:

I created an **automated posting endpoint** that does this:

```javascript
POST /api/vmos/tk/post-sequence
{
  "instanceId": "YOUR_DEVICE_ID",
  "videoFilePath": "/sdcard/DCIM/bitcoin_50k.mp4",
  "caption": "Bitcoin just hit $50k! 🚀",
  "hashtags": ["Bitcoin", "Crypto", "Mining", "MineHedge", "BTC"]
}
```

### What It Does Automatically:

**Step 1:** Launch TikTok app
```javascript
POST /vcpcloud/api/padApi/startApp
{ "pkgName": "com.zhiliaoapp.musically" }
```

**Step 2:** Tap the '+' button (center bottom)
```javascript
Tap at (540, 1824) // 50% width, 95% height
Wait 2 seconds
```

**Step 3:** Tap 'Upload' button
```javascript
Tap at (864, 1728) // 80% width, 90% height
Wait 1.5 seconds
```

**Step 4:** Select video from gallery
```javascript
Tap at (270, 480) // 25% width, 25% height (first video)
Wait 1 second
```

**Step 5:** Tap 'Next' button
```javascript
Tap at (972, 96) // 90% width, 5% height
Wait 2 seconds
```

**Step 6:** Tap caption field
```javascript
Tap at (540, 576) // 50% width, 30% height
Wait 1 second
```

**Step 7:** Input caption
```javascript
// Using ADB command (if available)
input text "Bitcoin%sjust%shit%s$50k!%s#Bitcoin%s#Crypto..."
Wait 1 second
```

**Step 8:** Tap 'Post' button
```javascript
Tap at (972, 96) // 90% width, 5% height
Done! ✅
```

## 🎯 Complete End-to-End Workflow

Here's how the **full automation** works in n8n:

### Content Creation Workflow (Every 12 hours):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TRIGGER (Cron: every 12 hours)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. GET TRENDING CRYPTO                                      │
│    GET /api/crypto/trending?limit=5                         │
│    → Returns top 5 cryptos by market cap                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. EXTRACT TOP CRYPTO                                       │
│    Select crypto[0] (most trending)                         │
│    Extract: name, symbol, price, change%                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. GENERATE SCRIPT                                          │
│    POST /api/openai/generate-script                         │
│    → AI creates hook, facts, CTA, hashtags                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. GENERATE VIDEO (Future - when Sora 2 available)         │
│    POST /api/openai/generate-video                          │
│    → Creates 30-second crypto video                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. GET ALL VMOS DEVICES                                     │
│    GET /api/vmos/instances                                  │
│    → Returns list of 10 devices                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. LOOP THROUGH EACH DEVICE                                 │
│    For each device in devices:                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │ 7a. UPLOAD VIDEO TO DEVICE                        │
    │     POST /api/vmos/upload                         │
    │     → Uploads video to /sdcard/DCIM/              │
    └───────────────────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │ 7b. WAIT 5 SECONDS                                │
    │     (Let upload complete)                         │
    └───────────────────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │ 7c. POST TO TIKTOK                                │
    │     POST /api/vmos/tk/post-sequence               │
    │     → Executes 8-step posting sequence            │
    └───────────────────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │ 7d. WAIT 10 SECONDS                               │
    │     (Avoid rate limiting between devices)         │
    └───────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. SEND SUCCESS EMAIL                                       │
│    "Posted to 10 devices: [crypto topic]"                   │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Setting Up Video Posting

### Step 1: Find Coordinates for Your Device

The default coordinates assume 1080x1920 screen. You need to **verify** these work on YOUR devices:

**Test Script:**
```powershell
# Test tapping the + button
$body = @{
    instanceId = "YOUR_DEVICE_ID"
    action = "tap_custom"
    params = @{
        x = 540
        y = 1824
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/tk/action" `
    -Method POST -Body $body -ContentType "application/json"

# Watch VMOS dashboard - did it tap the + button?
```

**If coordinates are wrong:**
1. Open VMOS Cloud dashboard
2. View your device screen
3. Manually open TikTok
4. Note where buttons actually are
5. Calculate coordinates:
   - X = (button_position_from_left / screen_width) * 1080
   - Y = (button_position_from_top / screen_height) * 1920

### Step 2: Adjust Coordinates in Code

If needed, edit `mcp-server.js` at lines 467-520 to adjust coordinates.

### Step 3: Test Manual Posting First

Before automating, test posting manually:

```powershell
# 1. Upload a test video
$uploadBody = @{
    instanceId = "YOUR_DEVICE_ID"
    fileUrl = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
    fileName = "test_video.mp4"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/upload" `
    -Method POST -Body $uploadBody -ContentType "application/json"

# Wait 10 seconds for upload
Start-Sleep -Seconds 10

# 2. Execute posting sequence
$postBody = @{
    instanceId = "YOUR_DEVICE_ID"
    videoFilePath = "/sdcard/DCIM/test_video.mp4"
    caption = "Testing TikTok automation!"
    hashtags = @("Test", "Automation")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/tk/post-sequence" `
    -Method POST -Body $postBody -ContentType "application/json"

# 3. Watch VMOS dashboard to see it post!
```

## 🎬 Alternative: Manual Video Creation (Until Sora 2)

Since Sora 2 isn't publicly available yet, here are alternatives:

### Option 1: Use Other AI Video Tools

**Pictory.ai:**
```javascript
// Replace Sora 2 endpoint with Pictory
POST https://api.pictory.ai/api/v1/video/generate
{
  "script": scriptText,
  "duration": 30,
  "style": "crypto"
}
```

**Synthesia:**
```javascript
POST https://api.synthesia.io/v2/videos
{
  "script": scriptText,
  "template": "crypto_template"
}
```

**InVideo API:**
Similar concept - generate videos from text

### Option 2: Pre-Made Video Templates

1. Create 10-20 video templates with crypto visuals
2. Use AI to add text overlays
3. Rotate through templates
4. Update text based on trending topics

### Option 3: Stock Footage + Text

1. Use stock crypto footage (Pexels, Pixabay)
2. Add text overlays programmatically (FFmpeg)
3. Render final video
4. Upload and post

**FFmpeg Example:**
```bash
ffmpeg -i stock_crypto.mp4 \
  -vf "drawtext=text='Bitcoin hits $50k':x=(w-text_w)/2:y=100:fontsize=48:fontcolor=white" \
  -c:a copy output.mp4
```

### Option 4: Static Images + Ken Burns Effect

Create slideshow videos:
```javascript
// Using FFmpeg
ffmpeg -loop 1 -i image1.jpg -i image2.jpg -i image3.jpg \
  -filter_complex "[0:v]zoompan=z='min(zoom+0.0015,1.5)':d=125[v0]; \
                   [1:v]zoompan=z='min(zoom+0.0015,1.5)':d=125[v1]; \
                   [v0][v1]concat=n=2:v=1:a=0" \
  -t 30 output.mp4
```

## 📊 What Works NOW vs LATER

### ✅ Works NOW (Test Today!)

- Fetch trending crypto data
- Generate AI scripts
- Upload videos to devices
- Touch simulation (tap, swipe)
- Start/stop TikTok app
- **Basic posting automation** (needs coordinate tuning)

### ⏳ Needs Setup

- Video generation (waiting on Sora 2 or alternative)
- Caption text input (may need ADB access or keyboard simulation)
- Coordinate fine-tuning for your specific devices
- Error handling for failed posts

### 🔮 Future Enhancements

- Auto-detect TikTok UI elements (computer vision)
- Handle different screen sizes automatically
- Verify post success via screenshot analysis
- Auto-retry failed posts
- A/B test different captions/hashtags

## 🚀 Quick Start Testing

### Test the Full Flow (Without Video Generation):

```powershell
# 1. Start MCP server
.\start-mcp-server.ps1

# 2. Get trending crypto
curl http://localhost:3000/api/crypto/trending?limit=1

# 3. Generate script
$scriptBody = @{
    topic = "Bitcoin reaches new high"
    keywords = @("Bitcoin", "crypto")
} | ConvertTo-Json

$script = Invoke-RestMethod -Uri "http://localhost:3000/api/openai/generate-script" `
    -Method POST -Body $scriptBody -ContentType "application/json"

# 4. Use a sample video URL (for testing)
$testVideoUrl = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"

# 5. Upload to device
$uploadBody = @{
    instanceId = "YOUR_DEVICE_ID"
    fileUrl = $testVideoUrl
    fileName = "test_bitcoin.mp4"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/upload" `
    -Method POST -Body $uploadBody -ContentType "application/json"

# 6. Wait for upload
Start-Sleep -Seconds 10

# 7. Post to TikTok!
$postBody = @{
    instanceId = "YOUR_DEVICE_ID"
    videoFilePath = "/sdcard/DCIM/test_bitcoin.mp4"
    caption = $script.script.hook
    hashtags = $script.script.hashtags
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/tk/post-sequence" `
    -Method POST -Body $postBody -ContentType "application/json"

# 8. Watch your VMOS device post to TikTok! 🎉
```

## 🎯 Recommended Approach

### Phase 1: Manual Video + Automated Posting (THIS WEEK)

1. Create videos manually (or use stock)
2. Upload to a server/CDN
3. Use automation to:
   - Get trending topics
   - Generate captions
   - Upload videos to devices
   - Post to TikTok automatically

### Phase 2: Semi-Automated (NEXT WEEK)

1. Use template videos
2. Automate text overlays with FFmpeg
3. Full posting automation
4. Scale to all 10 devices

### Phase 3: Full Automation (WHEN SORA 2 AVAILABLE)

1. Complete end-to-end automation
2. Trending topic → Script → Video → Post
3. Zero manual intervention
4. Run 2x daily across all devices

## 📝 Summary

**For Content Creation:**
- ✅ Crypto data: **READY**
- ✅ Script generation: **READY**
- ⏳ Video generation: **Waiting on Sora 2** (use alternatives)
- ✅ File upload: **READY**

**For Content Posting:**
- ✅ Touch simulation: **READY**
- ✅ TikTok app control: **READY**
- ✅ Posting sequence: **CODED** (needs coordinate tuning)
- ⚠️ Text input: **Partially ready** (may need adjustment)

**Bottom Line:**
You can start testing the **posting automation TODAY** with sample videos. Just need to:
1. Fine-tune coordinates for your devices
2. Test on one device first
3. Scale to all 10 once working

The content generation part (script, video) can use temporary solutions until Sora 2 is available!

---

**Next: Run the test script and see your device post automatically! 🚀**

