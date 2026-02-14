# Lemon Squeezy Integration - Fixes Applied

## Summary

The Lemon Squeezy checkout was getting stuck after clicking subscribe because:
1. No redirect URL was configured (users couldn't complete checkout)
2. Missing/incorrect environment variables
3. Webhook might not be configured in Lemon Squeezy dashboard

## Changes Made ✅

### 1. Fixed Checkout Flow (`backend/main.py`)
**Line 1316** - Added redirect URL to checkout creation:
```python
"checkout_options": {
    "redirect_url": f"{os.environ.get('FRONTEND_URL', 'https://www.hazlabel.co')}/checkout/success"
}
```

**Line 1347** - Enhanced logging to track checkout creation:
```python
print(f"Checkout options: {checkout_data['data']['attributes'].get('checkout_options', {})}")
return {
    "checkout_url": checkout_url,
    "checkout_id": checkout_data["data"]["id"]
}
```

### 2. Fixed Environment Variables (`backend/.env`)
Updated variable names and added missing keys:
```bash
# OLD (Wrong)
LEMONSQUEEZY_WEBHOOK_SECRET=hazlabel_secret_key_12345

# NEW (Correct)
LEMON_SQUEEZY_WEBHOOK_SECRET=hazlabel_secret_key_12345
LEMON_SQUEEZY_API_KEY=YOUR_LEMON_SQUEEZY_API_KEY_HERE  # ⚠️ NEEDS YOUR ACTUAL KEY
LEMON_SQUEEZY_STORE_ID=117111
FRONTEND_URL=https://www.hazlabel.co
```

### 3. Enhanced Webhook Debugging (`backend/webhooks.py`)
Added startup warning for missing webhook secret:
```python
if not LEMON_SQUEEZY_WEBHOOK_SECRET:
    print("[WEBHOOK WARNING] LEMON_SQUEEZY_WEBHOOK_SECRET not set in environment variables")
```

### 4. Created Testing Tools
- `test_lemon_squeezy.py` - Automated test script to verify configuration
- `LEMON_SQUEEZY_FIX.md` - Complete troubleshooting guide

## What You Need to Do Now ⚠️

### Step 1: Get Your Lemon Squeezy API Key
1. Go to https://app.lemonsqueezy.com/settings/api
2. Create a new API key if you don't have one
3. Copy the key (starts with `lmsq_api_...`)

### Step 2: Update Environment Variables

**Local development** (`backend/.env`):
```bash
cd backend
# Edit .env and replace:
LEMON_SQUEEZY_API_KEY=YOUR_LEMON_SQUEEZY_API_KEY_HERE
# with your actual API key:
LEMON_SQUEEZY_API_KEY=lmsq_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Railway production**:
1. Go to Railway dashboard
2. Select your backend service
3. Go to Variables tab
4. Add/update these variables:
   - `LEMON_SQUEEZY_API_KEY` = your API key
   - `LEMON_SQUEEZY_WEBHOOK_SECRET` = `hazlabel_secret_key_12345`
   - `LEMON_SQUEEZY_STORE_ID` = `117111`
   - `FRONTEND_URL` = `https://www.hazlabel.co`

### Step 3: Configure Webhook in Lemon Squeezy
1. Go to https://app.lemonsqueezy.com/settings/webhooks
2. Click "Create Webhook"
3. Fill in:
   - **URL**: `https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy`
   - **Secret**: `hazlabel_secret_key_12345`
   - **Events** (select all subscription events):
     - ✅ subscription_created
     - ✅ subscription_updated
     - ✅ subscription_payment_success
     - ✅ subscription_payment_failed
     - ✅ subscription_cancelled
     - ✅ subscription_expired
     - ✅ subscription_resumed
     - ✅ subscription_payment_recovered

### Step 4: Deploy Changes
```bash
# Commit and push changes
git add .
git commit -m "Fix: Add Lemon Squeezy redirect URL and fix environment variables"
git push origin main

# Railway will auto-deploy
```

### Step 5: Test the Flow
```bash
# Run the test script locally
python3 test_lemon_squeezy.py

# Test the checkout flow:
# 1. Visit https://www.hazlabel.co/pricing
# 2. Click "Subscribe" on Professional plan
# 3. Complete payment
# 4. Should redirect to /checkout/success
# 5. Check subscription appears in dashboard
```

## How to Verify It's Working

### Check Checkout Creation
Backend logs should show:
```
Creating checkout for user_id: xxx, variant_id: 1283692
Checkout created successfully: https://hazlabel.lemonsqueezy.com/checkout/custom/...
Checkout options: {'redirect_url': 'https://www.hazlabel.co/checkout/success'}
```

### Check Webhook Reception
After completing payment, backend logs should show:
```
[WEBHOOK] Received webhook request from ...
[WEBHOOK] Signature verified successfully
[WEBHOOK] Event: subscription_created
[WEBHOOK] Subscription ID: ...
[WEBHOOK SUCCESS] Subscription upserted successfully
```

### Check Database
Query Supabase `subscriptions` table:
```sql
SELECT * FROM subscriptions WHERE user_id = 'your-user-id';
```

Should see a record with:
- `status` = 'active'
- `lemon_subscription_id` populated
- `lemon_variant_id` matching your plan

## Troubleshooting

### "Failed to create checkout session"
- API key is missing or invalid
- Check `LEMON_SQUEEZY_API_KEY` is set correctly
- Verify key at https://app.lemonsqueezy.com/settings/api

### User stuck on checkout page
- Checkout URL is created but user can't complete
- This should be fixed now with redirect_url
- If still happening, check Lemon Squeezy doesn't have any payment restrictions

### "Processing Payment" forever
- Webhook is not being received
- Check webhook is configured in Lemon Squeezy dashboard
- Verify webhook URL is accessible
- Check webhook logs in Lemon Squeezy for delivery failures

### "Invalid signature" error
- Webhook secret mismatch
- Make sure both Lemon Squeezy webhook config and backend `.env` use: `hazlabel_secret_key_12345`

## Files Modified

1. ✅ `backend/main.py` - Added redirect URL and enhanced logging
2. ✅ `backend/.env` - Fixed variable names, added missing variables
3. ✅ `backend/webhooks.py` - Added startup warning
4. ✅ `test_lemon_squeezy.py` - Created test script
5. ✅ `LEMON_SQUEEZY_FIX.md` - Created troubleshooting guide

## Next Steps

1. ⚠️ **Add your Lemon Squeezy API key** to `backend/.env` and Railway
2. ⚠️ **Configure webhook** in Lemon Squeezy dashboard
3. ⚠️ **Redeploy** to Railway
4. ✅ **Test** the complete checkout flow

## Testing Checklist

- [ ] API key added to `.env` and Railway
- [ ] Webhook configured in Lemon Squeezy
- [ ] Changes deployed to Railway
- [ ] Run `python3 test_lemon_squeezy.py` - all checks pass
- [ ] Test checkout flow from pricing page
- [ ] Payment redirects to success page
- [ ] Webhook is received (check backend logs)
- [ ] Subscription appears in user dashboard
- [ ] User can access paid features

---

**Status**: Code changes complete, awaiting:
- API key configuration
- Webhook setup
- Deployment & testing
