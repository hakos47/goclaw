package pg

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
)

// PGSecurityAuditStore implements the store.SecurityAuditStore interface using PostgreSQL.
type PGSecurityAuditStore struct {
	db *sql.DB
}

// NewPGSecurityAuditStore creates a new PGSecurityAuditStore.
func NewPGSecurityAuditStore(db *sql.DB) *PGSecurityAuditStore {
	return &PGSecurityAuditStore{db: db}
}

// LogEvent records a security event such as a device authorization failure.
func (s *PGSecurityAuditStore) LogEvent(ctx context.Context, tenantID uuid.UUID, eventType, deviceID, userID, ipAddress, userAgent string) error {
	query := `
		INSERT INTO security_audit_logs (event_type, device_id, user_id, tenant_id, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := s.db.ExecContext(ctx, query, eventType, deviceID, userID, tenantID, ipAddress, userAgent)
	return err
}
