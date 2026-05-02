-- Migration 000064_webauthn_flags.up.sql
ALTER TABLE authorized_devices ADD COLUMN IF NOT EXISTS backup_eligible BOOLEAN DEFAULT false;
ALTER TABLE authorized_devices ADD COLUMN IF NOT EXISTS backup_state BOOLEAN DEFAULT false;
