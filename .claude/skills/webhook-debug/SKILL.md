# Webhook Debug Skill

Debug Lemon Squeezy webhook issues by checking Railway logs, webhook signatures, and event processing.

## Usage

`/webhook-debug [event_type]`

Example: `/webhook-debug subscription_updated`

## Description

This skill helps debug Lemon Squeezy webhook issues by:
1. Fetching recent Railway logs for webhook events
2. Checking for signature verification failures
3. Validating event handling in backend/webhooks.py
4. Providing troubleshooting recommendations

## Valid Event Types

- subscription_created
- subscription_updated
- subscription_cancelled
- subscription_expired
- subscription_resumed
- subscription_payment_success
- subscription_payment_failed
- subscription_payment_recovered

## Task

When invoked:

1. **Check Railway Logs**
   - Search for webhook events in Railway logs
   - Look for signature verification issues
   - Check for event processing errors
   - Identify any failed database updates

2. **Validate Event Type**
   - Confirm the event type exists in Lemon Squeezy API
   - Check if backend/webhooks.py handles this event
   - Verify event name matches exactly (case-sensitive)

3. **Signature Verification**
   - Check if LEMON_SQUEEZY_WEBHOOK_SECRET is configured
   - Look for signature mismatch errors in logs
   - Verify HMAC SHA256 signature calculation

4. **Database Sync**
   - Check if subscription was updated in Supabase
   - Verify user_id was provided in custom_data
   - Look for upsert failures or missing fields

5. **Provide Recommendations**
   Based on findings, suggest:
   - Missing webhook events to add
   - Environment variable configuration issues
   - Lemon Squeezy dashboard webhook settings
   - Database schema problems
   - Event handling logic bugs

## Example Output

```
🔍 Webhook Debug Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Event Type: subscription_updated
✅ Event is valid in Lemon Squeezy API
✅ Event is handled in backend/webhooks.py

Railway Logs (Last 50 lines):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[WEBHOOK] Event: subscription_updated
[WEBHOOK] Subscription ID: 12345
[WEBHOOK SUCCESS] Subscription upserted successfully

Findings:
✅ No signature verification failures
✅ Event processed successfully
✅ Database updated

Recommendations:
• Everything looks good!
• Monitor for payment events (subscription_payment_failed)
```

## Railway CLI Commands

The skill may use these commands:
- `railway logs --tail 50` - Fetch recent logs
- `railway logs | grep "WEBHOOK"` - Filter webhook events
- `railway logs | grep "signature"` - Check signature issues

## Files to Check

- `backend/webhooks.py:88-100` - Event handler list
- `backend/webhooks.py:24-59` - Signature verification
- `backend/queries.py` - Database upsert logic
- `.env` or Railway dashboard - Webhook secret configuration

## Common Issues

1. **"Invalid signature"**: LEMON_SQUEEZY_WEBHOOK_SECRET mismatch
2. **"Event type not handled"**: Add event to webhook handler
3. **"No user_id in custom_data"**: Lemon Squeezy checkout missing user_id
4. **"Subscription upsert failed"**: Database schema or constraint issue

## Notes

- Always check Lemon Squeezy Dashboard → Webhooks → Recent Deliveries
- Webhook events are listed at: https://docs.lemonsqueezy.com/help/webhooks
- signature_plan_changed does NOT exist (common mistake)
- Use `disable_prorations: true` for plan changes to avoid payment failures
