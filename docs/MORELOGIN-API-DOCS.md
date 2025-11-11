# MoreLogin API Documentation

Complete reference for MoreLogin Cloud Phone API integration.

## Table of Contents

- [Authentication](#authentication)
- [Browser Profile Management](#browser-profile-management) **[LOCAL API - Port 40000]**
- [Cloud Phone Management](#cloud-phone-management) **[Cloud API - api.morelogin.com]**
- [Proxy Management](#proxy-management)
- [Group Management](#group-management)
- [ADB Connection](#adb-connection)
- [Node.js Code Examples](#nodejs-code-examples)
- [Error Handling](#error-handling)

---

## Authentication

MoreLogin API uses **MD5 hash authentication** with custom headers.

### Required Headers

Every API request must include these headers:

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Content-Type` | String | YES | `application/json` |
| `X-Api-Id` | String | YES | Your API ID from MoreLogin Profile settings |
| `X-Nonce-Id` | String | YES | Globally unique ID: `{Timestamp}:{RandomString}` |
| `Authorization` | String | YES | MD5 hash: `MD5(API_ID + NonceId + SecretKey)` |

### Authentication Algorithm

```javascript
const crypto = require('crypto');

function generateMoreLoginHeaders(apiId, secretKey) {
  // Generate nonce (timestamp + random string)
  const nonceId = `${Date.now()}:${Math.random().toString(36).substring(7)}`;
  
  // Create authorization string: API_ID + NonceId + SecretKey
  const authString = apiId + nonceId + secretKey;
  
  // Calculate MD5 hash
  const authorization = crypto.createHash('md5')
    .update(authString)
    .digest('hex');
  
  return {
    'Content-Type': 'application/json',
    'X-Api-Id': apiId,
    'X-Nonce-Id': nonceId,
    'Authorization': authorization
  };
}
```

### Example

**Given:**
- API ID: `123456789`
- NonceId: `abcdef`
- SecretKey: `uvwxyz`

**Authorization value:**
```
MD5("123456789abcdefuvwxyz") = "2d3ad29bb2f48b569521ae0791bc5ca2"
```

---

## Browser Profile Management

**Base URL:** `http://127.0.0.1:40000` (Local MoreLogin Client)

**Note:** Browser Profile APIs communicate with your **local MoreLogin client** running on your machine. The MoreLogin application must be running and logged in to use these endpoints.

### 1. Start Browser Profile

**Endpoint:** `POST /api/env/start`

Start a browser profile and get the debug port for Selenium/Puppeteer automation.

**Request Body:**
```json
{
  "envId": "1795695767353204736",
  "isHeadless": false,
  "cdpEvasion": true,
  "encryptKey": "xxx"
}
```

**Parameters:**
- `envId` (string, optional): Profile ID (required if uniqueId not provided)
- `uniqueId` (integer, optional): Profile order number
- `isHeadless` (boolean, optional): Start in headless mode (v2.36.0+)
- `cdpEvasion` (boolean, optional): Enable CDP feature evasion to reduce detection (v2.36.0+)
- `encryptKey` (string, optional): Private key for end-to-end encrypted profiles

**Response:**
```json
{
  "code": 0,
  "msg": "",
  "data": {
    "envId": "1795695767353204736",
    "debugPort": "61598"
  }
}
```

### 2. Stop Browser Profile

**Endpoint:** `POST /api/env/close`

**Request Body:**
```json
{
  "envId": "1795695767353204736"
}
```

### 3. Quick Create Browser Profile

**Endpoint:** `POST /api/env/create/quick`

Quickly create browser profiles (1-50 at once).

**Request Body:**
```json
{
  "browserTypeId": 1,
  "operatorSystemId": 1,
  "quantity": 1,
  "browserCore": 0,
  "groupId": 0,
  "isEncrypt": 0
}
```

**Parameters:**
- `browserTypeId` (integer, **required**): 1=Chrome, 2=Firefox
- `operatorSystemId` (integer, **required**): 1=Windows, 2=macOS, 3=Android, 4=iOS
- `quantity` (integer, **required**): Number of profiles [1-50]
- `browserCore` (integer): Kernel version (0=auto-match)
- `groupId` (integer): Profile group ID (0=ungrouped)
- `isEncrypt` (integer): Enable end-to-end encryption (0=off, 1=on)

**Response:**
```json
{
  "code": 0,
  "msg": "",
  "data": [1795695767353204736, 1795695767353204737],
  "requestId": "uuid"
}
```

### 4. Get Browser Profile List

**Endpoint:** `POST /api/env/page`

**Request Body:**
```json
{
  "pageNo": 1,
  "pageSize": 10,
  "envName": "",
  "groupId": 0,
  "envId": 0
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "",
  "data": {
    "current": 1,
    "pages": 10,
    "total": 100,
    "dataList": [
      {
        "id": 1795695767353204736,
        "envName": "Profile 1",
        "groupId": 0,
        "proxyId": 12345
      }
    ]
  }
}
```

### 5. Get Browser Profile Status

**Endpoint:** `POST /api/env/status`

Check if a browser profile is currently running.

**Request Body:**
```json
{
  "envId": "1795695767353204736"
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "",
  "data": {
    "envId": "1795695767353204736",
    "status": "running",
    "localStatus": "running",
    "debugPort": "50979",
    "webdriver": "C:\\Users\\..\\webdriver.exe"
  }
}
```

**Status Values:**
- `"running"`: Profile is currently active
- `"stopped"`: Profile is not running

### 6. Delete Browser Profile

**Endpoint:** `POST /api/env/removeToRecycleBin/batch`

Delete profiles (recoverable from trash within 7 days).

**Request Body:**
```json
{
  "envIds": [1795695767353204736],
  "removeEnvData": true
}
```

### 7. Modify Browser Profile

**Endpoint:** `POST /api/env/update`

Update profile settings including proxy, fingerprints, cookies, etc.

**Request Body:**
```json
{
  "envId": 1795695767353204736,
  "envName": "Updated Profile Name",
  "proxyId": 12345,
  "groupId": 0,
  "cookies": "...",
  "advancedSetting": {}
}
```

### 8. Clear Local Profile Cache

**Endpoint:** `POST /api/env/removeLocalCache`

Clear browser data for a profile (v2.28.0+).

**Request Body:**
```json
{
  "envId": "1795695767353204736",
  "localStorage": true,
  "indexedDB": false,
  "cookie": false,
  "extension": false
}
```

### 9. Refresh Fingerprint

**Endpoint:** `POST /api/env/fingerprint/refresh`

Generate new fingerprint for a profile (v2.28.0+).

**Request Body:**
```json
{
  "envId": "1795695767353204736",
  "uaVersion": 129,
  "advancedSetting": {}
}
```

### Browser Profile Advanced Settings

For advanced profile creation/modification, you can customize:

- **Fingerprints:** UA, Canvas, WebGL, AudioContext, ClientRects, Fonts
- **Location:** Timezone, Geolocation, Language
- **Network:** WebRTC settings, Do Not Track
- **Hardware:** CPU cores, Memory, Screen resolution
- **Security:** Port scan protection, Battery status, Bluetooth

See full parameter documentation at: https://support.morelogin.com/en/articles/10204806-browser-profile

### Example: Connect Playwright to MoreLogin Browser

```javascript
const { chromium } = require('playwright');

// 1. Start MoreLogin browser profile
const startResponse = await axios.post('http://127.0.0.1:40000/api/env/start', {
  envId: '1795695767353204736',
  cdpEvasion: true
});

const debugPort = startResponse.data.data.debugPort;

// 2. Connect Playwright via CDP
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);
const context = browser.contexts()[0];
const page = await context.newPage();

// 3. Automate with anti-detect browser
await page.goto('https://twitter.com');

// 4. Close when done
await browser.close();

// 5. Stop MoreLogin profile
await axios.post('http://127.0.0.1:40000/api/env/close', {
  envId: '1795695767353204736'
});
```

---

## Cloud Phone Management

Base URL: `https://api.morelogin.com`

### 1. Getting List of Cloud Phones

**Endpoint:** `POST /api/cloudphone/page`

Query information about your cloud phone profiles.

**Request Body:**
```json
{
  "pageNo": 1,
  "pageSize": 10,
  "bindIp": true,
  "keyword": ""
}
```

**Parameters:**
- `bindIp` (boolean, optional): Filter by proxy binding status
- `keyword` (string, optional): Search by proxy info, group name, tag name, or profile name
- `pageNo` (integer, optional): Current page (default: 1)
- `pageSize` (integer, optional): Items per page (default: 10)
- `sort` (array, optional): Sort by `envName` or `createDate`

**Response:**
```json
{
  "code": 0,
  "msg": "",
  "data": {
    "current": 1,
    "total": 5,
    "dataList": [
      {
        "id": 1571806316503059,
        "envName": "Cloud Phone 1",
        "envStatus": 4,
        "envRemark": "Main TikTok account",
        "enableAdb": true,
        "adbInfo": {
          "success": 1,
          "adbIp": "192.168.1.100",
          "adbPort": "5555",
          "adbPassword": "abc123"
        },
        "proxy": {
          "id": 12345,
          "proxyName": "Soax Mobile Proxy",
          "proxyIp": "proxy.soax.com",
          "proxyPort": 9000
        }
      }
    ]
  }
}
```

**Status Codes:**
- `envStatus`: 0=New, 1=Creation Failed, 2=Stop, 3=Starting, 4=Running, 5=Resetting

### 2. Creating Cloud Phone

**Endpoint:** `POST /api/cloudphone/create`

Create new cloud phone profiles (batch creation supported, up to 10).

**Request Body:**
```json
{
  "quantity": 1,
  "skuId": 10002,
  "altitude": 100,
  "automaticGeo": true,
  "automaticLanguage": true,
  "automaticLocation": true,
  "country": "us",
  "envRemark": "TikTok Account #1",
  "groupId": "",
  "language": "en-US",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "proxyId": 0,
  "timezone": "America/Los_Angeles"
}
```

**Parameters:**
- `quantity` (integer, **required**): Number of cloud phones to create [1-10]
- `skuId` (number, **required**): Model - 10002 (Model X), 10004 (Model Y)
- `altitude` (number): Altitude in meters
- `automaticGeo` (boolean): Auto-match geographic location (default: true)
- `automaticLanguage` (boolean): Auto-match language (default: true)
- `automaticLocation` (boolean): Auto-match timezone/country (default: true)
- `country` (string): Country code (e.g., "us", "uk")
- `envRemark` (string): Profile notes (max 1500 chars)
- `groupId` (string): Assign to specific group
- `latitude`, `longitude` (number): GPS coordinates
- `proxyId` (integer): Proxy ID to assign (0 = none)
- `timezone` (string): Timezone (e.g., "America/New_York")

**Response:**
```json
{
  "code": 0,
  "msg": "",
  "data": [1571806316503059]
}
```

### 3. Start Cloud Phone

**Endpoint:** `POST /api/cloudphone/powerOn`

**Request Body:**
```json
{
  "id": 1571806316503059
}
```

**Response:**
```json
{
  "code": 0,
  "msg": ""
}
```

### 4. Stop Cloud Phone

**Endpoint:** `POST /api/cloudphone/powerOff`

**Request Body:**
```json
{
  "id": 1571806316503059
}
```

### 5. Modify Cloud Phone

**Endpoint:** `POST /api/cloudphone/edit/batch`

Batch modify cloud phone settings (proxy, location, etc.)

**Request Body:**
```json
{
  "id": [1571806316503059, 1571806635916317],
  "proxyId": 12345,
  "country": "us",
  "timezone": "America/Los_Angeles",
  "envRemark": "Updated profile"
}
```

### 6. Delete Cloud Phone

**Endpoint:** `POST /api/cloudphone/delete/batch`

**Description:** Batch delete cloud phone profiles. The MoreLogin application needs to be updated to version 2.9.0 and above.

**Request Body:**
```json
{
  "ids": [1571806316503059]
}
```

**Return Data:**
```json
{
  "code": 0,  // Return result code 0:Normal Other codes are exceptions.
  "msg": "",  // Error message
  "data": {},  // The operation returns data
  "requestId": ""   // Operation Request ID
}
```

### 7. Enable/Disable ADB

**Endpoint:** `POST /api/cloudphone/updateAdb`

**Request Body:**
```json
{
  "enableAdb": true,
  "ids": [1571806316503059]
}
```

### 8. One-Click New Phone

**Endpoint:** `POST /api/cloudphone/newMachine`

Resets cloud phone to factory state.

**Request Body:**
```json
{
  "id": 1571806316503059
}
```

### 9. Upload File

**Endpoint:** `POST /api/cloudphone/uploadFile`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (File, required): File to upload
- `id` (integer, required): Cloud phone ID
- `uploadDest` (string, required): Destination path (e.g., `/sdcard/DCIM/`)

---

## Proxy Management

### 1. Get Proxy List

**Endpoint:** `POST /api/proxyInfo/page`

**Request Body:**
```json
{
  "pageNo": 1,
  "pageSize": 10,
  "isCloudPhoneProxy": true,
  "proxyName": "",
  "proxyCheckStatus": 0
}
```

**Parameters:**
- `isCloudPhoneProxy` (boolean): Filter proxies compatible with cloud phones
- `proxyCheckStatus` (integer): 0=pending, 1=success, 2=failed, 3=unknown error
- `proxyStatus` (integer): 0=Normal, 1=Pending, 2=Upgrading, 3=Expired, 4=Expiring soon

### 2. Add Proxy

**Endpoint:** `POST /api/proxyInfo/add`

**Request Body (for Soax/Decado mobile proxies):**
```json
{
  "proxyName": "Soax Mobile US",
  "proxyIp": "proxy.soax.com",
  "proxyPort": 9000,
  "username": "your_username",
  "password": "your_password",
  "proxyProvider": 0,
  "proxyType": 0,
  "country": "us",
  "city": "Los Angeles",
  "refreshUrl": ""
}
```

**Proxy Provider Codes:**
- 0: HTTP
- 1: HTTPS
- 2: SOCKS5
- 3: SSH
- 13: ABCPROXY
- 14: LunaProxy
- 15: IPHTML
- 16: PiaProxy
- 17: 922S5
- 18: 360Proxy

**Response:**
```json
{
  "code": 0,
  "msg": "",
  "data": 12345
}
```

### 3. Update Proxy

**Endpoint:** `POST /api/proxyInfo/update`

**Request Body:**
```json
{
  "id": 12345,
  "proxyName": "Updated Proxy Name",
  "proxyIp": "new-proxy.soax.com",
  "proxyPort": 9001,
  "username": "new_user",
  "password": "new_pass"
}
```

### 4. Delete Proxy

**Endpoint:** `POST /api/proxyInfo/delete`

**Request Body:**
```json
[1054661322597744600, 1054661322597744601]
```

---

## Group Management

### 1. Get Group List

**Endpoint:** `POST /api/envgroup/page`

**Request Body:**
```json
{
  "pageNo": 1,
  "pageSize": 20,
  "groupName": ""
}
```

### 2. Create Group

**Endpoint:** `POST /api/envgroup/create`

**Request Body:**
```json
{
  "groupName": "TikTok Accounts"
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "",
  "data": 67890
}
```

### 3. Modify Group

**Endpoint:** `POST /api/envgroup/edit`

**Request Body:**
```json
{
  "id": 67890,
  "groupName": "TikTok Main Accounts"
}
```

### 4. Delete Group

**Endpoint:** `POST /api/envgroup/delete`

**Request Body:**
```json
{
  "ids": [67890],
  "isDeleteAllEnv": false
}
```

**Parameters:**
- `isDeleteAllEnv` (boolean): If true, also deletes all cloud phones in this group

---

## ADB Connection

MoreLogin Cloud Phones support ADB (Android Debug Bridge) for automated mobile app control. This enables programmatic interaction with TikTok and other mobile apps for warmup and automation purposes.

### 1. Enable ADB for Cloud Phone

Use the **MoreLogin API "Cloud Phone" - "update Cloud Phone ADB status" interface** to enable ADB:

```javascript
const response = await axios.post(
  `${moreloginApiUrl}/api/cloudphone/updateAdb`,
  {
    ids: [cloudPhoneId],
    enableAdb: true
  },
  { headers: generateMoreLoginHeaders(apiId, secretKey) }
);

if (response.data.code === 0) {
  console.log('ADB enabled successfully');
}
```

**Parameters:**
- `ids` (array): Array of cloud phone IDs to enable ADB for
- `enableAdb` (boolean): Set to `true` to enable ADB

### 2. Get ADB Connection Information

After enabling ADB, retrieve the connection details from the cloud phone profile:

```javascript
const response = await axios.post(
  `${moreloginApiUrl}/api/cloudphone/page`,
  { pageNo: 1, pageSize: 20 },
  { headers: generateMoreLoginHeaders(apiId, secretKey) }
);

const phone = response.data.data.dataList.find(p => p.id === cloudPhoneId);
if (phone?.adbInfo?.success === 1) {
  const { adbIp, adbPort, adbPassword } = phone.adbInfo;
  console.log(`ADB Connection: ${adbIp}:${adbPort} (Password: ${adbPassword})`);
}
```

**ADB Info Response:**
- `adbIp`: IP address for ADB connection
- `adbPort`: Port number for ADB connection
- `adbPassword`: Authentication password
- `success`: Status indicator (1 = ready)

### 3. Connect and Authenticate via ADB

```bash
# Step 1: Connect to the ADB device
adb connect <adbIp>:<adbPort>

# Step 2: Authenticate with password (if required)
adb -s <adbIp>:<adbPort> shell <adbPassword>

# Step 3: Verify connection
adb devices
```

**Example:**
```bash
adb connect 98.98.125.30:20434
adb -s 98.98.125.30:20434 shell 5R12gXSM
adb devices
```

### 4. ADB Automation Functions

Use these ADB commands for TikTok automation (adapted from MoreLogin documentation):

```javascript
// Tap at coordinates
function tap(deviceId, x, y) {
  execSync(`adb -s ${deviceId} shell input tap ${x} ${y}`);
}

// Swipe gesture
function swipe(deviceId, startX, startY, endX, endY, duration = 100) {
  execSync(`adb -s ${deviceId} shell input swipe ${startX} ${startY} ${endX} ${endY} ${duration}`);
}

// Launch app
function launchApp(deviceId, packageName) {
  execSync(`adb -s ${deviceId} shell am start -n ${packageName}`);
}

// Input text
function inputText(deviceId, text) {
  // Escape special characters and spaces
  const escapedText = text.replace(/"/g, '\\"').replace(/\s/g, '%s');
  execSync(`adb -s ${deviceId} shell "input text \\"${escapedText}\\""`);
}

// Send key event
function keyEvent(deviceId, keyCode) {
  execSync(`adb -s ${deviceId} shell input keyevent ${keyCode}`);
}

// Take screenshot and save locally
function takeScreenshot(deviceId, localPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const remoteFile = `/sdcard/screenshot_${timestamp}.png`;
  const localFile = `${localPath}/screenshot_${timestamp}.png`;

  execSync(`adb -s ${deviceId} shell screencap -p ${remoteFile}`);
  execSync(`adb -s ${deviceId} pull ${remoteFile} ${localFile}`);
  execSync(`adb -s ${deviceId} shell rm ${remoteFile}`);

  return localFile;
}
```

### 5. Common ADB Commands for TikTok Automation

```bash
# Device Management
adb -s <device> devices                    # List connected devices
adb -s <device> shell getprop ro.product.model  # Get device model
adb -s <device> shell getprop sys.boot_completed  # Check if device is ready

# App Management
adb -s <device> shell am start -n com.zhiliaoapp.musically/.MainActivity  # Launch TikTok
adb -s <device> shell pm list packages    # List installed apps
adb -s <device> shell am force-stop com.zhiliaoapp.musically  # Stop TikTok

# Touch Input (Core Automation)
adb -s <device> shell input tap 540 960   # Tap center screen
adb -s <device> shell input swipe 540 1400 540 400 1000  # Scroll down
adb -s <device> shell input swipe 540 400 540 1400 1000   # Scroll up

# Text Input
adb -s <device> shell input text "hello%sworld"  # Input with spaces
adb -s <device> shell input keyevent 66         # Press Enter
adb -s <device> shell input keyevent 4          # Press Back

# File Operations
adb -s <device> push local.mp4 /sdcard/video.mp4    # Upload file
adb -s <device> pull /sdcard/screenshot.png .      # Download file
adb -s <device> shell ls /sdcard/                  # List device files
```

### 6. TikTok-Specific ADB Automation

```javascript
// Complete TikTok warmup sequence
async function tiktokWarmup(deviceId) {
  // Launch TikTok
  launchApp(deviceId, 'com.zhiliaoapp.musically');

  await sleep(5000); // Wait for app to load

  // Scroll through For You feed (10 times)
  for (let i = 0; i < 10; i++) {
    await sleep(3000); // Watch video

    // Random like (30% chance)
    if (Math.random() < 0.3) {
      tap(deviceId, 900, 1200); // Like button
      await sleep(1000);
    }

    // Scroll to next video
    swipe(deviceId, 540, 1400, 540, 400, 800);
    await sleep(2000);
  }

  // Search for content
  tap(deviceId, 900, 150); // Search icon
  await sleep(1000);
  inputText(deviceId, 'crypto%strading');
  keyEvent(deviceId, 66); // Enter
  await sleep(3000);

  // Browse search results
  for (let i = 0; i < 5; i++) {
    swipe(deviceId, 540, 1300, 540, 600, 600);
    await sleep(2000);
  }

  keyEvent(deviceId, 4); // Back to main feed
}
```

### 7. Troubleshooting ADB Issues

**Connection Problems:**
- Ensure ADB is enabled via MoreLogin API before connecting
- Wait 10-15 seconds after enabling ADB before attempting connection
- Verify cloud phone is powered on and running

**Authentication Issues:**
- Use the exact `adbPassword` from the API response
- Some devices may not require password authentication

**Shell Access Limitations:**
- Some cloud providers restrict full shell access for security
- Core automation commands (`input tap`, `input swipe`) usually work
- Advanced shell commands may be blocked

**Device Not Ready:**
- Check `sys.boot_completed` property
- Wait longer after power-on for device initialization
- Verify proxy configuration if device fails to start

### 8. Node.js ADB Helper Implementation

```javascript
import { execSync } from 'child_process';

class ADBHelper {
  constructor(deviceId) {
    this.deviceId = deviceId;
  }

  runCommand(command) {
    const fullCommand = `adb -s ${this.deviceId} ${command}`;
    return execSync(fullCommand, { encoding: 'utf8' });
  }

  tap(x, y) {
    this.runCommand(`shell input tap ${x} ${y}`);
  }

  swipe(startX, startY, endX, endY, duration = 300) {
    this.runCommand(`shell input swipe ${startX} ${startY} ${endX} ${endY} ${duration}`);
  }

  inputText(text) {
    const escaped = text.replace(/"/g, '\\"');
    this.runCommand(`shell "input text \\"${escaped}\\""`);
  }

  launchApp(packageName) {
    this.runCommand(`shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
  }

  keyEvent(code) {
    this.runCommand(`shell input keyevent ${code}`);
  }
}

// Usage
const adb = new ADBHelper('98.98.125.30:20434');
adb.tap(540, 960); // Tap center
adb.swipe(540, 1400, 540, 400, 1000); // Scroll
adb.launchApp('com.zhiliaoapp.musically'); // Launch TikTok
```

### References

- [MoreLogin ADB Connection Guide](https://support.morelogin.com/en/articles/10204764-adb-connection-cloud-phone)
- [Android ADB Documentation](https://developer.android.com/tools/adb)
- [ADB Shell Commands](https://adbshell.com/)

---

## Node.js Code Examples

### Complete Authentication Helper

```javascript
const axios = require('axios');
const crypto = require('crypto');

class MoreLoginAPI {
  constructor(apiId, secretKey) {
    this.apiId = apiId;
    this.secretKey = secretKey;
    this.baseUrl = 'https://api.morelogin.com';
  }

  generateHeaders() {
    const nonceId = `${Date.now()}:${Math.random().toString(36).substring(7)}`;
    const authString = this.apiId + nonceId + this.secretKey;
    const authorization = crypto.createHash('md5')
      .update(authString)
      .digest('hex');

    return {
      'Content-Type': 'application/json',
      'X-Api-Id': this.apiId,
      'X-Nonce-Id': nonceId,
      'Authorization': authorization
    };
  }

  async listCloudPhones(pageNo = 1, pageSize = 10) {
    const response = await axios.post(
      `${this.baseUrl}/api/cloudphone/page`,
      { pageNo, pageSize },
      { headers: this.generateHeaders() }
    );
    return response.data;
  }

  async createCloudPhone(options) {
    const response = await axios.post(
      `${this.baseUrl}/api/cloudphone/create`,
      {
        quantity: options.quantity || 1,
        skuId: options.skuId || 10002,
        automaticGeo: true,
        automaticLanguage: true,
        automaticLocation: true,
        country: options.country || 'us',
        proxyId: options.proxyId || 0,
        envRemark: options.envRemark || ''
      },
      { headers: this.generateHeaders() }
    );
    return response.data;
  }

  async enableADB(cloudPhoneIds) {
    const response = await axios.post(
      `${this.baseUrl}/api/cloudphone/updateAdb`,
      {
        enableAdb: true,
        ids: Array.isArray(cloudPhoneIds) ? cloudPhoneIds : [cloudPhoneIds]
      },
      { headers: this.generateHeaders() }
    );
    return response.data;
  }

  async addProxy(proxyConfig) {
    const response = await axios.post(
      `${this.baseUrl}/api/proxyInfo/add`,
      {
        proxyName: proxyConfig.name,
        proxyIp: proxyConfig.ip,
        proxyPort: proxyConfig.port,
        username: proxyConfig.username,
        password: proxyConfig.password,
        proxyProvider: proxyConfig.provider || 0,
        proxyType: proxyConfig.type || 0,
        country: proxyConfig.country || ''
      },
      { headers: this.generateHeaders() }
    );
    return response.data;
  }

  async assignProxyToCloudPhone(cloudPhoneIds, proxyId) {
    const response = await axios.post(
      `${this.baseUrl}/api/cloudphone/edit/batch`,
      {
        id: Array.isArray(cloudPhoneIds) ? cloudPhoneIds : [cloudPhoneIds],
        proxyId: proxyId
      },
      { headers: this.generateHeaders() }
    );
    return response.data;
  }
}

// Usage
const api = new MoreLoginAPI('your_api_id', 'your_secret_key');

(async () => {
  // List cloud phones
  const phones = await api.listCloudPhones();
  console.log('Cloud Phones:', phones);

  // Create new cloud phone
  const newPhone = await api.createCloudPhone({
    quantity: 1,
    skuId: 10002,
    country: 'us',
    envRemark: 'TikTok Account #1'
  });
  console.log('Created:', newPhone);

  // Enable ADB
  await api.enableADB(newPhone.data[0]);
  console.log('ADB enabled');
})();
```

### ADB Automation with Node.js

```javascript
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class ADBAutomation {
  constructor(adbIp, adbPort, adbPassword) {
    this.device = `${adbIp}:${adbPort}`;
    this.password = adbPassword;
  }

  async connect() {
    await execPromise(`adb connect ${this.device}`);
    await execPromise(`adb -s ${this.device} shell ${this.password}`);
    console.log(`Connected to ${this.device}`);
  }

  async tap(x, y) {
    await execPromise(`adb -s ${this.device} shell input tap ${x} ${y}`);
  }

  async swipe(x1, y1, x2, y2, duration = 400) {
    await execPromise(
      `adb -s ${this.device} shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`
    );
  }

  async inputText(text) {
    const escapedText = text.replace(/\s/g, '%s').replace(/"/g, '\\"');
    await execPromise(`adb -s ${this.device} shell input text "${escapedText}"`);
  }

  async launchTikTok() {
    await execPromise(
      `adb -s ${this.device} shell am start -n com.zhiliaoapp.musically/.MainActivity`
    );
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

// Usage
(async () => {
  const adb = new ADBAutomation('192.168.1.100', '5555', 'abc123');
  
  await adb.connect();
  await adb.launchTikTok();
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Scroll down (swipe up)
  await adb.swipe(540, 1500, 540, 500, 400);
  
  // Like button (right side)
  await adb.tap(970, 1150);
})();
```

---

## Error Handling

### Common Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Request completed successfully |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Verify API credentials and authentication |
| 403 | Forbidden | Check account permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Retry request or contact support |

### Error Response Format

```json
{
  "code": 400,
  "msg": "Invalid parameter: quantity must be between 1 and 10",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Best Practices

1. **Always check response code:**
   ```javascript
   if (response.data.code === 0) {
     // Success
   } else {
     console.error('Error:', response.data.msg);
   }
   ```

2. **Handle rate limits:**
   - Implement exponential backoff for retries
   - Respect API rate limits (check MoreLogin docs for specifics)

3. **Validate before API calls:**
   - Check parameter ranges (e.g., quantity: 1-10)
   - Verify IDs exist before modification/deletion

4. **Use try-catch blocks:**
   ```javascript
   try {
     const result = await api.listCloudPhones();
   } catch (error) {
     console.error('API Error:', error.response?.data || error.message);
   }
   ```

---

## Resources

- **Official API Documentation:** https://support.morelogin.com/en/collections/10925243-api
- **GitHub Code Examples:** https://github.com/MoreLoginBrowser/MoreLogin-API-Demos
- **ADB Command Reference:** https://adbshell.com/
- **Support:**
  - Telegram: https://t.me/moreloginsupport
  - Facebook: https://www.messenger.com/t/101496179431654
  - WhatsApp: +8618005008913

---

## Appendix: Country Codes

Common country codes for cloud phone creation:

- `us` - United States
- `uk` - United Kingdom
- `ca` - Canada
- `au` - Australia
- `de` - Germany
- `fr` - France
- `jp` - Japan
- `sg` - Singapore

## Appendix: Timezones

Common timezones:

- `America/New_York` - US Eastern Time
- `America/Los_Angeles` - US Pacific Time
- `America/Chicago` - US Central Time
- `Europe/London` - UK
- `Europe/Paris` - France
- `Asia/Tokyo` - Japan
- `Asia/Singapore` - Singapore

## Appendix: Language Codes

- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `es-ES` - Spanish (Spain)
- `fr-FR` - French (France)
- `de-DE` - German (Germany)
- `ja-JP` - Japanese (Japan)
- `zh-CN` - Chinese (Simplified)

