import os
import asyncio
from supabase import create_client, Client

# Supabase credentials
SUPABASE_URL = "https://miqunemacflrcbfwarma.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

async def fix_subscription():
    if not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set")
        return
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Find user by email
    email = "shauryaasingh1603@gmail.com"
    print(f"Looking for user: {email}")
    
    response = supabase.auth.admin.list_users()
    user = None
    for u in response:
        if u.email == email:
            user = u
            break
    
    if not user:
        print(f"ERROR: User {email} not found")
        return
    
    user_id = user.id
    print(f"Found user ID: {user_id}")
    
    # Cancel any existing past_due subscriptions
    print("Checking for existing subscriptions...")
    existing = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()
    
    if existing.data:
        for sub in existing.data:
            print(f"Found subscription: ID={sub['id']}, Status={sub['status']}, Variant={sub['lemon_variant_id']}")
            if sub['status'] in ['past_due', 'unpaid']:
                print(f"Deleting past_due/unpaid subscription: {sub['id']}")
                supabase.table("subscriptions").delete().eq("id", sub["id"]).execute()
    
    # Create new Professional subscription
    import datetime
    now = datetime.datetime.now(datetime.timezone.utc)
    renews_at = now + datetime.timedelta(days=30)
    
    subscription_data = {
        "user_id": user_id,
        "lemon_subscription_id": "manual_override_" + user_id[:8],
        "lemon_customer_id": "manual_customer",
        "lemon_variant_id": "1283692",  # Professional Monthly
        "status": "active",
        "renews_at": renews_at.isoformat(),
        "ends_at": None
    }
    
    print("Creating Professional subscription...")
    print(subscription_data)
    
    result = supabase.table("subscriptions").insert(subscription_data).execute()
    
    if result.data:
        print("✅ SUCCESS! Subscription created:")
        print(result.data)
    else:
        print("❌ ERROR creating subscription")
        print(result)

if __name__ == "__main__":
    asyncio.run(fix_subscription())
