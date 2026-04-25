-- 000059_categorized_sessions.up.sql
-- Enrich sessions model with channel metadata for categorization.

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS source_channel_id UUID REFERENCES channel_instances(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50);

-- Create index for faster groupings by channel
CREATE INDEX IF NOT EXISTS idx_sessions_channel_categorization ON sessions (tenant_id, channel_type, source_channel_id);

-- Migration logic: attempt to infer channel_type from session_key if possible (legacy support)
UPDATE sessions SET channel_type = 'whatsapp' WHERE session_key LIKE '%whatsapp%' AND channel_type IS NULL;
UPDATE sessions SET channel_type = 'telegram' WHERE session_key LIKE '%telegram%' AND channel_type IS NULL;
UPDATE sessions SET channel_type = 'discord' WHERE session_key LIKE '%discord%' AND channel_type IS NULL;
UPDATE sessions SET channel_type = 'slack' WHERE session_key LIKE '%slack%' AND channel_type IS NULL;
UPDATE sessions SET channel_type = 'web' WHERE (session_key LIKE '%ws:%' OR session_key LIKE '%http%') AND channel_type IS NULL;
UPDATE sessions SET channel_type = 'internal' WHERE (session_key LIKE '%cron%' OR session_key LIKE '%heartbeat%' OR session_key LIKE '%evolution%') AND channel_type IS NULL;
