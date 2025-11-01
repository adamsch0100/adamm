# Workflow Testing Guide

## Overview

The n8n workflow (`workflows/warmup-workflow.json`) now matches the test script (`tests/test-full-warmup.ps1`) exactly. Both use the same MCP server endpoints and logic, ensuring identical behavior.

## What's Synchronized

### ✅ Lifecycle Management
- **Boot Wait**: 120 seconds (not 60s)
- **ADB Wait**: 60 seconds for daemon (not 10s)
- **ADB Verification**: 6 retry attempts with 10s delays
- **Power Off**: Included at end of workflow

### ✅ Randomization (Same in Both)
- **Main Feed Scrolls**: Random 8-12 scrolls per session
- **Like Rate**: Random 30-50% per session
- **Follow Count**: Random 2-3 users per search
- **Final Scrolls**: Random 3-5 scrolls

### ✅ Search Flow
- **Topic Selection**: Random crypto topic from MCP server list
- **Search 1**: Users tab → Follow 2-3 users → Scroll
- **Search 2**: Videos tab → Tap first video → Watch 5s → Back twice
- **Navigation**: Proper back navigation (2 backs to return home)

### ✅ Final Engagement
- **Return to Home**: 2 backs from search results
- **Final Scrolls**: 3-5 random scrolls with 50% like rate
- **Exit TikTok**: Uses `exit_tiktok` action before power off
- **Wait After Exit**: 2 second delay before shutdown

### ✅ Human-Like Behavior
All actions use the **same MCP server endpoints** which automatically add:
- Random delays: 3-15 seconds between actions
- Human-like typing: Word-by-word with 200-500ms delays
- Natural interactions: All coordinates and gestures tested and proven

## Testing Methods

### Method 1: PowerShell Test Script (Quick)

```powershell
cd "C:\Users\adamm\Projects\TikTok Automation"
.\tests\test-full-warmup.ps1
```

**Expected Duration**: 5-10 minutes
**Best For**: Quick validation, debugging specific issues

### Method 2: n8n Workflow (Production)

1. Start n8n:
   ```powershell
   cd "C:\Users\adamm\Projects\TikTok Automation"
   .\scripts\start-n8n.ps1
   ```

2. Open n8n: `http://localhost:5678`

3. Import workflow: `workflows/warmup-workflow.json`

4. Run manually or wait for scheduled trigger (8am, 6pm daily)

**Expected Duration**: 5-10 minutes per device
**Best For**: Production automation, multi-device testing

## Verification Checklist

Use this checklist when testing either method:

- [ ] Device powers on successfully
- [ ] 120s boot wait completes
- [ ] ADB enables and verifies connection
- [ ] TikTok launches without errors
- [ ] Main feed: 8-12 scrolls with varied likes
- [ ] Search 1: Users tab, follows 2-3 people
- [ ] Search 2: Videos tab, watches first result
- [ ] Returns to home feed correctly
- [ ] Final engagement: 3-5 scrolls with likes
- [ ] Exits TikTok before shutdown
- [ ] Device powers off successfully

## Expected Behavior

Both methods should produce:

1. **Same Actions**: Identical sequence of taps, scrolls, types, follows
2. **Same Timing**: 3-15s random delays from MCP server
3. **Same Randomization**: Different counts each run (scrolls, likes, follows)
4. **Same Duration**: ~5-10 minutes total per device

## Differences (Technical Only)

The only differences are technical implementation details:

| Aspect | Test Script | n8n Workflow |
|--------|-------------|--------------|
| **Execution** | PowerShell commands | n8n HTTP nodes + JS Code |
| **Logging** | Console output with colors | n8n execution logs |
| **Scheduling** | Manual run only | Automated (8am, 6pm) + Manual |
| **Multi-Device** | Single device per run | Loops through all devices |

Both call the **exact same MCP server endpoints** with the **exact same parameters**.

## Common Issues

### Issue: Workflow Skips Steps
**Solution**: Check n8n node connections. All nodes should be connected in sequence.

### Issue: Different Scroll Counts
**Expected**: This is normal! Randomization means each run will be different (8-12 range).

### Issue: ADB Connection Fails
**Solution**: 
1. Verify phone is powered on
2. Wait full 60s after enabling ADB
3. Check MCP server logs for connection errors
4. Retry up to 6 times (automatic in both methods)

### Issue: Wrong Tab (Videos vs Users)
**Expected**: Search 1 always uses Users, Search 2 always uses Videos (deterministic).

## Success Indicators

✅ **Test Script Success**:
```
================================
  WARMUP WORKFLOW COMPLETE!
================================
```

✅ **n8n Workflow Success**:
- All nodes green in execution view
- "Log Completion" node shows device ID and timestamp
- No error nodes triggered

## Next Steps After Testing

Once both methods work identically:

1. **Schedule n8n workflow** for automated daily runs (8am, 6pm)
2. **Monitor first few runs** to ensure consistency
3. **Scale to more devices** by adding cloud phones to MoreLogin
4. **Disable test script** once confident in n8n automation

## Pro Tips

- **Test first** with PowerShell script before enabling n8n automation
- **Monitor timing** - if sessions consistently take >10 min, delays might be too long
- **Check TikTok activity** - ensure accounts show natural engagement patterns
- **Stagger runs** - if multiple devices, n8n will process them sequentially (good for anti-detection)

## Support

If you encounter issues:

1. Check MCP server is running: `http://localhost:3000/health`
2. Review MCP server logs for errors
3. Verify MoreLogin API credentials in `.env`
4. Test individual actions using `/api/tiktok/action` endpoint
5. Consult `docs/WARMUP-ACTIONS.md` for action details


