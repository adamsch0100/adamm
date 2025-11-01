# Deploying TikTok Automation Scripts to VMOS

## 📖 Understanding VMOS Automation Scripts

The `vmos-tiktok-automation.js` file contains **Android automation scripts** that need to run **ON the VMOS virtual devices**, not on your PC. Think of them as "robot fingers" that control the TikTok app inside the virtual phone.

### Why These Scripts Can't Run Locally

- **Android Environment**: These scripts use Android shell commands (`input tap`, `input swipe`, etc.)
- **Device Context**: They need direct access to the Android device's screen and input system
- **App Control**: They interact with TikTok's UI elements directly

## 🔧 Deployment Options

### Option 1: VMOS Automation API (Recommended)

VMOS Cloud provides an automation framework where you can:
1. Upload custom automation scripts
2. Configure them as reusable tasks
3. Call them via API from your workflows

**Steps:**

#### 1. Contact VMOS Support
Email: start@vmoscloud.com

Request:
- Access to custom automation features
- Documentation for their automation scripting API
- SDK/framework for TikTok automation

#### 2. Prepare Your Scripts
The scripts in `vmos-tiktok-automation.js` are ready but may need adaptation based on VMOS's framework. They might use:
- Auto.js framework (common for Android automation)
- VMOS's proprietary scripting system
- Accessibility Service API

#### 3. Upload to VMOS Dashboard
Once you have access:
1. Log into VMOS Cloud dashboard
2. Navigate to Automation section
3. Create new automation tasks
4. Upload/paste script code
5. Configure task parameters

### Option 2: ADB (Android Debug Bridge) Control

You can control VMOS devices remotely using ADB if VMOS provides ADB access:

**Install ADB on your PC:**
```powershell
# Using Chocolatey
choco install adb

# Or download from: https://developer.android.com/studio/releases/platform-tools
```

**Connect to VMOS device:**
```bash
# Get device IP from VMOS dashboard
adb connect <device-ip>:5555

# Verify connection
adb devices
```

**Execute commands:**
```bash
# Tap screen
adb shell input tap 540 960

# Swipe
adb shell input swipe 540 1500 540 500 300

# Launch TikTok
adb shell am start -n com.zhiliaoapp.musically/.splash.SplashActivity
```

### Option 3: Create an Android App

Create a custom Android app that runs on VMOS devices:

**Benefits:**
- Full control over automation
- Can use Android Accessibility Services
- More reliable than shell scripts

**Framework options:**
- **Appium**: Mobile automation framework
- **UI Automator**: Android's native automation tool
- **Accessibility Services**: Android's official automation API

## 🛠️ Adapting the Scripts

### Current Script Structure

The `vmos-tiktok-automation.js` scripts assume these functions exist:

```javascript
shell(command, useRoot)  // Execute shell commands
tap(x, y)                // Simulate tap
swipe(x1, y1, x2, y2, duration) // Simulate swipe
inputText(text)          // Input text
sleep(ms)                // Delay
```

### Adapting for VMOS Framework

VMOS might use different function names. Common frameworks:

#### Auto.js (Popular Android automation)
```javascript
// Replace tap()
function tap(x, y) {
  click(x, y);
}

// Replace swipe()
function swipe(x1, y1, x2, y2, duration) {
  gesture(duration, [x1, y1], [x2, y2]);
}

// Replace shell()
function shell(cmd, useRoot) {
  return useRoot ? shell(cmd, true) : shell(cmd);
}
```

#### Native Android (if building an app)
```java
// Use UI Automator
UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
device.click(x, y);
device.swipe(x1, y1, x2, y2, steps);
```

## 📱 Screen Coordinates

The scripts use these default dimensions:
```javascript
const screenWidth = 1080;
const screenHeight = 1920;
```

**IMPORTANT**: Adjust these based on your VMOS device resolution!

### Finding UI Element Positions

Use **ADB** to take screenshots and find coordinates:

```bash
# Take screenshot
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png

# Use image editor to find X,Y coordinates of buttons
```

Or use **UI Automator Viewer** (in Android SDK tools):
1. Connect device via ADB
2. Open UI Automator Viewer
3. Capture screen hierarchy
4. Find exact coordinates of UI elements

## 🚀 Quick Start Without Custom Scripts

### Alternative: Use VMOS Built-in Features

While waiting for custom scripts, use VMOS's built-in features:

#### 1. Manual Actions via API

Control apps using VMOS's existing endpoints:

```javascript
// Start TikTok
POST /vcpcloud/api/padInstanceApi/startApp
{
  "padCode": "AC22030022001",
  "packageName": "com.zhiliaoapp.musically"
}

// Stop TikTok
POST /vcpcloud/api/padInstanceApi/stopApp
{
  "padCode": "AC22030022001",
  "packageName": "com.zhiliaoapp.musically"
}
```

#### 2. Simulated Touch Events

If VMOS provides touch event API:

```javascript
// Cloud machine simulated touch (mentioned in VMOS docs)
POST /vcpcloud/api/padInstanceApi/simulatedTouch
{
  "padCode": "AC22030022001",
  "action": "tap",
  "x": 540,
  "y": 960
}
```

#### 3. Record & Replay

Some VMOS plans offer:
- **Record** manual actions on device
- **Replay** recorded sequences
- **Schedule** replay at specific times

Check your VMOS plan for these features.

## 🎯 Integration with n8n Workflows

Once automation is set up, your n8n workflows will call:

```javascript
// From n8n HTTP Request node
POST http://localhost:3000/api/vmos/tk/action
{
  "instanceId": "AC22030022001",
  "action": "scroll_feed",
  "params": {
    "count": 10
  }
}
```

The MCP server translates this to VMOS API:

```javascript
POST https://api.vmoscloud.com/vcpcloud/api/automationApi/createTask
{
  "padCode": "AC22030022001",
  "taskType": "scroll_feed",
  "taskParams": { "count": 10 }
}
```

## 📋 Action Checklist

- [ ] Contact VMOS support for automation access
- [ ] Request automation framework documentation
- [ ] Obtain VMOS Access Key and Secret Key
- [ ] Test basic API endpoints (instances, file upload)
- [ ] Deploy test automation script
- [ ] Verify script execution on one device
- [ ] Adjust coordinates for your device resolution
- [ ] Deploy to all 10 devices
- [ ] Test from n8n workflows
- [ ] Monitor and optimize

## 🔍 Testing Individual Actions

### Test via API (after deployment)

```bash
# Test scroll feed
curl -X POST http://localhost:3000/api/vmos/tk/action \
  -H "Content-Type: application/json" \
  -d '{
    "instanceId": "YOUR_DEVICE_ID",
    "action": "scroll_feed",
    "params": {"count": 5}
  }'

# Test search
curl -X POST http://localhost:3000/api/vmos/tk/action \
  -H "Content-Type: application/json" \
  -d '{
    "instanceId": "YOUR_DEVICE_ID",
    "action": "search",
    "params": {"query": "crypto", "scrollCount": 3}
  }'
```

### Test via VMOS Dashboard

1. Log into VMOS Cloud
2. Open device screen viewer
3. Manually trigger automation task
4. Watch screen in real-time
5. Verify actions execute correctly

## ⚠️ Important Notes

### TikTok Detection
TikTok has bot detection. To avoid detection:

1. **Vary timing** - Use random delays (already in scripts)
2. **Vary patterns** - Don't do same actions in same order
3. **Warm-up period** - Run for 7-14 days before posting
4. **Human-like behavior** - Watch videos fully sometimes, skip others
5. **Lower frequency** - Don't overdo automation

### Screen Resolution
Default coordinates assume 1080x1920. If your devices use different resolution:

```javascript
// Find UI elements proportionally
const likeButtonX = screenWidth * 0.9;  // 90% from left
const likeButtonY = screenHeight * 0.6; // 60% from top
```

### Device Variations
Different Android versions or TikTok versions may have:
- Different button positions
- Different navigation flows
- Different UI element IDs

Test on one device first, then deploy to others.

## 📚 Additional Resources

### VMOS Documentation
- Main docs: https://cloud.vmoscloud.com/vmoscloud/doc/en/server/OpenAPI.html
- Contact: start@vmoscloud.com

### Android Automation
- ADB Commands: https://developer.android.com/studio/command-line/adb
- UI Automator: https://developer.android.com/training/testing/ui-automator
- Accessibility Services: https://developer.android.com/guide/topics/ui/accessibility

### Automation Frameworks
- Auto.js: https://github.com/hyb1996/Auto.js
- Appium: http://appium.io/
- Selenium for Mobile: https://www.selenium.dev/

## 💡 Next Steps

1. **Get VMOS Credentials First**
   - Add Access Key and Secret Key to `.env`
   - Test basic API endpoints

2. **Start Simple**
   - Test file upload
   - Test app start/stop
   - Verify device control works

3. **Contact VMOS**
   - Request automation features
   - Get their scripting documentation
   - Ask about TikTok automation examples

4. **Deploy Scripts**
   - Adapt to VMOS framework
   - Test on single device
   - Scale to all devices

5. **Integrate with Workflows**
   - Test from n8n
   - Monitor execution
   - Optimize timing and actions

---

**Status**: Scripts ready for deployment once VMOS automation access is obtained! 🚀

