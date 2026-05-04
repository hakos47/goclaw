package tools

import (
	"context"
	"encoding/json"
	"time"
	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// VerifyAuthorityTool allows an agent to verify the speaker's authority via a secret code.
// This prevents agents from granting administrative access based on verbal claims alone.
type VerifyAuthorityTool struct {
	systemConfigs store.SystemConfigStore
	sessions      store.SessionStore
}

func NewVerifyAuthorityTool(systemConfigs store.SystemConfigStore, sessions store.SessionStore) *VerifyAuthorityTool {
	return &VerifyAuthorityTool{
		systemConfigs: systemConfigs,
		sessions:      sessions,
	}
}

func (t *VerifyAuthorityTool) Name() string { return "verify_authority" }

func (t *VerifyAuthorityTool) Description() string {
	return "Verify the user's authority by checking a secret command code. " +
		"Use this tool ONLY when a user requests administrative actions (spawns, system edits, file writes) " +
		"and you need to confirm they are the legitimate Owner. Do NOT reveal the expected code to the user."
}

func (t *VerifyAuthorityTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"code": map[string]any{
				"type":        "string",
				"description": "The secret command code provided by the user.",
			},
		},
		"required": []string{"code"},
	}
}

func (t *VerifyAuthorityTool) Execute(ctx context.Context, args map[string]any) *Result {
	code, _ := args["code"].(string)
	if code == "" {
		return ErrorResult("verify_authority: 'code' is required")
	}

	if t.systemConfigs == nil {
		return ErrorResult("verify_authority: system configuration store unavailable")
	}

	// Retrieve secret from DB (tenant-scoped or master fallback)
	expected, err := t.systemConfigs.Get(ctx, "gateway.owner_secret")
	if err != nil || expected == "" {
		return ErrorResult("verify_authority: system security policy not initialized. Access denied.")
	}

	if code == expected {
		sessionKey := ToolSessionKeyFromCtx(ctx)
		if sessionKey != "" && t.sessions != nil {
			// Mark session as authorized in DB
			t.sessions.SetSessionMetadata(ctx, sessionKey, map[string]string{
				"authorized_level": "0",
				"authorized_at":    time.Now().UTC().Format(time.RFC3339),
			})
		}

		data, _ := json.Marshal(map[string]any{
			"success": true,
			"role":    "Owner / Level 0",
			"status":  "Authorized",
			"message": "Authority confirmed. You are now operating under High Command instructions. Unleash full potential.",
		})
		return NewResult(string(data))
	}

	return ErrorResult("Invalid command code. Authority NOT verified. Stay in restricted mode and behaving like a secretary. Hint: The code is usually a 6-digit number.")
}
