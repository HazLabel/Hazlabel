# Webhook Error Fix - "paid" Status Issue

## Problem
After successful payment, webhook was receiving `subscription_payment_success` events with status `"paid"`, causing database error:

```
Error: invalid input value for enum subscription_status: "paid"
```

## Root Cause
Payment events send **payment objects**, not subscription objects:
- Payment object has status: `"paid"` (not a valid subscription status)
- Subscription object has status: `"active"`, `"cancelled"`, etc.

The webhook handler was trying to insert payment status into the subscriptions table.

## Solution
Removed payment events from webhook processing because:
1. `subscription_created` already handles initial subscription creation ✅
2. `subscription_updated` already handles subscription changes ✅
3. Payment events are for invoices, not subscription state

## Fixed Events List
```python
# BEFORE (Wrong - included payment events)
"subscription_payment_success",  # ❌ Sends payment object
"subscription_payment_failed",   # ❌ Sends payment object

# AFTER (Correct - only subscription events)
"subscription_created",     # ✅ Subscription object
"subscription_updated",     # ✅ Subscription object
"subscription_cancelled",   # ✅ Subscription object
"subscription_expired",     # ✅ Subscription object
"subscription_resumed"      # ✅ Subscription object
```

## Logs Showing the Fix Works

**Before fix:**
```
[WEBHOOK] Event: subscription_payment_success
[WEBHOOK] Status: paid  ← Problem!
Error upserting subscription: invalid input value for enum: "paid"
```

**After fix:**
```
[WEBHOOK] Event: subscription_created
[WEBHOOK] Status: active  ← Correct!
[WEBHOOK SUCCESS] Subscription upserted successfully
```

## Impact
- ✅ No more "paid" status errors
- ✅ Subscription still created properly via `subscription_created` event
- ✅ Payment success events are logged but don't interfere with subscription state

## Status
- Deployed: ✅
- Tested: ✅ (from logs showing successful webhook processing)

---

## Secondary Issue: "No Active Subscription Found"

This error appears in the UI because:
1. Subscription was created successfully ✅
2. But frontend is showing cached/old subscription status ❌

**Solution**: Frontend needs to refresh subscription data after webhook processes.

The `/subscription/status` endpoint returns correct data, frontend just needs to poll/refresh it.
