# Tech Stack Document for PostPulse.io

This document explains, in everyday language, the technology choices behind PostPulse.io. It’s designed so anyone—technical or not—can understand why we picked each tool and how it helps the project.

## 1. Frontend Technologies

We want the part of the app you see (the frontend) to be fast, responsive, and easy to use. Here’s what we picked:

- Next.js (built on React)
  - Provides server-side rendering (SSR) for fast page loads and good search visibility.
  - Gives us a built-in routing system so pages and dashboards feel snappy.
- React
  - Lets us build reusable components (buttons, forms, cards) for a clean, consistent interface.
- CSS Modules (built into Next.js)
  - Scope styles to individual components to avoid messy, global CSS.
  - Keeps styling simple without adding big external libraries.
- @supabase/ssr helper
  - Ensures authentication checks happen before pages load, so secure areas stay locked down.

How this enhances user experience:
- Fast initial load thanks to SSR.
- Smooth, app-like navigation without full page refreshes.
- Clear, consistent look and feel through reusable components.
- Protected pages (dashboard, account settings) load securely and quickly.

## 2. Backend Technologies

Behind the scenes, we need a place to store data, run logic, and connect to AI or social platforms. Here’s what we use:

- Supabase (database, authentication, backend logic)
  - PostgreSQL database for storing users, campaigns, accounts, leads.
  - Authentication via email, OAuth, JWT tokens; enforces row-level security so each user sees only their data (except admins).
  - Edge Functions for custom server-side logic (e.g., proxying requests to OpenAI or n8n).
- OpenAI (and Grok)
  - Generates text content (threads, comments, scripts) based on user keywords and prompts.
- n8n (workflow automation)
  - Handles media creation: images, slideshows, videos via templates.
  - Runs on simple HTTP triggers from our app, so we keep front-end and back-end decoupled.
- MoreLogin
  - Manages multiple social media accounts safely with built-in proxy rotation and device emulation.
- Upload-Post API
  - Publishes content automatically to TikTok, Instagram, X, and YouTube.
- PRAW (Python Reddit API Wrapper)
  - Automates Reddit interactions: posting, commenting, upvoting.
- Typeform and ConvertKit
  - Power the lead capture funnels (forms, email sequences) that turn engagement into real contacts.

How these work together:
1. User creates a campaign in the app.
2. Supabase triggers OpenAI for text and sends the prompt to n8n for media.
3. Generated content is saved back in Supabase as a JSON blob.
4. When scheduling, Supabase queues posts with timing rules.
5. At publish time, our backend calls Upload-Post or PRAW using the credentials stored via MoreLogin.
6. Typeform/ConvertKit capture leads from replies or DMs.

## 3. Infrastructure and Deployment

We want reliable hosting, smooth deployments, and safe version control. Here’s our setup:

- Railway
  - Hosts both the Next.js app and Supabase Edge Functions with automatic scaling.
  - Connects directly to our GitHub repo for instant deployments on push.
- Git & GitHub
  - All code lives in a GitHub repository for version tracking and peer review.
- CI/CD pipeline (Railway + GitHub)
  - On every code push, Railway builds and deploys the latest version.
  - Environment variables (SUPABASE_URL, SUPABASE_KEY, N8N_URL, MORELOGIN_API_KEY, etc.) are managed securely in Railway.
- n8n hosting
  - Can be self-hosted or run in the cloud; we configure webhooks and credentials once and let n8n handle workflow uptime.

These choices give us:
- One-click (or push) deploys so new features go live fast.
- Automatic scaling to handle sudden traffic spikes (important when campaigns go viral).
- Centralized management of secrets so credentials stay safe.

## 4. Third-Party Integrations

PostPulse.io connects to several outside services to deliver full automation:  

- MoreLogin (account emulation, proxy rotation)  
- Upload-Post API (auto-posting to TikTok, Instagram, X, YouTube)  
- PRAW (Reddit posting and commenting)  
- OpenAI & Grok (AI text generation)  
- n8n (media workflows, Google Sheets exports)  
- Typeform (lead capture forms)  
- ConvertKit (email sequences for leads)  
- Whop (payment processing for subscriptions)  
- Google Sheets API (optional export of campaign data)

Benefits of these integrations:
- Each tool is best-in-class at its job (AI, posting, workflows, payments).
- We avoid building complex features from scratch, speeding up the MVP.
- Clear separation of concerns: our app focuses on orchestration, not reinventing wheels.

## 5. Security and Performance Considerations

Security measures:
- Supabase Auth with JWT tokens and strict row-level security (RLS).  
- Role-based access: Owner/Admin sees all users; standard users see only their own data.  
- Environment variables for all API keys (never hard-coded).  
- MoreLogin’s proxy/IP rotation and warm-up routines prevent bans and credential exposure.  
- Input validation on all forms and API endpoints to block malicious data.

Performance optimizations:
- Server-side rendering (Next.js) for fast first paint.  
- Edge Functions for low-latency calls to AI or workflow engines.  
- Asynchronous job scheduling for posting (no user waits).  
- Database indexing on key tables (campaigns, accounts, leads) for quick lookups.  
- Controlled posting velocity and queuing to avoid rate-limit throttling.

## 6. Conclusion and Overall Tech Stack Summary

PostPulse.io’s tech stack is tailored to deliver a powerful, AI-driven content automation tool that’s easy to use, secure, and scalable. Here’s the quick recap:

- Frontend: Next.js + React for fast, polished user interfaces.
- Backend: Supabase (DB, Auth, Edge Functions) + OpenAI + n8n + MoreLogin + Upload-Post + PRAW for a modular, data-driven core.
- Infrastructure: Railway + GitHub for smooth CI/CD and reliable scaling.
- Integrations: Typeform, ConvertKit, Whop, Google Sheets API to cover payments, lead capture, and data export.
- Security & Performance: JWT/RLS, proxy rotation, SSR, edge logic, and queueing to keep everything safe and responsive.

Together, these technologies align perfectly with our goal: let users set up multi-platform campaigns in minutes, generate thousands of AI-powered posts, capture leads automatically, and focus on growth—while the platform handles the heavy lifting.