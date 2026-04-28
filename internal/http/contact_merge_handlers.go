package http

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/google/uuid"

	"github.com/nextlevelbuilder/goclaw/internal/i18n"
	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// handleMergeContacts links selected contacts to a tenant_user identity.
// POST /v1/contacts/merge
func (h *ChannelInstancesHandler) handleMergeContacts(w http.ResponseWriter, r *http.Request) {
	locale := store.LocaleFromContext(r.Context())
	tid := store.TenantIDFromContext(r.Context())
	if tid == uuid.Nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgTenantScopeRequired)})
		return
	}

	var body struct {
		ContactIDs   []string `json:"contact_ids"`
		TenantUserID *string  `json:"tenant_user_id"`
		CreateUser   *struct {
			UserID      string `json:"user_id"`
			DisplayName string `json:"display_name"`
		} `json:"create_user"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgInvalidJSON)})
		return
	}

	if len(body.ContactIDs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgContactIDsRequired)})
		return
	}

	contactUUIDs := make([]uuid.UUID, 0, len(body.ContactIDs))
	for _, idStr := range body.ContactIDs {
		if id, err := uuid.Parse(idStr); err == nil {
			contactUUIDs = append(contactUUIDs, id)
		}
	}

	if len(contactUUIDs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgInvalidID, "contact_ids")})
		return
	}

	if len(contactUUIDs) > 500 {
		contactUUIDs = contactUUIDs[:500]
	}

	hasTU := body.TenantUserID != nil && *body.TenantUserID != ""
	hasCU := body.CreateUser != nil
	if hasTU == hasCU { // must have exactly one
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgMergeTargetRequired)})
		return
	}

	var targetID uuid.UUID
	var targetUserID string // tenant_user.user_id string for context file migration

	if hasTU {
		// Hybrid ID: could be a UUID (tenant_user) or a string (contact sender_id)
		targetIDStr := *body.TenantUserID
		if parsed, err := uuid.Parse(targetIDStr); err == nil {
			// Try as UUID (tenant_user)
			tu, err := h.tenantStore.GetTenantUser(r.Context(), parsed)
			if err == nil && tu.TenantID == tid {
				targetID = tu.ID
				targetUserID = tu.UserID
			}
		}

		// If not found as tenant_user, check if it's a contact sender_id
		if targetID == uuid.Nil {
			contacts, err := h.contactStore.ListContacts(r.Context(), store.ContactListOpts{Search: targetIDStr, Limit: 1})
			if err == nil && len(contacts) > 0 && contacts[0].SenderID == targetIDStr {
				// Promote contact to tenant_user automatically
				displayName := ""
				if contacts[0].DisplayName != nil {
					displayName = *contacts[0].DisplayName
				}
				tu, err := h.tenantStore.CreateTenantUserReturning(r.Context(), tid, targetIDStr, displayName, store.TenantRoleMember)
				if err != nil {
					slog.Error("contacts.merge.promote_contact", "error", err, "sender_id", targetIDStr)
					writeJSON(w, http.StatusInternalServerError, map[string]string{"error": i18n.T(locale, i18n.MsgFailedToCreate, "tenant user from contact", err.Error())})
					return
				}
				targetID = tu.ID
				targetUserID = tu.UserID
			}
		}

		if targetID == uuid.Nil {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": i18n.T(locale, i18n.MsgTenantUserNotFound)})
			return
		}
	} else {
		// Create new tenant_user.
		userID := body.CreateUser.UserID
		displayName := body.CreateUser.DisplayName
		if userID == "" {
			// Fallback: derive from first contact's username.
			userID = h.deriveUserIDFromContacts(r.Context(), contactUUIDs)
		}
		if userID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgRequired, "user_id")})
			return
		}
		tu, err := h.tenantStore.CreateTenantUserReturning(r.Context(), tid, userID, displayName, store.TenantRoleMember)
		if err != nil {
			slog.Error("contacts.merge.create_user", "error", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": i18n.T(locale, i18n.MsgFailedToCreate, "tenant user", err.Error())})
			return
		}
		targetID = tu.ID
		targetUserID = tu.UserID
	}

	if err := h.contactStore.MergeContacts(r.Context(), contactUUIDs, targetID); err != nil {
		slog.Error("contacts.merge", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": i18n.T(locale, i18n.MsgFailedToUpdate, "contacts", err.Error())})
		return
	}

	// Migrate user_context_files from old sender_ids to new tenant_user_id.
	h.migrateContextFilesOnMerge(r.Context(), contactUUIDs, targetUserID)

	emitAudit(h.msgBus, r, "contacts.merged", "tenant_user", targetID.String())
	writeJSON(w, http.StatusOK, map[string]any{
		"merged_id":    targetID,
		"merged_count": len(contactUUIDs),
	})
}

// handleUnmergeContacts removes merged_id from selected contacts.
// POST /v1/contacts/unmerge
func (h *ChannelInstancesHandler) handleUnmergeContacts(w http.ResponseWriter, r *http.Request) {
	locale := store.LocaleFromContext(r.Context())
	tid := store.TenantIDFromContext(r.Context())
	if tid == uuid.Nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgTenantScopeRequired)})
		return
	}

	var body struct {
		ContactIDs []string `json:"contact_ids"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgInvalidJSON)})
		return
	}
	if len(body.ContactIDs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgContactIDsRequired)})
		return
	}

	contactUUIDs := make([]uuid.UUID, 0, len(body.ContactIDs))
	for _, idStr := range body.ContactIDs {
		if id, err := uuid.Parse(idStr); err == nil {
			contactUUIDs = append(contactUUIDs, id)
		}
	}

	if len(contactUUIDs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgInvalidID, "contact_ids")})
		return
	}

	if len(contactUUIDs) > 500 {
		contactUUIDs = contactUUIDs[:500]
	}

	if err := h.contactStore.UnmergeContacts(r.Context(), contactUUIDs); err != nil {
		slog.Error("contacts.unmerge", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": i18n.T(locale, i18n.MsgFailedToUpdate, "contacts", err.Error())})
		return
	}

	emitAudit(h.msgBus, r, "contacts.unmerged", "contacts", "")
	writeJSON(w, http.StatusOK, map[string]any{"unmerged_count": len(contactUUIDs)})
}

// handleListMergedContacts returns contacts linked to a tenant_user.
// GET /v1/contacts/merged/{tenantUserId}
func (h *ChannelInstancesHandler) handleListMergedContacts(w http.ResponseWriter, r *http.Request) {
	locale := store.LocaleFromContext(r.Context())
	tid := store.TenantIDFromContext(r.Context())
	if tid == uuid.Nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgTenantScopeRequired)})
		return
	}

	mergedID, err := uuid.Parse(r.PathValue("tenantUserId"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgInvalidID, "tenantUserId")})
		return
	}

	contacts, err := h.contactStore.GetContactsByMergedID(r.Context(), mergedID)
	if err != nil {
		slog.Error("contacts.merged.list", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": i18n.T(locale, i18n.MsgFailedToList, "contacts")})
		return
	}
	if contacts == nil {
		contacts = []store.ChannelContact{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"contacts": contacts})
}

// handleListTenantUsers returns users for the current tenant (for merge dialog dropdown).
// GET /v1/tenant-users
func (h *ChannelInstancesHandler) handleListTenantUsers(w http.ResponseWriter, r *http.Request) {
	locale := store.LocaleFromContext(r.Context())
	tid := store.TenantIDFromContext(r.Context())
	if tid == uuid.Nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": i18n.T(locale, i18n.MsgTenantScopeRequired)})
		return
	}

	users, err := h.tenantStore.ListUsers(r.Context(), tid)
	if err != nil {
		slog.Error("tenant_users.list", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": i18n.T(locale, i18n.MsgFailedToList, "tenant users")})
		return
	}
	if users == nil {
		users = []store.TenantUserData{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": users})
}

// migrateContextFilesOnMerge moves user_context_files from old sender_ids to the new tenant_user_id.
// Best-effort: log errors but don't fail the merge.
func (h *ChannelInstancesHandler) migrateContextFilesOnMerge(ctx context.Context, contactIDs []uuid.UUID, newUserID string) {
	// Batch-fetch sender_ids from merged contacts in one query.
	oldUserIDs, err := h.contactStore.GetSenderIDsByContactIDs(ctx, contactIDs)
	if err != nil {
		slog.Warn("contacts.merge.get_sender_ids", "error", err)
		return
	}
	// Filter out the target user_id itself (no self-migration needed).
	filtered := oldUserIDs[:0]
	for _, id := range oldUserIDs {
		if id != newUserID {
			filtered = append(filtered, id)
		}
	}
	if len(filtered) == 0 {
		return
	}
	if err := h.agentStore.MigrateUserDataOnMerge(ctx, filtered, newUserID); err != nil {
		slog.Warn("contacts.merge.migrate_context_files", "error", err, "old_ids", filtered, "new_id", newUserID)
	}
}

// deriveUserIDFromContacts returns the first contact's username or sender_id as fallback user_id.
func (h *ChannelInstancesHandler) deriveUserIDFromContacts(ctx context.Context, contactIDs []uuid.UUID) string {
	if len(contactIDs) == 0 {
		return ""
	}
	c, err := h.contactStore.GetContactByID(ctx, contactIDs[0])
	if err != nil {
		return ""
	}
	if c.Username != nil && *c.Username != "" {
		return *c.Username
	}
	return c.SenderID
}
