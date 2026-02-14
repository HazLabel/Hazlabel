-- Downgrade shauryaasingh1603@gmail.com to free tier
-- User ID: 79c1653d-8e39-4a22-880d-1f86a9b25193

-- Delete all subscriptions for this user (downgrade to free)
DELETE FROM subscriptions
WHERE user_id = '79c1653d-8e39-4a22-880d-1f86a9b25193';

-- Verify user is now on free tier (should return 0 rows)
SELECT * FROM subscriptions
WHERE user_id = '79c1653d-8e39-4a22-880d-1f86a9b25193';
