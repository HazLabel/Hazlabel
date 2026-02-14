# Quick Test Guide - Lemon Squeezy Integration

## 🚀 Changes Deployed

All fixes have been pushed to GitHub and Railway should be deploying automatically.

## ⚡ Quick Verification (5 minutes)

### 1. Check Backend is Live
```bash
curl https://hazlabel-production.up.railway.app/health
```
✅ Should return: `{"status":"healthy"}`

### 2. Check Webhook Endpoint
```bash
curl https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy/health
```
✅ Should return:
```json
{
  "status": "ok",
  "message": "Lemon Squeezy webhook endpoint is reachable",
  "webhook_secret_configured": true
}
```

### 3. Test Checkout Flow (The Real Test)

1. Go to https://www.hazlabel.co/pricing
2. Sign in with your test account
3. Click "Subscribe" on Professional plan
4. **BEFORE THE FIX**: User stuck on checkout page ❌
5. **AFTER THE FIX**: User redirected to `/checkout/success` ✅

### 4. Check Backend Logs

In Railway dashboard → Logs, you should see:

**On Subscribe click:**
```
Creating checkout for user_id: xxx, variant_id: 1283692
Checkout created successfully: https://hazlabel.lemonsqueezy.com/checkout/...
Checkout options: {'redirect_url': 'https://www.hazlabel.co/checkout/success'}
```

**After completing payment:**
```
[WEBHOOK] Event: subscription_created
[WEBHOOK SUCCESS] Subscription upserted successfully
```

## 🎯 What Was Fixed

1. **Added redirect URL** - Users can now complete checkout
2. **Fixed env variables** - Backend can create checkouts properly
3. **Enhanced logging** - You can see exactly what's happening

## ✅ Success = All These Work

- [ ] Can click "Subscribe" and get redirected to Lemon Squeezy
- [ ] Can complete payment on Lemon Squeezy
- [ ] Get redirected to `/checkout/success` (NOT stuck!)
- [ ] See "Processing Payment" → "Success!" message
- [ ] Subscription appears in dashboard
- [ ] Can upload more than 2 SDSs (professional tier works)

## 🔍 If Issue Persists

The screen you showed was stuck on "Processing..." which means:

**Before fix**: No redirect URL → User couldn't complete payment → No webhook sent

**After fix**: Has redirect URL → User completes payment → Redirected to success page → Webhook received

If still stuck, check:
1. Railway deployed successfully (check dashboard)
2. Environment variables are set in Railway (not just local .env)
3. Webhook is configured in Lemon Squeezy dashboard

## 📊 Expected Flow

```
User clicks "Subscribe"
    ↓
Backend creates checkout (with redirect_url) ✅ NEW
    ↓
User redirected to Lemon Squeezy checkout page
    ↓
User enters payment info
    ↓
Lemon Squeezy processes payment
    ↓
User redirected to /checkout/success ✅ NEW (was stuck here before)
    ↓
Frontend shows "Processing Payment..."
    ↓
Webhook sent to backend
    ↓
Backend updates subscription
    ↓
Frontend shows "Success!" and redirects to dashboard
```

## 🎬 Ready to Test

Just test the checkout flow from the pricing page. The fix is live once Railway finishes deploying (usually ~2 minutes after push).

Check Railway dashboard for deployment status: https://railway.app
