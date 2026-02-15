# Critical Fix: Plan Upgrade Payment Failures

## Problem

When clicking "Upgrade to Enterprise":
1. ❌ System tried to charge card **immediately**
2. ❌ Payment required OTP but **no checkout page opened**
3. ❌ Payment failed silently
4. ❌ **User downgraded to Free tier** (lost Professional subscription)

### From Lemon Squeezy Logs
```
✓ Plan switched to Enterprise
✗ Subscription payment failed ₹2,869.70
✓ Subscription invoice created
```

The system tried to charge immediately without opening a checkout page for OTP verification.

## Root Cause

The old implementation used `PATCH /subscriptions/{id}` to change the variant:

```python
# OLD (Wrong)
{
  "variant_id": new_variant_id,
  "disable_prorations": True  # This doesn't prevent immediate charges!
}
```

**Problem**: Even with `disable_prorations: True`, Lemon Squeezy still tries to charge immediately for upgrades. When payment requires 3D Secure/OTP, it fails because no checkout page opens.

## Solution

### New Logic: Detect Upgrade vs Downgrade

```python
# Tier hierarchy (higher = more expensive)
variant_tiers = {
    "1283715": 4,  # Enterprise Annual (highest)
    "1283714": 3,  # Enterprise Monthly
    "1254589": 2,  # Pro Annual
    "1283692": 1,  # Pro Monthly (lowest)
}

is_upgrade = new_tier > current_tier
```

### For Upgrades (Higher Price)
1. **Cancel** current subscription
2. **Create new checkout** with upgraded variant
3. **Redirect user** to Lemon Squeezy checkout page
4. User authorizes payment (OTP works!)
5. Webhook creates new subscription

```python
# NEW (Correct for upgrades)
return {
    "requires_checkout": True,
    "checkout_url": "https://lemonsqueezy.com/checkout/...",
    "message": "Please complete payment to activate your upgraded plan."
}
```

### For Downgrades (Lower Price)
1. **PATCH** subscription with new variant
2. **Schedule** change for next billing cycle
3. No immediate payment required

```python
# Correct for downgrades
{
    "variant_id": new_variant_id,
    "invoice_immediately": False  # No immediate charge
}
```

## Frontend Changes

```typescript
const result = await response.json()

if (result.requires_checkout) {
  // Upgrade: Redirect to checkout for payment authorization
  window.location.href = result.checkout_url
} else {
  // Downgrade: Scheduled for next cycle
  toast.success("Changes take effect on next billing cycle")
}
```

## Flow Comparison

### OLD FLOW (Broken) ❌
```
User clicks "Upgrade to Enterprise"
    ↓
Backend: PATCH subscription (variant_id: Enterprise)
    ↓
Lemon Squeezy: Try to charge ₹2,869.70
    ↓
Payment requires OTP
    ↓
NO CHECKOUT PAGE → Payment fails
    ↓
Subscription cancelled → Downgraded to Free
```

### NEW FLOW (Fixed) ✅
```
User clicks "Upgrade to Enterprise"
    ↓
Backend: Cancel current + Create checkout
    ↓
Frontend: Redirect to checkout URL
    ↓
Lemon Squeezy: Show checkout page
    ↓
User enters OTP → Payment authorized
    ↓
Webhook: Create new Enterprise subscription
    ↓
Success! Enterprise plan activated
```

## Testing

### Upgrade (Professional → Enterprise)
1. Go to Settings → Manage Billing
2. Click "Upgrade to Enterprise"
3. **Should redirect** to Lemon Squeezy checkout
4. Complete payment with OTP
5. Redirected to `/checkout/success`
6. Enterprise subscription activated

### Downgrade (Enterprise → Professional)
1. Go to Settings → Manage Billing
2. Click "Switch to Professional"
3. **No checkout** - just shows success message
4. Change takes effect on next billing cycle

### Cycle Change (Monthly → Annual)
1. Go to Settings → Manage Billing
2. Click "Switch to Annual"
3. **No checkout** - scheduled for next cycle

## Deployment

- Committed: 1d8dd97
- Status: ✅ Deployed to Railway & Vercel
- Tested: Pending (please test upgrade flow)

## Impact

✅ **Fixes**:
- No more failed payments on upgrades
- OTP/3D Secure authentication works properly
- No accidental downgrades to Free tier
- Proper payment authorization flow

⚠️ **User Impact**:
- Upgrades now require completing a new checkout (expected behavior)
- Previous subscription is cancelled before upgrade (clean transition)
- Downgrades remain simple (no checkout required)

---

**Status**: Ready for testing
**Priority**: Critical - prevents revenue loss and bad UX
