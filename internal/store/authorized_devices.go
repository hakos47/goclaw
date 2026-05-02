package store

import (
	"context"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
)

type AuthorizedDeviceStore interface {
	ApproveDevice(ctx context.Context, tenantID uuid.UUID, deviceID string) (bool, error)
	DenyDevice(ctx context.Context, tenantID uuid.UUID, deviceID string) (bool, error)

	GetCredentials(ctx context.Context, tenantID uuid.UUID, userID string) ([]webauthn.Credential, error)
	GetCredentialByID(ctx context.Context, credentialID []byte) (*webauthn.Credential, uuid.UUID, string, error)
	SaveCredential(ctx context.Context, tenantID uuid.UUID, userID, name string, isTrusted bool, cred *webauthn.Credential) error
	UpdateCredential(ctx context.Context, tenantID uuid.UUID, userID string, cred *webauthn.Credential) error
}
