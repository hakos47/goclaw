-- 000060_native_session_category.up.sql
-- Transform soft categorization into a native, high-performance indexed column.

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT 'personal';

-- Populate based on previous logic for backward compatibility
UPDATE sessions SET category = 'inbound' WHERE channel_type IN ('whatsapp', 'facebook');
UPDATE sessions SET category = 'support' WHERE channel_type IN ('telegram', 'discord');
UPDATE sessions SET category = 'evolution' WHERE channel_type IN ('internal', 'evolution');
UPDATE sessions SET category = 'system' WHERE session_key LIKE '%system%';
UPDATE sessions SET category = 'personal' WHERE category IS NULL OR category = '';

-- Create index for O(1) grouping and filtering
CREATE INDEX IF NOT EXISTS idx_sessions_category_tenant ON sessions (tenant_id, category, updated_at DESC);
