# Backend Structure Document for PostPulse.io

This document outlines the backend setup for PostPulse.io in clear, everyday language. It covers the architecture, database, APIs, hosting, infrastructure, security, monitoring, and maintenance.

## 1. Backend Architecture

**Overview**  
The backend for PostPulse.io is built on a serverless-first, function-driven design, using Supabase for data and authentication and Railway for hosting custom services. Key design elements:  

- Serverless functions (Supabase Edge Functions) to handle API logic in isolated units.  
- RESTful endpoints for clear, predictable communication.  
- Modular code organization separating campaign logic, account management, content generation, and posting workflows.  

**Scalability**  
- Serverless functions auto-scale based on traffic.  
- PostgreSQL on Supabase can handle high read/write volumes with built-in scaling options.  

**Maintainability**  
- Clear folder structure (`/api`, `/lib`, `/services`) keeps features decoupled.  
- Shared utilities for talking to OpenAI, n8n, and MoreLogin avoid duplication.  
- Comments and inline docs via CodeGuide.dev ensure any developer can onboard quickly.  

**Performance**  
- Lightweight edge functions reduce cold-start times.  
- Caching of repeated AI prompts can be added via in-memory stores or CDN.  
- Static assets served by CDN (e.g., Cloudflare) from Railway.

## 2. Database Management

**Technology**  
- PostgreSQL hosted by Supabase (SQL-based).  
- Built-in Row-Level Security (RLS) to enforce per-user data access.  

**Data Practices**  
- Each table has a UUID primary key and timestamp fields (`created_at`, `updated_at`).  
- RLS policies ensure users can only see their own campaigns, accounts, and leads.  
- Backups and point-in-time recovery configured via Supabase dashboard.

**Data Access**  
- Supabase client library (`@supabase/supabase-js`) in serverless functions and frontend.  
- Edge Functions verify JWT tokens and run queries with elevated privileges when needed.

## 3. Database Schema

### Human-Readable Schema

• **users**: Stores login info and role.  
  – id (UUID), email, role (admin/user), created_at  

• **campaigns**: Defines an AI content campaign.  
  – id (UUID), user_id (FK to users), keywords (text), topics (text), content_json (JSON), status, created_at  

• **accounts**: Links campaigns to social media accounts.  
  – id (UUID), campaign_id (FK), morelogin_id (string), platform (enum), status, created_at  

• **leads**: Captured emails and their source.  
  – id (UUID), campaign_id (FK), email, source (Typeform/ConvertKit), created_at  

• **posts**: Tracks each automated post.  
  – id (UUID), campaign_id (FK), account_id (FK), media_url, platform_post_id, status, posted_at  

• **analytics**: Stores metrics per post/campaign.  
  – id (UUID), post_id (FK), impressions, clicks, conversions, revenue, recorded_at

### SQL Schema (PostgreSQL)

```sql
-- Users
auth.users (managed by Supabase Auth)

-- Campaigns
drop table if exists campaigns;
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  keywords text,
  topics text,
  content_json jsonb,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Accounts
drop table if exists accounts;
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id),
  morelogin_id text,
  platform text,
  status text default 'active',
  created_at timestamptz default now()
);

-- Leads
drop table if exists leads;
create table leads (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id),
  email text,
  source text,
  created_at timestamptz default now()
);

-- Posts
drop table if exists posts;
create table posts (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id),
  account_id uuid not null references accounts(id),
  media_url text,
  platform_post_id text,
  status text,
  posted_at timestamptz
);

-- Analytics
drop table if exists analytics;
create table analytics (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id),
  impressions int,
  clicks int,
  conversions int,
  revenue decimal,
  recorded_at timestamptz default now()
);
```  

## 4. API Design and Endpoints

All APIs use REST over HTTPS, secured by Supabase JWT authentication.

**Authentication**  
- Supabase Auth handles signup/signin.  
- Client includes JWT in `Authorization` header for all backend calls.

**Key Endpoints**  

• `/api/campaigns`  
  – GET: list user’s campaigns  
  – POST: create a new campaign  

• `/api/campaigns/:id`  
  – GET: campaign details  
  – PUT: update keywords/topics/status  
  – DELETE: remove campaign  

• `/api/accounts`  
  – GET/POST: list or add a MoreLogin account for a campaign  

• `/api/generate-content`  
  – POST: accepts keywords/topics, calls OpenAI, returns text  

• `/api/trigger-media`  
  – POST: posts text to n8n webhook, returns media URL(s)  

• `/api/post`  
  – POST: pulls media/text from DB, calls Upload-Post API or PRAW, returns post ID  

• `/api/leads`  
  – GET/POST: view or store new leads from Typeform/ConvertKit  

• `/api/analytics`  
  – GET: fetch aggregated impressions, clicks, conversions per campaign

• Webhook `/webhook/n8n`  
  – Receives callbacks from n8n workflows with media creation results

## 5. Hosting Solutions

**Railway**  
- Hosts Next.js server (if any SSR is used), custom Node.js microservices (if needed), and n8n (optional self-hosted).  
- Auto-scaling dynos and predictable billing.  
- Integrated environment‐variable management.

**Supabase**  
- Manages PostgreSQL database and Edge Functions.  
- Built-in Auth removes need for separate identity provider.  

**n8n**  
- Self-hosted on a small Railway instance or Docker on a VM.  
- Connects AI model, media generation nodes, and webhooks.

## 6. Infrastructure Components

• **Load Balancer**: Managed by Railway to distribute traffic across function instances.  
• **CDN**: Cloudflare (or Railway’s built-in CDN) for serving static assets and caching API responses.  
• **Caching**: Optional Redis instance (can be added) for storing repeated AI results.  
• **Proxies & IP Rotation**: Provided by MoreLogin for safe, distributed posting.  
• **Workflow Engine**: n8n orchestrates multi-step media creation workflows.

## 7. Security Measures

• **Authentication & Authorization**  
  – Supabase Auth with JWT tokens.  
  – Row-Level Security on all tables to enforce per-user data access.  

• **Data Encryption**  
  – All traffic over TLS (HTTPS).  
  – Database encrypted at rest by Supabase.

• **Secrets Management**  
  – API keys (OpenAI, MoreLogin, Upload-Post, Stripe/Whop) stored in Railway/Supabase env variables.  

• **Regulatory Compliance**  
  – GDPR-friendly: users own their data, can delete accounts.  
  – PCI scope reduced by relying on Whop/Stripe for payment handling.

## 8. Monitoring and Maintenance

**Monitoring**  
- Railway Metrics for CPU, memory, and response times.  
- Supabase Dashboard for database performance and Edge Function logs.  
- n8n workflow logs to track failures in media generation.

**Maintenance**  
- Monthly dependency updates via Dependabot or Renovate.  
- Database migrations managed with Supabase CLI.  
- Regular backups and test restores from Supabase.  
- Sentry (or similar) for error tracking in serverless functions.

## 9. Conclusion and Overall Backend Summary

PostPulse.io’s backend uses a modern, serverless-centered stack that’s easy to scale and maintain. Supabase provides a robust database and authentication layer, while Railway handles hosting of custom services and n8n workflows. RESTful endpoints connect the frontend, AI engines, and social platforms, all secured by JWT and RLS rules. This setup ensures reliable automated content generation and posting, with clear monitoring and security practices—exactly what creators and agencies need to grow their social media presence efficiently.