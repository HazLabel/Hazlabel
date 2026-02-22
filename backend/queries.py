from database import supabase
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

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
    """
    Retrieve the current subscription for a user.
    Includes cancelled subscriptions since users retain access until ends_at.
    Priority: active/on_trial first, then cancelled (if still within billing period).
    """
    try:
        # First try to find an active or on_trial subscription
        result = supabase.table("subscriptions").select("*").eq("user_id", user_id).in_("status", ["active", "on_trial"]).single().execute()
        return result.data
    except Exception:
        pass

    try:
        # Fall back to cancelled subscription (user still has access until ends_at)
        from datetime import datetime, timezone
        result = supabase.table("subscriptions").select("*").eq("user_id", user_id).eq("status", "cancelled").order("updated_at", desc=True).limit(1).single().execute()
        if result.data:
            ends_at = result.data.get("ends_at")
            if ends_at:
                # Parse ends_at and check if it's still in the future
                ends_at_dt = datetime.fromisoformat(ends_at.replace("Z", "+00:00"))
                if ends_at_dt > datetime.now(timezone.utc):
                    return result.data
        return None
    except Exception:
        return None

async def count_monthly_uploads(user_id: str) -> int:
    """Count SDS uploads in the current month."""
    # Get first day of current month
    now = datetime.now()
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    try:
        result = supabase.table("audit_logs")\
            .select("*", count="exact")\
            .eq("user_id", user_id)\
            .eq("action", "chemical.created")\
            .gte("created_at", first_of_month.isoformat())\
            .execute()

        return result.count or 0
    except Exception as e:
        print(f"Error counting uploads: {e}")
        return 0
