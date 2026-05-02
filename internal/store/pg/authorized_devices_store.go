package pg

import (
	"context"
	"database/sql"
	"errors"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type PGAuthorizedDeviceStore struct {
	db *sql.DB
}

func NewPGAuthorizedDeviceStore(db *sql.DB) *PGAuthorizedDeviceStore {
	return &PGAuthorizedDeviceStore{db: db}
}

func (s *PGAuthorizedDeviceStore) ApproveDevice(ctx context.Context, tenantID uuid.UUID, deviceID string) (bool, error) {
	query := `
		UPDATE authorized_devices
		SET is_trusted = true
		WHERE tenant_id = $1 AND id::text = $2
	`
	res, err := s.db.ExecContext(ctx, query, tenantID, deviceID)
	if err != nil {
		return false, err
	}
	affected, _ := res.RowsAffected()
	return affected > 0, nil
}

func (s *PGAuthorizedDeviceStore) DenyDevice(ctx context.Context, tenantID uuid.UUID, deviceID string) (bool, error) {
	query := `
		DELETE FROM authorized_devices
		WHERE tenant_id = $1 AND id::text = $2
	`
	res, err := s.db.ExecContext(ctx, query, tenantID, deviceID)
	if err != nil {
		return false, err
	}
	affected, _ := res.RowsAffected()
	return affected > 0, nil
}

func (s *PGAuthorizedDeviceStore) GetCredentials(ctx context.Context, tenantID uuid.UUID, userID string) ([]webauthn.Credential, error) {
	query := `
		SELECT credential_id, public_key, attestation_type, transport, sign_count, is_clone_warning
		FROM authorized_devices
		WHERE tenant_id = $1 AND user_id = $2
	`
	rows, err := s.db.QueryContext(ctx, query, tenantID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var creds []webauthn.Credential
	for rows.Next() {
		var c webauthn.Credential
		var t []string
		if err := rows.Scan(&c.ID, &c.PublicKey, &c.AttestationType, pq.Array(&t), &c.Authenticator.SignCount, &c.Authenticator.CloneWarning); err != nil {
			return nil, err
		}
		c.Authenticator.Attachment = "platform" // simple default for now
		creds = append(creds, c)
	}
	return creds, nil
}

func (s *PGAuthorizedDeviceStore) GetCredentialByID(ctx context.Context, credentialID []byte) (*webauthn.Credential, uuid.UUID, string, error) {
	query := `
		SELECT tenant_id, user_id, public_key, attestation_type, transport, sign_count, is_clone_warning, backup_eligible, backup_state
		FROM authorized_devices
		WHERE credential_id = $1
	`
	var tenantID uuid.UUID
	var userID string
	var c webauthn.Credential
	c.ID = credentialID

	var t []string
	var be, bs bool
	err := s.db.QueryRowContext(ctx, query, credentialID).Scan(&tenantID, &userID, &c.PublicKey, &c.AttestationType, pq.Array(&t), &c.Authenticator.SignCount, &c.Authenticator.CloneWarning, &be, &bs)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, uuid.Nil, "", nil // not found
		}
		return nil, uuid.Nil, "", err
	}
	c.Authenticator.Attachment = "platform"
	c.Flags.BackupEligible = be
	c.Flags.BackupState = bs
	return &c, tenantID, userID, nil
}

func (s *PGAuthorizedDeviceStore) SaveCredential(ctx context.Context, tenantID uuid.UUID, userID, name string, isTrusted bool, cred *webauthn.Credential) error {
	query := `
		INSERT INTO authorized_devices (user_id, tenant_id, name, credential_id, public_key, attestation_type, transport, sign_count, is_clone_warning, is_trusted, backup_eligible, backup_state)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := s.db.ExecContext(ctx, query, userID, tenantID, name, cred.ID, cred.PublicKey, cred.AttestationType, pq.Array([]string{}), cred.Authenticator.SignCount, cred.Authenticator.CloneWarning, isTrusted, cred.Flags.BackupEligible, cred.Flags.BackupState)
	return err
}

func (s *PGAuthorizedDeviceStore) UpdateCredential(ctx context.Context, tenantID uuid.UUID, userID string, cred *webauthn.Credential) error {
	query := `
		UPDATE authorized_devices
		SET sign_count = $1, is_clone_warning = $2, backup_state = $3, last_used_at = NOW()
		WHERE tenant_id = $4 AND user_id = $5 AND credential_id = $6
	`
	_, err := s.db.ExecContext(ctx, query, cred.Authenticator.SignCount, cred.Authenticator.CloneWarning, cred.Flags.BackupState, tenantID, userID, cred.ID)
	return err
}
