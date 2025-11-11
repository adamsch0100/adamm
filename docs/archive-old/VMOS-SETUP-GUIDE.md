# VMOS Cloud Setup Guide for TikTok Automation

This guide explains how to set up and use VMOS Cloud with the TikTok automation system.

## 📖 VMOS API Documentation

**Official API Documentation**: https://cloud.vmoscloud.com/vmoscloud/doc/en/server/OpenAPI.html

**API Host**: `api.vmoscloud.com`

## 🔐 Authentication

VMOS Cloud uses **HMAC-SHA256 signature authentication** for API requests.

### Required Credentials

1. **Access Key ID** - Your account's access key identifier
2. **Secret Access Key** - Your account's secret key for signing requests

### How to Get Credentials

Contact VMOS Cloud technical support to obtain your Access Key ID and Secret Access Key:
- **Email**: start@vmoscloud.com
- **WeChat**: Get WeChat Code (see documentation)
- **Telegram**: Available in documentation

### Authentication Headers

Every API request requires these headers:

```
x-date: 20250109T120000Z           # UTC timestamp
x-host: api.vmoscloud.com          # API host
authorization: HMAC-SHA256 ...     # Calculated signature
Content-Type: application/json     # JSON content
x-content-sha256: <hash>           # SHA256 of request body
```

## 🎯 API Endpoints Used by This System

### 1. Query Cloud Phone Instances

**Endpoint**: `/vcpcloud/api/padInstanceApi/queryPadInstancePage`  
**Method**: POST  
**Purpose**: Get list of all your virtual phone devices

**Request**:
```json
{
  "pageNum": 1,
  "pageSize": 100
}
```

**Response**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [
      {
        "padCode": "AC22030022001",
        "status": 1,
        "name": "Device 1",
        ...
      }
    ],
    "total": 10
  }
}
```

### 2. Upload File by URL

**Endpoint**: `/vcpcloud/api/padFileApi/uploadFileByUrl`  
**Method**: POST  
**Purpose**: Upload a video file to a virtual phone

**Request**:
```json
{
  "padCode": "AC22030022001",
  "url": "https://example.com/video.mp4",
  "fileName": "tiktok_video.mp4",
  "filePath": "/sdcard/DCIM/"
}
```

**Response**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": 12345,
    "fileId": "cf08f7b685ab3a7b6a793b30de1b33ae34",
    "filePath": "/sdcard/DCIM/tiktok_video.mp4"
  }
}
```

### 3. Create Automation Task

**Endpoint**: `/vcpcloud/api/automationApi/createTask`  
**Method**: POST  
**Purpose**: Create automated tasks for TikTok actions

**Request**:
```json
{
  "padCode": "AC22030022001",
  "taskType": "custom_script",
  "taskParams": {
    "action": "scroll_feed",
    "count": 5
  }
}
```

**Response**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": 10613
  }
}
```

## 🔧 Setting Up VMOS Devices

### Step 1: Purchase Virtual Phones

1. Go to VMOS Cloud dashboard
2. Purchase 10 virtual phone instances
3. Choose appropriate specifications:
   - **Android Version**: 9 or higher (recommended)
   - **Memory**: 2GB+ per instance
   - **Storage**: 16GB+ per instance

### Step 2: Install TikTok

For each virtual phone:
1. Access the device via VMOS web interface
2. Install TikTok app (com.zhiliaoapp.musically)
3. Set up TikTok accounts or log in to existing accounts

**Via API (Application Installation)**:
```
Endpoint: /vcpcloud/api/padFileApi/installApp
Method: POST
```

### Step 3: Configure Device Properties

Recommended settings for TikTok automation:
- **Location**: Set GPS coordinates for target region
- **Language**: English or target language
- **Timezone**: Match your target audience
- **WiFi**: Configure if needed

**Via API (Modify Instance Properties)**:
```
Endpoint: /vcpcloud/api/padInstanceApi/modifyPadInstanceProperties
Method: POST
```

## 🤖 TikTok Automation Setup

### Understanding VMOS Automation

VMOS Cloud provides automation capabilities through:
1. **Automated Tasks API** - Create scheduled tasks
2. **Custom Scripts** - Write custom automation logic
3. **App Control** - Start/stop/restart applications

### TikTok Actions to Automate

The system needs to perform these TikTok actions:

#### 1. Scroll Feed
- Simulates scrolling through TikTok feed
- Random scroll speed and duration
- Pauses to view videos

#### 2. Like Videos
- Randomly likes 5-10 videos
- Natural timing between likes
- Varied interaction patterns

#### 3. Search
- Searches for "crypto mining" and related terms
- Scrolls through search results
- Occasionally clicks on profiles

#### 4. Watch Videos
- Watches videos to completion
- Varies watch time (skip some, watch others fully)
- Realistic viewing patterns

#### 5. Follow Accounts
- Follows 1-3 crypto-related accounts per session
- Checks profile before following
- Natural delays between follows

### Implementing Custom Scripts

You'll need to create custom automation scripts in VMOS for TikTok:

**Example Script Structure**:
```javascript
// TikTok Scroll Feed Automation
function scrollFeed() {
  // Launch TikTok
  launchApp("com.zhiliaoapp.musically");
  sleep(3000);
  
  // Scroll feed 5-10 times
  for (let i = 0; i < randomInt(5, 10); i++) {
    swipe(540, 1500, 540, 500, randomInt(300, 600));
    sleep(randomInt(2000, 5000));
  }
}
```

**Note**: Contact VMOS support for detailed automation scripting documentation.

## 📦 Package Names

Important Android package names for TikTok:

- **TikTok**: `com.zhiliaoapp.musically`
- **TikTok Lite**: `com.zhiliaoapp.musically.go`

Use these when creating automation tasks or controlling the app.

## 🔄 Callbacks and Webhooks

VMOS Cloud supports callbacks for async operations. Configure your callback URL in the VMOS dashboard.

### Callback Types

1. **File Upload Callback** (taskBusinessType: 1009)
2. **App Installation Callback** (taskBusinessType: 1003)
3. **App Uninstallation Callback** (taskBusinessType: 1004)
4. **App Start Callback** (taskBusinessType: 1007)
5. **App Stop Callback** (taskBusinessType: 1005)
6. **App Restart Callback** (taskBusinessType: 1006)

### Callback Example

```json
{
  "taskBusinessType": 1009,
  "taskId": 10659,
  "result": true,
  "errorCode": null,
  "padCode": "AC22030022001",
  "fileId": "cfec132ab3c4e1aff5515c4467d9bbe460",
  "taskResult": "Success",
  "taskStatus": 3
}
```

## 🛠️ Integration with MCP Server

The MCP server (`mcp-server.js`) handles:

1. **Signature Generation** - Automatically calculates HMAC-SHA256 signatures
2. **Request Headers** - Adds required authentication headers
3. **API Endpoints** - Wraps VMOS API for easier n8n integration
4. **Error Handling** - Processes VMOS response codes

### How Signature Works

```javascript
// The MCP server automatically:
1. Generates UTC timestamp (x-date)
2. Calculates SHA256 hash of request body
3. Constructs canonical string
4. Signs with HMAC-SHA256 using secret key
5. Adds all headers to request
```

You don't need to handle this manually - the MCP server does it for you!

## 📝 Common API Response Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid parameters |
| 401  | Unauthorized - Invalid credentials |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error |

## 🚨 Rate Limits

VMOS Cloud has rate limits (varies by plan):
- Check your plan documentation
- Implement delays between bulk operations
- Use batch operations when available

## 💡 Best Practices

### 1. Device Management
- Name your devices clearly (e.g., "TikTok-Bot-01")
- Monitor device status regularly
- Keep devices online during automation

### 2. Automation Safety
- Start with conservative action counts
- Gradually increase activity over time
- Mimic human behavior patterns
- Use random delays and variations

### 3. TikTok Account Safety
- Warm up accounts for 7-14 days before posting
- Don't perform identical actions across all accounts
- Vary timing and behavior patterns
- Monitor for any TikTok warnings

### 4. API Usage
- Cache instance lists to reduce API calls
- Handle errors gracefully with retries
- Log all API responses for debugging
- Monitor callback notifications

## 🔍 Troubleshooting

### Issue: "401 Unauthorized"
**Cause**: Invalid Access Key or Secret Key  
**Solution**: 
- Verify credentials in `.env` file
- Check that keys haven't expired
- Contact VMOS support to regenerate keys

### Issue: "Signature verification failed"
**Cause**: Incorrect signature calculation  
**Solution**:
- Ensure system clock is synchronized
- Verify body is properly formatted JSON
- Check that body isn't modified after signing

### Issue: "Device not found"
**Cause**: Invalid padCode or device offline  
**Solution**:
- Verify device exists in VMOS dashboard
- Check device status (should be online)
- Query instances API to get valid padCodes

### Issue: "Task failed"
**Cause**: Various automation issues  
**Solution**:
- Check device screen via VMOS dashboard
- Verify TikTok app is installed and logged in
- Review task parameters
- Check automation script logic

## 📚 Additional Resources

- **VMOS Dashboard**: https://cloud.vmoscloud.com/
- **API Documentation**: https://cloud.vmoscloud.com/vmoscloud/doc/en/server/OpenAPI.html
- **Android SDK**: Available in documentation
- **Web H5 SDK**: For web-based device control
- **Windows PC SDK**: For desktop integration

## 🆘 Support

If you need help with VMOS Cloud:

1. **Email**: start@vmoscloud.com
2. **WeChat**: Available in documentation
3. **Telegram**: Check documentation for link

For issues with this automation system, check:
- `README.md` - Complete system documentation
- `QUICKSTART.md` - Quick setup guide
- MCP server logs for API errors

---

**Next Steps**: After setting up VMOS credentials, continue with the main setup process in `QUICKSTART.md`.

