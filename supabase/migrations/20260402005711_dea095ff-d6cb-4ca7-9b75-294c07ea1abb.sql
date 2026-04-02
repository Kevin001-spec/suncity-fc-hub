ALTER TABLE members ADD COLUMN IF NOT EXISTS google_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_google_id ON members(google_id) WHERE google_id IS NOT NULL;