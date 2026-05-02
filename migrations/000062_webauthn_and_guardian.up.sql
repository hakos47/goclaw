-- Migration: 000062_webauthn_and_guardian.up.sql
-- Description: Adds tables for WebAuthn (Passkeys) and Guardian Mode (Security Auditing)

-- ============================================================
-- 1. WebAuthn Devices
-- ============================================================

CREATE TABLE authorized_devices (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id           VARCHAR(255) NOT NULL,
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    credential_id     BYTEA NOT NULL,
    public_key        BYTEA NOT NULL,
    attestation_type  VARCHAR(255) NOT NULL,
    transport         VARCHAR(50)[],
    sign_count        BIGINT NOT NULL DEFAULT 0,
    is_clone_warning  BOOLEAN NOT NULL DEFAULT FALSE,
    is_trusted        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at      TIMESTAMPTZ,
    
    CONSTRAINT unique_user_device_credential UNIQUE (tenant_id, user_id, credential_id)
);

CREATE INDEX idx_authorized_devices_user_tenant ON authorized_devices(user_id, tenant_id);
CREATE INDEX idx_authorized_devices_credential ON authorized_devices(credential_id);

-- ============================================================
-- 2. Security Audit Logs
-- ============================================================

CREATE TABLE security_audit_logs (
    event_id   UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    event_type VARCHAR(100) NOT NULL,
    device_id  VARCHAR(255),
    user_id    VARCHAR(255),
    tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_audit_logs_user_tenant ON security_audit_logs(user_id, tenant_id);
CREATE INDEX idx_security_audit_logs_event_type ON security_audit_logs(event_type);

-- ============================================================
-- 3. Row Level Security (RLS)
-- ============================================================

ALTER TABLE authorized_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own devices and logs within their tenant.
-- Note: Reusing logic from robust_rls.up.sql where appropriate.

CREATE POLICY authorized_devices_tenant_isolation ON authorized_devices
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY security_audit_logs_tenant_isolation ON security_audit_logs
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
