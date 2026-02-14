# Railway Environment Variables Setup

## The Problem

You're getting this error:
```
Failed to create checkout. Please try again.
```

**Root Cause**: Railway environment variables are **not automatically synced** from your local `.env` file. Even though you have them locally, Railway doesn't know about them.

## Solution: Add Variables to Railway Dashboard

### Step-by-Step Guide

#### 1. Get Your Lemon Squeezy API Key
```
1. Visit: https://app.lemonsqueezy.com/settings/api
2. Click "Create API Key" or use existing one
3. Copy the key (format: lmsq_api_xxxxxxxxxxxxxxxxx)
4. Save it somewhere safe
```

#### 2. Open Railway Dashboard
```
1. Go to: https://railway.app
2. Sign in
3. Find your "HazLabel" project
4. Click on your backend service (should show "FastAPI" or "Python")
```

#### 3. Add Environment Variables

Click on the **"Variables"** tab, then add these **4 variables**:

##### Variable 1: API Key (REQUIRED)
```
Name:  LEMON_SQUEEZY_API_KEY
Value: lmsq_api_xxxxxxxxxxxxxxxxxxxxxxxx (your actual key)
```

##### Variable 2: Webhook Secret (REQUIRED)
```
Name:  LEMON_SQUEEZY_WEBHOOK_SECRET
Value: hazlabel_secret_key_12345
```

##### Variable 3: Store ID (REQUIRED)
```
Name:  LEMON_SQUEEZY_STORE_ID
Value: 117111
```

##### Variable 4: Frontend URL (REQUIRED)
```
Name:  FRONTEND_URL
Value: https://www.hazlabel.co
```

#### 4. Save and Deploy

After adding each variable:
- Railway will show "Redeploying..."
- Wait ~2 minutes for deployment to complete
- Check the "Logs" tab to confirm deployment succeeded

## Verify It Worked

### Option 1: Use the Config Check Endpoint
```bash
curl https://hazlabel-production.up.railway.app/subscription/config-check
```

**Success looks like:**
```json
{
  "lemon_squeezy_configured": true,
  "api_key_set": true,
  "api_key_length": 58,
  "environment_check": {
    "LEMON_SQUEEZY_API_KEY": "✅ SET",
    "LEMON_SQUEEZY_WEBHOOK_SECRET": "✅ SET",
    "LEMON_SQUEEZY_STORE_ID": "✅ SET",
    "FRONTEND_URL": "✅ SET"
  }
}
```

**Failure looks like:**
```json
{
  "environment_check": {
    "LEMON_SQUEEZY_API_KEY": "❌ MISSING"  <-- Still not set!
  }
}
```

### Option 2: Check Railway Logs

In Railway dashboard → Logs tab, look for:
```
[CHECKOUT] API Key configured: True
[CHECKOUT] Store ID: 117111
```

If you see:
```
[ERROR] LEMON_SQUEEZY_API_KEY not set in environment
```

Then the variable is **still missing**.

## Test the Checkout Flow

Once all 4 variables show "✅ SET":

1. Visit https://www.hazlabel.co/pricing
2. Click "Subscribe Now" on Professional plan
3. Should redirect to Lemon Squeezy checkout
4. Complete payment
5. Should redirect to `/checkout/success`
6. Subscription should appear in dashboard

## Common Issues

### "I added the variables but still getting 500 error"

**Check:**
1. Did Railway finish redeploying? (Check Logs tab for "Started server process")
2. Did you add them to the **correct service**? (Should be the backend/FastAPI service)
3. Are there any typos in the variable names? (Must be EXACT)

### "The config-check shows API key is set but checkout still fails"

**Check Railway Logs** for the actual error:
```
[ERROR] Lemon Squeezy checkout error: 401
[ERROR] Response body: {"error": "Unauthorized"}
```

- **401 Unauthorized**: API key is invalid → Get a fresh key from Lemon Squeezy
- **403 Forbidden**: API key lacks permissions → Check key permissions
- **422 Unprocessable**: Wrong store_id or variant_id

### "I can see the variables in Railway but they're not working"

**Redeploy manually:**
1. Railway dashboard → Your service
2. Click "..." menu → "Redeploy"
3. Wait for deployment to complete

## Railway Variables vs Local .env

**Important Distinction:**

❌ **Local `.env` file**
- Located in `backend/.env`
- Only used for local development (`python main.py`)
- **NOT USED** by Railway

✅ **Railway Variables**
- Set in Railway dashboard → Variables tab
- Used when your app runs on Railway
- **MUST be set manually** for production

## Quick Checklist

Before testing checkout:

- [ ] All 4 variables added to Railway dashboard
- [ ] Railway deployment completed successfully
- [ ] Config check shows all "✅ SET"
- [ ] Railway logs show "API Key configured: True"
- [ ] Webhook configured in Lemon Squeezy dashboard

## Get Help

If you've followed all steps and it's still not working:

1. **Check config endpoint**:
   ```bash
   curl https://hazlabel-production.up.railway.app/subscription/config-check
   ```

2. **Check Railway logs**: Look for `[ERROR]` messages

3. **Share the error**: Copy the exact error from Railway logs

---

**Next Step**: Add the 4 environment variables to Railway, wait for redeploy, then test checkout!
