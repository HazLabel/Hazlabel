import hmac
import hashlib
import os
from fastapi import APIRouter, Request, HTTPException, Header
from typing import Dict, Any
from queries import upsert_subscription

router = APIRouter()

LEMON_SQUEEZY_WEBHOOK_SECRET = os.environ.get("LEMONSQUEEZY_WEBHOOK_SECRET")

async def verify_signature(request: Request, x_signature: str = Header(None)):
    """
    Verify the Lemon Squeezy webhook signature.
    """
    if not x_signature:
        raise HTTPException(status_code=401, detail="No signature provided")
        
    if not LEMON_SQUEEZY_WEBHOOK_SECRET:
        print("WARNING: LEMONSQUEEZY_WEBHOOK_SECRET not set")
        # In production this should probably fail, but for dev we might be lax? 
        # No, security first.
        raise HTTPException(status_code=500, detail="Server misconfigured")

    body = await request.body()
    
    # Create digest
    digest = hmac.new(
        LEMON_SQUEEZY_WEBHOOK_SECRET.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(digest, x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

@router.post("/webhooks/lemon-squeezy")
async def lemon_squeezy_webhook(request: Request, x_signature: str = Header(None)):
    """
    Handle Lemon Squeezy webhooks.
    Supported events: subscription_created, subscription_updated, subscription_cancelled
    """
    await verify_signature(request, x_signature)
    
    payload = await request.json()
    data = payload.get("data", {})
    attributes = data.get("attributes", {})
    event_name = payload.get("meta", {}).get("event_name")
    custom_data = payload.get("meta", {}).get("custom_data", {})
    
    print(f"Received webhook: {event_name}")
    
    if event_name in ["subscription_created", "subscription_updated", "subscription_cancelled", "subscription_expired", "subscription_resumed"]:
        
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
            
        # If it's an update and we don't have user_id, it needs to exist already. 
        # upsert_subscription handles the check.
        
        result = await upsert_subscription(subscription_data)
        
        if result:
             return {"status": "processed", "event": event_name}
        else:
             # If we tried to update a non-existent sub without user_id, it failed silentish
             return {"status": "ignored", "reason": "updated failed or missing user_id"}

    return {"status": "ignored", "event": event_name}
