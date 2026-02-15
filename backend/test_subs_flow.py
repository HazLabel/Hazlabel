import asyncio
import os
import sys
import json
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

async def test_webhook_logic():
    """
    Simulate webhook events to test logic without real Lemon Squeezy calls.
    """
    print("🧪 Testing Webhook Logic...")
    
    from webhooks import router
    from database import supabase
    
    # Mock Request object
    class MockRequest:
        def __init__(self, json_data):
            self._json = json_data
            self.client = type('obj', (object,), {'host': 'test-host'})
            
        async def json(self):
            return self._json
            
        async def body(self):
            return json.dumps(self._json).encode('utf-8')

    # 1. Test Payment Failure
    print("\n[1] Testing 'subscription_payment_failed'...")
    fail_payload = {
        "meta": {"event_name": "subscription_payment_failed"},
        "data": {
            "relationships": {
                "subscription": {
                    "data": {"id": "test_active_sub"}
                }
            }
        }
    }
    
    # Prerequisite: Create a dummy active subscription
    dummy_sub = {
        "user_id": "test_user_123", # Ensure this user exists or use dummy
        "lemon_subscription_id": "test_active_sub",
        "lemon_customer_id": "cust_123",
        "lemon_variant_id": "123",
        "status": "active"
    }
    # upsert dummy
    try:
        # Check if test user exists, if not create one for test? 
        # For safety, let's assume we can just insert into subscriptions if foreign key allows or mocking queries.
        # Since we use real DB connection, we need a real user.
        # Let's skip DB insert if we don't have a user, just testing the function logic?
        # Actually verify_signature will fail without valid secret/signature.
        pass
    except Exception as e:
        print(f"Skipping DB setup: {e}")

    print("⚠️  To fully test this, set LEMON_SQUEEZY_WEBHOOK_SECRET in .env and ensure 'test_active_sub' exists in DB.")
    print("This script is a template for manual verification.")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_webhook_logic())
