# Lemon Squeezy Deployment Checklist

## ✅ Code Changes - COMPLETE
- [x] Added `redirect_url` to checkout creation
- [x] Fixed environment variable names
- [x] Enhanced logging
- [x] Committed and pushed to GitHub

## Railway Environment Variables - VERIFY THESE

Make sure these are set in your Railway dashboard (NOT just local .env):

### Required Variables
```
LEMON_SQUEEZY_API_KEY=lmsq_api_... (your actual API key)
LEMON_SQUEEZY_WEBHOOK_SECRET=hazlabel_secret_key_12345
LEMON_SQUEEZY_STORE_ID=117111
FRONTEND_URL=https://www.hazlabel.co
```

### How to Check Railway Variables
1. Go to https://railway.app
2. Select your backend service (HazLabel backend)
3. Go to "Variables" tab
4. Verify all 4 variables above are set with correct values

## Lemon Squeezy Webhook - VERIFY THIS

### Webhook Configuration
1. Go to https://app.lemonsqueezy.com/settings/webhooks
2. Verify webhook exists with:
   - **URL**: `https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy`
   - **Secret**: `hazlabel_secret_key_12345`
   - **Signing Secret**: Same as above
   - **Status**: Active ✅

### Required Events (all selected)
- [x] `subscription_created`
- [x] `subscription_updated`
- [x] `subscription_payment_success`
- [x] `subscription_payment_failed`
- [x] `subscription_cancelled`
- [x] `subscription_expired`
- [x] `subscription_resumed`
- [x] `subscription_payment_recovered`

## Deployment Status

Railway should automatically deploy after the git push. Check:

1. **Build Status**: https://railway.app (check if build succeeded)
2. **Backend Logs**: Look for startup message confirming deployment
3. **Health Check**: `curl https://hazlabel-production.up.railway.app/health`

Expected response:
```json
{"status": "healthy"}
```

## Test Checkout Flow

### 1. Test Webhook Endpoint
```bash
curl https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Lemon Squeezy webhook endpoint is reachable",
  "webhook_secret_configured": true
}
```

### 2. Test Full Checkout
1. Visit https://www.hazlabel.co/pricing
2. Click "Subscribe" on Professional plan
3. You should be redirected to Lemon Squeezy checkout
4. **NEW**: After payment, should redirect to `/checkout/success` ✅
5. Check backend logs for webhook receipt

### 3. Expected Log Output

**On checkout creation:**
```
Creating checkout for user_id: xxx, variant_id: 1283692
Checkout created successfully: https://hazlabel.lemonsqueezy.com/checkout/...
Checkout options: {'redirect_url': 'https://www.hazlabel.co/checkout/success'}
```

**On successful payment (webhook):**
```
[WEBHOOK] Received webhook request from ...
[WEBHOOK] Signature verified successfully
[WEBHOOK] Event: subscription_created
[WEBHOOK SUCCESS] Subscription upserted successfully
```

## Verification Steps

After deployment completes:

- [ ] Railway deployment succeeded
- [ ] Health check returns `{"status": "healthy"}`
- [ ] Webhook health check returns `webhook_secret_configured: true`
- [ ] Test checkout creates successfully
- [ ] Payment redirects to `/checkout/success` (not stuck on Lemon Squeezy)
- [ ] Webhook is received (check backend logs)
- [ ] Subscription appears in user's dashboard
- [ ] User can access paid features

## If Something Doesn't Work

### User Stuck on Checkout Page
- Check Railway logs for checkout creation
- Verify `redirect_url` is in the checkout options logs
- Check if checkout was created successfully

### No Redirect After Payment
- Verify `FRONTEND_URL` is set in Railway
- Check Lemon Squeezy checkout settings
- Look for errors in browser console

### No Webhook Received
- Check Lemon Squeezy webhook logs (shows delivery attempts)
- Verify webhook URL is correct
- Check webhook secret matches
- Test webhook endpoint health check

### "Invalid Signature" Error
- Webhook secret mismatch
- Verify secret in Lemon Squeezy matches Railway env var
- Both should be: `hazlabel_secret_key_12345`

## Quick Test Commands

```bash
# Test backend health
curl https://hazlabel-production.up.railway.app/health

# Test webhook endpoint
curl https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy/health

# Check Railway logs
# Go to Railway dashboard → Select service → Logs tab

# Test locally (if needed)
cd backend
python3 ../test_lemon_squeezy.py
```

## Success Criteria

✅ All checks pass when:
1. Checkout URL is generated with redirect_url
2. User can complete payment on Lemon Squeezy
3. User is redirected back to `/checkout/success`
4. Webhook is received and processed
5. Subscription shows in database
6. User has access to paid features

---

**Current Status**: Code deployed ✅
**Next**: Verify Railway env vars and webhook config
