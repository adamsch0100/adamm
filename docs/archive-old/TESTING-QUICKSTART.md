# 🧪 Campaign System - Quick Test Guide

## Prerequisites

✅ Backend server running (port 3000)
✅ Frontend server running (port 3001)  
✅ Database schema applied (campaigns table exists)
✅ At least 1-2 active social accounts in your database

## Step-by-Step Test

### 1. Apply Database Schema

Open Supabase SQL Editor and run:

```sql
-- The campaigns table should already be in your supabase-schema.sql
-- If not, run this:

CREATE TABLE campaigns (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  topic_source TEXT CHECK (topic_source IN ('auto', 'manual')),
  topic TEXT NOT NULL,
  topic_metadata JSONB,
  video_count INTEGER NOT NULL CHECK (video_count >= 1 AND video_count <= 10),
  target_accounts BIGINT[],
  target_platforms TEXT[],
  require_approval BOOLEAN DEFAULT false,
  auto_post_on_approval BOOLEAN DEFAULT true,
  script JSONB,
  video_ids TEXT[],
  captions TEXT[],
  status TEXT CHECK (status IN ('creating', 'generating_script', 'generating_videos', 'downloading', 'pending_review', 'approved', 'posting', 'completed', 'failed', 'cancelled')) DEFAULT 'creating',
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  error_message TEXT,
  videos_status JSONB,
  posting_status JSONB,
  reviewed_at TIMESTAMPTZ,
  approved_video_count INTEGER DEFAULT 0,
  rejected_video_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_posted INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  results JSONB
);

-- Indexes
CREATE INDEX idx_campaigns_user_status ON campaigns(user_id, status);
CREATE INDEX idx_campaigns_created ON campaigns(created_at DESC);
CREATE INDEX idx_campaigns_pending_review ON campaigns(user_id, status) WHERE status = 'pending_review';

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own campaigns" ON campaigns FOR ALL USING (auth.uid() = user_id);
```

### 2. Verify Servers Are Running

Backend:
```bash
http://localhost:3000/health
# Should return: {"status": "ok", ...}
```

Frontend:
```bash
http://localhost:3001/dashboard
# Should load dashboard
```

### 3. Create Test Accounts (If Needed)

Navigate to: `http://localhost:3001/dashboard/accounts`

Create at least 2 test accounts:
- Platform: TikTok
- Username: test_account_1, test_account_2
- Status: Active

### 4. Create Your First Campaign

**Navigate to Campaigns:**
http://localhost:3001/dashboard/campaigns

**Click "New Campaign"**

**Step 1 - Topic:**
- Select "Custom"
- Enter: "Bitcoin Price Analysis"
- Click "Next"

**Step 2 - Videos:**
- Set video count to: 2
- **Check "Require video approval before posting"** ✅
- Click "Next"

**Step 3 - Accounts:**
- Select your 2 test accounts
- Click "Next"

**Step 4 - Review:**
- Verify summary looks correct
- Click "Launch Campaign"

### 5. Watch Progress (Real-Time)

You should see:

**Minute 0-1:**
```
Status: Generating Script
Progress: 5-15%
Current Step: "Generating script for topic"
```

**Minute 1-4:**
```
Status: Generating Videos
Progress: 15-50%
Current Step: "Generating video 1 of 2"
Individual video shows: "⟳ In Progress (45%)"
```

**Minute 4-7:**
```
Status: Generating Videos  
Progress: 50-85%
Current Step: "Generating video 2 of 2"
Video 1 shows: "✓ Completed (100%)"
Video 2 shows: "⟳ In Progress (67%)"
```

**Minute 7-8:**
```
Status: Downloading
Progress: 90-95%
Current Step: "Downloading completed videos"
Both videos show: "✓ Completed (100%)"
```

**Minute 8+:**
```
Status: Pending Review
Progress: 95%
Current Step: "Waiting for video approval"
Banner: "🎬 Videos are ready for review. Click to preview and approve."
```

### 6. Review & Approve Videos

**Click the campaign** to open detail view

You should see:
- Script section (expandable)
- 2 videos in a grid
- Each video has:
  - Preview thumbnail
  - Checkbox for selection
  - "Preview" and "Download" links

**Test video preview:**
- Hover over a video thumbnail
- It should start playing

**Approve videos:**
1. Check both videos (or just one to test)
2. Click "Approve 2 Videos" button
3. Campaign continues automatically

### 7. Watch Posting

```
Status: Posting
Progress: 95-100%
Current Step: "Posting to accounts"

Posting Status section shows:
- @test_account_1 (TikTok) - Video 1 - Posting...
- @test_account_2 (TikTok) - Video 2 - Posting...
```

### 8. View Completed Campaign

```
Status: Completed
Progress: 100%

Summary shows:
- 2 videos generated
- 2 accounts posted to
- 2 successful posts
- 0 failed posts

Activity Timeline shows:
- Campaign created
- Generation started
- Videos reviewed (2 approved, 0 rejected)
- Campaign completed
```

## What to Look For

### ✅ Success Indicators

1. **Real-time updates work**
   - Progress bars move smoothly
   - Status changes automatically
   - No page refresh needed

2. **Video preview works**
   - Can see video thumbnails
   - Videos play on hover
   - Download links work

3. **Approval workflow works**
   - Campaign pauses at pending_review
   - Can select/deselect videos
   - Approve button triggers posting
   - Campaign completes automatically

4. **UI is responsive**
   - No lag in updates
   - Smooth transitions
   - Clear status indicators

### ❌ Common Issues

**Campaign stuck at "Generating Videos"**
- Videos take 3-5 minutes each
- Check individual video progress
- If >10 minutes, check backend logs

**"No accounts found"**
- Make sure accounts exist in database
- Check accounts are status="active"
- Create accounts on Accounts page

**Approval not working**
- Ensure campaign status is "pending_review"
- Check you selected at least one video
- Try refreshing the page

**Videos not previewing**
- Check video URLs are valid
- Check browser console for errors
- Try downloading video to test

## Testing Different Scenarios

### Scenario 1: Quick Test (2 videos)
- Topic: "Ethereum Layer 2"
- Videos: 2
- Accounts: 2
- Approval: Enabled
- Time: ~10-15 minutes

### Scenario 2: Auto Topic
- Topic: Auto (trending crypto)
- Videos: 3
- Accounts: 3
- Approval: Enabled
- Time: ~15-20 minutes

### Scenario 3: Without Approval
- Topic: "Solana NFTs"
- Videos: 2
- Accounts: 2
- Approval: **Disabled**
- Time: ~10 minutes
- Should auto-post without pause

### Scenario 4: Selective Approval
- Topic: "DeFi Trends"
- Videos: 3
- Accounts: 3
- Approval: Enabled
- Action: Approve only 2 of 3 videos
- Result: 1 video rejected, 2 posted

## Debugging Tips

### Check Backend Logs
```bash
# Backend terminal should show:
Campaign 123 execution started
Generating script...
Script generated successfully
Starting video generation...
Video 1 generation started
...
```

### Check Browser Console
```javascript
// Should see fetch requests every 3 seconds:
GET /api/campaigns/123/status
// Response: 200 OK with campaign data
```

### Check Database
```sql
-- See campaign in database
SELECT id, status, progress, current_step, videos_status 
FROM campaigns 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Manual API Test
```bash
# Get campaign status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/campaigns/123/status

# List campaigns
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/campaigns
```

## Expected Results

After successful test, you should have:

✅ Campaign visible in list  
✅ Status shows "Completed"  
✅ 2 videos generated  
✅ 2 accounts posted to  
✅ Real-time progress worked  
✅ Video preview worked  
✅ Approval workflow worked  
✅ Activity timeline complete  

## Next Steps

Once basic test passes:

1. **Test with more videos** (5-10)
2. **Test with auto topic**
3. **Test approval/rejection**
4. **Test error handling** (cancel mid-generation)
5. **Test multiple campaigns**
6. **Test on mobile view**

## Quick Command Reference

```powershell
# Start backend
node mcp-server.js

# Start frontend
cd frontend
npm run dev

# Check health
curl http://localhost:3000/health

# View campaigns page
http://localhost:3001/dashboard/campaigns
```

---

## Summary

This test will verify:
- ✅ Database schema works
- ✅ Backend API works
- ✅ Frontend UI works
- ✅ Real-time updates work
- ✅ Video preview works
- ✅ Approval workflow works
- ✅ End-to-end flow works

**Total test time: ~15 minutes**

Ready to test! 🚀

