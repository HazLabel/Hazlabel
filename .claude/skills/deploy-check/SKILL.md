# Deploy Check Skill

Verify deployment status and health for both Vercel (frontend) and Railway (backend).

## Usage

`/deploy-check [service]`

- `/deploy-check` - Check both Vercel and Railway
- `/deploy-check vercel` - Check only Vercel
- `/deploy-check railway` - Check only Railway

## Description

This skill performs pre-deployment and post-deployment health checks:
- Vercel build status and environment variables
- Railway deployment status and logs
- API endpoint connectivity
- Database connection health
- Webhook configuration

## Task

When invoked:

### 1. Vercel (Frontend) Health Check

**Pre-Deployment:**
- ✅ No TypeScript errors (`npm run build`)
- ✅ All required environment variables set
- ✅ No missing dependencies in package.json
- ✅ API_URL points to correct Railway backend

**Post-Deployment:**
- ✅ Latest commit deployed
- ✅ Build successful
- ✅ No runtime errors in Vercel logs
- ✅ Frontend accessible (200 status)

**Environment Variables to Verify:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_LEMON_CHECKOUT_PRO_MONTHLY
NEXT_PUBLIC_LEMON_CHECKOUT_PRO_ANNUAL
NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE_MONTHLY
NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE_ANNUAL
NEXT_PUBLIC_LEMON_VARIANT_PRO_MONTHLY
NEXT_PUBLIC_LEMON_VARIANT_PRO_ANNUAL
NEXT_PUBLIC_LEMON_VARIANT_ENTERPRISE_MONTHLY
NEXT_PUBLIC_LEMON_VARIANT_ENTERPRISE_ANNUAL
```

### 2. Railway (Backend) Health Check

**Pre-Deployment:**
- ✅ No Python syntax errors
- ✅ All dependencies in requirements.txt
- ✅ Root directory set to `backend/`
- ✅ Start command configured correctly

**Post-Deployment:**
- ✅ Latest commit deployed
- ✅ Service running (not crashed)
- ✅ Health endpoint returns 200
- ✅ Database connection successful
- ✅ No critical errors in logs

**Environment Variables to Verify:**
```
DATABASE_URL
LEMON_SQUEEZY_API_KEY
LEMON_SQUEEZY_WEBHOOK_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### 3. Integration Tests

**API Connectivity:**
- ✅ GET /health returns 200
- ✅ GET /subscription/status (with auth) returns valid response
- ✅ POST /webhooks/lemon-squeezy/health returns 200

**Database:**
- ✅ Supabase connection working
- ✅ subscriptions table accessible
- ✅ Row-level security policies active

**Webhooks:**
- ✅ Lemon Squeezy webhook URL configured
- ✅ Webhook secret matches Railway env var
- ✅ Recent webhook events processed successfully

### 4. Deployment Checklist

**Before Deployment:**
- [ ] All tests passing locally
- [ ] No .env files in git
- [ ] No console.log statements in production code
- [ ] Environment variables synced (Vercel + Railway)
- [ ] Database migrations applied
- [ ] Webhook secrets rotated if needed

**After Deployment:**
- [ ] Vercel build successful
- [ ] Railway service healthy
- [ ] Frontend loads without errors
- [ ] API endpoints responding
- [ ] Webhooks receiving events
- [ ] No 500 errors in logs

## Output Format

```markdown
# Deployment Health Check Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Vercel (Frontend)
✅ Build Status: Deployed
✅ Commit: 39a2654 (Fix subscription management)
✅ Environment Variables: 12/12 configured
✅ Frontend URL: https://hazlabel.co (200 OK)
⚠️  Warning: 2 TypeScript warnings in build logs

## Railway (Backend)
✅ Service Status: Running
✅ Commit: 39a2654 (Fix subscription management)
✅ Environment Variables: 5/5 configured
✅ Health Endpoint: https://hazlabel-production.railway.app/health (200 OK)
✅ Recent Logs: No errors in last 50 lines

## API Integration
✅ Frontend → Backend: Connected
✅ Backend → Supabase: Connected
✅ Lemon Squeezy Webhooks: Configured

## Issues Found
⚠️  1 warning, 0 critical issues

### Warnings:
1. TypeScript warnings in Vercel build (non-blocking)
   - File: frontend/src/components/billing-dialog.tsx:234
   - Fix: Add explicit type annotation

## Recommendations
✅ Deployment looks healthy!
• Monitor Vercel logs for any runtime errors
• Check Railway logs for webhook events

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Status: ✅ HEALTHY
```

## Commands Used

### Vercel
```bash
# Check deployment status
vercel ls

# View recent deployments
vercel inspect <deployment-url>

# Check build logs
vercel logs <deployment-url>

# Test frontend
curl -I https://hazlabel.co
```

### Railway
```bash
# Check service status
railway status

# View recent logs
railway logs --tail 50

# Test health endpoint
curl https://hazlabel-production.railway.app/health

# Check environment variables
railway variables
```

### API Tests
```bash
# Health check
curl https://hazlabel-production.railway.app/health

# Webhook health
curl https://hazlabel-production.railway.app/webhooks/lemon-squeezy/health

# Subscription status (requires auth)
curl -H "Authorization: Bearer <token>" \
  https://hazlabel-production.railway.app/subscription/status
```

## Files to Check

- `frontend/package.json` - Dependencies
- `frontend/.env.local` - Local environment variables
- `backend/requirements.txt` - Python dependencies
- `backend/main.py` - Health endpoints
- `vercel.json` - Vercel configuration
- `railway.toml` - Railway configuration
- `.gitignore` - Ensure .env files excluded

## Common Issues

### Vercel Issues
1. **Build failing**: Missing dependencies or TypeScript errors
2. **Environment variables**: Not synced from .env.local to Vercel dashboard
3. **API calls failing**: NEXT_PUBLIC_API_URL pointing to wrong backend
4. **404 errors**: Routing issues or missing pages

### Railway Issues
1. **Service crashed**: Check logs for Python errors
2. **Database connection**: DATABASE_URL incorrect or Supabase down
3. **Webhook failures**: LEMON_SQUEEZY_WEBHOOK_SECRET mismatch
4. **Import errors**: Missing dependencies in requirements.txt

### Integration Issues
1. **CORS errors**: Frontend domain not allowed in backend CORS config
2. **Authentication failing**: JWT token issues or expired secrets
3. **Webhooks not received**: URL not configured in Lemon Squeezy dashboard
4. **Payment failures**: Lemon Squeezy API key invalid

## Automation

This skill can be triggered automatically:
- Before every deployment (pre-commit hook)
- After successful git push to main
- On a schedule (daily health checks)
- When webhook errors detected

## Exit Criteria

The deployment is considered healthy when:
1. Both Vercel and Railway show "deployed" status
2. All environment variables are configured
3. Health endpoints return 200 OK
4. No critical errors in logs (last 50 lines)
5. API integration tests pass
6. Webhooks are configured and working

If any critical issues found, deployment should be rolled back.
