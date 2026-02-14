#!/usr/bin/env python3
"""
Test script for Lemon Squeezy integration
Run this to verify your Lemon Squeezy setup
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

import env_utils  # Load environment variables

def check_env_vars():
    """Check if all required environment variables are set"""
    required_vars = {
        "LEMON_SQUEEZY_API_KEY": "API key for Lemon Squeezy",
        "LEMON_SQUEEZY_WEBHOOK_SECRET": "Webhook secret for signature verification",
        "LEMON_SQUEEZY_STORE_ID": "Store ID (defaults to 117111)",
        "FRONTEND_URL": "Frontend URL for redirects (defaults to production)",
    }

    print("=" * 60)
    print("LEMON SQUEEZY ENVIRONMENT CHECK")
    print("=" * 60)

    all_set = True
    for var, description in required_vars.items():
        value = os.environ.get(var)
        if value:
            # Mask sensitive values
            if "KEY" in var or "SECRET" in var:
                display = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
            else:
                display = value
            print(f"✅ {var:35} = {display}")
        else:
            print(f"❌ {var:35} = NOT SET")
            print(f"   Description: {description}")
            all_set = False

    print("\n" + "=" * 60)
    if all_set:
        print("✅ All environment variables are configured!")
    else:
        print("❌ Missing environment variables. See above.")
        print("\nPlease update backend/.env with missing values.")
    print("=" * 60)

    return all_set

def test_webhook_endpoint():
    """Test if webhook endpoint is accessible"""
    import requests

    print("\n" + "=" * 60)
    print("WEBHOOK ENDPOINT TEST")
    print("=" * 60)

    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8080")
    webhook_url = f"{backend_url}/webhooks/lemon-squeezy/health"

    try:
        print(f"Testing: {webhook_url}")
        response = requests.get(webhook_url, timeout=10)

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Webhook endpoint is accessible")
            print(f"   Status: {data.get('status')}")
            print(f"   Secret configured: {data.get('webhook_secret_configured')}")
        else:
            print(f"❌ Webhook endpoint returned status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    except requests.RequestException as e:
        print(f"❌ Cannot reach webhook endpoint: {e}")
        print(f"   Make sure backend is running on {backend_url}")

    print("=" * 60)

def test_lemon_api():
    """Test Lemon Squeezy API connection"""
    import requests

    print("\n" + "=" * 60)
    print("LEMON SQUEEZY API TEST")
    print("=" * 60)

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        print("❌ LEMON_SQUEEZY_API_KEY not set, skipping API test")
        print("=" * 60)
        return

    store_id = os.environ.get("LEMON_SQUEEZY_STORE_ID", "117111")

    try:
        print(f"Testing API connection...")
        print(f"Store ID: {store_id}")

        # Test by fetching store info
        response = requests.get(
            f"https://api.lemonsqueezy.com/v1/stores/{store_id}",
            headers={
                "Accept": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            },
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            store_name = data.get("data", {}).get("attributes", {}).get("name", "Unknown")
            print(f"✅ API connection successful!")
            print(f"   Store: {store_name}")
        elif response.status_code == 401:
            print(f"❌ API key is invalid or expired")
            print(f"   Get a new key from: https://app.lemonsqueezy.com/settings/api")
        else:
            print(f"❌ API request failed with status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    except requests.RequestException as e:
        print(f"❌ Cannot connect to Lemon Squeezy API: {e}")

    print("=" * 60)

def check_webhook_config():
    """Check webhook configuration in Lemon Squeezy"""
    import requests

    print("\n" + "=" * 60)
    print("WEBHOOK CONFIGURATION CHECK")
    print("=" * 60)

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        print("❌ LEMON_SQUEEZY_API_KEY not set, cannot check webhooks")
        print("=" * 60)
        return

    try:
        print("Fetching webhook configurations...")
        response = requests.get(
            "https://api.lemonsqueezy.com/v1/webhooks",
            headers={
                "Accept": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            },
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            webhooks = data.get("data", [])

            if not webhooks:
                print("⚠️  No webhooks configured!")
                print("\nTo configure webhook:")
                print("1. Go to: https://app.lemonsqueezy.com/settings/webhooks")
                print("2. Click 'Create Webhook'")
                print("3. Set URL: https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy")
                print(f"4. Set Secret: {os.environ.get('LEMON_SQUEEZY_WEBHOOK_SECRET', 'YOUR_SECRET')}")
                print("5. Enable subscription events")
            else:
                print(f"✅ Found {len(webhooks)} webhook(s) configured:")
                for webhook in webhooks:
                    attrs = webhook.get("attributes", {})
                    print(f"\n   Webhook ID: {webhook.get('id')}")
                    print(f"   URL: {attrs.get('url')}")
                    print(f"   Events: {', '.join(attrs.get('events', []))}")
                    print(f"   Test mode: {attrs.get('test_mode')}")
        else:
            print(f"❌ Failed to fetch webhooks: {response.status_code}")
    except requests.RequestException as e:
        print(f"❌ Error checking webhooks: {e}")

    print("=" * 60)

def main():
    """Run all tests"""
    print("\n🔍 LEMON SQUEEZY INTEGRATION TEST\n")

    # Check environment variables
    env_ok = check_env_vars()

    if not env_ok:
        print("\n⚠️  Fix environment variables before running other tests")
        return 1

    # Test webhook endpoint (requires backend to be running)
    test_webhook_endpoint()

    # Test Lemon Squeezy API
    test_lemon_api()

    # Check webhook configuration
    check_webhook_config()

    print("\n✅ Test complete! Review results above.\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())
