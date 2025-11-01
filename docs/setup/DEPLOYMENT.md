# 🚀 Production Deployment Guide

## Railway Deployment (Recommended)

### Prerequisites
- Railway account (free tier available)
- GitHub repository (for auto-deployments)
- All API keys ready (Supabase, Stripe, MoreLogin, etc.)

---

## Step 1: Deploy MCP Server (Backend)

### 1.1 Create New Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

### 1.2 Configure Environment Variables

In Railway dashboard, add these variables:

```env
# Node Environment
NODE_ENV=production
PORT=3000

# MoreLogin API
MORELOGIN_API_ID=your_api_id_here
MORELOGIN_SECRET_KEY=your_secret_key_here
MORELOGIN_API_URL=https://api.morelogin.com

# OpenAI (Sora 2)
OPENAI_API_KEY=sk-your-key-here

# Google (Veo 3)
GOOGLE_API_KEY=your-google-key-here
GOOGLE_PROJECT_ID=your-project-id

# CoinMarketCap
COINMARKETCAP_API_KEY=your-cmc-key-here

# CORS (add your frontend domain)
ALLOWED_ORIGINS=https://your-frontend.railway.app,https://your-domain.com
```

### 1.3 Deploy
```bash
# From root directory (where mcp-server.js is)
railway up

# Or link GitHub repo for auto-deploy
railway link
git push origin main  # Auto-deploys on push
```

### 1.4 Verify Deployment
```bash
# Get your Railway URL
railway domain

# Test health endpoint
curl https://your-backend.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

---

## Step 2: Deploy Frontend (Next.js)

### 2.1 Create Separate Railway Service

In Railway dashboard:
1. Click "New"
2. Select "GitHub Repo"
3. Choose your repository
4. Select `frontend` folder as root directory

### 2.2 Configure Frontend Environment Variables

```env
# Node
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MCP Server
NEXT_PUBLIC_MCP_SERVER_URL=https://your-backend.railway.app

# Encryption
ENCRYPTION_KEY=random-32-char-string-here-change-this-in-production
```

### 2.3 Build Settings

Railway should auto-detect Next.js. If not:

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

**Root Directory:**
```
frontend
```

### 2.4 Custom Domain (Optional)

1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records as shown
4. Wait for SSL certificate (automatic)

---

## Step 3: Configure Stripe Webhooks

### 3.1 Create Webhook Endpoint

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Add endpoint
3. URL: `https://your-frontend.railway.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3.2 Copy Webhook Secret

Copy the `whsec_...` key and add to frontend env vars as `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Database Setup (Supabase)

### 4.1 Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Wait for provisioning (~2 minutes)

### 4.2 Run Database Schema

In Supabase SQL Editor, run:
```bash
# Copy contents of supabase-schema.sql
# Paste into SQL Editor
# Click "Run"
```

### 4.3 Enable Row Level Security

RLS is automatically enabled in the schema. Verify:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`

### 4.4 Configure Auth

In Supabase Dashboard → Authentication:
1. **Email Auth**: Enabled
2. **Confirm email**: Enabled
3. **Site URL**: `https://your-frontend.railway.app`
4. **Redirect URLs**: Add:
   - `https://your-frontend.railway.app/auth/callback`
   - `https://your-frontend.railway.app/dashboard`

---

## Step 5: Monitoring & Logs

### 5.1 Railway Logs

```bash
# View MCP server logs
railway logs

# Follow logs in real-time
railway logs --follow
```

### 5.2 Health Monitoring

Set up uptime monitoring (e.g., UptimeRobot):
- URL: `https://your-backend.railway.app/health`
- Interval: 5 minutes
- Alert if down

### 5.3 Error Tracking (Optional)

Consider adding Sentry:
```bash
npm install @sentry/node @sentry/nextjs
```

---

## Step 6: Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Supabase database schema deployed
- [ ] Stripe webhooks configured & tested
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active
- [ ] Health check endpoint responding
- [ ] Test signup flow end-to-end
- [ ] Test payment flow (use Stripe test mode first!)
- [ ] Verify email confirmation works
- [ ] Test device viewer with real MoreLogin device
- [ ] Test account creation flow
- [ ] Test multi-platform posting
- [ ] Check all API keys are production keys (not test)
- [ ] Enable CORS for production domain
- [ ] Set up monitoring alerts
- [ ] Database backups enabled (Supabase does this automatically)
- [ ] Rate limiting configured (if needed)

---

## Scaling Considerations

### Traffic Scaling (Railway)
Railway auto-scales based on usage. For high traffic:
1. Upgrade to Pro plan
2. Configure scaling rules
3. Add horizontal replicas if needed

### Database Scaling (Supabase)
1. Start with Free tier (500MB, 2GB bandwidth)
2. Upgrade to Pro when you hit:
   - 8GB database size
   - 250GB bandwidth
   - 50+ concurrent connections

### Cost Estimates

**Starting (0-100 users):**
- Railway: $5/month (MCP server)
- Railway: $5/month (Frontend)
- Supabase: Free
- **Total: ~$10/month**

**Growing (100-1000 users):**
- Railway: $20/month (both services)
- Supabase Pro: $25/month
- **Total: ~$45/month**

**Scaled (1000+ users):**
- Railway Pro: $50-100/month
- Supabase Pro: $25-100/month
- **Total: ~$75-200/month**

Plus variable costs:
- SMS verification: ~$0.50/account created
- Video generation: ~$0.20/video
- Proxy bandwidth: ~$5-20/user/month

---

## Troubleshooting

### Frontend won't build
```bash
# Check build logs
railway logs

# Common issues:
# 1. Missing env vars
# 2. TypeScript errors
# 3. Import errors

# Test locally first:
cd frontend
npm run build
```

### Backend not responding
```bash
# Check health endpoint
curl https://your-backend.railway.app/health

# Check logs
railway logs

# Restart service
railway restart
```

### Database connection failed
```bash
# Verify Supabase URL and keys
# Check if service role key has right permissions
# Ensure RLS policies allow operations
```

### Stripe webhook not working
```bash
# Test webhook locally with Stripe CLI:
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Check webhook secret matches
# Verify endpoint URL is correct
# Check event types are selected
```

---

## Security Best Practices

1. **API Keys**: Never commit to git
2. **Encryption Key**: Use strong random string (32+ chars)
3. **Supabase RLS**: Always enabled
4. **CORS**: Whitelist only your domains
5. **Rate Limiting**: Implement for public endpoints
6. **Database Backups**: Enable point-in-time recovery
7. **SSL**: Always use HTTPS (Railway handles this)
8. **Environment Variables**: Different for dev/staging/prod

---

## Backup & Recovery

### Database Backups (Supabase)
- Automatic daily backups (Pro plan)
- Point-in-time recovery (Pro plan)
- Manual backup:
  ```bash
  # Export to SQL
  pg_dump -h db.your-project.supabase.co -U postgres > backup.sql
  ```

### Code Backups
- GitHub repository (primary)
- Railway automatic Git integration
- Keep `.env.example` updated in repo

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs

Need help? Check the README.md or raise an issue in the repository.




