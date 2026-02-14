# Diagnose Checkout 500 Error

## Error Seen
```
Failed to create checkout. Please try again.
```

Backend logs show:
```
Creating checkout for user_id: 79c1653d-8e39-4a22-880d-1f86a9b25193, variant_id: 1283692
INFO: 100.64.0.2:12328 - "POST /subscription/create-checkout?variant_id=1283692 HTTP/1.1" 500 Internal Server Error
```

## Most Likely Cause: Missing API Key in Railway

The 500 error happens when `LEMON_SQUEEZY_API_KEY` is **not set in Railway**, even though your local `.env` might have it.

## Quick Diagnosis (30 seconds)

### 1. Check Backend Configuration
Once Railway deploys (wait ~2 minutes), run:

```bash
curl https://hazlabel-production.up.railway.app/subscription/config-check
```

**Expected Result:**
```json
{
  "lemon_squeezy_configured": true,
  "environment_check": {
    "LEMON_SQUEEZY_API_KEY": "✅ SET",
    "LEMON_SQUEEZY_WEBHOOK_SECRET": "✅ SET",
    "LEMON_SQUEEZY_STORE_ID": "✅ SET",
    "FRONTEND_URL": "✅ SET"
  }
}
```

**If You See This:**
```json
{
  "environment_check": {
    "LEMON_SQUEEZY_API_KEY": "❌ MISSING"  <-- PROBLEM!
  }
}
```

Then the API key is **not set in Railway** (even though you said keys are 100% correct).

## Fix: Add API Key to Railway

### Step 1: Get Your Lemon Squeezy API Key
1. Go to https://app.lemonsqueezy.com/settings/api
2. Copy your API key (starts with `lmsq_api_`)

### Step 2: Add to Railway
1. Go to https://railway.app
2. Select your **backend** service (HazLabel API)
3. Click **"Variables"** tab
4. Click **"New Variable"**
5. Add:
   ```
   Name: LEMON_SQUEEZY_API_KEY
   Value: lmsq_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. Click **"Add"**
7. Railway will **auto-redeploy** (~2 minutes)

### Step 3: Verify It's Set
Wait for deployment, then:
```bash
curl https://hazlabel-production.up.railway.app/subscription/config-check
```

Should now show:
```json
{
  "environment_check": {
    "LEMON_SQUEEZY_API_KEY": "✅ SET"  <-- FIXED!
  }
}
```

### Step 4: Test Checkout Again
Visit https://hazlabel.co/pricing and try subscribing again.

## Other Required Railway Variables

Make sure **ALL** of these are set in Railway Variables:

```
LEMON_SQUEEZY_API_KEY=lmsq_api_xxxxxxxxxxxxx
LEMON_SQUEEZY_WEBHOOK_SECRET=hazlabel_secret_key_12345
LEMON_SQUEEZY_STORE_ID=117111
FRONTEND_URL=https://www.hazlabel.co
```

## Check Railway Logs After Fix

After adding the API key and redeploying, the logs should show:

```
[CHECKOUT] API Key configured: True
[CHECKOUT] Store ID: 117111
[CHECKOUT] Variant ID: 1283692
Creating checkout for user_id: xxx, variant_id: 1283692
Checkout created successfully: https://hazlabel.lemonsqueezy.com/checkout/...
Checkout options: {'redirect_url': 'https://www.hazlabel.co/checkout/success'}
```

If you see:
```
[ERROR] LEMON_SQUEEZY_API_KEY not set in environment
```

Then the API key is still missing in Railway.

## Common Mistake

❌ **Local `.env` file is NOT used in Railway**
- Setting it in `backend/.env` only affects local development
- Railway uses its own environment variables in the dashboard

✅ **You MUST set variables in Railway dashboard**
- Go to Railway → Your Service → Variables tab
- Add each variable there

## Still Getting 500 Error?

If API key is set and you still get 500, check the **detailed error** in Railway logs:

```
[ERROR] Lemon Squeezy checkout error: 401
[ERROR] Response body: {"error": "Unauthorized"}
```

This means:
- **401**: API key is invalid/expired → Get new key
- **403**: API key lacks permissions → Check API key permissions
- **422**: Invalid request data → Check store_id and variant_id

## Quick Commands

```bash
# 1. Check configuration
curl https://hazlabel-production.up.railway.app/subscription/config-check

# 2. Check health
curl https://hazlabel-production.up.railway.app/health

# 3. View Railway logs
# Go to: https://railway.app → Your Service → Logs

# 4. Test after fixing
# Visit: https://hazlabel.co/pricing → Subscribe
```

---

**TL;DR**: The 500 error is almost certainly because `LEMON_SQUEEZY_API_KEY` is not set in Railway environment variables. Add it in Railway dashboard, wait for redeploy, then test again.
