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
