package store

import (
	"context"

	"github.com/google/uuid"
)

// SecurityAuditStore defines methods for interacting with security audit logs.
type SecurityAuditStore interface {
	LogEvent(ctx context.Context, tenantID uuid.UUID, eventType, deviceID, userID, ipAddress, userAgent string) error
}
