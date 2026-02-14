# Lemon Squeezy Integration Fix Guide

## Issues Identified ✅

### 1. **Missing Redirect URL** - FIXED ✓
**Problem:** Checkout was created but users couldn't complete payment because there was no redirect URL configured.

**Solution:** Added `checkout_options.redirect_url` to the checkout creation API call in `backend/main.py:1316`.

```python
"checkout_options": {
    "redirect_url": f"{os.environ.get('FRONTEND_URL', 'https://www.hazlabel.co')}/checkout/success"
}
```

### 2. **Missing/Wrong Environment Variables** - FIXED ✓
**Problem:**
- `LEMONSQUEEZY_WEBHOOK_SECRET` should be `LEMON_SQUEEZY_WEBHOOK_SECRET` (underscores)
- Missing `LEMON_SQUEEZY_API_KEY`
- Missing `LEMON_SQUEEZY_STORE_ID`
- Missing `FRONTEND_URL`

**Solution:** Updated `backend/.env` with correct variable names. You need to:
1. Get your API key from Lemon Squeezy dashboard → Settings → API
2. Replace `YOUR_LEMON_SQUEEZY_API_KEY_HERE` in `.env` with actual key

### 3. **Webhook Not Configured** - NEEDS VERIFICATION ⚠️
**Problem:** No webhooks are being received by your backend.

**Solution:** Configure webhook in Lemon Squeezy:
1. Go to https://app.lemonsqueezy.com/settings/webhooks
2. Click "Create Webhook"
3. Set URL: `https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy`
4. Set Secret: `hazlabel_secret_key_12345` (same as in your .env)
5. Enable these events:
   - ✅ `subscription_created`
   - ✅ `subscription_updated`
   - ✅ `subscription_payment_success`
   - ✅ `subscription_payment_failed`
   - ✅ `subscription_cancelled`
   - ✅ `subscription_expired`
   - ✅ `subscription_resumed`
   - ✅ `subscription_payment_recovered`

## Critical Steps to Fix

### Step 1: Update Environment Variables
```bash
cd backend
# Edit .env and add your actual Lemon Squeezy API key
# LEMON_SQUEEZY_API_KEY=lmsq_api_xxxxxxxxxxxxx
```

### Step 2: Redeploy Backend to Railway
```bash
git add .
git commit -m "Fix: Add redirect_url to Lemon Squeezy checkout and fix env vars"
git push origin main
```

Railway should auto-deploy. Make sure these environment variables are set in Railway dashboard:
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`
- `LEMON_SQUEEZY_STORE_ID`
- `FRONTEND_URL`

### Step 3: Configure Webhook in Lemon Squeezy
See "Webhook Not Configured" section above.

### Step 4: Test the Flow
1. Visit https://www.hazlabel.co/pricing
2. Click "Subscribe" on Professional plan
3. Complete payment (use test mode if available)
4. Should redirect to `/checkout/success`
5. Check backend logs for webhook receipt
6. Verify subscription appears in dashboard

## Testing Checklist

- [ ] Backend has `LEMON_SQUEEZY_API_KEY` set
- [ ] Webhook is configured in Lemon Squeezy dashboard
- [ ] Webhook secret matches `.env` variable
- [ ] Test checkout creates successfully
- [ ] Test payment redirects to `/checkout/success`
- [ ] Webhook is received by backend (check logs)
- [ ] Subscription appears in user dashboard
- [ ] User can access paid features

## Debugging

### Check if checkout is created:
```bash
# Backend logs should show:
# "Checkout created successfully: https://..."
```

### Check if webhook is received:
```bash
# Backend logs should show:
# "[WEBHOOK] Event: subscription_created"
# "[WEBHOOK SUCCESS] Subscription upserted successfully"
```

### Test webhook manually:
```bash
curl -X POST https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy/health
# Should return: {"status": "ok", "webhook_secret_configured": true}
```

### Check subscription in database:
Query Supabase `subscriptions` table for your user_id.

## Common Issues

### "No signature provided"
- Webhook secret not configured in Lemon Squeezy
- Check webhook is sending `X-Signature` header

### "Invalid signature"
- Webhook secret mismatch between Lemon Squeezy and backend `.env`
- Make sure both use: `hazlabel_secret_key_12345`

### "Subscription not found after payment"
- Webhook might be failing
- Check webhook logs in Lemon Squeezy dashboard
- Verify webhook URL is correct and accessible

### User stuck on "Processing Payment"
- No redirect URL was set (now fixed)
- Payment failed
- Webhook failed to process

## Files Changed

1. `backend/main.py` - Added `checkout_options.redirect_url`
2. `backend/.env` - Fixed environment variable names and added missing vars

## Next Steps

1. **Add your Lemon Squeezy API key** to `backend/.env`
2. **Redeploy** to Railway
3. **Configure webhook** in Lemon Squeezy dashboard
4. **Test end-to-end** checkout flow

## Support

If issues persist after following this guide:
1. Check Lemon Squeezy webhook logs for delivery failures
2. Check Railway logs for webhook processing errors
3. Verify the checkout URL is being generated correctly
4. Test with a different payment method

---

**Status:** Ready to test after:
- ✅ Code changes deployed
- ⚠️ API key added to environment
- ⚠️ Webhook configured in Lemon Squeezy
