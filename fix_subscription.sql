-- Fix subscription for shauryaasingh1603@gmail.com
-- User ID: 79c1653d-8e39-4a22-880d-1f86a9b25193
-- Run this in Supabase SQL Editor

-- Step 1: Delete the past_due/unpaid subscription
DELETE FROM subscriptions
WHERE user_id = '79c1653d-8e39-4a22-880d-1f86a9b25193';

-- Step 2: Create new Professional Monthly subscription
INSERT INTO subscriptions (
    user_id,
    lemon_subscription_id,
    lemon_customer_id,
    lemon_variant_id,
    status,
    renews_at,
    ends_at
) VALUES (
    '79c1653d-8e39-4a22-880d-1f86a9b25193',
    'manual_79c1653d',
    'manual_customer',
    '1283692',  -- Professional Monthly variant
    'active',
    NOW() + INTERVAL '30 days',
    NULL
);

-- Verify the subscription was created
SELECT * FROM subscriptions
WHERE user_id = '79c1653d-8e39-4a22-880d-1f86a9b25193';
