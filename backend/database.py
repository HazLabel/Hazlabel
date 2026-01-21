from supabase import create_client, Client
import os
import env_utils
from models import GHSLabel
from typing import List, Dict, Any

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client = create_client(url, key)

def get_supabase():
    return supabase

async def save_chemical(user_id: str, name: str, ghs_data: GHSLabel, source_pdf_url: str = "", status: str = "completed", needs_review: bool = False):
    """Saves a chemical to the Supabase database."""
    data = {
        "user_id": user_id,
        "name": name,
        "ghs_data": ghs_data.model_dump() if ghs_data else {},
        "source_pdf_url": source_pdf_url,
        "status": status,
        "needs_review": needs_review
    }
    result = supabase.table("chemicals").insert(data).execute()
    return result.data

async def update_chemical(chemical_id: str, data: Dict[str, Any]):
    """Updates an existing chemical record."""
    result = supabase.table("chemicals").update(data).eq("id", chemical_id).execute()
    return result.data

async def delete_chemical(chemical_id: str):
    """Deletes a chemical from the database."""
    result = supabase.table("chemicals").delete().eq("id", chemical_id).execute()
    return result.data

async def log_audit(
    user_id: str, 
    action: str, 
    target_type: str = None, 
    target_id: str = None, 
    details: Dict[str, Any] = None
):
    """
    Log an audit event. Non-blocking - will silently fail if table doesn't exist.
    
    Actions: chemical.created, chemical.updated, chemical.deleted, chemical.viewed, label.printed
    """
    try:
        data = {
            "user_id": user_id,
            "action": action,
            "target_type": target_type or "unknown",
            "target_id": target_id,
            "details": details or {}
        }
        result = supabase.table("audit_logs").insert(data).execute()
        return result.data
    except Exception as e:
        # Silently fail if audit_logs table doesn't exist
        print(f"Audit log failed (non-critical): {e}")
        return None

async def get_audit_logs(user_id: str):
    """Retrieve audit logs for a user. Returns empty list if table doesn't exist."""
    try:
        result = supabase.table("audit_logs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(100).execute()
        return result.data
    except Exception as e:
        print(f"Failed to fetch audit logs: {e}")
        return []

async def get_chemicals(user_id: str):
    """Retrieves all chemicals for a specific user."""
    result = supabase.table("chemicals").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data

async def get_chemical_by_id(chemical_id: str):
    """Retrieves a single chemical by its ID."""
    result = supabase.table("chemicals").select("*").eq("id", chemical_id).single().execute()
    return result.data
