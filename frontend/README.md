# Multi-Platform Social Automation SaaS

A powerful SaaS platform for automated multi-platform social media management across TikTok, Instagram, YouTube, Facebook, LinkedIn, and X/Twitter.

## 🚀 Features

- **Multi-Platform Support**: Manage 6 social platforms from one dashboard
- **Automated Account Creation**: Create and verify accounts automatically
- **Human-Like Warmup**: Platform-specific warmup strategies
- **AI Video Generation**: Create content with Sora 2 or Veo 3
- **Multi-Platform Distribution**: Post to all platforms simultaneously
- **Remote Device Control**: View and control phone instances in real-time
- **Cross-Platform Analytics**: Unified metrics across all platforms
- **Tiered Pricing**: From $29.99/month (Starter) to Enterprise

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI**: shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe
- **APIs**: Upload-post, MoreLogin, Decado, TextVerified, OpenAI
- **Deployment**: Railway

## 📦 Installation

```bash
# Clone the repository
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Visit http://localhost:3001

## ⚙️ Configuration

### 1. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `/supabase-schema.sql`
3. Copy your Project URL and anon key to `.env.local`

### 2. Stripe Setup

1. Create products for each tier (Starter, Growth, Pro)
2. Copy price IDs to `src/app/(auth)/signup/page.tsx`
3. Set up webhook endpoint
4. Add keys to `.env.local`

### 3. API Services

Configure API keys for:
- **Upload-post**: Multi-platform posting
- **MoreLogin**: Virtual phone instances
- **Decado**: Mobile proxies
- **TextVerified**: SMS verification
- **OpenAI**: Video generation (Sora 2/Veo 3)

## 📂 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages
│   ├── api/             # API routes
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Layout components
├── lib/
│   ├── supabase/        # Supabase clients
│   └── utils.ts         # Utility functions
└── types/
    └── index.ts         # TypeScript types
```

## 🎯 Key Components

### Authentication
- Login/Signup with Supabase
- Protected routes with middleware
- Stripe checkout integration

### Dashboard
- Overview with stats
- Multi-platform account management
- Device viewer with remote control
- Content creation and distribution
- Analytics and reporting

### Platform Support
- TikTok
- Instagram
- YouTube
- Facebook
- LinkedIn
- X/Twitter

## 🔐 Environment Variables

Required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Other
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
ENCRYPTION_KEY=
```

## 🚢 Deployment

### Railway Deployment

1. Push code to GitHub
2. Connect repository to Railway
3. Add environment variables
4. Deploy automatically

### Manual Deployment

```bash
npm run build
npm start
```

## 📊 Database Schema

Main tables:
- `profiles` - User accounts
- `cloud_phones` - Virtual devices
- `social_accounts` - Multi-platform accounts
- `content_posts` - Published content
- `warmup_templates` - Platform warmup strategies
- `activity_logs` - User activity tracking
- `usage_tracking` - Billable usage

## 🤝 Contributing

This is a private project. For questions or support, contact the development team.

## 📝 License

Proprietary - All rights reserved

## 🔗 Links

- [Setup Guide](../SETUP-GUIDE.md)
- [Database Schema](../supabase-schema.sql)
- [Implementation Plan](../ tiktok-automation-saas-frontend.plan.md)

## 🆘 Support

For setup assistance or technical support, refer to the SETUP-GUIDE.md file.
