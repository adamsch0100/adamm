# PostPulse.io: Step-by-Step Implementation Guide

This guide walks you through setting up and building PostPulse.io—a secure, scalable AI-driven content automation platform—using Railway, Supabase, n8n, Next.js, and integrations with MoreLogin, Upload-Post, PRAW, OpenAI/Grok, Typeform/ConvertKit, and Whop.

---

## Table of Contents
1. Prerequisites
2. Infrastructure Setup
   - Railway
   - Supabase
   - n8n
   - Domain & TLS
   - CI/CD & Secret Management
3. Local Development Environment
4. Code Structure & Conventions
5. Authentication & Authorization
6. Campaign Creation Flow
7. AI Content Generation (OpenAI/Grok)
8. n8n Workflow Configuration
9. Account Management & Auto-Posting
   - MoreLogin Integration
   - Upload-Post API Integration
   - PRAW (Reddit)
10. Lead Capture & Auto-Interactions
11. Payments via Whop
12. Dashboard & Analytics
13. Security Best Practices
14. Deployment to Railway

---

## 1. Prerequisites

- **Accounts & Services**:
  • Railway
  • Supabase (Project + Auth)
  • n8n (Self-hosted or Cloud)
  • OpenAI/Grok API Key
  • MoreLogin account + API Key
  • Upload-Post API Key
  • Reddit app credentials (for PRAW)
  • Typeform & ConvertKit accounts
  • Whop account + API Key
- **Local Tools**:
  • Node.js ≥16, Yarn (or npm)
  • Git
  • Docker (optional, for n8n local)

---

## 2. Infrastructure Setup

### 2.1 Railway
1. Create a new Railway project.
2. Connect your GitHub repository (empty `postpulse` repo).
3. In Railway dashboard, add **Environment Variables** (under Settings → Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `MORELOGIN_API_KEY`
   - `UPLOAD_POST_API_KEY`
   - `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`
   - `TYPEFORM_TOKEN`, `CONVERTKIT_API_KEY`
   - `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`
4. Enable Railway’s **Secrets management** for these variables (never check them into source).

### 2.2 Supabase
1. Create a new Supabase project.
2. In **Auth → Settings**:
   - Enable Email Sign-up
   - Add OAuth providers (Google, GitHub) if needed.
3. In **SQL Editor**, run schema migrations:

```sql
-- users table (built-in)
-- campaigns
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  keywords text[],
  topics text[],
  content_json jsonb,
  created_at timestamptz default now()
);

-- accounts
create table accounts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  morelogin_id text not null,
  platform text not null,
  created_at timestamptz default now()
);

-- leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  email text not null,
  source text,
  created_at timestamptz default now()
);
```

4. **Row-Level Security (RLS)**:
```sql
alter table campaigns enable row level security;
create policy "Users can manage their campaigns" on campaigns
  for all using (auth.uid() = user_id);

alter table accounts enable row level security;
create policy "Campaign owner can access accounts" on accounts
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_id and c.user_id = auth.uid()
    )
  );

alter table leads enable row level security;
create policy "Campaign owner can access leads" on leads
  for all using (auth.uid() = (select user_id from campaigns where id = campaign_id));
```

5. Copy **Project URL** and **anon/service_role keys** to Railway variables.

### 2.3 n8n
1. Deploy n8n in Railway (or Docker):
   - Expose port 5678.
   - Add `.env`:
     ```
     N8N_BASIC_AUTH_ACTIVE=true
     N8N_BASIC_AUTH_USER=<username>
     N8N_BASIC_AUTH_PASSWORD=<strong_password>
     N8N_HOST=0.0.0.0
     N8N_PORT=5678
     ```
2. Secure n8n with Basic Auth and HTTPS (Railway auto-TLS).
3. Store third-party API keys in **n8n Credentials** (OpenAI, MoreLogin, Upload-Post, Reddit, Typeform, ConvertKit).

### 2.4 Domain & TLS
- Assign a custom domain in Railway → Domains & Certificates.
- Enforce HTTPS with HSTS via Railway settings.

### 2.5 CI/CD & Secret Management
- Add a **GitHub Actions** workflow:
  • Lint (ESLint, Prettier)
  • TypeScript compile
  • Run basic tests (e.g., `supabase-js` integration mocks)
  • Secret scanning (GitGuardian or GitHub Advanced Security)
- Use Railway’s automatic deploy on push to `main`.

---

## 3. Local Development Environment

1. Clone the repo:
   ```bash
   git clone git@github.com:<org>/postpulse.git
   cd postpulse
   ```
2. Copy env template:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   yarn install
   ```
4. Start services locally:
   - **Supabase**: `supabase start`
   - **n8n**: `docker-compose up -d n8n`
   - **Next.js**: `yarn dev`

---

## 4. Code Structure & Conventions

```
/src
 ├─ app/           # Next.js pages & layouts
 ├─ components/    # Reusable React components
 ├─ lib/           # API clients & utilities
 │   ├─ supabase.ts
 │   ├─ openai.ts
 │   ├─ morelogin.ts
 │   ├─ uploadPost.ts
 ├─ pages/api/     # Next.js API routes (auth, webhooks)
 ├─ workflows/     # n8n JSON workflow exports
 └─ styles/        # global CSS / Tailwind config
```

Conventions:
- **TypeScript** with `strict` mode.
- All sensitive logic in `/pages/api` or Supabase Edge Functions.
- Re-use `lib/` clients, ensure single instance per request.
- Use ESLint + Prettier for code consistency.

---

## 5. Authentication & Authorization

### 5.1 Supabase Client Initialization (lib/supabase.ts)
```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, detectSessionInUrl: true }
});
```

### 5.2 Sign-Up / Sign-In Pages
- Use Supabase’s React hooks (`useSession`, `useUser`, `signIn`, `signUp`).
- Enforce strong password policy in frontend & server.
- After login, redirect to `/campaigns`.
- On protected pages, check `session` server-side via `getServerSideProps` and redirect to `/login` if unauthenticated.

### 5.3 Role-Based Access (Owner/Admin vs Standard)
- Store an `app_metadata.role` claim on user sign-up (via Supabase Auth trigger or Edge Function).
- Use custom claim in RLS if needed for admin operations.

---

## 6. Campaign Creation Flow

1. **Wizard Form** (`/app/campaigns/new.tsx`):
   - Steps for keywords/topics → preview AI output → confirm.
2. On submit, call `/api/campaigns` (Next.js API route):
   ```ts
   // pages/api/campaigns/index.ts
   import { supabase } from '../../../lib/supabase';

   export default async function handler(req, res) {
     if (req.method !== 'POST') return res.status(405).end();
     const { keywords, topics } = req.body;
     // Input validation
     if (!Array.isArray(keywords) || !Array.isArray(topics)) {
       return res.status(400).json({ error: 'Invalid payload' });
     }
     const user = supabase.auth.user();
     const { data, error } = await supabase
       .from('campaigns')
       .insert({ user_id: user.id, keywords, topics })
       .single();
     if (error) return res.status(500).json({ error: error.message });
     res.status(201).json(data);
   }
   ```
3. On save, pre-generate minimal content JSON (or leave blank until AI step).

---

## 7. AI Content Generation (OpenAI/Grok)

### 7.1 Client Setup (`lib/openai.ts`)
```ts
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export default openai;
```

### 7.2 Cursor Prompt Templates
- **Thread Generation**:
  ```text
  You are an expert copywriter. Create a Twitter thread outline (10 tweets) based on these keywords:
  {{keywords.join(', ')}}
  Include hooks, value points, and a call to action at the end.
  ```
- **IG Carousel Scripts**:
  ```text
  Generate a 5-slide Instagram carousel script for topics: {{topics.join(', ')}}.
  Each slide should have a headline and 2–3 bullet points.
  ```
- **YouTube Short Script**:
  ```text
  Write a 60-second YouTube Short script about {{topic}} with an engaging hook and clear CTA.
  ```

### 7.3 API Call Example
```ts
// pages/api/generate.ts
import openai from '../../lib/openai';

export default async function handler(req, res) {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7
    });
    res.status(200).json({ content: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI generation failed' });
  }
}
```

---

## 8. n8n Workflow Configuration

1. **Create Media Workflow** (`workflows/media-generation.json`):
   - Trigger: Webhook (HTTP POST)
   - Node: OpenAI → returns text
   - Node: ImageMagick (via `executeCommand`) or `n8n-nodes-ffmpeg` for slideshows
   - Node: Upload result to S3 or Supabase Storage
   - Return media URL

2. **Example Webhook Node**:
```json
{
  "nodes": [
    { "parameters": { "path": "generate-media" }, "name": "Webhook", "type": "n8n-nodes-base.webhook" },
    { "parameters": { "resource": "chatCompletion", ... }, "name": "OpenAI", "type": "n8n-nodes-base.openAi" }
  ],
  "connections": { ... }
}
```
3. In Next.js, call this webhook after AI text generation:
```ts
const res = await fetch(`${process.env.N8N_WEBHOOK_URL}/generate-media`, { method: 'POST', body: JSON.stringify({ text }) });
const { mediaUrl } = await res.json();
```

---

## 9. Account Management & Auto-Posting

### 9.1 MoreLogin Integration (`lib/morelogin.ts`)
```ts
export async function warmUpAccount(moreloginId: string) {
  const res = await fetch('https://api.morelogin.com/v2/warmup', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.MORELOGIN_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: moreloginId })
  });
  return res.json();
}
```

### 9.2 Upload-Post API Integration (`lib/uploadPost.ts`)
```ts
export async function postToTikTok(accountId: string, videoUrl: string, caption: string) {
  const res = await fetch('https://upload-post.io/api/v1/tiktok/upload', {
    method: 'POST',
    headers: { 'x-api-key': process.env.UPLOAD_POST_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: accountId, videoUrl, caption })
  });
  return res.json();
}
```

### 9.3 Reddit Posting (PRAW via n8n or Edge Function)
- Use a Python Edge Function or n8n’s **PRAW Node**.
- Store credentials securely in n8n.

---

## 10. Lead Capture & Auto-Interactions

- In n8n, watch for comments via MoreLogin webhook or PRAW node.
- Filter by keywords → send DM or reply.
- Use Typeform/ConvertKit nodes to create subscribers.

---

## 11. Payments via Whop

1. Configure Whop webhook to `/api/whop-webhook`.
2. Validate signature:
```ts
import crypto from 'crypto';

export default function handler(req, res) {
  const signature = req.headers['x-whop-signature'] as string;
  const hmac = crypto
    .createHmac('sha256', process.env.WHOP_WEBHOOK_SECRET!)  
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (signature !== hmac) return res.status(401).end();
  // Process purchase event
  res.status(200).end();
}
```

---

## 12. Dashboard & Analytics

- Query Supabase Views:
  • Campaign performance: impressions, clicks, conversions
  • Leads by source
- Use React Chart libraries (Recharts or Chart.js) in `/components/Dashboard`.
- Only fetch minimal columns; use server-side data fetching to avoid exposing full tables.

---

## 13. Security Best Practices

- **Environment Variables**: All keys in Railway secrets; never commit `.env`.
- **Input Validation**: Use `zod` or `yup` in API routes.
- **CORS**: Restrictive policy in Next.js (`next.config.js`).
- **CSRF**: Use `next-csrf` or double-submit cookies for state-changing endpoints.
- **HTTP Headers**: In `next.config.js` or a custom Express server, add:
  ```js
  const securityHeaders = [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'same-origin' },
    { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; img-src *;" }
  ];
  module.exports = { async headers() { return [{ source: '/(.*)', headers: securityHeaders }]; } };
  ```
- **Rate Limiting**: Use `next-rate-limit` for API routes.
- **Dependency Scanning**: Integrate `npm audit`, Snyk or GitHub Dependabot.

---

## 14. Deployment to Railway

1. Push `main` branch:
   ```bash
   git add .
   git commit -m "Initial secure implementation"
   git push origin main
   ```
2. Railway auto-builds & deploys; monitor logs.
3. Run end-to-end tests (Selenium or Playwright) against staging.
4. Promote to production; verify metrics.

---

Congratulations! You now have a secure, production-ready blueprint for PostPulse.io. Adjust and iterate on each step to match evolving requirements and compliance needs.