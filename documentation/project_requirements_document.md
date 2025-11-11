# Project Requirements Document (PRD)

## 1. Project Overview

PostPulse.io is an AI-driven web platform that automates end-to-end social media content creation, posting, engagement, and lead capture across five major networks (TikTok, Instagram, X, YouTube, Reddit). Users start by entering campaign details (keywords, topics, target platforms), then PostPulse.io uses AI (OpenAI/Grok) to generate text assets and triggers n8n workflows to create videos, slideshows, and images. The system schedules and posts that content through MoreLogin-managed profiles (with proxy rotation) and the Upload-Post API or PRAW, all while capturing comments, DMs, and leads in Supabase.

Built as a lean MVP, PostPulse.io first serves solo creators driving organic traffic to digital products ($27–$99) with the goal of $1K–$5K daily revenue. Key success criteria include:

*   Generating and posting 1,000–5,000 AI-powered pieces per day across 100–300 warmed-up accounts
*   Capturing 1K+ weekly leads with 3–5% conversion rates
*   Delivering a unified dashboard for campaign setup, multi-platform scheduling, and analytics\
    Future phases add freemium subscriptions ($49–$99/month via Whop), team roles, deeper API integrations, and native mobile apps.

## 2. In-Scope vs Out-of-Scope

### In-Scope (MVP)

*   Responsive web app (no native mobile) built with Next.js
*   User Authentication & Roles: Owner/Admin vs Standard User via Supabase (email, OAuth, JWT, RLS)
*   Accounts Page: link MoreLogin profiles (pre-configured proxies/IP rotation) and Upload-Post API keys
*   Campaign Wizard: name, keywords, topics, platform selection, profile selection, posting cadence
*   AI Content Generation: OpenAI/Grok for text; n8n workflows for media (videos, slideshows, images)
*   Multi-Account Auto-Posting: Upload-Post API (TikTok/IG/X/YouTube), PRAW for Reddit; velocity controls & warm-ups
*   Lead Capture & Auto-Interaction: keyword monitoring, auto-DMs/replies, Typeform/ConvertKit funnel integration, leads stored in Supabase
*   Analytics Dashboard: internal counters (impressions, clicks, leads, conversions, revenue) with on-demand Google Sheets export
*   Basic Payment Flow: integrate Whop for future subscription management (no live billing needed at MVP)
*   Hosting & Deployment: Railway for Next.js, Supabase for backend/DB/auth, self-hosted or cloud n8n

### Out-of-Scope (Phase 2+)

*   Native iOS/Android apps
*   Direct API integrations for official platform analytics
*   In-depth branding, custom UI design system
*   Team/collaboration features beyond Owner/Admin vs Standard User
*   Advanced legal/compliance modules (GDPR, CCPA)
*   Stripe, Gumroad or multiple payment gateways beyond Whop
*   Real-time chat or support modules

## 3. User Flow

First, a new user lands on PostPulse.io and signs up via email or OAuth. Supabase issues a JWT and the user is redirected to a dashboard. If signed in as Owner/Admin, they see a global Users panel; standard users go directly to their workspace. From the sidebar, they click “Accounts” to add MoreLogin profiles—each profile already has proxy rotation set up—plus Upload-Post credentials. The system runs auto-warm routines until all accounts report “healthy.”

Next, the user visits “Campaigns” and launches the wizard. They enter campaign name, select keywords/topics, pick platforms and MoreLogin profiles, and set posting frequency. Once submitted, the backend calls OpenAI/Grok for text drafts and fires n8n workflows (via webhooks) to generate videos, slideshows, or images. Generated assets are stored in Supabase. In “Schedule & Preview,” users can edit text or swap media. After approval, posts are queued with delays and proxies. The automation engine triggers Upload-Post and PRAW to publish. As content goes live, the lead-capture module monitors comments/replies, sends auto-DMs or form links, and records leads into Supabase. Finally, the “Analytics” page displays internal metrics and lets users export data.

## 4. Core Features

*   **Authentication & Roles**

    *   Supabase email/OAuth login, JWT-based sessions, Row-Level Security
    *   Owner/Admin vs Standard User access control

*   **Account Management**

    *   Link MoreLogin profiles (with pre-configured proxy/IP rotation, ADB/Selenium warm-ups)
    *   Connect Upload-Post API keys for TikTok, IG, X, YouTube; PRAW config for Reddit

*   **Campaign Creation Wizard**

    *   Unified form: campaign name, platforms, posting cadence, keywords/topics, profile selection

*   **AI Text Generation**

    *   OpenAI/Grok prompts based on user inputs for threads, comments, scripts

*   **Media Workflow Automation**

    *   n8n HTTP webhooks to trigger video, slideshow, image templates (DALL·E, Pollinations)

*   **Multi-Account, Velocity-Controlled Posting**

    *   Queue system with delays/proxies for 1K–5K posts/day; uses Upload-Post API & PRAW

*   **Lead Capture & Engagement**

    *   Keyword monitoring on comments, auto-DMs/replies directing to Typeform/ConvertKit funnels
    *   Leads stored in Supabase leads table with source metadata

*   **Analytics & Exports**

    *   Internal counters for impressions, clicks, leads, conversions, revenue
    *   On-demand Google Sheets export via n8n node or direct DB query

*   **Basic Monetization Setup**

    *   Whop integration placeholder for freemium/premium subscriptions

*   **Deployment & Env Management**

    *   Railway hosting, secure env variables (SUPABASE_URL/KEY, N8N_URL, MORELOGIN_KEY)

## 5. Tech Stack & Tools

*   **Frontend**: Next.js (App Router, React)
*   **Backend & Auth**: Supabase (Database, Auth, Edge Functions, RLS)
*   **Workflow Automation**: n8n (self-hosted or cloud)
*   **AI Models**: OpenAI GPT-4/Grok for text; DALL·E/Pollinations for images/videos
*   **Account Emulation**: MoreLogin (with Selenium/ADB warm-ups, proxy/IP rotation)
*   **Posting APIs**: Upload-Post API (TikTok/IG/X/YT), PRAW (Reddit)
*   **Forms & Funnels**: Typeform, ConvertKit
*   **Payment Gateway**: Whop
*   **Hosting/CI**: Railway (Next.js, Supabase Edge), Git-based deploys
*   **Optional Exports**: Google Sheets API via n8n

## 6. Non-Functional Requirements

*   **Performance**:

    *   Dashboard initial load < 2s on 3G.
    *   AI & n8n triggers return within 5–10s for small batches.

*   **Scalability**:

    *   Support 100–300 accounts, 1K–5K daily posts.
    *   Database indexing on campaigns, accounts, leads.

*   **Security**:

    *   HTTPS everywhere, JWT for all API calls.
    *   RLS ensures users see only their own data (except Owner/Admin).
    *   Encrypted storage of third-party credentials.

*   **Reliability**:

    *   Retry logic for failed HTTP calls to n8n, Upload-Post, PRAW.
    *   Circuit breaker for platform rate-limit errors.

*   **Usability**:

    *   Simple, mobile-responsive UI.
    *   Clear status indicators for warm-ups, queued posts, and lead events.

*   **Compliance**:

    *   No special GDPR/CCPA requirements initially; follow standard data-retention best practices.

## 7. Constraints & Assumptions

*   Supabase, Railway, and n8n instances are provisioned before development.
*   MoreLogin account rotation and proxy infrastructure already configured by user.
*   Upload-Post API keys and PRAW credentials available at setup.
*   AI service quotas (OpenAI/Grok) are sufficient for 100–500 items/day.
*   Users accept on-demand Google Sheets export instead of real-time sync.
*   All platform posting occurs via headless emulation or official APIs—no scraping.

## 8. Known Issues & Potential Pitfalls

*   **Platform Blocking & Rate Limits**:

    *   TikTok, Instagram, X may throttle or ban accounts.
    *   Mitigation: built-in velocity controls, proxy rotation, warm-up routines.

*   **n8n Workflow Failures**:

    *   HTTP triggers can fail due to network issues.
    *   Mitigation: implement retries, fallback to manual re-enqueue.

*   **AI Content Quality**:

    *   Generic prompts may produce low-value posts.
    *   Mitigation: tune prompts, allow quick editing in preview.

*   **Credential Drift**:

    *   MoreLogin or Upload-Post tokens may expire.
    *   Mitigation: periodic credential health checks and re-authentication flows.

*   **Data Consistency**:

    *   Partial failures (text OK, media not generated) could orphan campaigns.
    *   Mitigation: atomic DB transactions or compensating cleanup jobs.

This PRD fully describes PostPulse.io’s MVP requirements. Subsequent technical documents (Tech Stack, Frontend Guidelines, Backend Structure, etc.) can use this as the definitive blueprint.
