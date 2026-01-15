-- Migration: Add status and needs_review to chemicals
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chemical_status') THEN
        CREATE TYPE chemical_status AS ENUM ('processing', 'completed', 'failed');
    END IF;
END $$;

ALTER TABLE chemicals 
ADD COLUMN IF NOT EXISTS status chemical_status DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS error_message TEXT;
