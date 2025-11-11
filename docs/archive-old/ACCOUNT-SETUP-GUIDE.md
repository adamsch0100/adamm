# ACCOUNT SETUP GUIDE - Get Upload-post Profile Keys

## Your 4 Accounts
1. slcfcgeaofxg@onlyrugs.fun / Soccer1984!
2. rjpgxtinfatk@onlyrugs.fun / Soccer1984!
3. bxfhrlsvmnzt@onlyrugs.fun / Soccer1984!
4. adam@saahomes.com / Soccer1984!

---

## STEP 1: Sign Up for Upload-post.com (5 min)

1. Go to https://upload-post.com
2. Click "Sign Up" or "Get Started"
3. Choose plan:
   - **Starter:** $29/month = 100 posts/month (enough for testing)
   - **Growth:** $79/month = 500 posts/month (recommended for 4 accounts)
4. Complete signup

---

## STEP 2: Get Your API Key (2 min)

1. In upload-post dashboard, go to "Settings" or "API Keys"
2. Click "Generate API Key" or "View API Key"
3. **COPY YOUR API KEY** (looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
4. Save it - we'll add it to Supabase next

**Already have it?** It should be in `operator_settings` table as `uploadpost` service.

---

## STEP 3: Connect Twitter Accounts (15 min total)

For EACH of your 4 Twitter accounts:

### Account 1: slcfcgeaofxg@onlyrugs.fun

1. In upload-post dashboard, click "Accounts" or "Connected Accounts"
2. Click "Add Account" or "Connect Account"
3. Select "Twitter/X"
4. A popup will ask you to login to Twitter
5. **Login with:** slcfcgeaofxg@onlyrugs.fun / Soccer1984!
6. Authorize upload-post to access your account
7. Once connected, you'll see a **Profile Key**
   - Format: `tw_abc123xyz` or `tw_xxxxxxxxxx`
8. **COPY THIS KEY** - write it down as:
   ```
   slcfcgeaofxg → tw_[paste key here]
   ```

### Account 2: rjpgxtinfatk@onlyrugs.fun
- Repeat steps 2-8 above
- Save key as: `rjpgxtinfatk → tt_[key]`

### Account 3: bxfhrlsvmnzt@onlyrugs.fun
- Repeat steps 2-8 above
- Save key as: `bxfhrlsvmnzt → tt_[key]`

### Account 4: adam@saahomes.com
- Repeat steps 2-8 above
- Save key as: `adam → tt_[key]`

---

## STEP 4: Connect TikTok Accounts (15 min total)

Same process but select "TikTok" instead:

For EACH account:
1. Click "Add Account" → Select "TikTok"
2. Login with same credentials
3. Copy TikTok profile key (format: `tt_abc123xyz`)
4. Document:
   ```
   slcfcgeaofxg → TikTok: tt_[key]
   rjpgxtinfatk → TikTok: tt_[key]
   bxfhrlsvmnzt → TikTok: tt_[key]
   adam → TikTok: tt_[key]
   ```

---

## STEP 5: Add Accounts to Dashboard (10 min)

1. Open http://localhost:3001/dashboard/accounts
2. Make sure you're logged in
3. For EACH account, click "Add Account"

### Example for Account 1:
- **Platform:** "Both Twitter & TikTok"
- **Username:** `slcfcgeaofxg` (from email, no @)
- **Display Name:** `AI Hustles Pro` (or your choice)
- **Twitter Profile Key:** `tw_[paste from upload-post]`
- **TikTok Profile Key:** `tt_[paste from upload-post]`
- **Whop Link:** Your Whop checkout link (e.g., `https://whop.com/ai-side-hustles/`)

4. Click "Add Account"
5. Repeat for all 4 accounts

**Verify:** All 4 should show as "Active" with green status

---

## QUICK REFERENCE

After setup, you should have:

| Email | Twitter Key | TikTok Key | Status |
|-------|-------------|------------|--------|
| slcfcgeaofxg@onlyrugs.fun | tw_... | tt_... | Active |
| rjpgxtinfatk@onlyrugs.fun | tw_... | tt_... | Active |
| bxfhrlsvmnzt@onlyrugs.fun | tw_... | tt_... | Active |
| adam@saahomes.com | tw_... | tt_... | Active |

---

## TROUBLESHOOTING

### "OAuth failed" or "Connection error"
- Clear browser cache
- Try incognito window
- Make sure Twitter/TikTok accounts aren't restricted
- Verify login credentials are correct

### "Profile key not showing"
- Refresh upload-post dashboard
- Check "Connected Accounts" section
- Re-connect account if needed

### "Account already connected"
- Check if another upload-post account has it
- You may need to disconnect first, then reconnect

---

## NEXT STEPS

Once all accounts are added:
1. Go to `/dashboard/twitter`
2. Generate 10 test tweets
3. Schedule them
4. Watch them post automatically!

Good luck! 🚀



