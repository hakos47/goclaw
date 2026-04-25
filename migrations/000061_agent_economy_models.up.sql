-- 000061_agent_economy_models.up.sql
-- Support for dynamic model routing based on channel efficiency (economy mode).

ALTER TABLE agents ADD COLUMN IF NOT EXISTS economy_provider VARCHAR(50);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS economy_model VARCHAR(200);
