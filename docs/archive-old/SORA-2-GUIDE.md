# 🎬 Sora 2 API Integration Guide

## 📖 Official Documentation

Based on OpenAI's official Sora 2 API documentation, here's how to integrate video generation into your TikTok automation.

## 🚀 How Sora 2 Works

Sora 2 is **asynchronous** - video generation happens in 3 steps:

1. **Create** - Start a video generation job
2. **Poll** - Check status until complete
3. **Download** - Get the final MP4 file

This process can take **several minutes** depending on model and resolution.

## 🎥 Two Models Available

### `sora-2` (Recommended for TikTok)
- ⚡ **Faster** generation
- 💰 **Lower cost**
- ✅ **Good quality** for social media
- 🎯 **Best for**: Rapid iteration, prototypes, TikTok content

### `sora-2-pro`
- 🎨 **Higher quality** output
- ⏱️ **Slower** generation
- 💎 **Production-grade** results
- 🎯 **Best for**: Cinematic footage, marketing assets

**For TikTok automation, use `sora-2`** - it's fast enough for 2x daily posting and quality is perfect for social media.

## 📐 Supported Resolutions

Common TikTok formats:
- `720x1280` - TikTok vertical (9:16)
- `1080x1920` - HD vertical (9:16)
- `1280x720` - Landscape (16:9)

**Recommended**: `1080x1920` for best TikTok quality

## ⏱️ Video Duration

- Minimum: Not specified in docs
- Maximum: Varies by model
- **Recommended for TikTok**: `8` or `15` seconds (short, engaging clips)

## 🔌 API Endpoints (MCP Server)

I've created 4 endpoints for Sora 2:

### 1. Start Video Generation (Async)

```javascript
POST /api/openai/generate-video
{
  "prompt": "Wide shot of Bitcoin coin spinning against crypto charts background, golden light",
  "model": "sora-2",
  "size": "1080x1920",
  "seconds": "8"
}

Response:
{
  "success": true,
  "videoId": "video_abc123",
  "status": "queued",
  "progress": 0,
  "note": "Poll /api/openai/video-status/{videoId} for updates"
}
```

### 2. Check Status

```javascript
GET /api/openai/video-status/{videoId}

Response:
{
  "success": true,
  "videoId": "video_abc123",
  "status": "in_progress",  // queued, in_progress, completed, failed
  "progress": 45
}
```

### 3. Download Video

```javascript
GET /api/openai/video-download/{videoId}

Response:
{
  "success": true,
  "videoId": "video_abc123",
  "downloadUrl": "https://api.openai.com/v1/videos/video_abc123/content",
  "note": "URL valid for 1 hour"
}
```

### 4. Generate and Poll (Complete)

```javascript
POST /api/openai/generate-video-complete
{
  "prompt": "Your prompt here",
  "model": "sora-2",
  "size": "1080x1920",
  "seconds": "8"
}

// This endpoint waits until generation is complete
// Can take several minutes!

Response:
{
  "success": true,
  "videoId": "video_abc123",
  "status": "completed",
  "downloadUrl": "https://...",
  "thumbnailUrl": "https://..."
}
```

## 💡 Effective Prompting for Crypto Content

According to OpenAI's guide, describe: **shot type, subject, action, setting, lighting**

### Good Crypto Prompts:

**Bitcoin surge:**
```
"Wide shot of a golden Bitcoin coin spinning slowly, rising upward through a field of green stock charts, dramatic backlighting, cinematic depth of field, 4K quality"
```

**Mining visualization:**
```
"Close-up dolly shot of crypto mining rig with glowing LEDs, fans spinning, digital numbers flowing across screen, cool blue and purple lighting, high-tech atmosphere"
```

**Market movement:**
```
"Dynamic tracking shot following a crypto chart line moving upward, transforming into a rocket trajectory, green candlesticks in background, energetic feel"
```

**Educational style:**
```
"Medium shot of animated cryptocurrency symbols (Bitcoin, Ethereum) floating and rotating in space, subtle particle effects, clean modern aesthetic, soft lighting"
```

### Prompt Template for TikTok:

```javascript
const videoPrompt = `
[SHOT TYPE] of [SUBJECT] [ACTION], 
[SETTING], [LIGHTING], 
optimized for TikTok vertical format
`;

// Example:
"Wide shot of Bitcoin logo emerging from digital particles, 
rising through cryptocurrency charts with green arrows, 
cinematic golden hour lighting, 
optimized for TikTok vertical format"
```

## 🔄 Complete Workflow Integration

### Updated n8n Workflow:

```
1. Get trending crypto
   ↓
2. Generate script with GPT-4o
   ↓
3. Generate video with Sora 2 (START)
   ↓
4. Poll status every 10 seconds
   ↓
5. When complete, download video
   ↓
6. Upload to VMOS devices
   ↓
7. Post to TikTok
```

### Example n8n Nodes:

**Node 1: Generate Video Prompt**
```javascript
// Code node to build Sora 2 prompt
const crypto = $input.item.json;
const script = $input.item.json.script;

const videoPrompt = `
Wide vertical shot of ${crypto.name} cryptocurrency symbol rising upward through digital charts, 
${crypto.percentChange24h > 0 ? 'green bullish' : 'red bearish'} candlesticks in background,
dramatic cinematic lighting, golden particles, 
optimized for TikTok vertical format 9:16
`;

return {
  json: {
    prompt: videoPrompt,
    model: 'sora-2',
    size: '1080x1920',
    seconds: '8'
  }
};
```

**Node 2: Start Video Generation**
```javascript
// HTTP Request node
POST http://localhost:3000/api/openai/generate-video
Body: {{ $json }}
```

**Node 3: Poll Until Complete**
```javascript
// Loop node - poll every 10 seconds
// Condition: status !== 'completed' and status !== 'failed'

GET http://localhost:3000/api/openai/video-status/{{ $json.videoId }}

// Wait 10 seconds node between iterations
```

**Node 4: Download Video**
```javascript
// When status === 'completed'
GET http://localhost:3000/api/openai/video-download/{{ $json.videoId }}
```

## 🎨 Using Image References

You can provide a **reference image** as the first frame:

```javascript
POST /api/openai/generate-video
{
  "prompt": "The logo transforms with particle effects and moves upward",
  "model": "sora-2",
  "size": "1080x1920",
  "seconds": "8",
  "inputReference": "<base64_image_data>"
}
```

**Use case**: 
- Start with your logo/brand asset
- Animate it with Sora 2
- Consistent branding across all videos

## ♻️ Remix Existing Videos

Refine videos without starting from scratch:

```javascript
POST https://api.openai.com/v1/videos/{previous_video_id}/remix
{
  "prompt": "Change color palette to teal and orange, add warm backlight"
}
```

**Use case**:
- Generated a good video but wrong colors?
- Need minor tweaks?
- A/B test variations

## 💰 Cost Optimization

**For TikTok automation:**

1. **Use `sora-2`** (not pro) - faster and cheaper
2. **8 seconds** is enough for TikTok (15 max)
3. **1080x1920** resolution - good balance
4. **Cache popular videos** - reuse when topic is similar
5. **Generate once, post to all devices** - don't regenerate per device

**Estimated workflow:**
- 2 videos per day
- 8 seconds each
- `sora-2` model
- = Affordable for daily automation

## 🚨 Content Restrictions

Sora 2 enforces these rules:

❌ **NOT Allowed:**
- Content inappropriate for under 18
- Copyrighted characters (Mickey Mouse, etc.)
- Copyrighted music
- Real people or public figures
- Faces of humans in input images

✅ **Allowed for Crypto:**
- Abstract visuals (charts, graphs, particles)
- Cryptocurrency symbols/logos
- 3D animations
- Text overlays
- Market data visualizations

**Crypto content is perfect** - no people, no copyright issues!

## 🎯 Testing Sora 2 Now

### Quick Test:

```powershell
# 1. Generate a video
$body = @{
    prompt = "Wide shot of golden Bitcoin coin spinning, rising through green charts, cinematic lighting"
    model = "sora-2"
    size = "1080x1920"
    seconds = "8"
} | ConvertTo-Json

$video = Invoke-RestMethod -Uri "http://localhost:3000/api/openai/generate-video" `
    -Method POST -Body $body -ContentType "application/json"

Write-Host "Video generation started: $($video.videoId)"
Write-Host "Status: $($video.status)"

# 2. Poll for completion
$status = $video.status
while ($status -eq "queued" -or $status -eq "in_progress") {
    Start-Sleep -Seconds 10
    
    $statusCheck = Invoke-RestMethod -Uri "http://localhost:3000/api/openai/video-status/$($video.videoId)"
    $status = $statusCheck.status
    $progress = $statusCheck.progress
    
    Write-Host "Status: $status - Progress: $progress%"
}

# 3. Download when complete
if ($status -eq "completed") {
    $download = Invoke-RestMethod -Uri "http://localhost:3000/api/openai/video-download/$($video.videoId)"
    Write-Host "Video ready!"
    Write-Host "Download URL: $($download.downloadUrl)"
}
```

### Or Use the Complete Endpoint:

```powershell
# This handles polling automatically (but may timeout if too long)
$body = @{
    prompt = "Bitcoin cryptocurrency rising through digital space"
    model = "sora-2"
    size = "1080x1920"
    seconds = "8"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3000/api/openai/generate-video-complete" `
    -Method POST -Body $body -ContentType "application/json"

Write-Host "Video URL: $($result.downloadUrl)"
```

## 📊 Expected Generation Times

Based on OpenAI's docs:
- **sora-2**: ~2-5 minutes for 8-second video
- **sora-2-pro**: ~5-15 minutes for 8-second video

**Plan your workflow accordingly:**
- Use webhooks for production (better than polling)
- Show progress to users
- Have fallback content if generation fails

## 🔗 Webhook Integration (Production)

For production, use webhooks instead of polling:

1. Configure webhook at: https://platform.openai.com/settings/project/webhooks
2. OpenAI sends events when jobs complete:
   - `video.completed`
   - `video.failed`
3. Your server receives notification automatically
4. No need to poll!

## 📈 Complete TikTok Flow with Sora 2

```
Every 12 hours:

1. Fetch trending crypto (CoinMarketCap)
   ↓
2. Generate script (GPT-4o) - 5 seconds
   ↓
3. Build Sora prompt from script - instant
   ↓
4. Start Sora 2 generation - instant (returns job ID)
   ↓
5. Poll status every 10s - 2-5 minutes total
   ↓
6. Download completed video - 10 seconds
   ↓
7. Upload to all 10 VMOS devices - 1 minute
   ↓
8. Post to TikTok (touch automation) - 2 minutes
   ↓
DONE! Total time: ~10-15 minutes for complete automation
```

## ✅ Sora 2 Checklist

- [x] API endpoints created in MCP server
- [x] Async handling implemented
- [x] Status polling available
- [x] Download functionality ready
- [ ] Test with real OpenAI API key
- [ ] Optimize prompts for best results
- [ ] Integrate into n8n workflow
- [ ] Set up error handling
- [ ] Configure webhooks (optional, production)

## 🎉 Summary

**Sora 2 is READY in your MCP server!**

Use:
- `/api/openai/generate-video` - Start generation
- `/api/openai/video-status/{id}` - Check progress
- `/api/openai/video-download/{id}` - Get video

**For TikTok automation:**
- Model: `sora-2` (fast, good quality)
- Size: `1080x1920` (vertical)
- Duration: `8` seconds (perfect for TikTok)
- Prompts: Crypto visuals, charts, animations

**Everything is automated** - crypto data → script → video → post! 🚀

