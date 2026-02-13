import hmac
import hashlib
import os
from fastapi import APIRouter, Request, HTTPException, Header
from typing import Dict, Any
from queries import upsert_subscription

router = APIRouter()

LEMON_SQUEEZY_WEBHOOK_SECRET = os.environ.get("LEMON_SQUEEZY_WEBHOOK_SECRET")

@router.get("/webhooks/lemon-squeezy/health")
async def webhook_health_check():
    """
    Health check endpoint to verify webhook URL is reachable.
    Lemon Squeezy may ping this to verify the endpoint before activating webhooks.
    """
    return {
        "status": "ok",
        "message": "Lemon Squeezy webhook endpoint is reachable",
        "webhook_secret_configured": bool(LEMON_SQUEEZY_WEBHOOK_SECRET)
    }

async def verify_signature(request: Request, x_signature: str = Header(None)):
    """
    Verify the Lemon Squeezy webhook signature.
    """
    print(f"[SIGNATURE DEBUG] Received X-Signature header: {x_signature[:20] if x_signature else 'None'}...")

    if not x_signature:
        print("[SIGNATURE ERROR] No X-Signature header provided")
        raise HTTPException(status_code=401, detail="No signature provided")

    if not LEMON_SQUEEZY_WEBHOOK_SECRET:
        print("WARNING: LEMONSQUEEZY_WEBHOOK_SECRET not set")
        raise HTTPException(status_code=500, detail="Server misconfigured")

    body = await request.body()
    print(f"[SIGNATURE DEBUG] Request body length: {len(body)} bytes")
    print(f"[SIGNATURE DEBUG] Body preview: {body[:100]}...")
    print(f"[SIGNATURE DEBUG] Secret configured: {LEMON_SQUEEZY_WEBHOOK_SECRET[:4]}...{LEMON_SQUEEZY_WEBHOOK_SECRET[-2:]}")

    # Create digest
    digest = hmac.new(
        LEMON_SQUEEZY_WEBHOOK_SECRET.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()

    print(f"[SIGNATURE DEBUG] Expected signature: {digest[:20]}...")
    print(f"[SIGNATURE DEBUG] Received signature: {x_signature[:20] if x_signature else 'None'}...")
    print(f"[SIGNATURE DEBUG] Signatures match: {hmac.compare_digest(digest, x_signature)}")

    if not hmac.compare_digest(digest, x_signature):
        print(f"[SIGNATURE ERROR] Signature mismatch!")
        print(f"[SIGNATURE ERROR] Expected: {digest}")
        print(f"[SIGNATURE ERROR] Received: {x_signature}")
        raise HTTPException(status_code=401, detail="Invalid signature")

@router.post("/webhooks/lemon-squeezy")
async def lemon_squeezy_webhook(request: Request, x_signature: str = Header(None)):
    """
    Handle Lemon Squeezy webhooks.
    Supported events: subscription_created, subscription_updated, subscription_cancelled
    """
    print(f"[WEBHOOK] Received webhook request from {request.client.host if request.client else 'unknown'}")

    try:
        await verify_signature(request, x_signature)
        print(f"[WEBHOOK] Signature verified successfully")
    except HTTPException as e:
        print(f"[WEBHOOK ERROR] Signature verification failed: {e.detail}")
        raise

    payload = await request.json()
    data = payload.get("data", {})
    attributes = data.get("attributes", {})
    event_name = payload.get("meta", {}).get("event_name")
    custom_data = payload.get("meta", {}).get("custom_data", {})

    print(f"[WEBHOOK] Event: {event_name}")
    print(f"[WEBHOOK] Subscription ID: {data.get('id')}")
    print(f"[WEBHOOK] Customer ID: {attributes.get('customer_id')}")
    print(f"[WEBHOOK] Variant ID: {attributes.get('variant_id')}")
    print(f"[WEBHOOK] Status: {attributes.get('status')}")
    print(f"[WEBHOOK] Custom data: {custom_data}")

    # Handle subscription lifecycle events
    # Note: subscription_plan_changed does NOT exist - plan changes trigger subscription_updated
    # Added payment events for better recovery handling
    if event_name in [
        "subscription_created",
        "subscription_updated",
        "subscription_cancelled",
        "subscription_expired",
        "subscription_resumed",
        "subscription_payment_success",
        "subscription_payment_failed",
        "subscription_payment_recovered"
    ]:

        # Map Lemon Squeezy status to our DB enum
        # LS statuses: on_trial, active, paused, past_due, unpaid, cancelled, expired
        status = attributes.get("status")

        # Prepare DB record
        subscription_data = {
            "lemon_subscription_id": str(data.get("id")),
            "lemon_customer_id": str(attributes.get("customer_id")),
            "lemon_variant_id": str(attributes.get("variant_id")),
            "status": status,
            "renews_at": attributes.get("renews_at"),
            "ends_at": attributes.get("ends_at"),
        }

        # Only set user_id on creation or if present in custom_data
        # We assume custom_data contains user_id passed during checkout
        user_id = custom_data.get("user_id")
        if user_id:
            subscription_data["user_id"] = user_id
            print(f"[WEBHOOK] Processing for user_id: {user_id}")
        else:
            print(f"[WEBHOOK WARNING] No user_id found in custom_data")

        # If it's an update and we don't have user_id, it needs to exist already.
        # upsert_subscription handles the check.

        try:
            result = await upsert_subscription(subscription_data)

            if result:
                print(f"[WEBHOOK SUCCESS] Subscription upserted successfully")
                return {"status": "processed", "event": event_name}
            else:
                print(f"[WEBHOOK ERROR] Subscription upsert failed")
                return {"status": "ignored", "reason": "upsert failed or missing user_id"}
        except Exception as e:
            print(f"[WEBHOOK ERROR] Exception during upsert: {str(e)}")
            raise

    print(f"[WEBHOOK] Event type '{event_name}' not handled, ignoring")
    return {"status": "ignored", "event": event_name}
