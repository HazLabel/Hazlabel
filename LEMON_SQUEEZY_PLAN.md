# Lemon Squeezy Implementation Plan (Revised)

This document outlines the plan to integrate Lemon Squeezy subscriptions into the HazLabel platform, incorporating specific product details and the requested user flow.

## Configuration Details

**Store URL**: `hazlabel.lemonsqueezy.com`
**Callback URL**: `https://hazlabel-production.up.railway.app/webhooks/lemon-squeezy`

### Product & Variant IDs

| Plan | Billing | Product ID | Variant ID |
| :--- | :--- | :--- | :--- |
| **Professional** | Monthly | 795475 | `1283692` |
| **Professional** | Annual | 795475 | `1254589` |
| **Enterprise** | Monthly | 795475 | `1283714` |
| **Enterprise** | Annual | 795475 | `1283715` |

## Implementation Steps

### Phase 1: Environment Configuration

1.  **Backend (`.env` in Railway)**:
    *   `LEMONSQUEEZY_WEBHOOK_SECRET`: Set to the provided secret (`Jai...`).
    *   `LEMONSQUEEZY_API_KEY`: (Required for Customer Portal) Generate this in Lemon Squeezy settings.

2.  **Frontend (`.env.local`)**:
    *   `NEXT_PUBLIC_LEMONSQUEEZY_STORE_URL`: `https://hazlabel.lemonsqueezy.com`
    *   `NEXT_PUBLIC_VARIANT_PROFESSIONAL_MONTHLY`: `1283692`
    *   `NEXT_PUBLIC_VARIANT_PROFESSIONAL_ANNUAL`: `1254589`
    *   `NEXT_PUBLIC_VARIANT_ENTERPRISE_MONTHLY`: `1283714`
    *   `NEXT_PUBLIC_VARIANT_ENTERPRISE_ANNUAL`: `1283715`

### Phase 2: User Flow & Frontend Logic

**User State**: All new users start on a **Free Tier** by default.

1.  **Landing Page Modification**:
    *   Locate the "Get Started" buttons in the Membership/Pricing section.
    *   **Change**: Update links to redirect to the Sign-In page (`/login` or equivalent).
    *   *Note*: Users must be authenticated to upgrade.

2.  **Dashboard Upgrade Flow**:
    *   Create a **Pricing/Upgrade Modal** or Page accessible from the Dashboard (e.g., via a "Upgrade Plan" button in the sidebar or header).
    *   **UI Components**:
        *   Toggle for Monthly vs. Annual billing.
        *   Card for **Professional Plan** with "Upgrade" button.
        *   Card for **Enterprise Plan** with "Upgrade" button.
    *   **Checkout Logic**:
        *   When clicking "Upgrade", generate the Lemon Squeezy Checkout URL.
        *   **Crucial**: Pass the `user_id` and `email` in the checkout data.
        *   URL Format:
            ```javascript
            const checkoutUrl = `https://hazlabel.lemonsqueezy.com/checkout/buy/${variantId}?checkout[custom][user_id]=${user.id}&checkout[email]=${user.email}`;
            window.open(checkoutUrl, '_blank'); // or redirect
            ```

3.  **Subscription Management (For existing subscribers)**:
    *   If the user already has an active subscription (checked via `useSubscription` hook):
        *   Show "Manage Subscription" instead of "Upgrade".
        *   Clicking this calls the backend endpoint `/subscription/portal`.

### Phase 3: Backend Implementation

1.  **Database**:
    *   Existing `subscriptions` table is sufficient.
    *   Ensure `status` column defaults to `active` (for free tier?) or handle "no record" as Free Tier in logic. *Decision: No record in `subscriptions` table = Free Tier.*

2.  **API Endpoints**:
    *   `GET /subscription/portal`:
        *   Fetch the user's `lemon_customer_id` from the database.
        *   Call Lemon Squeezy API to get the portal URL.
        *   Return the URL to the frontend.

3.  **Webhooks**:
    *   Verify `backend/webhooks.py` handles the `subscription_created` and `subscription_updated` events.
    *   Ensure the `upsert_subscription` function correctly maps the `user_id` from `meta.custom_data.user_id` (passed during checkout) to the database record.

### Phase 4: Testing Plan

1.  **Environment**: Test locally using `ngrok` to tunnel webhooks.
2.  **Free User Test**:
    *   Sign up a new user.
    *   Verify they can see the Dashboard.
    *   Verify they see "Upgrade" options.
3.  **Upgrade Test**:
    *   Click "Upgrade" (Professional Monthly).
    *   Complete purchase in Lemon Squeezy Test Mode.
    *   **Verify**:
        *   Webhook received by backend.
        *   Database `subscriptions` table updated with new record.
        *   Frontend updates to show "Professional" badge/status.
        *   "Upgrade" button changes to "Manage Subscription".
4.  **Portal Test**:
    *   Click "Manage Subscription".
    *   Verify redirection to Lemon Squeezy Customer Portal.
