#!/usr/bin/env python3
"""
Downgrade user to free tier by deleting their subscription.
Uses Supabase Python client.
"""

from supabase import create_client, Client

# Supabase credentials from .env.local
SUPABASE_URL = "https://miqunemacflrcbfwarma.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcXVuZW1hY2ZscmNiZndhcm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjUwODUsImV4cCI6MjA4MzI0MTA4NX0.nRsl_KTRH-ssp5kRKOHYpOzVHVhOuMSt3TgWqFhlwcA"

# User to downgrade
USER_EMAIL = "shauryaasingh1603@gmail.com"
USER_ID = "79c1653d-8e39-4a22-880d-1f86a9b25193"

def downgrade_to_free():
    """Delete all subscriptions for the user, downgrading them to free tier."""

    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    print(f"Downgrading user: {USER_EMAIL}")
    print(f"User ID: {USER_ID}")
    print()

    try:
        # Delete all subscriptions for this user
        response = (
            supabase.table("subscriptions")
            .delete()
            .eq("user_id", USER_ID)
            .execute()
        )

        deleted_count = len(response.data) if response.data else 0
        print(f"✅ SUCCESS! Deleted {deleted_count} subscription(s)")

        if deleted_count > 0:
            print("\nDeleted subscriptions:")
            for sub in response.data:
                print(f"  - Subscription ID: {sub.get('lemon_subscription_id')}")
                print(f"    Variant: {sub.get('lemon_variant_id')}")
                print(f"    Status: {sub.get('status')}")

        print("\n" + "="*60)
        print("✅ User downgraded to FREE tier!")
        print("="*60)
        print("\nUser will now have:")
        print("  - Tier: Free")
        print("  - Upload Limit: 2/month (+ 5 grace uploads)")
        print("  - Status: No active subscription")
        print("\nRefresh https://hazlabel.co/settings to see changes.")

    except Exception as error:
        print(f"❌ ERROR: {error}")
        print("\nIf this fails, run this SQL in Supabase dashboard:")
        print(f"DELETE FROM subscriptions WHERE user_id = '{USER_ID}';")
        return False

    return True

if __name__ == "__main__":
    downgrade_to_free()
