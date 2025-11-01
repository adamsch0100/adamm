# 📋 Setup Checklist

## Phase 1: ✅ COMPLETE
The foundation is built and ready to go!

---

## Phase 2: Get Your Service Accounts Ready

### Supabase Setup
- [ ] Go to https://supabase.com and create a new project
- [ ] Wait for project to provision (~2 minutes)
- [ ] Copy **Project URL** from Settings → API
- [ ] Copy **anon/public key** from Settings → API
- [ ] Copy **service_role key** from Settings → API (keep secret!)
- [ ] Go to SQL Editor
- [ ] Create new query
- [ ] Paste contents of `supabase-schema.sql`
- [ ] Click "Run"
- [ ] Verify tables created (should see 13 tables in Table Editor)
- [ ] Update `frontend/.env.local`:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
  ```

---

### Stripe Setup (Payment Processing)
- [ ] Go to https://dashboard.stripe.com/register
- [ ] Create account or log in
- [ ] **Important**: Toggle to **Test Mode** (top right)
- [ ] Go to Products → Add Product
  - [ ] Create "Starter Plan"
    - Name: Starter
    - Price: $29.99/month (recurring)
    - Copy the **Price ID** (starts with `price_`)
  - [ ] Create "Growth Plan"
    - Name: Growth
    - Price: $79.99/month (recurring)
    - Copy the **Price ID**
  - [ ] Create "Pro Plan"
    - Name: Pro
    - Price: $199.99/month (recurring)
    - Copy the **Price ID**
- [ ] Go to Developers → API Keys
  - [ ] Copy **Publishable key** (starts with `pk_test_`)
  - [ ] Copy **Secret key** (starts with `sk_test_`)
- [ ] Go to Developers → Webhooks
  - [ ] Click "Add endpoint"
  - [ ] Endpoint URL: `https://your-domain.com/api/stripe/webhook` (or use ngrok for local testing)
  - [ ] Select events:
    - [ ] `checkout.session.completed`
    - [ ] `customer.subscription.updated`
    - [ ] `customer.subscription.deleted`
    - [ ] `invoice.payment_failed`
  - [ ] Copy **Signing secret** (starts with `whsec_`)
- [ ] Update `frontend/.env.local`:
  ```env
  STRIPE_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```
- [ ] Update `frontend/src/app/(auth)/signup/page.tsx`:
  ```typescript
  const PLANS = {
    starter: { name: 'Starter', price: 29.99, priceId: 'price_YOUR_STARTER_ID' },
    growth: { name: 'Growth', price: 79.99, priceId: 'price_YOUR_GROWTH_ID' },
    pro: { name: 'Pro', price: 199.99, priceId: 'price_YOUR_PRO_ID' }
  }
  ```

---

### Upload-post Setup (Multi-Platform Posting)
- [ ] Go to https://upload-post.com
- [ ] Sign up for an account
- [ ] Choose plan based on your tier:
  - Testing: Basic (€14/month, 1 profile)
  - Production: Professional (€42/month, 25 profiles) or higher
- [ ] Copy **API Key** from dashboard
- [ ] Update `frontend/.env.local`:
  ```env
  UPLOAD_POST_API_KEY=your_api_key_here
  ```
- [ ] (Optional) Connect social accounts via their dashboard for testing

---

### MoreLogin Setup (Virtual Phone Instances)
- [ ] You mentioned you already have this - verify credentials
- [ ] Log in to https://www.morelogin.com
- [ ] Go to API section
- [ ] Copy **API Key** and **API Secret**
- [ ] Update `mcp-server.js` environment or config
- [ ] Test connection: Create a test device via their API

---

### Decado Setup (Mobile Proxies)
- [ ] Go to https://decado.com
- [ ] Sign up for mobile proxy plan
- [ ] Get **API Key** from dashboard
- [ ] Note pricing: ~$0.10-0.15/GB for mobile proxies
- [ ] Store in database via user_api_keys table (encrypted)

---

### TextVerified Setup (SMS Verification)
- [ ] Go to https://textverified.com
- [ ] Create account
- [ ] Add funds ($10 minimum recommended)
- [ ] Go to API section
- [ ] Copy **API Key**
- [ ] Note pricing: ~$0.35 per verification
- [ ] Store in database via user_api_keys table (encrypted)

---

### OpenAI Setup (Video Generation)
- [ ] Go to https://platform.openai.com
- [ ] Create account or log in
- [ ] Go to API Keys
- [ ] Create new secret key
- [ ] Copy key (starts with `sk-`)
- [ ] **Important**: Add credits to account for Sora 2 access
- [ ] Pricing: ~$0.20-0.30 per video (estimated)
- [ ] Update `mcp-server.js` environment:
  ```env
  OPENAI_API_KEY=sk-...
  ```

---

## Phase 3: Test the Application

### Initial Setup
- [ ] Open terminal in project root
- [ ] Run `cd frontend`
- [ ] Run `npm install` (if not done already)
- [ ] Verify `.env.local` has all real values (no placeholders)
- [ ] Run `npm run build` to verify no errors
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3001

### Authentication Flow
- [ ] Click "Get Started" on landing page
- [ ] Select "Growth" plan
- [ ] Enter your email and a test password
- [ ] Click "Continue to Payment"
- [ ] Should redirect to Stripe checkout
- [ ] Use test card: `4242 4242 4242 4242`
  - Any future expiry (e.g., 12/34)
  - Any 3-digit CVC
  - Any ZIP code
- [ ] Complete checkout
- [ ] Should redirect to `/dashboard`
- [ ] Verify dashboard loads with your stats (all zeros initially)

### Database Verification
- [ ] Go to Supabase dashboard
- [ ] Open Table Editor
- [ ] Check `profiles` table - should have 1 row (your account)
- [ ] Verify `stripe_customer_id` is populated
- [ ] Verify `subscription_status` is "active"
- [ ] Check `subscription_plan` matches what you selected

### Stripe Verification
- [ ] Go to Stripe dashboard
- [ ] Go to Customers - should see 1 customer (your email)
- [ ] Go to Subscriptions - should see 1 active subscription
- [ ] Go to Payments - should see 1 successful payment

---

## Phase 4: Backend (MCP Server) Setup

### Environment Variables
- [ ] Create `.env` in project root (if not exists)
- [ ] Add all API keys:
  ```env
  MORELOGIN_API_KEY=your_key
  MORELOGIN_API_SECRET=your_secret
  DECADO_API_KEY=your_key
  TEXTVERIFIED_API_KEY=your_key
  OPENAI_API_KEY=your_key
  COINMARKETCAP_API_KEY=your_key (optional, for crypto topics)
  ```

### Test MCP Server
- [ ] Open separate terminal
- [ ] Navigate to project root
- [ ] Run `node mcp-server.js`
- [ ] Should see: "MCP Server listening on port 3000"
- [ ] Test endpoint: `curl http://localhost:3000/health` (should return OK)

---

## Phase 5: Encryption Key Setup

### Generate Encryption Key
- [ ] Open PowerShell or terminal
- [ ] Run: 
  ```powershell
  # PowerShell
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
  [Convert]::ToBase64String($bytes)
  
  # OR use OpenSSL (if installed)
  openssl rand -base64 32
  ```
- [ ] Copy the output
- [ ] Update `frontend/.env.local`:
  ```env
  ENCRYPTION_KEY=your_generated_key_here
  ```

---

## Phase 6: Production Deployment (Optional)

### Railway Setup
- [ ] Create account at https://railway.app
- [ ] Connect GitHub repository
- [ ] Create new project
- [ ] Add environment variables (same as `.env.local`)
- [ ] Deploy frontend (automatic from `frontend` directory)
- [ ] Deploy backend (Node.js service from root)
- [ ] Get production URLs
- [ ] Update Stripe webhook URL to production domain
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain

---

## 🎯 Quick Start (After Setup Complete)

```powershell
# Option 1: Use the helper script
.\scripts\start-dev.ps1

# Option 2: Manual start (2 terminals)
# Terminal 1 - Backend:
node mcp-server.js

# Terminal 2 - Frontend:
cd frontend
npm run dev
```

Then visit: http://localhost:3001

---

## ✅ Completion Criteria

You're ready for Phase 2 development when:

- [x] Phase 1 code is built and working
- [ ] Supabase project created with schema
- [ ] Stripe configured with 3 products
- [ ] Can sign up and checkout successfully
- [ ] Dashboard loads after signup
- [ ] All API keys obtained (Upload-post, MoreLogin, Decado, TextVerified, OpenAI)
- [ ] MCP server runs without errors
- [ ] Encryption key generated

---

## 🆘 Troubleshooting

### "Supabase connection failed"
- Verify URL and keys in `.env.local`
- Check if you're using the anon key (not service role) for NEXT_PUBLIC_SUPABASE_ANON_KEY
- Clear browser cache and cookies

### "Stripe checkout not working"
- Verify you're in Test Mode
- Check price IDs in `signup/page.tsx` match Stripe dashboard
- Verify publishable key is correct
- Check browser console for errors

### "Build fails with TypeScript errors"
- Run `npm install` again
- Delete `.next` folder: `rm -rf .next`
- Clear cache: `npm cache clean --force`
- Rebuild: `npm run build`

### "Database tables not created"
- Go to Supabase SQL Editor
- Click "Schema Visualizer" - should see all 13 tables
- If missing, re-run `supabase-schema.sql`

---

## 📞 Need Help?

Refer to these docs:
1. `SETUP-GUIDE.md` - Detailed setup instructions
2. `IMPLEMENTATION-SUMMARY.md` - What's been built
3. `frontend/README.md` - Frontend documentation
4. `supabase-schema.sql` - Database schema reference

---

**Once all checkboxes are checked, you're ready to continue with Phase 2: Upload-post Integration! 🚀**




