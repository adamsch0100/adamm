# PostPulse.io Monitoring Setup Guide

## Overview

PostPulse.io includes comprehensive monitoring and observability tools to ensure production reliability and performance.

## Health Checks

### Application Health Check
**Endpoint:** `GET /api/health`
**Purpose:** Monitor application and database health
**Returns:**
```json
{
  "status": "healthy|unhealthy",
  "timestamp": "2025-11-10T10:24:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "lastChecked": "2025-11-10T10:24:00.000Z"
    },
    "environment": {
      "status": "healthy",
      "checks": {
        "supabaseUrl": true,
        "supabaseAnonKey": true,
        "encryptionKey": true
      }
    }
  },
  "system": {
    "uptime": 3600,
    "memoryUsage": {...},
    "nodeVersion": "v18.17.0",
    "platform": "linux"
  },
  "performance": {
    "averagePageLoadTime": 1200,
    "averageApiResponseTime": 150,
    "totalErrors": 0,
    "memoryUsage": {...}
  }
}
```

### Admin Metrics Dashboard
**Endpoint:** `GET /api/metrics?timeframe=24h`
**Purpose:** Detailed analytics and monitoring data (admin only)
**Parameters:**
- `timeframe`: `1h`, `24h`, `7d`, `30d` (default: `24h`)

## Error Tracking (Sentry)

### Setup Instructions

1. **Create Sentry Project**
   ```bash
   # Install Sentry CLI
   npm install -g @sentry/cli

   # Create project
   sentry-cli projects create postpulse-io --platform nextjs
   ```

2. **Configure Environment Variables**
   ```env
   # Add to .env.production
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_AUTH_TOKEN=your-sentry-auth-token
   ```

3. **Initialize Sentry** (Already configured in `src/lib/sentry.ts`)

### Error Monitoring Features
- **Frontend Errors:** JavaScript errors, unhandled promise rejections
- **API Errors:** Failed requests, database errors, authentication failures
- **Performance Issues:** Slow API responses, memory leaks
- **User Session Replay:** For critical error investigation

## Performance Monitoring

### Client-Side Performance
- **Page Load Times:** Automatic tracking of page load performance
- **API Response Times:** Monitoring of all API calls
- **Memory Usage:** Client-side memory consumption tracking
- **Error Rates:** Client-side error tracking

### Server-Side Performance
- **Database Query Times:** Response time monitoring
- **Memory Usage:** Server memory consumption
- **API Response Times:** Server-side API performance
- **Error Rates:** Server error tracking

## Alert Configuration

### Recommended Alerts

#### Critical Alerts (Immediate Response)
```
- Application down (health check fails)
- Database unreachable
- High error rate (>5% of requests)
- Memory usage >90%
- Disk space <10% available
```

#### Warning Alerts (Monitor Closely)
```
- API response time >2s
- Error rate >1%
- Memory usage >75%
- Database connection pool exhausted
```

### Setting Up Alerts

#### Railway Alerts
1. Go to Railway project dashboard
2. Navigate to Monitoring → Alerts
3. Configure uptime monitoring for `/api/health`
4. Set up email/Slack notifications

#### Sentry Alerts
1. Go to Sentry project settings
2. Configure alerts for:
   - New error issues
   - Performance issues
   - Release health

## Logging Strategy

### Application Logs
- **Error Logs:** All errors logged to console and Sentry
- **API Logs:** Request/response logging with performance metrics
- **Database Logs:** Query performance and error logging
- **Security Logs:** Authentication and authorization events

### Log Retention
- **Application Logs:** 30 days rolling
- **Error Logs:** Indefinite (Sentry)
- **Security Logs:** 90 days minimum
- **Audit Logs:** 1 year minimum

## Monitoring Dashboard

### Key Metrics to Monitor

#### User Metrics
- Active users (daily/weekly/monthly)
- New user registrations
- User retention rates
- Feature usage statistics

#### Performance Metrics
- Page load times (<3s target)
- API response times (<500ms target)
- Error rates (<1% target)
- Uptime (>99.9% target)

#### Business Metrics
- Campaign creation rate
- Content posting success rate
- Lead capture rate
- Revenue metrics

#### System Metrics
- CPU usage
- Memory usage
- Database connection count
- Disk usage

## Third-Party Monitoring Services

### Recommended Services

#### Primary Monitoring
- **Sentry:** Error tracking and performance monitoring
- **Railway:** Infrastructure monitoring and alerting

#### Optional Advanced Monitoring
- **DataDog:** Comprehensive observability platform
- **New Relic:** Application performance monitoring
- **LogRocket:** User session replay and error tracking

### Cost Considerations
- **Sentry:** Free tier covers basic needs, paid plans for advanced features
- **Railway:** Included with hosting plan
- **DataDog/New Relic:** Enterprise-grade, higher cost

## Incident Response

### Alert Response Procedures

#### Level 1 Alert (Warning)
1. Acknowledge alert within 5 minutes
2. Investigate root cause
3. Implement temporary fix if needed
4. Schedule permanent fix

#### Level 2 Alert (Critical)
1. Acknowledge alert within 2 minutes
2. Notify on-call engineer immediately
3. Begin investigation and mitigation
4. Communicate status to stakeholders
5. Implement permanent fix

### Escalation Process
1. **5 minutes:** Initial alert acknowledgment
2. **15 minutes:** Investigation started
3. **30 minutes:** Status update to stakeholders
4. **2 hours:** Root cause identified
5. **4 hours:** Fix implemented
6. **24 hours:** Post-mortem completed

## Maintenance Windows

### Recommended Schedule
- **Weekly:** Security updates and patches
- **Monthly:** Major version updates
- **Quarterly:** Infrastructure reviews

### Communication
- Announce maintenance windows 48 hours in advance
- Provide rollback plan for critical updates
- Monitor systems during maintenance
- Send completion notification

## Backup and Recovery

### Backup Strategy
- **Database:** Daily automated backups via Supabase
- **Application:** Code repository with deployment history
- **Configuration:** Environment variables documented and versioned

### Recovery Procedures
1. **Database Recovery:** Use Supabase point-in-time recovery
2. **Application Rollback:** Deploy previous version from Git
3. **Configuration:** Restore from backup or recreate

## Compliance Monitoring

### Security Compliance
- Regular security scans
- Dependency vulnerability checks
- Access log reviews
- Incident reporting

### Performance Compliance
- SLA monitoring
- User experience tracking
- System availability reporting

## Getting Started

### Quick Setup
1. **Enable Health Checks:** Deploy and verify `/api/health` endpoint
2. **Set Up Sentry:** Configure DSN and basic error tracking
3. **Configure Railway Alerts:** Set up uptime monitoring
4. **Test Alerting:** Trigger test alerts to verify notification channels
5. **Create Dashboard:** Set up monitoring dashboard for key metrics

### Validation Checklist
- [ ] Health check endpoint responding correctly
- [ ] Sentry error tracking receiving events
- [ ] Railway alerts configured and tested
- [ ] Performance monitoring collecting metrics
- [ ] Admin metrics dashboard accessible
- [ ] Alert response procedures documented
- [ ] Backup procedures tested
- [ ] Incident response plan in place

## Support and Resources

### Documentation Links
- [Sentry Documentation](https://docs.sentry.io/)
- [Railway Monitoring](https://docs.railway.app/)
- [Next.js Performance Monitoring](https://nextjs.org/docs/basic-features/built-in-css-support)

### Support Contacts
- **Development Team:** For application-specific issues
- **Railway Support:** For infrastructure issues
- **Sentry Support:** For monitoring configuration issues

This monitoring setup ensures PostPulse.io maintains high availability, performance, and reliability in production.
