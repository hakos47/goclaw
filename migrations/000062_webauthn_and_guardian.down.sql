-- Migration: 000062_webauthn_and_guardian.down.sql
-- Description: Removes tables for WebAuthn (Passkeys) and Guardian Mode (Security Auditing)

DROP TABLE IF EXISTS authorized_devices;
DROP TABLE IF EXISTS security_audit_logs;
