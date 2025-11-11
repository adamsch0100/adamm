# 🚀 PostPulse.io Quick Launch Guide

**Goal: Get PostPulse.io running in production within 2 hours**

## Prerequisites Checklist

- [ ] Supabase project exists and is healthy
- [ ] API keys configured in Supabase `operator_settings` table
- [ ] Railway account ready
- [ ] Domain name available (optional)

---

## Phase 1: Environment Setup (15 minutes)

### 1. Configure Production Environment Variables

Create `.env.production` in your project root:

```env
# ===============================================
# SUPABASE CONFIGURATION
# ===============================================
NEXT_PUBLIC_SUPABASE_URL=https://oplnmnyohkahixymoqdy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ===============================================
# SECURITY
# ===============================================
ENCRYPTION_KEY=production-encryption-key-32-chars-min

# ===============================================
# APP CONFIGURATION
# ===============================================
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 2. Generate Production Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `ENCRYPTION_KEY` in your `.env.production`.

---

## Phase 2: Railway Deployment (30 minutes)

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init postpulse-io

# Link to existing project (if you have one)
railway link
```

### 2. Configure Multi-Service Setup

You need two services:
1. **MCP Server** (backend API)
2. **Next.js Frontend** (web app)

#### Service 1: MCP Server
```bash
# Create MCP service
railway add --name mcp-server

# Set environment variables for MCP service
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=https://oplnmnyohkahixymoqdy.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
railway variables set ENCRYPTION_KEY=your-32-char-encryption-key

# Set start command
railway service --name mcp-server --start-command "node mcp-server.js"
```

#### Service 2: Next.js Frontend
```bash
# Create frontend service
railway add --name frontend

# Set environment variables for frontend
railway variables set --service frontend NEXT_PUBLIC_SUPABASE_URL=https://oplnmnyohkahixymoqdy.supabase.co
railway variables set --service frontend NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
railway variables set --service frontend SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
railway variables set --service frontend ENCRYPTION_KEY=your-32-char-encryption-key
railway variables set --service frontend NODE_ENV=production
railway variables set --service frontend NEXT_PUBLIC_APP_ENV=production

# Set build settings
railway service --name frontend --build-command "npm run build"
railway service --name frontend --start-command "npm start"
```

### 3. Deploy

```bash
# Deploy both services
railway deploy

# Check deployment status
railway status
railway logs --service mcp-server
railway logs --service frontend
```

---

## Phase 3: Database Migration (10 minutes)

### 1. Run Critical Migrations

Go to your Supabase dashboard → SQL Editor and run:

```sql
-- Step 1: Create campaigns table
\i supabase/migrations/20251110120000_create_campaigns_and_analytics_tables.sql

-- Step 2: Add campaign references
\i supabase/migrations/20251110120100_add_campaign_references.sql

-- Step 3: Migrate existing data
\i supabase/migrations/20251110120200_migrate_twitter_campaigns_data.sql
```

### 2. Verify Migrations

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('campaigns', 'analytics');

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('campaigns', 'analytics');
```

---

## Phase 4: Domain Configuration (10 minutes)

### 1. Add Custom Domain (Optional but Recommended)

```bash
# Add domain to frontend service
railway domain --service frontend --name yourdomain.com

# Configure DNS (add CNAME record pointing to Railway domain)
# Example: app.yourdomain.com CNAME your-railway-domain.up.railway.app
```

### 2. SSL Certificate

Railway automatically provides SSL certificates for custom domains.

---

## Phase 5: Final Validation (15 minutes)

### 1. Test Health Check

Visit: `https://your-domain.com/api/health`

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy" },
    "environment": { "status": "healthy" }
  }
}
```

### 2. Test Authentication

1. Visit your domain
2. Try to sign up/sign in
3. Verify Supabase Auth works

### 3. Test Basic Functionality

1. Create a test account (social media account)
2. Try creating a campaign
3. Test content generation (if OpenAI is configured)

### 4. Configure Monitoring

```bash
# Add health check monitoring
# Railway Dashboard → Your Project → Monitoring → Add Health Check
# URL: https://your-domain.com/api/health
# Method: GET
# Expected Status: 200
# Interval: 30 seconds
```

---

## Phase 6: Go Live Checklist

- [ ] Environment variables configured in Railway
- [ ] Database migrations completed successfully
- [ ] Both services (MCP + Frontend) deployed and healthy
- [ ] Health check endpoint responding
- [ ] Authentication working
- [ ] Basic campaign creation functional
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring alerts set up

---

## Troubleshooting

### Common Issues

**MCP Server won't start:**
```bash
# Check logs
railway logs --service mcp-server

# Common issues:
# - Missing SUPABASE_SERVICE_ROLE_KEY
# - Database connection failed
# - Port already in use (Railway handles this)
```

**Frontend build fails:**
```bash
railway logs --service frontend

# Common issues:
# - Missing NEXT_PUBLIC_SUPABASE_URL
# - TypeScript compilation errors
# - Missing dependencies
```

**Health check fails:**
- Check database connectivity
- Verify environment variables
- Check Supabase project status

### Rollback Plan

If deployment fails:
```bash
# Redeploy previous version
railway rollback --service frontend
railway rollback --service mcp-server

# Or redeploy from specific commit
railway deploy --service frontend --ref your-commit-hash
```

---

## Post-Launch Tasks

### Immediate (Next Day)
1. **Test core workflows:** Create campaign → Generate content → Post to test account
2. **Configure remaining API keys** in Supabase operator_settings
3. **Set up user onboarding flow**

### Week 1
1. **Monitor performance** and error rates
2. **Add rate limiting** if needed
3. **Configure backup alerts**
4. **Test payment integration** (Whop)

### Ongoing
1. **Monitor usage metrics**
2. **Optimize performance** based on real usage
3. **Add new features** based on user feedback

---

## Emergency Contacts

- **Railway Support:** https://railway.app/support
- **Supabase Support:** https://supabase.com/support
- **Your emergency contact:** [your phone/email]

---

**🎯 Target: PostPulse.io live and earning within 24 hours!**
