# Quick Start Guide

Get your TikTok automation running in 5 minutes!

## Step-by-Step Setup

### 1️⃣ Install Node.js (if not installed)

Download and install Node.js 18+ from: https://nodejs.org/

Verify installation:
```powershell
node --version
# Should show v18.x.x or higher
```

### 2️⃣ Run Setup Script

Open PowerShell in the project directory and run:
```powershell
.\setup.ps1
```

This will:
- Install all dependencies
- Create your `.env` configuration file

### 3️⃣ Add Your API Keys

Edit the `.env` file:
```powershell
notepad .env
```

Add your API keys:
```env
VMOS_ACCESS_KEY=your_vmos_access_key_id
VMOS_SECRET_KEY=your_vmos_secret_access_key
COINMARKETCAP_API_KEY=your_actual_cmc_key
OPENAI_API_KEY=your_actual_openai_key
ALERT_EMAIL=your_email@example.com
```

**Where to get API keys:**
- **VMOS Cloud**: Contact support at start@vmoscloud.com to get Access Key & Secret Key ([See detailed guide](VMOS-SETUP-GUIDE.md))
- **CoinMarketCap**: https://coinmarketcap.com/api/ (free tier available)
- **OpenAI**: https://platform.openai.com/api-keys (requires account)

Save and close the file.

### 4️⃣ Start Everything

```powershell
.\start-all.ps1
```

This opens two windows:
- **MCP Server** - Background API server
- **n8n** - Workflow automation platform

Wait for both to fully start (about 30 seconds).

### 5️⃣ Access n8n

Open your browser and go to:
```
http://localhost:5678
```

First time? You'll create an n8n account (stored locally, no internet required).

### 6️⃣ Import Workflows

In n8n:

1. Click **Workflows** in the left sidebar
2. Click **Import from File** (top-right)
3. Select `warmup-workflow.json` from your project folder
4. Click **Import**
5. Repeat for `content-workflow.json`

### 7️⃣ Configure Gmail Notifications (Optional)

The MCP server handles all API authentication (VMOS, CoinMarketCap, OpenAI) via the `.env` file. You only need to set up Gmail in n8n for email notifications:

#### Gmail Notifications:
1. Click **Credentials** in left sidebar
2. Click **Add Credential**
3. Select **Gmail OAuth2**
4. Follow the OAuth connection wizard
5. Click **Save**

**Note**: If you don't want email notifications, you can skip this step and remove the email nodes from the workflows later.

### 8️⃣ Test the Workflows

#### Test Warm-Up Workflow:
1. Open **TikTok Account Warm-Up** workflow
2. Click **Execute Workflow** (top-right)
3. Watch it run in real-time
4. Check for green checkmarks on all nodes

#### Test Content Creation Workflow:
1. Open **TikTok Content Creation & Posting** workflow
2. Click **Execute Workflow**
3. This takes longer (video generation ~2-5 minutes)
4. Monitor progress in the execution panel

### 9️⃣ Activate Workflows

Once testing is successful:

1. Open each workflow
2. Toggle the **Active** switch (top-right) to ON
3. The workflows now run automatically on their schedules:
   - **Warm-Up**: Once daily (random hour)
   - **Content**: Every 12 hours

### 🎉 You're Done!

Your TikTok automation is now running!

## What Happens Next?

### Daily Warm-Up (Automatic)
Every day at a random time, the system will:
- Access all 10 VMOS virtual phones
- Perform natural engagement on each (scroll, like, search, watch, follow)
- Send you an email when complete

### Content Creation (Every 12 Hours)
Twice daily, the system will:
- Fetch trending crypto topics
- Generate a TikTok script with AI
- Create a 30-second video with Sora 2
- Post to all 10 TikTok accounts
- Send you success/failure notifications

## Monitoring

### Check Workflow Status
1. Open n8n: http://localhost:5678
2. Click **Executions** in sidebar
3. See all past runs with success/failure status

### Check Email
You'll receive emails for:
- ✅ Successful warm-ups
- ✅ Successful content posts
- ❌ Any failures

### View MCP Server
The MCP Server window shows real-time API activity.

## Common Issues

### "Cannot find module" error
Run: `npm install` in the project directory

### "Port 3000 already in use"
Another program is using port 3000. Either:
- Close that program, or
- Change `MCP_PORT=3001` in `.env` file

### Workflow fails with "401 Unauthorized"
Double-check your API keys in:
1. `.env` file
2. n8n credentials

### Video generation fails
- Ensure your OpenAI account has Sora 2 access
- Check OpenAI API usage limits
- The Sora 2 API endpoint may need adjustment when official docs are released

## Need Help?

1. Check `README.md` for detailed documentation
2. Review the troubleshooting section
3. Check n8n execution logs for specific errors
4. Verify all API keys are correct

## Stopping the System

To stop:
1. Press `Ctrl+C` in both PowerShell windows (MCP Server and n8n)
2. Close the windows

To restart:
```powershell
.\start-all.ps1
```

---

**Happy Automating!** 🚀

