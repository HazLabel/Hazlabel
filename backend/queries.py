from database import supabase
from typing import Dict, Any, Optional
from datetime import datetime

async def upsert_subscription(data: Dict[str, Any]):
    """
    Upserts a subscription record.
    Used for subscription_created and subscription_updated events.
    Keying off lemon_subscription_id.
    """
    # Check if exists first to get the ID if needed, or just upsert on lemon_subscription_id
    # Supabase upsert requires a primary key or unique constraint. 
    # logical subscription_id is unique.
    
    # We need user_id to insert. For updates, we might not get user_id in the webhook payload directly 
    # if it's not custom_data. But typically updates come after creation.
    # If user_id is missing in update, we rely on existing record.
    
    # Prepare data for upsert
    # Note: If validation fails or user_id is missing on insert, this will raise.
    
    try:
        # Check if subscription exists
        existing = await get_subscription(data["lemon_subscription_id"])
        
        if existing:
            # Update
            result = supabase.table("subscriptions").update(data).eq("lemon_subscription_id", data["lemon_subscription_id"]).execute()
        else:
            # Insert
            result = supabase.table("subscriptions").insert(data).execute()
            
        return result.data
    except Exception as e:
        print(f"Error upserting subscription: {e}")
        return None

async def get_subscription(lemon_subscription_id: str):
    """Retrieve a subscription by its Lemon Squeezy ID."""
    try:
        result = supabase.table("subscriptions").select("*").eq("lemon_subscription_id", lemon_subscription_id).single().execute()
        return result.data
    except Exception:
        return None

async def get_user_subscription(user_id: str):
    """Retrieve the active subscription for a user."""
    try:
        result = supabase.table("subscriptions").select("*").eq("user_id", user_id).in_("status", ["active", "on_trial"]).single().execute()
        return result.data
    except Exception:
        return None
