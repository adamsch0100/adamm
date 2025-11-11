# PostPulse.io End-to-End Testing Checklist

## Pre-Testing Setup
- [ ] Ensure both frontend (`npm run dev:frontend`) and backend (`npm run dev`) are running
- [ ] Verify Supabase connection and migrations are applied
- [ ] Check that environment variables are properly configured
- [ ] Confirm admin user account exists (`admin@postpulse.io`)

## Test User: Authentication Flow
- [ ] **Login**: Navigate to `/login` and successfully log in with admin credentials
- [ ] **Dashboard Access**: Verify dashboard loads with overview stats
- [ ] **Route Protection**: Try accessing `/dashboard` without login (should redirect to login)
- [ ] **Logout**: Verify logout functionality works properly

## Test 1: Campaign Management
- [ ] **Create Campaign**: Click "New Campaign" → Fill form (name, keywords, topics, platforms) → Submit
- [ ] **Campaign List**: Verify new campaign appears in campaigns list
- [ ] **Campaign Details**: Click on campaign → View details and associated data
- [ ] **API Integration**: Confirm campaigns are stored in database via `/api/campaigns`

## Test 2: Content Generation
- [ ] **Access Generator**: Navigate to Content → Use ContentGenerator component
- [ ] **Form Validation**: Try submitting without required fields (should show errors)
- [ ] **Generate Content**: Select campaign + platform + content type → Enter keywords/topics → Generate
- [ ] **API Integration**: Verify `/api/generate-content` is called and returns content
- [ ] **Display Results**: Check that generated content displays properly with platform-specific formatting

## Test 3: Account Management
- [ ] **View Accounts**: Navigate to Accounts page → See existing accounts (if any)
- [ ] **Add Account**: Click "Add Account" → Fill form with platform details → Submit
- [ ] **Account Validation**: Verify account appears in list with correct platform
- [ ] **API Integration**: Confirm accounts are stored via `/api/accounts` routes
- [ ] **Upload-Post Integration**: Test adding account with Upload-Post profile key

## Test 4: Content Posting
- [ ] **Access Posting**: Use ContentUploader component on Content page
- [ ] **Form Setup**: Select campaign, enter content, choose platforms/accounts
- [ ] **Schedule Post**: Set schedule time or post immediately
- [ ] **Submit Post**: Click "Schedule Post" → Verify success message
- [ ] **API Integration**: Confirm `/api/post` creates posting queue entries
- [ ] **Queue Status**: Check that posts appear in posting queue

## Test 5: Device Management
- [ ] **Access Devices**: Navigate to Devices page
- [ ] **View Devices**: See MoreLogin cloud phone instances (may be empty initially)
- [ ] **Device Controls**: Test power on/off, browser start/stop if devices exist
- [ ] **API Integration**: Verify device operations use `/api/morelogin/*` proxies
- [ ] **Create Device**: Test device creation flow (requires MoreLogin API keys)

## Test 6: Account Warmup
- [ ] **Access Warmup**: Navigate to Warmup page
- [ ] **View Accounts**: See social accounts available for warmup
- [ ] **Start Warmup**: Click "Start Warmup" on an account → Select duration
- [ ] **Warmup Progress**: Monitor progress bar and status updates
- [ ] **API Integration**: Verify warmup operations use `/api/warmup/*` proxies
- [ ] **Pause/Resume**: Test pausing and resuming warmup processes

## Test 7: Analytics Dashboard
- [ ] **Access Analytics**: Navigate to Analytics page
- [ ] **View Charts**: Check that overview stats display (may be zero initially)
- [ ] **Apply Filters**: Test campaign, platform, and date range filters
- [ ] **API Integration**: Verify `/api/analytics` returns filtered data
- [ ] **Chart Rendering**: Ensure charts update when filters change
- [ ] **Platform Breakdown**: Check pie chart and performance metrics

## Test 8: Settings & API Keys
- [ ] **Access Settings**: Navigate to Settings page (admin only)
- [ ] **View API Keys**: Check current operator settings status
- [ ] **Add API Key**: Use OperatorKeyManager to add a service API key
- [ ] **Encryption**: Verify keys are stored encrypted (not visible in plain text)
- [ ] **API Integration**: Confirm `/api/operator-settings` handles key management

## Test 9: Cross-Platform Integration
- [ ] **Multi-Platform Posting**: Create post targeting multiple platforms simultaneously
- [ ] **Platform-Specific Content**: Verify content adapts to each platform's requirements
- [ ] **Account Filtering**: Test posting to accounts from different platforms
- [ ] **Unified Analytics**: Check analytics across all platforms in single dashboard

## Test 10: Error Handling & Edge Cases
- [ ] **Network Errors**: Test behavior when backend is unavailable
- [ ] **Invalid Data**: Submit forms with invalid data (should show validation errors)
- [ ] **Permission Errors**: Try admin-only features as regular user
- [ ] **Rate Limiting**: Test rapid API calls (should handle gracefully)
- [ ] **Large Data**: Test with large content or many accounts

## Performance & UX Testing
- [ ] **Loading States**: Verify loading indicators appear during async operations
- [ ] **Error Messages**: Check that user-friendly error messages display
- [ ] **Responsive Design**: Test on different screen sizes
- [ ] **Navigation**: Ensure smooth navigation between pages
- [ ] **Real-time Updates**: Test polling mechanisms (warmup status, analytics refresh)

## Security Testing
- [ ] **Authentication**: Verify protected routes require login
- [ ] **Authorization**: Confirm admin-only features are restricted
- [ ] **Data Validation**: Test for SQL injection and XSS vulnerabilities
- [ ] **API Security**: Ensure API routes validate input and authenticate requests

## Integration Testing
- [ ] **Supabase RLS**: Verify row-level security policies work correctly
- [ ] **API Route Protection**: Confirm Next.js API routes handle auth properly
- [ ] **MCP Communication**: Test communication between Next.js and MCP server
- [ ] **Database Consistency**: Ensure data consistency across related tables

## Browser Testing
- [ ] **Chrome/Edge**: Test primary functionality
- [ ] **Firefox**: Test cross-browser compatibility
- [ ] **Mobile Browsers**: Test responsive design and touch interactions

## Final Validation
- [ ] **Health Check**: Verify `/api/health` endpoint returns success
- [ ] **Metrics Dashboard**: Check admin metrics are accessible
- [ ] **Documentation**: Ensure all features are documented
- [ ] **Error Logs**: Review server logs for any unhandled errors

## Test Results Summary
- **Total Tests**: 50+
- **Passed**: [count]
- **Failed**: [count]
- **Blocked**: [count]
- **Not Applicable**: [count]

## Critical Issues Found
[List any show-stopping bugs or issues]

## Recommendations
[Suggestions for improvements or additional testing]

## Ready for Production
- [ ] All critical functionality working
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Error handling robust
- [ ] Documentation complete
