# Lemon Squeezy Integration - Implementation Summary

## ✅ Completed Implementation

All core functionality for Lemon Squeezy subscription management has been implemented according to the plan.

---

## 📁 New Files Created

### Frontend

1. **`frontend/src/hooks/use-subscription.ts`**
   - React Query hook for fetching subscription status
   - Returns: tier, status, upload counts, limits
   - Auto-refetches on window focus

2. **`frontend/src/components/subscription-management.tsx`**
   - Main subscription UI component
   - Shows current plan badge, usage meter, upgrade CTA
   - "Manage Subscription" button (opens Lemon Squeezy portal)
   - Visual progress bar for upload limits
   - Warning messages when approaching limit

---

## 🔧 Modified Files

### Backend

1. **`backend/main.py`**
   - Added `/subscription/status` endpoint (line ~1082)
     - Returns tier, usage count, limits for current user
   - Added `/subscription/portal` endpoint (line ~1119)
     - Generates Lemon Squeezy Customer Portal URL
     - Requires `LEMONSQUEEZY_API_KEY`
   - Modified `/parse-sds` endpoint (line ~68)
     - Soft limit: Warn at 2 uploads (free tier)
     - Hard limit: Block at 5 uploads (free tier)
     - Returns `X-Upload-Warning` header when approaching limit
   - Modified `/parse-sds/validated` endpoint (line ~162)
     - Same usage limit logic as above

2. **`backend/queries.py`**
   - Added `count_monthly_uploads(user_id)` function
     - Counts `chemical.created` audit logs for current month
     - Used for usage limit enforcement

3. **`backend/requirements.txt`**
   - Added `requests` library (for Lemon Squeezy API calls)

### Frontend

4. **`frontend/src/app/(dashboard)/settings/page.tsx`**
   - Added CreditCard icon import
   - Added SubscriptionManagement component import
   - Added new "Subscription & Billing" section (after Notifications, before Security)

5. **`frontend/src/components/layout/dashboard-layout.tsx`**
   - Added useSubscription hook
   - Updated user badge to show dynamic tier (Free/Professional/Enterprise)
   - Shows upload count next to tier badge (e.g., "Free • 1/2")

---

## 🔑 Environment Variables Required

### Backend (Railway)

Already configured:
```bash
LEMONSQUEEZY_WEBHOOK_SECRET=Jai...  # ✅ Set
```

**New - Required:**
```bash
LEMONSQUEEZY_API_KEY=<generate_from_lemon_squeezy>  # ⚠️ NEEDS TO BE SET
```

**How to generate API key:**
1. Go to https://app.lemonsqueezy.com/settings/api
2. Click "Create API key"
3. Give it a name (e.g., "HazLabel Production")
4. Copy the key and add to Railway env vars

### Frontend (Vercel)

Already configured:
```bash
NEXT_PUBLIC_LEMON_CHECKOUT_PRO_MONTHLY=https://hazlabel.lemonsqueezy.com/checkout/buy/1283692
NEXT_PUBLIC_LEMON_CHECKOUT_PRO_ANNUAL=https://hazlabel.lemonsqueezy.com/checkout/buy/1254589
NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE_MONTHLY=https://hazlabel.lemonsqueezy.com/checkout/buy/1283714
NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE_ANNUAL=https://hazlabel.lemonsqueezy.com/checkout/buy/1283715
NEXT_PUBLIC_BACKEND_URL=https://hazlabel-production.up.railway.app
```

---

## 🧪 Testing Checklist

### 1. Environment Setup
- [ ] Backend: `LEMONSQUEEZY_API_KEY` set in Railway
- [ ] Backend: Deploy latest code with `requests` library installed
- [ ] Frontend: Verify checkout URL env vars in Vercel
- [ ] Frontend: Deploy latest code

### 2. Free Tier User Flow

**New User Signup:**
- [ ] Sign up new test account
- [ ] Go to Settings → See "Free" tier badge
- [ ] Dashboard header shows "Free • 0/2"
- [ ] Upload 1st SDS → Counter updates to "1/2"
- [ ] Upload 2nd SDS → See warning toast: "Free tier limit reached"
- [ ] Upload 3rd SDS → See warning: "1 grace upload remaining"
- [ ] Upload 4th SDS → See warning: "0 grace uploads remaining"
- [ ] Try 5th upload → BLOCKED with 403 error
- [ ] Error message: "You've exceeded your free tier limit (5 uploads/month). Please upgrade."

**Upgrade Path:**
- [ ] In Settings, click "Upgrade Plan" button
- [ ] Redirected to `/pricing` page
- [ ] Select Professional Monthly plan
- [ ] Click "Subscribe Now"
- [ ] Redirected to Lemon Squeezy checkout with `user_id` in URL
- [ ] Verify URL format: `...?checkout[custom][user_id]=<uuid>`

### 3. Subscription Purchase (Test Mode)

**Complete Checkout:**
- [ ] Use Lemon Squeezy test card (https://docs.lemonsqueezy.com/help/getting-started/test-mode)
- [ ] Complete purchase flow
- [ ] Check Railway logs for webhook received
- [ ] Verify webhook signature validated
- [ ] Check database `subscriptions` table for new record:
  ```sql
  SELECT * FROM subscriptions WHERE user_id = '<test_user_id>';
  ```
- [ ] Verify fields populated:
  - `lemon_subscription_id`
  - `lemon_customer_id`
  - `lemon_variant_id` (should be 1283692 for Pro Monthly)
  - `status` = 'active' or 'on_trial'
  - `renews_at` date set

**UI Updates:**
- [ ] Refresh Settings page
- [ ] See "Professional" badge (instead of "Free")
- [ ] Dashboard header shows "Professional • X/200"
- [ ] "Upgrade Plan" button replaced with "Manage Subscription" button

### 4. Customer Portal

**Access Portal:**
- [ ] Click "Manage Subscription" in Settings
- [ ] Backend calls Lemon Squeezy API
- [ ] New browser tab opens to Lemon Squeezy portal
- [ ] Can view subscription details
- [ ] Can see invoices
- [ ] Can update payment method

**Cancel Subscription:**
- [ ] In portal, cancel subscription
- [ ] Webhook sent to backend
- [ ] Database updated with status = 'cancelled'
- [ ] Settings page shows "(cancelled)" badge
- [ ] Subscription remains active until `ends_at` date

### 5. Usage Limits (Paid Tier)

**Professional Plan:**
- [ ] Upload 200 SDSs (warning at 200)
- [ ] Upload 201st SDS → No hard block (professional tier has no hard limit)
- [ ] Upload counter shows "201/200" (over limit but allowed)

**Enterprise Plan:**
- [ ] Upload limit: 15,000/month
- [ ] No hard block enforced

### 6. Monthly Reset

**End of Month:**
- [ ] On 1st day of new month, upload counter resets to 0
- [ ] Free user can upload 2 more SDSs
- [ ] Paid users counter resets but no limit enforced

---

## 🚀 Deployment Instructions

### Backend (Railway)

1. **Install dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Set environment variable:**
   - Go to Railway dashboard
   - Navigate to Variables tab
   - Add: `LEMONSQUEEZY_API_KEY=<your_api_key>`

3. **Deploy:**
   - Push to main branch (auto-deploys)
   - Or trigger manual deployment in Railway

4. **Verify:**
   ```bash
   curl https://hazlabel-production.up.railway.app/health
   # Should return: {"status": "healthy"}
   ```

### Frontend (Vercel)

1. **Install dependencies (local test):**
   ```bash
   cd frontend
   npm install
   ```

2. **Deploy:**
   - Push to main branch (auto-deploys)
   - Or trigger manual deployment in Vercel

3. **Verify:**
   - Visit https://hazlabel.vercel.app/settings
   - Should see Subscription & Billing section

---

## 🐛 Troubleshooting

### "Failed to open subscription portal"

**Cause:** `LEMONSQUEEZY_API_KEY` not set or invalid

**Fix:**
1. Generate new API key from Lemon Squeezy dashboard
2. Add to Railway environment variables
3. Redeploy backend

### Webhook not received

**Cause:** Webhook signature verification failing

**Fix:**
1. Check Railway logs for error messages
2. Verify `LEMONSQUEEZY_WEBHOOK_SECRET` matches Lemon Squeezy settings
3. Check webhook endpoint URL in Lemon Squeezy dashboard:
   - Should be: `https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy`

### Subscription not updating after purchase

**Cause:** `user_id` not passed in checkout URL

**Fix:**
1. Check frontend checkout URL generation
2. Verify user is authenticated before clicking "Subscribe Now"
3. Check Lemon Squeezy webhook payload for `meta.custom_data.user_id`

### Upload counter not incrementing

**Cause:** `audit_logs` table not recording uploads

**Fix:**
1. Check `save_to_vault` parameter is `true` when uploading
2. Verify `log_audit()` function is called after successful upload
3. Check database:
   ```sql
   SELECT * FROM audit_logs WHERE user_id = '<user_id>' AND action = 'chemical.created';
   ```

---

## 📊 Database Queries (Useful for Testing)

### Check user subscription:
```sql
SELECT * FROM subscriptions WHERE user_id = '<user_id>';
```

### Check upload count for current month:
```sql
SELECT COUNT(*) FROM audit_logs
WHERE user_id = '<user_id>'
  AND action = 'chemical.created'
  AND created_at >= date_trunc('month', CURRENT_DATE);
```

### Manually reset upload count (testing only):
```sql
DELETE FROM audit_logs
WHERE user_id = '<user_id>'
  AND action = 'chemical.created';
```

### Manually activate subscription (testing only):
```sql
UPDATE subscriptions
SET status = 'active',
    renews_at = NOW() + INTERVAL '30 days'
WHERE user_id = '<user_id>';
```

---

## 🎯 Next Steps

1. **Generate Lemon Squeezy API key** and add to Railway
2. **Deploy backend** with new code
3. **Deploy frontend** with new code
4. **Test free tier flow** with new account
5. **Test upgrade flow** in Lemon Squeezy test mode
6. **Test customer portal** access
7. **Monitor webhooks** in Railway logs
8. **Production testing** with real payment

---

## 📝 Implementation Notes

### Soft Limit Strategy

- **Free tier:** Warn at 2, block at 5 uploads
- **Paid tiers:** Warn at monthly limit, no hard block
- **Grace period:** 3 extra uploads for free users before hard stop
- **Reset:** Monthly counter resets on 1st day of month

### Tier Detection

Subscription tiers are detected via `lemon_variant_id`:
- `1283692` → Professional Monthly (200 uploads/month)
- `1254589` → Professional Annual (~208 uploads/month)
- `1283714` → Enterprise Monthly (15,000 uploads/month)
- `1283715` → Enterprise Annual (~16,666 uploads/month)
- No record → Free tier (2 uploads/month, 5 hard limit)

### API Response Headers

When approaching/exceeding soft limit, the API returns:
- HTTP Header: `X-Upload-Warning: "You've reached your free tier limit. X grace uploads remaining..."`
- Frontend should display this as a toast notification

---

## ✅ Status: Ready for Deployment

All code is complete and ready for production deployment. The only remaining step is setting the `LEMONSQUEEZY_API_KEY` environment variable in Railway.
