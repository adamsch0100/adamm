# Frontend-Backend Alignment Audit

## Summary
**CRITICAL ISSUES FOUND**: Frontend is calling MCP server directly instead of Next.js API routes in multiple places.

## API Contract Mismatches

### ❌ Campaigns Page (`/dashboard/campaigns`)
**Current**: `http://localhost:3000/api/campaigns` (MCP)
**Should**: `/api/campaigns` (Next.js API → MCP proxy)

**Issues**:
- Bypasses Next.js auth middleware
- Direct MCP calls from client (CORS/security issues)
- Missing Next.js API route entirely

### ❌ Accounts Page (`/dashboard/accounts`)
**Current**: `http://localhost:3000/api/accounts` (MCP)
**Should**: `/api/accounts` (Next.js API → MCP proxy)

**Issues**:
- Direct MCP calls from client
- Missing Next.js API route
- No auth middleware protection

### ❌ ContentUploader Component
**Current**: `http://localhost:3000/api/upload-post/upload-video` (MCP)
**Should**: `/api/post` (Next.js API → MCP proxy)

**Issues**:
- Direct MCP calls from client
- Missing Next.js API route for posting
- No proper error handling/auth

### ✅ Health Endpoints (Working)
- Frontend: `http://localhost:3001/api/health` ✅
- Backend: `http://localhost:3000/health` ✅

### ✅ Generate Content API (Implemented)
- Frontend calls: `/api/generate-content` ✅
- Backend endpoint: `POST /api/generate-content` ✅

## Missing Next.js API Routes

### Required Routes (Not Implemented)
1. **`/api/campaigns`** - GET/POST campaigns
2. **`/api/campaigns/[id]`** - GET/PATCH/DELETE specific campaign
3. **`/api/accounts`** - GET/POST accounts
4. **`/api/accounts/[id]`** - PATCH/DELETE accounts
5. **`/api/post`** - POST to MCP upload endpoints
6. **`/api/analytics`** - GET analytics data
7. **`/api/morelogin/*`** - Proxy to MCP device/warmup endpoints
8. **`/api/cloud-phones`** - Proxy to MCP device management

### Existing Routes (Working)
- ✅ `/api/generate-content` → MCP `/api/generate-content`
- ✅ `/api/health` - Health check
- ✅ `/api/metrics` - Admin metrics (403 for non-admin)

## Component Issues

### Dashboard Overview (`/dashboard`)
- ✅ Direct Supabase queries (correct)
- ✅ Platform breakdown display (all 6 platforms)
- ✅ Quick actions (non-functional buttons)

### CreateCampaignModal
- ❌ Missing implementation?
- ❌ No API calls visible

### CampaignDetailView
- ❌ Likely calls MCP directly
- ❌ Missing Next.js API routes

## Data Type Mismatches

### Campaign Schema
**Database**: Uses `uuid` for IDs
**Frontend Types**: May expect `number` or different structure

### Account Schema
**Database**: `social_accounts` table
**Frontend**: Expects different field structure

## Authentication Issues

### Missing Middleware Protection
- Dashboard routes not protected by middleware
- No session validation in API routes
- Direct MCP calls bypass auth

## Resolution Plan

### Phase 1: Create Missing API Routes
1. Implement `/api/campaigns` route
2. Implement `/api/accounts` route
3. Implement `/api/post` route
4. Implement `/api/analytics` route

### Phase 2: Add MCP Proxies
1. Create `/api/morelogin/*` proxy routes
2. Create `/api/cloud-phones` proxy
3. Create `/api/warmup/*` proxy routes

### Phase 3: Update Frontend Components
1. Change all MCP direct calls to Next.js API calls
2. Add proper error handling
3. Implement loading states

### Phase 4: Fix Data Types
1. Update frontend types to match DB schema
2. Fix ID type mismatches (uuid vs number)
3. Ensure date/timezone handling

### Phase 5: Add Middleware Protection
1. Protect `/dashboard/**` routes
2. Validate sessions in API routes
3. Add admin role checks

## Testing Checklist

- [ ] Login/signup works
- [ ] Dashboard loads with correct data
- [ ] Create campaign → calls correct API
- [ ] Add account → calls correct API
- [ ] Generate content → calls correct API
- [ ] Post content → calls correct API
- [ ] View analytics → calls correct API
- [ ] Device management → proxies work
- [ ] Warmup actions → proxies work

## Immediate Blockers

1. **Cannot test campaigns** - missing `/api/campaigns` route
2. **Cannot add accounts** - missing `/api/accounts` route
3. **Cannot post content** - missing `/api/post` route
4. **Security vulnerability** - direct MCP calls from client

## Priority Order

1. **HIGH**: Create `/api/campaigns` and `/api/accounts` routes
2. **HIGH**: Fix ContentUploader to use `/api/post`
3. **MEDIUM**: Add MCP proxy routes for devices/warmup
4. **MEDIUM**: Implement proper middleware protection
5. **LOW**: Fix data type mismatches
