# BLUEPRINT: WebAuthn (Passkeys) Integration Backend

## 1. Executive Summary
This document outlines the required backend infrastructure, database schema, and API contracts to implement WebAuthn (Passkeys) in GoClaw, adhering to the NIX-0 strict security and zero-trust guidelines.

## 2. Library Selection
- **Library:** `github.com/go-webauthn/webauthn`
- **Why:** It is the official and most actively maintained WebAuthn library for Go. It correctly implements the W3C Web Authentication API specification and handles complex ASN.1 parsing, CBOR decoding, and signature verification securely.
- **Initialization Requirements:**
  Requires configuration with the Relying Party (RP) ID (e.g., domain name), RP Display Name, and Origin.

## 3. Database Schema (PostgreSQL 18)

We will introduce a new table: `authorized_devices`. This table will store the public keys and metadata associated with user devices (Passkeys, YubiKeys, etc.).

```sql
CREATE TABLE authorized_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- User-friendly name (e.g., "iPhone 15", "YubiKey Bio")
    credential_id BYTEA NOT NULL UNIQUE,
    public_key BYTEA NOT NULL,
    attestation_type VARCHAR(255) NOT NULL,
    transport VARCHAR(50)[], -- e.g., ['usb', 'nfc', 'ble', 'internal']
    sign_count BIGINT NOT NULL DEFAULT 0,
    is_clone_warning BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    CONSTRAINT unique_user_credential UNIQUE (user_id, credential_id)
);

-- Index for fast lookups during authentication
CREATE INDEX idx_authorized_devices_user_id ON authorized_devices(user_id);
```

> **Note on NIX-0 Protocol (TASK-010 Integration):** 
> Ensure `ALTER TABLE authorized_devices ENABLE ROW LEVEL SECURITY;` is applied, integrating with the tenant isolation logic where appropriate.

## 4. API Endpoints Contract

### 4.1 Registration Flow (Requires Active Session / Existing Login)

**1. `POST /api/v1/auth/webauthn/register/begin`**
- **Auth:** Requires Authorization (Bearer Token).
- **Request Body:** `{}` (Optional: desired device name)
- **Response (200 OK):**
  ```json
  {
    "publicKey": { ... WebAuthn CreationOptions (Challenge, RP, User, etc.) ... }
  }
  ```
- **Logic:** Calls `webauthn.BeginRegistration()`. Stores the session data (challenge) temporarily in Redis or a cache with a short TTL (e.g., 2 minutes) tied to the user.

**2. `POST /api/v1/auth/webauthn/register/finish`**
- **Auth:** Requires Authorization (Bearer Token).
- **Request Body:** Standard WebAuthn parsed credential response.
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "device": { "id": "<uuid>", "name": "..." }
  }
  ```
- **Logic:** Retrieves the challenge from Redis. Calls `webauthn.FinishRegistration()`. Inserts the resulting public key and metadata into `authorized_devices`.

### 4.2 Login Flow (Passwordless / Multi-Factor)

**1. `POST /api/v1/auth/webauthn/login/begin`**
- **Auth:** Public
- **Request Body:** `{"username": "user@example.com"}` (Or omitted if doing discoverable credentials / passkey autofill).
- **Response (200 OK):**
  ```json
  {
    "publicKey": { ... WebAuthn RequestOptions (Challenge, AllowCredentials) ... }
  }
  ```
- **Logic:** Calls `webauthn.BeginLogin()`. Stores challenge in Redis with a short TTL.

**2. `POST /api/v1/auth/webauthn/login/finish`**
- **Auth:** Public
- **Request Body:** Standard WebAuthn parsed assertion response.
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "token": "eyJhbGci...", 
    "user": { ... }
  }
  ```
- **Logic:** Retrieves challenge. Calls `webauthn.FinishLogin()`. Updates `sign_count` and `last_used_at` in `authorized_devices`. Checks for signature counter anomalies (clone warning). Issues the standard JWT or session token.

## 5. Integration with WebSocket Handshake

Currently, the WebSocket connection requires an authentication token (JWT or session token).
Because the WebAuthn `login/finish` endpoint yields the exact same token format as the traditional login, **the WebSocket handshake requires ZERO modifications**.

However, the session payload should be enriched to include the `auth_method: "webauthn"` and `device_id` so that the context router (TASK-017) and audit logs can differentiate between a password login and a biometric/hardware key login.

### Enhancements:
- Inject `auth_method` into the Session/Token payload.
- Log the `device_id` used for the connection in the `sessions` table (referencing TASK-013).

## 6. Worker Execution Plan
This blueprint requires the `Expert-Go` worker to:
1. Add the `github.com/go-webauthn/webauthn` dependency.
2. Create the DB migration for `authorized_devices`.
3. Implement the `auth_webauthn.go` handler with the 4 endpoints.
4. Update the Session token generation to include `auth_method`.