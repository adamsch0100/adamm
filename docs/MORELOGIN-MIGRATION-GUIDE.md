# MoreLogin Migration Guide

Complete guide for migrating from VMOS Cloud to MoreLogin for TikTok automation.

## 🎯 Overview

This migration updates your TikTok automation system to use **MoreLogin Cloud Phones** instead of VMOS Cloud. MoreLogin provides better proxy management, improved reliability, and simpler authentication.

## 📋 Table of Contents

- [What Changed](#what-changed)
- [Prerequisites](#prerequisites)
- [Step-by-Step Migration](#step-by-step-migration)
- [Testing the Migration](#testing-the-migration)
- [Troubleshooting](#troubleshooting)
- [Key Differences](#key-differences)

---

## What Changed

### Authentication
- **Before (VMOS):** HMAC-SHA256 signature with complex string construction
- **After (MoreLogin):** Simple MD5 hash: `MD5(API_ID + NonceId + SecretKey)`

### API Endpoints
| Function | Old (VMOS) | New (MoreLogin) |
|----------|------------|-----------------|
| List devices | `/api/vmos/instances` | `/api/morelogin/instances` |
| TikTok actions | `/api/vmos/tk/action` | `/api/tiktok/action` |
| Upload file | `/api/vmos/upload` | `/api/morelogin/upload` |
| Posting | `/api/vmos/tk/post-sequence` | `/api/tiktok/post-sequence` |

### Automation Method
- **Before:** VMOS `simulateTouch` API for touch simulation
- **After:** Direct ADB commands (more reliable, more control)

### Request Parameters
- **Before:** `instanceId` for device identification
- **After:** `cloudPhoneId` for device identification

---

## Prerequisites

### 1. Get MoreLogin API Credentials

1. Sign up or log in to [MoreLogin](https://www.morelogin.com)
2. Navigate to **Profile > API Settings**
3. Note your:
   - **API ID** (e.g., `123456789`)
   - **Secret Key** (e.g., `abc123xyz`)

### 2. Create/Configure Cloud Phones

1. In MoreLogin dashboard, create at least 1 cloud phone:
   - **Model:** Choose Model X (10002) or Model Y (10004)
   - **Location:** Set to your target country (e.g., US)
   - **Proxy:** Assign your Soax/Decado mobile proxy (optional, recommended)

2. Enable ADB for each cloud phone (required for automation)

### 3. Backup Current Setup

```powershell
# Backup your .env file
Copy-Item .env .env.vmos.backup

# Backup workflows
Copy-Item warmup-workflow.json warmup-workflow.vmos.backup.json
Copy-Item content-workflow.json content-workflow.vmos.backup.json
```

---

## Step-by-Step Migration

### Step 1: Update Environment Variables

Open your `.env` file and replace VMOS credentials with MoreLogin:

**Before:**
```env
VMOS_API_URL=https://api.vmoscloud.com
VMOS_ACCESS_KEY=your_vmos_access_key
VMOS_SECRET_KEY=your_vmos_secret_key
```

**After:**
```env
MORELOGIN_API_URL=https://api.morelogin.com
MORELOGIN_API_ID=your_api_id
MORELOGIN_SECRET_KEY=your_secret_key
```

**Example:**
```env
MORELOGIN_API_URL=https://api.morelogin.com
MORELOGIN_API_ID=123456789
MORELOGIN_SECRET_KEY=abc123xyz
```

### Step 2: Update MCP Server

The `mcp-server.js` has been completely rewritten. No manual changes needed - the new version is already in place.

Key changes:
- New `generateMoreLoginHeaders()` function for MD5 authentication
- New `ADBHelper` class for direct ADB commands
- Updated all endpoint paths
- Replaced `instanceId` with `cloudPhoneId`

### Step 3: Update n8n Workflows

The workflows have been automatically updated. Changes include:

**warmup-workflow.json:**
- `Fetch VMOS Instances` → `Fetch MoreLogin Instances`
- Endpoint: `/api/vmos/instances` → `/api/morelogin/instances`
- Action endpoint: `/api/vmos/tk/action` → `/api/tiktok/action`
- Parameter: `instanceId` → `cloudPhoneId`

**content-workflow.json:**
- Endpoint: `/api/vmos/instances` → `/api/morelogin/instances`
- Upload: `/api/vmos/upload` → `/api/morelogin/upload`
- Posting: `/api/vmos/tk/post-sequence` → `/api/tiktok/post-sequence`
- Parameter: `instanceId` → `cloudPhoneId`

### Step 4: Enable ADB on Cloud Phones

Before you can run automation, enable ADB:

**Option A: Via API (Recommended)**

```powershell
$cloudPhoneIds = @(1571806316503059)  # Your cloud phone IDs

Invoke-RestMethod -Uri "http://localhost:3000/api/morelogin/adb/enable" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    cloudPhoneIds = $cloudPhoneIds
  } | ConvertTo-Json)
```

**Option B: Via MoreLogin Dashboard**
1. Go to MoreLogin dashboard
2. Select your cloud phone
3. Click "Enable ADB"
4. Note the ADB connection details (IP, Port, Password)

### Step 5: Install Dependencies

```powershell
# Ensure all npm packages are installed
npm install

# Verify ADB is installed on your system
adb version

# If ADB not found, install Android Platform Tools
# Download from: https://developer.android.com/tools/releases/platform-tools
```

### Step 6: Restart Services

```powershell
# Stop any running processes
# Press Ctrl+C if MCP server is running

# Start the updated MCP server
.\start-mcp-server.ps1

# In a new terminal, start n8n
npm run n8n
```

---

## Testing the Migration

### Test 1: Run the Test Script

```powershell
.\test-morelogin.ps1
```

This script will:
- ✓ Check MCP server health
- ✓ Test MoreLogin API connection
- ✓ List your cloud phones
- ✓ Test OpenAI API
- ✓ Test CoinMarketCap API
- ✓ Optional: Test ADB connection

**Expected Output:**
```
=== MoreLogin Integration Test ===

1. Testing MCP Server Health...
   ✓ MCP Server is running (Platform: MoreLogin)

2. Testing MoreLogin API Connection...
   ✓ Successfully connected to MoreLogin API
   Found 1 cloud phone(s)

   Cloud Phones:
   - ID: 1571806316503059
     Name: TikTok Account #1
     Status: Running
     ADB: Enabled
     ADB IP: 192.168.1.100:5555
```

### Test 2: Test Individual Endpoints

**List Cloud Phones:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/morelogin/instances" | ConvertTo-Json
```

**Test TikTok Action (Scroll):**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tiktok/action" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    cloudPhoneId = 1571806316503059
    action = "scroll_feed"
    params = @{
      screenWidth = 1080
      screenHeight = 1920
    }
  } | ConvertTo-Json)
```

### Test 3: Import and Test Workflows

1. **Open n8n:** `http://localhost:5678`
2. **Import workflows:**
   - Go to **Workflows > Import from File**
   - Import `warmup-workflow.json`
   - Import `content-workflow.json`
3. **Test warmup workflow:**
   - Open "TikTok Account Warm-Up"
   - Click **Execute Workflow**
   - Verify actions execute on your cloud phone
4. **Test content workflow:**
   - Open "TikTok Multi-Video Content Creation & Posting"
   - Click **Execute Workflow**
   - Wait for campaign generation (this takes time!)

---

## Troubleshooting

### Issue: "MoreLogin API ID not configured"

**Solution:**
1. Check your `.env` file
2. Ensure `MORELOGIN_API_ID` is set to your actual API ID (not placeholder)
3. Restart MCP server: `Ctrl+C` then `.\start-mcp-server.ps1`

### Issue: "ADB not available for this cloud phone"

**Solution:**
1. Enable ADB:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/morelogin/adb/enable" `
     -Method Post `
     -ContentType "application/json" `
     -Body (@{ cloudPhoneIds = @(YOUR_PHONE_ID) } | ConvertTo-Json)
   ```
2. Wait 30 seconds for ADB to activate
3. Fetch instances again to get ADB connection info

### Issue: "adb: command not found"

**Solution:**
1. Download Android Platform Tools: https://developer.android.com/tools/releases/platform-tools
2. Extract to `C:\platform-tools\`
3. Add to PATH:
   ```powershell
   $env:Path += ";C:\platform-tools"
   # For permanent: System Properties > Environment Variables > Path
   ```
4. Verify: `adb version`

### Issue: "Failed to connect to MoreLogin API"

**Possible causes:**
1. **Invalid credentials:** Double-check API ID and Secret Key
2. **Network issue:** Check internet connection
3. **API service down:** Visit https://status.morelogin.com (if available) or contact support

**Debug:**
```powershell
# Test direct API call
$apiId = "YOUR_API_ID"
$secretKey = "YOUR_SECRET_KEY"
$nonceId = "$(Get-Date -UFormat %s):test123"
$authString = "$apiId$nonceId$secretKey"
$auth = (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($authString))) -Algorithm MD5).Hash.ToLower()

$headers = @{
  "Content-Type" = "application/json"
  "X-Api-Id" = $apiId
  "X-Nonce-Id" = $nonceId
  "Authorization" = $auth
}

Invoke-RestMethod -Uri "https://api.morelogin.com/api/cloudphone/page" `
  -Method Post `
  -Headers $headers `
  -Body (@{ pageNo = 1; pageSize = 10 } | ConvertTo-Json)
```

### Issue: "Touch commands not working"

**Solution:**
MoreLogin uses ADB for automation. Verify:
1. ADB is enabled on cloud phone
2. ADB connection is successful
3. Coordinates are correct for device resolution

**Adjust coordinates if needed in `mcp-server.js`:**
```javascript
// TikTok like button position
const likeX = screenWidth * 0.9;  // Adjust multiplier
const likeY = screenHeight * 0.6; // Adjust multiplier
```

### Issue: n8n workflows not importing

**Solution:**
1. Ensure n8n is version 1.19.0 or higher: `npm list n8n`
2. Update if needed: `npm update n8n`
3. Clear n8n cache: Delete `.n8n` folder in your home directory
4. Restart n8n: `npm run n8n`

---

## Key Differences Between VMOS and MoreLogin

| Feature | VMOS Cloud | MoreLogin |
|---------|-----------|-----------|
| **Authentication** | HMAC-SHA256 (complex) | MD5 hash (simple) |
| **Touch Simulation** | Custom `simulateTouch` API | Direct ADB commands |
| **Proxy Management** | Manual/external | Built-in API |
| **Group Management** | Not available | Built-in grouping |
| **Device Models** | Generic | Model X, Model Y (configurable) |
| **ADB Access** | Via separate endpoint | Integrated, easy toggle |
| **API Documentation** | Limited | Comprehensive |
| **Cost** | ~$30-50/device/month | Varies by model |

### Advantages of MoreLogin

1. **Simpler Authentication:** No need for complex signature generation
2. **Better Proxy Support:** Built-in proxy management API
3. **More Reliable:** Direct ADB commands vs API-mediated touch
4. **Better Documentation:** Clear examples and support
5. **Flexible Grouping:** Organize cloud phones by campaign/purpose

---

## Post-Migration Checklist

- [ ] `.env` file updated with MoreLogin credentials
- [ ] MCP server starts without errors
- [ ] Test script (`test-morelogin.ps1`) passes all checks
- [ ] Cloud phones visible in instance list
- [ ] ADB enabled on all cloud phones
- [ ] ADB connection info available (IP, Port, Password)
- [ ] Test TikTok action (scroll) successful
- [ ] Warmup workflow imported into n8n
- [ ] Content workflow imported into n8n
- [ ] Test warmup workflow execution successful
- [ ] Proxies configured and assigned (if using)

---

## Need Help?

### MoreLogin Support
- **Telegram:** https://t.me/moreloginsupport
- **Facebook:** https://www.messenger.com/t/101496179431654
- **WhatsApp:** +8618005008913

### Documentation
- **API Reference:** `MORELOGIN-API-DOCS.md`
- **Official Docs:** https://support.morelogin.com/en/collections/10925243-api
- **GitHub Examples:** https://github.com/MoreLoginBrowser/MoreLogin-API-Demos

### Common Resources
- **Android Platform Tools:** https://developer.android.com/tools/releases/platform-tools
- **ADB Commands:** https://adbshell.com/
- **n8n Documentation:** https://docs.n8n.io/

---

## Rollback (If Needed)

If you need to rollback to VMOS:

```powershell
# Restore backups
Copy-Item .env.vmos.backup .env
Copy-Item warmup-workflow.vmos.backup.json warmup-workflow.json
Copy-Item content-workflow.vmos.backup.json content-workflow.json

# Restore old mcp-server.js from git
git checkout HEAD -- mcp-server.js

# Reinstall dependencies
npm install

# Restart server
.\start-mcp-server.ps1
```

---

**Migration Complete!** 🎉

Your TikTok automation system is now running on MoreLogin Cloud Phones with improved reliability and features.

