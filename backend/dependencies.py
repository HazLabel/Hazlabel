from fastapi import Header, HTTPException, Depends
from typing import Optional
from database import get_supabase

async def verify_user(authorization: Optional[str] = Header(None)):
    """
    Verifies the Supabase JWT token from the Authorization header.
    Returns the user object if valid.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    try:
        token = authorization.replace("Bearer ", "")
        supabase = get_supabase()
        user = supabase.auth.get_user(token)
        
        if not user:
             raise HTTPException(status_code=401, detail="Invalid token")
             
        return user.user

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def verify_subscription(user = Depends(verify_user)):
    """
    Verifies that the user has an active, on-trial, or cancelled-but-not-expired subscription.
    Cancelled subscriptions retain access until their ends_at date.
    """
    from queries import get_user_subscription

    subscription = await get_user_subscription(user.id)

    if not subscription:
        raise HTTPException(
            status_code=403,
            detail="Premium subscription required for this feature."
        )

    status = subscription.get("status")

    # Active and on_trial always have access
    if status in ["active", "on_trial"]:
        return user

    # Cancelled subscriptions have access until ends_at
    # (get_user_subscription already checks ends_at > now for cancelled subs)
    if status == "cancelled":
        return user

    raise HTTPException(
        status_code=403,
        detail="Premium subscription required for this feature."
    )

    return user
