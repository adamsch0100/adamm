# 🎬 Campaign System - Complete Guide

## Overview

The Campaign System allows you to create flexible, automated video generation and posting campaigns with full transparency and control. You can choose topics, customize video counts, select specific accounts, and review videos before posting.

## ✨ Key Features

### 1. Flexible Topic Selection
- **Auto Mode**: Automatically fetch trending cryptocurrency topics
- **Manual Mode**: Enter your own custom topic

### 2. Variable Video Count
- Generate 1-10 videos per campaign
- Each video has unique visual variations
- Adjust based on your account count and needs

### 3. Account Selection
- Choose specific accounts to post to
- Mix and match across platforms (TikTok, Instagram, YouTube, etc.)
- See account details before selection

### 4. Video Preview & Approval ⭐ NEW
- **Optional Approval Workflow**: Toggle "Require approval before posting"
- Preview all generated videos before they go live
- Select which videos to approve/reject
- Watch videos directly in the interface
- Download videos for review

### 5. Real-Time Transparency
- Live progress tracking during video generation
- Per-video status updates
- Posting status for each account
- Activity timeline
- Error notifications

## 🚀 How to Use

### Creating a Campaign

1. **Navigate to Campaigns**
   - Click "Campaigns" in the sidebar
   - Click "New Campaign" button

2. **Step 1: Topic Selection**
   - Choose "Auto" to fetch trending crypto automatically
   - Or choose "Custom" and enter your topic (e.g., "Ethereum Layer 2 Solutions")

3. **Step 2: Video Configuration**
   - Use the slider to select video count (1-10)
   - Check "Require video approval before posting" to enable preview workflow
   - See estimated generation time

4. **Step 3: Account Selection**
   - Browse your accounts grouped by platform
   - Click accounts to select/deselect
   - Must select at least one account

5. **Step 4: Review & Launch**
   - Review campaign summary
   - See estimated total time
   - Click "Launch Campaign"

### Monitoring Progress

The campaign automatically transitions through these stages:

1. **Creating** (0-5%)
   - Initial setup

2. **Generating Script** (5-15%)
   - AI creates engaging TikTok script
   - ~10 seconds

3. **Generating Videos** (15-90%)
   - Creates all videos with unique variations
   - ~3-5 minutes per video
   - Real-time progress bars for each video

4. **Downloading** (90-95%)
   - Downloads completed videos
   - ~30 seconds

5. **Pending Review** (if approval enabled)
   - Videos ready for preview
   - You review and approve

6. **Posting** (95-100%)
   - Posts to selected accounts
   - Sequential posting with delays

7. **Completed**
   - All done!

### Reviewing & Approving Videos

If you enabled "Require approval":

1. Campaign will pause at **Pending Review** status
2. You'll see a notification: "🎬 Videos are ready for review"
3. Click the campaign to view details
4. Each video shows:
   - Video preview (hover to play)
   - Download option
   - Checkbox to approve/reject
5. Select videos you want to post
6. Click "Approve X Videos" button
7. Campaign continues to posting automatically

**Tips for Review:**
- Hover over videos to preview them
- Download videos to watch full quality
- You can approve all or select specific ones
- Rejected videos won't be posted

### Viewing Campaign Details

Click any campaign to see:

- **Overall Progress**: Current step and percentage
- **Generated Script**: Hook, facts, and CTA
- **Video Status**: Each video's generation progress
- **Video Previews**: Watch and download completed videos
- **Posting Status**: Per-account posting results
- **Activity Timeline**: Complete history

## 📊 Campaign Statuses

### Active Statuses
- **Creating**: Initial setup
- **Generating Script**: Creating content script
- **Generating Videos**: AI video generation in progress
- **Downloading**: Fetching completed videos
- **Posting**: Publishing to accounts

### Waiting Statuses
- **Pending Review**: Videos ready for your approval ⭐

### Final Statuses
- **Approved**: Videos approved, posting will start
- **Completed**: All done successfully
- **Failed**: Something went wrong
- **Cancelled**: User cancelled

## 🎥 Video Generation Details

### How It Works
1. AI analyzes your topic
2. Generates 10 unique visual styles:
   - Spinning coin with charts
   - Chart animation with rising line
   - Crypto mining visualization
   - Digital particles forming logo
   - Dynamic market data overlay
   - Futuristic holographic display
   - Coins raining with effects
   - Blockchain network visualization
   - Price surge rocket trajectory
   - Candlestick patterns animation

3. Each video is:
   - 8 seconds long (perfect for TikTok)
   - Vertical format (9:16)
   - 1080p resolution
   - Unique from others in campaign

### Video Variations
Videos use different:
- Camera angles
- Visual styles
- Animations
- Effects
- Color palettes

This prevents accounts from posting identical content!

## 📱 Account Assignment

### Distribution Logic
- Videos are cycled across accounts
- If 3 videos and 6 accounts:
  - Accounts 1 & 4 get Video 1
  - Accounts 2 & 5 get Video 2
  - Accounts 3 & 6 get Video 3

### Best Practices
- Match video count to account count for 1:1 distribution
- More videos = more variety
- Review which accounts get which videos in detail view

## ⏱️ Time Estimates

### Generation Time
- Script: ~10 seconds
- Per Video: ~3-5 minutes
- 2 videos: ~8 minutes
- 5 videos: ~20 minutes
- 10 videos: ~40 minutes

### Posting Time
- Per Account: ~2 minutes
- 3 accounts: ~6 minutes
- 10 accounts: ~20 minutes

### Total Time Examples
- **Quick Campaign** (2 videos, 2 accounts): ~15 minutes
- **Medium Campaign** (5 videos, 5 accounts): ~30 minutes
- **Full Campaign** (10 videos, 10 accounts): ~60 minutes

## 🎯 Use Cases

### 1. Test New Content
- Create 2-3 videos with approval enabled
- Review quality before posting
- Choose best performers

### 2. Daily Automation
- Set up auto-topic campaigns
- Generate content about trending topics
- Disable approval for hands-off automation

### 3. Multi-Account Growth
- Create 10 videos for 10 accounts
- Each account gets unique content
- Post simultaneously to all platforms

### 4. Platform-Specific Campaigns
- Target only TikTok accounts
- Or only Instagram accounts
- Customize per platform

### 5. Quality Control
- Always enable approval for new niches
- Review AI-generated content
- Ensure brand alignment

## 🔧 Technical Details

### Database Schema
The `campaigns` table includes:
- User configuration (topic, video count, accounts)
- Status tracking (progress, current step)
- Video details (IDs, URLs, approval status)
- Posting results (per-account status)
- Timestamps (created, started, completed)

### API Endpoints
- `POST /api/campaigns/create` - Create campaign
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/:id/status` - Get status
- `POST /api/campaigns/:id/approve` - Approve videos
- `POST /api/campaigns/:id/cancel` - Cancel campaign

### Real-Time Updates
- Frontend polls every 3 seconds for active campaigns
- Stops polling when campaign completes
- Automatic refresh on status changes

## 🎨 UI Features

### Campaigns List
- Summary cards with progress bars
- Status badges with icons
- Quick stats (videos, accounts, posts)
- Time since creation

### Campaign Detail
- Expandable script section
- Video grid with previews
- Interactive checkboxes for approval
- Account posting table
- Activity timeline

### Create Modal
- 4-step wizard
- Progress dots
- Validation at each step
- Summary before launch

## 🚨 Error Handling

### If Video Generation Fails
- Individual videos can fail without stopping campaign
- Failed videos are marked clearly
- Campaign continues with successful videos

### If Posting Fails
- Per-account errors are tracked
- Other accounts continue posting
- Detailed error messages shown

### If Campaign Fails
- Error message displayed
- Partial results still saved
- Can view what completed before failure

## 📈 Future Enhancements (Planned)

- [ ] Edit videos before posting
- [ ] Schedule campaigns for future
- [ ] A/B test different scripts
- [ ] Analytics per campaign
- [ ] Duplicate successful campaigns
- [ ] Template campaigns for quick reuse
- [ ] Webhook notifications
- [ ] Export campaign reports

## 💡 Tips & Best Practices

### For Best Results
1. **Enable Approval** for first few campaigns
2. **Start Small** (2-3 videos) to test
3. **Match Video Count** to your account count
4. **Use Specific Topics** in manual mode
5. **Review Scripts** before videos finish
6. **Check Accounts** are active before launching

### Quality Control
- Review videos on desktop for best quality
- Download and check on mobile too
- Reject low-quality generations
- Note which visual styles work best

### Optimization
- Run campaigns during off-peak hours
- Space out posting to avoid rate limits
- Use varied topics across campaigns
- Mix auto and manual topics

### Scaling
- Start with one platform
- Add more accounts gradually
- Increase video count as you scale
- Consider multiple smaller campaigns vs one large

## 🆘 Troubleshooting

### Campaign Stuck at "Generating Videos"
- Videos can take 3-5 minutes each
- Check individual video progress
- If >10 minutes on one video, it may have failed

### "No Accounts Found"
- Make sure accounts are marked as "active"
- Check accounts page
- Create accounts if needed

### Videos Not Appearing
- Ensure you're logged in
- Check campaign status isn't failed
- Refresh the page

### Approval Not Working
- Select at least one video
- Check you're on campaign detail page
- Ensure campaign status is "pending_review"

## 📞 Support

For issues or questions:
1. Check campaign error messages
2. Review activity timeline
3. Check individual video/posting statuses
4. Contact support with campaign ID

---

## Summary

The Campaign System gives you **complete control** over automated video generation with **full transparency**. Whether you want hands-off automation or careful quality control, you can customize campaigns to fit your needs.

**Key Benefit**: Generate diverse, unique content for all your accounts in one click, with optional review before posting!

