-- Migration 000064_webauthn_flags.down.sql
ALTER TABLE authorized_devices DROP COLUMN IF EXISTS backup_eligible;
ALTER TABLE authorized_devices DROP COLUMN IF EXISTS backup_state;
