# Whop Integration - Complete Setup Guide

**Status:** ✅ Fully Integrated with Official SDK

**Documentation:** [https://docs.whop.com/apps/api/getting-started](https://docs.whop.com/apps/api/getting-started)

---

## What's Integrated

✅ **Official Whop SDK** (`@whop/sdk`) installed  
✅ **Product/Plan creation** via API  
✅ **Payment webhook** handling  
✅ **Sales tracking** in database  
✅ **Lead attribution** (tracks which lead bought)  
✅ **Auto-conversion** marking in funnel  

---

## Your Whop Credentials (Already in .env)

```env
# Backend (.env)
WHOP_API_KEY=MX5SIFiUXB9i2ROM0gfLIcRMItkP5QF6aJ352sqM0_U
WHOP_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_WHOP_APP_ID=app_Vg0lsvQh2Hg70R
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_0Pdfcil1W0jzu
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_qlLO5AY6C6ohCC

# Frontend (frontend/.env.local)
NEXT_PUBLIC_WHOP_APP_ID=app_Vg0lsvQh2Hg70R
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_0Pdfcil1W0jzu
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_qlLO5AY6C6ohCC
```

---

## Setup Steps

### 1. Get Webhook Secret

You need to create a webhook endpoint in Whop Dashboard:

1. Go to [Whop Developer Dashboard](https://dash.whop.com/developer)
2. Click your app (`app_Vg0lsvQh2Hg70R`)
3. Go to **Webhooks** section
4. Add endpoint: `https://your-domain.com/api/webhooks/whop`
   - For local dev: Use ngrok → `https://abc123.ngrok.io/api/webhooks/whop`
5. Subscribe to events:
   - ✅ `payment.succeeded`
   - ✅ `membership.created`
6. Copy the **Webhook Secret** and add to `.env`:
   ```env
   WHOP_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### 2. Test Webhook (Local Development)

If testing locally, use ngrok:

```powershell
# Terminal 1: Start backend
node mcp-server.js

# Terminal 2: Start ngrok
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Add to Whop webhook: https://abc123.ngrok.io/api/webhooks/whop
```

### 3. Verify Integration

Test the webhook endpoint:

```powershell
curl -X POST http://localhost:3000/api/webhooks/whop `
  -H "Content-Type: application/json" `
  -d '{
    "action": "payment.succeeded",
    "data": {
      "id": "pay_test123",
      "amount": 2700,
      "plan_id": "plan_test",
      "user": {
        "email": "test@example.com",
        "username": "testuser"
      }
    }
  }'
```

Should return: `{"success":true}`

---

## How It Works

### Product Flow

```
1. Generate Ebook
   ↓
POST /api/products/ebook/generate
   ↓
2. Create on Whop
   ↓
POST /api/whop/product/create
{"productId": 123}
   ↓
3. Get Checkout Link
   ↓
Response: {"checkoutUrl": "https://whop.com/..."}
   ↓
4. Use in DMs
   ↓
"Want the full guide? $27: [checkout link]"
```

### Purchase Flow

```
1. User clicks Whop link
   ↓
2. User purchases on Whop
   ↓
3. Whop sends webhook
   ↓
POST /api/webhooks/whop
{
  "action": "payment.succeeded",
  "data": {
    "amount": 2700,
    "plan_id": "plan_xxx",
    "user": {"email": "..."}
  }
}
   ↓
4. Backend processes:
   - Creates sale record
   - Links to lead (if exists)
   - Marks lead as converted
   - Updates product stats
   ↓
5. Whop delivers product automatically
```

---

## API Endpoints

### Create Product on Whop

```bash
POST http://localhost:3000/api/whop/product/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "productId": 123
}
```

**Response:**
```json
{
  "success": true,
  "whopPlanId": "plan_xxxxxxxxx",
  "checkoutUrl": "https://whop.com/qlLO5AY6C6ohCC?pass=plan_xxxxxxxxx",
  "plan": {...}
}
```

### Webhook Handler (Automatic)

Whop calls this automatically on purchase:

```
POST https://your-domain.com/api/webhooks/whop
X-Whop-Signature: sha256=...

{
  "action": "payment.succeeded",
  "data": {
    "id": "pay_xxxxxxxxx",
    "amount": 2700,
    "plan_id": "plan_xxxxxxxxx",
    "user": {
      "email": "customer@example.com",
      "username": "customer123"
    }
  }
}
```

---

## Week 1 Usage Example

### Day 2: Create Product

```bash
# 1. Generate ebook
POST /api/products/ebook/generate
{
  "topic": "10 AI Tools to Make $1000/Month",
  "title": "The Complete AI Side Hustle Guide",
  "pageCount": 200
}

# Wait 30-40 minutes...

# 2. Upload PDF to Google Drive/Dropbox
# Get shareable link

# 3. Create on Whop
POST /api/whop/product/create
{
  "productId": <from_step_1>
}

# 4. Copy checkoutUrl from response
# Example: https://whop.com/qlLO5AY6C6ohCC?pass=plan_abc123
```

### Day 4-5: Use in DMs

When someone comments "GUIDE":

```
Hey @username! 👋

Here's your free guide: [Google Drive link to 2 chapters]

This covers the first 2 AI tools.

Want all 10 tools + step-by-step setup?

Get the complete guide here:
https://whop.com/qlLO5AY6C6ohCC?pass=plan_abc123

Limited time: $27 (usually $49) ⚡
```

### Automatic After Purchase

1. ✅ Whop delivers PDF instantly
2. ✅ Webhook updates your database
3. ✅ Lead marked as "converted"
4. ✅ Revenue tracked for analytics
5. ✅ Customer gets receipt email

---

## Database Tracking

All sales are automatically recorded:

**Table:** `product_sales`

| Field | Value |
|-------|-------|
| user_id | Your user ID |
| product_id | Internal product ID |
| amount_usd | 27.00 |
| stripe_charge_id | `pay_xxxxxxxxx` (Whop payment ID) |
| customer_email | buyer@example.com |
| customer_name | buyer123 |
| lead_id | Link to leads table |
| purchased_at | 2025-01-15 14:30:00 |

**Table:** `leads` (auto-updated)

| Field | Before | After |
|-------|--------|-------|
| converted | false | true |
| converted_at | null | 2025-01-15 14:30:00 |
| conversion_value | null | 27.00 |
| funnel_stage | 'lead' | 'converted' |

---

## Advantages of Whop Integration

### vs. Manual Delivery

| Manual | Whop |
|--------|------|
| Check DM manually | Automatic |
| Send PDF link manually | Instant delivery |
| Track in spreadsheet | Auto-tracked in DB |
| No receipts | Professional receipt |
| Customer support = you | Whop handles it |
| Payment processor fees | Lower fees |
| 5-10 min per sale | 0 seconds |

### vs. Gumroad/Stripe Direct

| Others | Whop |
|--------|------|
| Build checkout page | Embedded/hosted |
| Handle refunds | Automatic |
| Manage access | Built-in |
| Mobile checkout | Optimized |
| Setup time | 5 minutes |

---

## Testing Checklist

### Local Testing

- [ ] Backend running: `node mcp-server.js`
- [ ] Environment variables loaded (check console logs)
- [ ] Generate test ebook
- [ ] Create Whop product/plan
- [ ] Test webhook with curl
- [ ] Check `product_sales` table in Supabase

### Production Testing

- [ ] Deploy backend to Railway/Vercel
- [ ] Set environment variables in production
- [ ] Add production webhook URL to Whop
- [ ] Make test purchase ($0.50 test product)
- [ ] Verify webhook received
- [ ] Check sale recorded in database
- [ ] Verify instant delivery works

---

## Common Issues

### "Whop API key not configured"

**Fix:** Check `.env` file has `WHOP_API_KEY=...`

Restart server after adding.

### Webhook not receiving events

**Fix:** 

1. Check URL is correct in Whop Dashboard
2. If local dev, use ngrok
3. Check webhook signature is valid
4. Look at Whop Dashboard → Webhooks → Event log

### "Plan creation failed"

**Fix:**

1. Verify `NEXT_PUBLIC_WHOP_COMPANY_ID` is correct
2. Check API key has correct permissions
3. See Whop Dashboard → Settings → API Permissions

### Sales not linking to leads

**Fix:**

Ensure lead has email in metadata:

```javascript
// When capturing lead
{
  "metadata": {
    "email": "user@example.com",
    "twitter_username": "@user"
  }
}
```

Webhook will match by email.

---

## Advanced: Custom Checkout URLs

You can pass metadata to track attribution:

```javascript
const checkoutUrl = `https://whop.com/${companyId}?pass=${planId}&metadata[lead_id]=${leadId}&metadata[source]=twitter`;
```

Metadata will be in webhook:

```json
{
  "data": {
    "metadata": {
      "lead_id": "123",
      "source": "twitter"
    }
  }
}
```

---

## Revenue Tracking

Query your Whop sales:

```bash
# From Whop API (last 30 days)
GET /api/whop/sales?timeframe=30days

# From local database
SELECT 
  COUNT(*) as total_sales,
  SUM(amount_usd) as total_revenue
FROM product_sales
WHERE purchased_at >= NOW() - INTERVAL '30 days'
  AND stripe_charge_id IS NOT NULL
```

Expected Week 1: 1-3 sales = $27-$81  
Expected Month 1: 10-30 sales = $270-$810  
Expected Month 3: 100+ sales = $2,700+

---

## Next Steps

### Week 1 (Manual)

1. ✅ Generate 1 ebook
2. ✅ Create on Whop ($27)
3. ✅ Use checkout link in manual DMs
4. ✅ Make first sale

### Week 2 (Semi-automated)

1. Generate 3 ebooks (different niches)
2. Create all on Whop ($27, $49, $97)
3. Use lead triggers for auto-DM
4. A/B test prices

### Week 3+ (Fully automated)

1. Auto-DM with Whop links
2. Track funnel (views → clicks → purchases)
3. Scale to 10+ accounts
4. Multi-product bundles

---

## Resources

- **Whop Docs:** https://docs.whop.com/apps/api/getting-started
- **Your Developer Dashboard:** https://dash.whop.com/developer
- **SDK Docs:** https://docs.whop.com/apps/sdk/typescript
- **Webhook Reference:** https://docs.whop.com/apps/webhooks
- **Your Installation Link:** https://whop.com/apps/app_Vg0lsvQh2Hg70R/install/

---

## Summary

✅ **Whop is fully integrated**  
✅ **Official SDK installed**  
✅ **Webhook handler ready**  
✅ **Environment configured**  
✅ **Database tracking complete**  

**You just need to:**
1. Add webhook secret to `.env`
2. Create webhook in Whop Dashboard
3. Test with first ebook

**Then you're ready to sell! 🚀**

