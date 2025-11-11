# PostPulse.io 🚀

**AI-Driven Social Media Automation Platform**

Automates content creation, posting, engagement, and monetization across TikTok, Instagram, X/Twitter, YouTube, and Reddit.

## ✨ Features

- 🤖 **AI Content Generation** - OpenAI/Grok powered text and media creation
- 📱 **Multi-Platform Posting** - Automated posting across 5+ social networks
- 🎯 **Smart Lead Capture** - Keyword monitoring and automated engagement
- 📊 **Analytics Dashboard** - Real-time performance metrics and revenue tracking
- 💰 **Monetization Ready** - Whop payment integration for subscriptions
- 🔒 **Enterprise Security** - AES-256 encryption, RLS policies, JWT auth

## 🏗️ Project Structure

```
postpulse-io/
├── backend/              # MCP Server (Express.js)
│   └── mcp-server.js
├── frontend/             # Next.js Web Application
│   ├── src/
│   │   ├── app/         # Next.js App Router
│   │   ├── components/  # React Components
│   │   └── lib/         # Utilities & Supabase client
│   └── package.json
├── services/             # Business Logic Services
│   ├── warmup.js        # Account warming routines
│   ├── upload-post.js   # Multi-platform posting
│   └── ... (26 services)
├── database/             # Database scripts & migrations
├── supabase/             # Supabase migrations
│   └── migrations/
├── workflows/            # n8n workflow definitions
├── scripts/              # Utility scripts
├── tests/                # Integration tests
├── documentation/        # Complete project docs
└── docs/                 # Archived documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Railway account (for deployment)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   cd frontend && npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start development servers:**
   ```bash
   # Start both backend and frontend
   npm run dev:full

   # Or start individually:
   npm run dev              # Backend (MCP Server)
   npm run dev:frontend     # Frontend (Next.js)
   ```

4. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

### Database Setup

1. **Run migrations:**
   ```bash
   # Via Supabase Dashboard → SQL Editor, run:
   # supabase/migrations/20251110120000_create_campaigns_and_analytics_tables.sql
   # supabase/migrations/20251110120100_add_campaign_references.sql
   # supabase/migrations/20251110120200_migrate_twitter_campaigns_data.sql
   ```

2. **Configure API keys:**
   ```sql
   -- In Supabase operator_settings table:
   SELECT service, status FROM operator_settings;
   ```

## 📋 Development Workflow

### Testing Locally
```bash
# Run integration tests
npm test

# Validate environment
node scripts/validate-env.js

# Check health
curl http://localhost:3001/api/health
```

### Adding New Features
1. Create API routes in `frontend/src/app/api/`
2. Add business logic in `services/`
3. Update database schema in `supabase/migrations/`
4. Add tests in `tests/`
5. Update documentation

## 🚢 Production Deployment

### Railway Deployment (Recommended)
```bash
# Follow DEPLOYMENT-QUICKSTART.md
npm install -g @railway/cli
railway login
railway init postpulse-io
# ... follow the quickstart guide
```

### Manual Deployment
1. Build frontend: `npm run build:frontend`
2. Deploy backend and frontend separately
3. Configure environment variables
4. Run database migrations

## 🔧 Configuration

### Environment Variables
See `.env.production` for complete list of required variables.

### API Keys Management
API keys are stored encrypted in Supabase `operator_settings` table:
- MoreLogin credentials
- OpenAI API keys
- Upload-Post tokens
- Whop payment keys

## 📊 Monitoring

- **Health Check:** `GET /api/health`
- **Metrics Dashboard:** `GET /api/metrics` (admin only)
- **Error Tracking:** Sentry integration
- **Performance:** Built-in monitoring

## 🤝 Contributing

1. Follow the established project structure
2. Add tests for new features
3. Update documentation
4. Use TypeScript for type safety
5. Follow ESLint rules

## 📚 Documentation

- `LAUNCH-CHECKLIST.md` - Complete launch guide
- `DEPLOYMENT-QUICKSTART.md` - Deployment instructions
- `SECURITY_AUDIT_REPORT.md` - Security assessment
- `MONITORING_SETUP.md` - Monitoring configuration
- `documentation/` - Complete technical documentation

## 📈 Roadmap

- [ ] Advanced AI content optimization
- [ ] Real-time analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app companion
- [ ] Advanced automation workflows

## 📞 Support

- **Issues:** Check troubleshooting guides
- **Deployment:** Follow deployment quickstart
- **Development:** See documentation folder

---

**Ready to automate your social media and start earning?** Let's launch! 🚀💰