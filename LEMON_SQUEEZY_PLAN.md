# Lemon Squeezy Implementation Plan

This document outlines the plan to integrate Lemon Squeezy subscriptions into the HazLabel platform.

## Current Status

*   **Backend**:
    *   `backend/webhooks.py` already contains a handler for Lemon Squeezy webhooks (`subscription_created`, `updated`, etc.).
    *   `backend/database.py` and `schema.sql` already include a `subscriptions` table and `upsert_subscription` logic.
    *   **Missing**: Logic to generate Customer Portal URLs.
*   **Frontend**:
    *   No subscription integration exists.
    *   `useUser` hook exists but doesn't fetch subscription data.
    *   No pricing page or checkout initiation.

## Implementation Steps

### Phase 1: Environment Configuration

1.  **Lemon Squeezy Setup**:
    *   Create a Store and a Product (Variant) in Lemon Squeezy.
    *   Configure Webhooks in Lemon Squeezy to point to `https://api.hazlabel.co/webhooks/lemon-squeezy` (or development URL).
    *   Select events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`.

2.  **Environment Variables**:
    *   **Backend** (`.env`):
        *   `LEMONSQUEEZY_API_KEY`: Read-write API key for fetching portal URLs.
        *   `LEMONSQUEEZY_WEBHOOK_SECRET`: Secret for verifying webhook signatures.
        *   `LEMONSQUEEZY_STORE_ID`: (Optional) For validation.
    *   **Frontend** (`.env.local`):
        *   `NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID`: The ID of the subscription variant to purchase.
        *   `NEXT_PUBLIC_LEMONSQUEEZY_STORE_URL`: The base URL for the store (e.g., `https://hazlabel.lemonsqueezy.com`).

### Phase 2: Backend Enhancements

1.  **Customer Portal Endpoint**:
    *   Create `backend/lemonsqueezy.py` to handle API requests.
    *   Implement `get_customer_portal_url(lemon_customer_id: str) -> str`.
        *   This requires calling `GET https://api.lemonsqueezy.com/v1/customers/{id}` and extracting `attributes.urls.customer_portal`.
    *   Add API endpoint `GET /subscription/portal` in `backend/main.py`.
        *   Verifies user is logged in.
        *   Fetches user's subscription from DB.
        *   Returns the portal URL.

### Phase 3: Frontend Implementation

1.  **Subscription Hook**:
    *   Create `frontend/src/hooks/use-subscription.ts`.
    *   Uses Supabase client to query `subscriptions` table for the current user.
    *   Returns `{ subscription, isLoading, isSubscribed }`.

2.  **Pricing Component**:
    *   Create `frontend/src/components/pricing-card.tsx`.
    *   **Logic**:
        *   If `isSubscribed` is false:
            *   Render "Subscribe" button.
            *   Link: `https://store.lemonsqueezy.com/checkout/buy/${VARIANT_ID}?checkout[custom][user_id]=${user.id}&checkout[email]=${user.email}`.
        *   If `isSubscribed` is true:
            *   Render "Manage Subscription" button.
            *   On click, call `GET /subscription/portal` and redirect to the returned URL.

3.  **Integration**:
    *   Add the `PricingCard` to `frontend/src/app/settings/page.tsx` (or create a new Pricing page).

### Phase 4: Testing & Verification

1.  **Local Testing**:
    *   Use `ngrok` or similar to expose local backend for webhooks.
    *   Perform a test purchase in Lemon Squeezy "Test Mode".
    *   Verify webhook is received and DB is updated.
    *   Verify frontend reflects "Subscribed" status.
    *   Verify "Manage Subscription" link works.

## detailed Tasks

- [ ] Add `LEMONSQUEEZY_API_KEY` to backend env.
- [ ] Add `NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID` to frontend env.
- [ ] Implement `backend/lemonsqueezy.py` for API calls.
- [ ] Add `GET /subscription/portal` endpoint.
- [ ] Create `useSubscription` hook in frontend.
- [ ] Create `PricingCard` component in frontend.
- [ ] Deploy and configure webhooks in Lemon Squeezy dashboard.
