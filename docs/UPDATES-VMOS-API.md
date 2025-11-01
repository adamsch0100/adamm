# VMOS API Integration Updates

## ✅ Updates Based on Official VMOS API Documentation

Based on the official VMOS Cloud API documentation at https://cloud.vmoscloud.com/vmoscloud/doc/en/server/OpenAPI.html, the following updates have been made to the TikTok automation system:

## 🔐 Authentication Changes

### Before
- Simple Bearer token authentication
- Single `VMOS_API_KEY` environment variable

### After ✓
- **HMAC-SHA256 signature authentication**
- Two environment variables:
  - `VMOS_ACCESS_KEY` - Access Key ID
  - `VMOS_SECRET_KEY` - Secret Access Key
- Automatic signature generation in MCP server

### New Signature Function
The `mcp-server.js` now includes `generateVMOSSignature()` which:
1. Generates UTC timestamp in ISO 8601 format
2. Calculates SHA256 hash of request body
3. Constructs canonical string
4. Signs with HMAC-SHA256
5. Adds all required headers:
   - `x-date`
   - `x-host`
   - `authorization`
   - `Content-Type`
   - `x-content-sha256`

## 🌐 API Endpoint Updates

### API Host
- **Changed from**: `https://api.vmoscloud.com/v1`
- **Changed to**: `https://api.vmoscloud.com`

### Endpoint Paths

#### Get Instances
```
Before: /instances
After:  /vcpcloud/api/padInstanceApi/queryPadInstancePage
Method: POST (changed from GET)
```

#### Upload File
```
Before: /files/upload
After:  /vcpcloud/api/padFileApi/uploadFileByUrl
Method: POST
```

#### Execute Actions
```
Before: /tasks
After:  /vcpcloud/api/automationApi/createTask
Method: POST
```

#### Post to TikTok
```
Before: /tk/post
After:  /vcpcloud/api/automationApi/createTask (with custom task type)
Method: POST
```

## 📦 Request/Response Format Updates

### Query Instances Request
```json
{
  "pageNum": 1,
  "pageSize": 100
}
```

### Query Instances Response
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [...],
    "total": 10
  }
}
```

### Upload File Request
```json
{
  "padCode": "AC22030022001",
  "url": "https://example.com/video.mp4",
  "fileName": "video.mp4",
  "filePath": "/sdcard/DCIM/"
}
```

### Response Code Handling
- Now checking for `response.data.code === 200` instead of HTTP status
- Extracting data from `response.data.data`
- Using `padCode` instead of `instance_id` or `instanceId`

## 📝 Environment Variables Updated

### `.env.example`
```diff
- VMOS_API_KEY=your_vmos_api_key_here
+ VMOS_ACCESS_KEY=your_vmos_access_key_id_here
+ VMOS_SECRET_KEY=your_vmos_secret_access_key_here
```

## 🔧 n8n Workflow Updates

### Removed Credential Requirements
- **Before**: Workflows required VMOS API Key and CoinMarketCap API Key credentials in n8n
- **After**: All API authentication handled by MCP server via `.env` file
- **Result**: Simplified setup - only Gmail credentials needed in n8n (optional)

### Updated Workflow Files
1. `warmup-workflow.json` - Removed VMOS credential reference
2. `content-workflow.json` - Removed VMOS and CoinMarketCap credential references

## 📚 New Documentation

### VMOS-SETUP-GUIDE.md
Comprehensive guide covering:
- Authentication mechanism explained
- API endpoints with examples
- Device setup instructions
- TikTok automation best practices
- Custom script recommendations
- Callback/webhook information
- Troubleshooting VMOS-specific issues
- Contact information for VMOS support

## 🛠️ Technical Implementation Details

### MCP Server (mcp-server.js)

#### New Imports
```javascript
const crypto = require('crypto'); // For HMAC-SHA256
```

#### Signature Generation
```javascript
function generateVMOSSignature(method, path, body = '') {
  // Implements VMOS HMAC-SHA256 signature calculation
  // Returns headers object with all required authentication headers
}
```

#### Updated Endpoints
All VMOS endpoints now:
1. Use correct API paths
2. Call `generateVMOSSignature()` for headers
3. Handle VMOS response format (code/msg/data)
4. Extract data from nested response structure

## 🎯 Key Benefits

1. **Secure Authentication**: HMAC-SHA256 is more secure than simple API keys
2. **Automatic Handling**: Signature calculation completely automated
3. **Simplified Setup**: Users only need to add 2 keys to `.env` file
4. **No n8n Credentials**: Workflows simplified - no credential management in n8n
5. **Production Ready**: Follows official VMOS API standards

## ⚠️ Important Notes

### TikTok Automation
The TikTok-specific actions (scroll, like, search, post) require:
1. **Custom scripts** in VMOS Cloud
2. **Automation tasks** configured in VMOS dashboard
3. **TikTok app** installed on all virtual phones

### API Endpoints to Implement
Based on VMOS documentation, additional endpoints available:
- Install/uninstall applications
- Start/stop/restart apps
- Modify device properties (location, language, timezone)
- Proxy configuration
- Contact management
- Image upgrades

These can be added to the MCP server as needed.

## 📞 Getting VMOS Credentials

**To obtain Access Key and Secret Key:**
1. Sign up at https://cloud.vmoscloud.com/
2. Contact technical support:
   - **Email**: start@vmoscloud.com
   - **WeChat**: See documentation for code
   - **Telegram**: See documentation for link

## 🔍 Testing Changes

### Test MCP Server
```powershell
.\start-mcp-server.ps1
```

Check startup output for:
```
✓ VMOS Access Key: Configured
✓ VMOS Secret Key: Configured
📖 VMOS API uses HMAC-SHA256 signature authentication
🔗 API Host: api.vmoscloud.com
```

### Test API Calls
```bash
# Health check
curl http://localhost:3000/health

# Test instances (requires valid credentials)
curl http://localhost:3000/api/vmos/instances
```

## ✨ Next Steps for Users

1. ✅ Update `.env` with VMOS Access Key and Secret Key
2. ✅ Re-import updated workflows into n8n
3. ✅ Test MCP server endpoints
4. ✅ Configure TikTok automation scripts in VMOS
5. ✅ Run test workflows

## 📖 Updated Documentation Files

All documentation has been updated to reflect the new VMOS API integration:
- ✅ `README.md` - Main documentation
- ✅ `QUICKSTART.md` - Quick start guide
- ✅ `.env.example` - Environment variables template
- ✅ `mcp-server.js` - MCP server implementation
- ✅ `warmup-workflow.json` - Warm-up workflow
- ✅ `content-workflow.json` - Content creation workflow
- ✅ `VMOS-SETUP-GUIDE.md` - New comprehensive VMOS guide
- ✅ `UPDATES-VMOS-API.md` - This document

---

**Status**: All updates complete and ready for use! 🚀

