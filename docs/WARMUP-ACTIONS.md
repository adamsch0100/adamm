# TikTok Warm-Up Actions Guide

## Overview

This document details all available TikTok automation actions for account warm-up using ADB commands through the MoreLogin cloud phones.

## Available Actions

### Main Feed Actions

#### scroll_feed
Scrolls to the next video in the TikTok feed.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "scroll_feed"
}
```

**Coordinates:** Center X (50%), swipe from 75% to 25% of screen height
**Duration:** 400ms

---

#### like_video
Taps the like button on the current video.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "like_video"
}
```

**Coordinates:** 90% width, 52% height (right side, middle area)

---

### Search Actions

#### tap_search
Opens the search interface.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "tap_search"
}
```

**Coordinates:** 90% width, 8% height (top right corner)

---

#### type_text
Types text into the focused input field.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "type_text",
  "params": {
    "text": "bitcoin"
  }
}
```

**Parameters:**
- `text` (string, required): The text to type

---

#### tap_search_enter
Executes the search (taps the search/enter button).

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "tap_search_enter"
}
```

**Coordinates:** 90% width, 8% height (same as search icon)

---

### Search Results Actions

#### tap_search_tab
Taps one of the search result tabs (Top, Users, LIVE, Videos, Shop).

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "tap_search_tab",
  "params": {
    "tab": "users"
  }
}
```

**Parameters:**
- `tab` (string, required): One of `top`, `users`, `live`, `videos`, `shop`

**Coordinates:**
- Top: 20% width
- Users: 35% width
- LIVE: 50% width
- Videos: 65% width
- Shop: 80% width
- Y: 15% height

---

#### tap_video_result
Taps on a video in the search results grid.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "tap_video_result",
  "params": {
    "position": 1
  }
}
```

**Parameters:**
- `position` (number, required): Grid position 1-6

**Grid Positions:**
```
1: Top left (25%, 35%)      2: Top right (75%, 35%)
3: Middle left (25%, 55%)   4: Middle right (75%, 55%)
5: Bottom left (25%, 75%)   6: Bottom right (75%, 75%)
```

---

### User Actions

#### tap_user_profile
Taps on a user profile in the users list.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "tap_user_profile",
  "params": {
    "position": 1
  }
}
```

**Parameters:**
- `position` (number, required): List position 1-7

**Coordinates:** Center X (50%), Y varies by position (25% to 85%)

---

#### tap_follow_button
Taps the follow button for a user in the list.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "tap_follow_button",
  "params": {
    "position": 1
  }
}
```

**Parameters:**
- `position` (number, required): List position 1-7

**Coordinates:** 85% width, Y varies by position (25% to 85%)

---

#### scroll_users
Scrolls down in the users list.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "scroll_users"
}
```

**Coordinates:** Center X (50%), swipe from 80% to 20% of screen height

---

### Navigation Actions

#### tap_back
Taps the back button to return to the previous screen.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "tap_back"
}
```

**Coordinates:** 10% width, 8% height (top left corner)

---

### Custom Actions

#### tap_custom
Taps at specific coordinates.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "tap_custom",
  "params": {
    "x": 540,
    "y": 960
  }
}
```

**Parameters:**
- `x` (number, required): X coordinate in pixels
- `y` (number, required): Y coordinate in pixels

---

#### swipe_custom
Performs a custom swipe gesture.

**Usage:**
```json
{
  "cloudPhoneId": "1665216846020012",
  "action": "swipe_custom",
  "params": {
    "x1": 540,
    "y1": 1440,
    "x2": 540,
    "y2": 480,
    "duration": 400
  }
}
```

**Parameters:**
- `x1` (number, required): Starting X coordinate
- `y1` (number, required): Starting Y coordinate
- `x2` (number, required): Ending X coordinate
- `y2` (number, required): Ending Y coordinate
- `duration` (number, optional): Swipe duration in milliseconds (default: 400)

---

## Screen Dimensions

Default screen dimensions used by the automation:
- **Width:** 1080px
- **Height:** 1920px

Coordinates are calculated as percentages of these dimensions for flexibility across different screen sizes.

---

## Warm-Up Best Practices

### Timing and Delays

1. **Random delays between actions:** 3-7 seconds
2. **After likes:** 2-3 seconds
3. **After search:** 2-3 seconds for results to load
4. **Between videos:** 5-8 seconds to mimic watching

### Action Frequency

1. **Main feed scrolling:** 10-15 scrolls per session
2. **Likes:** 40% chance per video (4-6 likes per session)
3. **Searches:** 2-3 different topics per session
4. **Follows:** 1-2 users per search

### Session Structure

**Recommended 10-15 minute warm-up session:**

1. **Startup (1-2 min):**
   - Power on device
   - Wait for boot
   - Enable ADB
   - Launch TikTok

2. **Main feed engagement (8 min):**
   - Scroll feed 10-15 times
   - Like videos randomly (40% chance)
   - Random delays between actions

3. **Search & explore (4 min):**
   - Search 2-3 crypto topics
   - Alternate between Users and Videos tabs
   - Follow 1-2 users OR watch 1 video per search

4. **Final engagement (2 min):**
   - Scroll feed 5-8 more times
   - Random delays

5. **Shutdown:**
   - Power off device

### Crypto Topic Variety

Available crypto topics for searches:
- bitcoin, ethereum, crypto, blockchain, mining
- cryptocurrency, defi, nft, web3, altcoin
- dogecoin, cardano, solana, polkadot, binance
- crypto news, bitcoin mining, ethereum staking
- defi yields, nft marketplace, web3 projects

Use the `/api/utils/random-crypto-topic` endpoint to get a random topic.

---

## Testing Actions

You can test individual actions using curl or PowerShell:

### PowerShell Example:
```powershell
$body = @{
    cloudPhoneId = "1665216846020012"
    action = "scroll_feed"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tiktok/action" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Curl Example:
```bash
curl -X POST http://localhost:3000/api/tiktok/action \
  -H "Content-Type: application/json" \
  -d '{
    "cloudPhoneId": "1665216846020012",
    "action": "like_video"
  }'
```

---

## Troubleshooting

### Action doesn't work

1. **Check ADB connection:**
   - Ensure cloud phone is powered on
   - Verify ADB is enabled
   - Wait 10s after enabling ADB

2. **Check coordinates:**
   - Screen dimensions may vary
   - Use `tap_custom` to test exact coordinates
   - Adjust percentages if needed

3. **Check timing:**
   - Add delays between actions
   - Wait for screens to fully load
   - TikTok app may need 5s to launch

### App not responding

1. **Restart TikTok:** Use `/api/tiktok/start` endpoint
2. **Restart device:** Power off and on again
3. **Check logs:** Server logs show ADB command output

---

## Cost Optimization

**Cloud phone lifecycle management saves money:**

- **Power on only when needed:** Use `/api/morelogin/poweron`
- **Run warm-up session:** 10-15 minutes
- **Power off when done:** Use `/api/morelogin/poweroff`
- **Result:** Only pay for active minutes

**Recommended schedule:**
- Morning session: 8:00 AM (12 minutes)
- Evening session: 6:00 PM (12 minutes)
- **Total:** ~24 minutes/day per account

---

## Additional Resources

- [MoreLogin API Documentation](MORELOGIN-API-DOCS.md)
- [Complete Warm-Up Workflow](../workflows/warmup-workflow.json)
- [Test Script](../tests/test-morelogin.ps1)


