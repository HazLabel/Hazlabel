-- ============================================================================
-- HazLabel Database Schema
-- ============================================================================

-- Create chemical_status enum
CREATE TYPE chemical_status AS ENUM ('processing', 'completed', 'failed');

-- Create the chemicals table
CREATE TABLE IF NOT EXISTS chemicals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users(id)
    name TEXT NOT NULL,
    ghs_data JSONB NOT NULL,
    source_pdf_url TEXT,
    status chemical_status DEFAULT 'completed',
    needs_review BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE chemicals ENABLE ROW LEVEL SECURITY;

-- Create policies for chemicals table
CREATE POLICY "Users can view their own chemicals" ON chemicals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chemicals" ON chemicals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chemicals" ON chemicals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chemicals" ON chemicals
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Audit Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs table
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Service role can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- User Settings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    default_label_size TEXT DEFAULT '4x2',
    notifications_enabled BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings table
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (user_id = auth.uid());

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Subscriptions Table (Lemon Squeezy)
-- ============================================================================

CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'unpaid', 'cancelled', 'expired', 'on_trial', 'paused');

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lemon_subscription_id TEXT UNIQUE NOT NULL,
    lemon_customer_id TEXT NOT NULL,
    lemon_variant_id TEXT NOT NULL,
    status subscription_status NOT NULL,
    renews_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lemon_id ON subscriptions(lemon_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
