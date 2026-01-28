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
    Verifies that the user has an active or on-trial subscription.
    """
    from queries import get_user_subscription
    
    subscription = await get_user_subscription(user.id)
    
    # We might want to allow some "free tier" usage here, but for "Premium" endpoints
    # we enforce active subscription. 
    # Logic: If no sub or sub status not in valid list -> 403
    
    if not subscription or subscription.get("status") not in ["active", "on_trial"]:
        raise HTTPException(
            status_code=403, 
            detail="Premium subscription required for this feature."
        )
        
    return user
