package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/nextlevelbuilder/goclaw/internal/store"
	"go.mau.fi/whatsmeow/types"
)

// WhatsAppReadMessagesTool retrieves the message history for a WhatsApp JID.
type WhatsAppReadMessagesTool struct {
	getter   WhatsAppClientGetter
	sessions func() store.SessionStore
}

func NewWhatsAppReadMessagesTool() *WhatsAppReadMessagesTool {
	return &WhatsAppReadMessagesTool{}
}

func (t *WhatsAppReadMessagesTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }
func (t *WhatsAppReadMessagesTool) SetSessionStore(fn func() store.SessionStore) { t.sessions = fn }

func (t *WhatsAppReadMessagesTool) Name() string { return "whatsapp_read_messages" }

func (t *WhatsAppReadMessagesTool) Description() string {
	return "Read the recent message history of a WhatsApp conversation. Automatically handles Phone vs LID identity mapping."
}

func (t *WhatsAppReadMessagesTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"jid": map[string]any{
				"type":        "string",
				"description": "The WhatsApp JID (phone-based @s.whatsapp.net or LID @lid or Group @g.us).",
			},
			"limit": map[string]any{
				"type":        "integer",
				"description": "Max messages to retrieve (default 15).",
			},
		},
		"required": []string{"jid"},
	}
}

func (t *WhatsAppReadMessagesTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.sessions == nil || t.getter == nil {
		return ErrorResult("whatsapp_read_messages: required stores not available")
	}

	jidStr, _ := args["jid"].(string)
	if jidStr == "" {
		return ErrorResult("whatsapp_read_messages: jid is required")
	}

	limit := 15
	if v, ok := args["limit"].(float64); ok && int(v) > 0 {
		limit = int(v)
	}

	agentKey := ToolAgentKeyFromCtx(ctx)
	if agentKey == "" {
		return ErrorResult("whatsapp_read_messages: agent context required")
	}

	client, authenticated, exists := t.getter("whatsapp")
	if !exists || client == nil || !authenticated {
		return ErrorResult("whatsapp_read_messages: WhatsApp channel not active/authenticated")
	}

	// 1. Resolve Identities (Phone JID <-> LID)
	targetJID, err := types.ParseJID(jidStr)
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_read_messages: invalid JID: %v", err))
	}

	jidsToTry := []string{targetJID.String()}
	
	// If it's a phone JID, try to find the LID
	if targetJID.Server == types.DefaultUserServer {
		resp, err := client.GetUserInfo(ctx, []types.JID{targetJID})
		if err == nil {
			if info, ok := resp[targetJID]; ok && !info.LID.IsEmpty() {
				jidsToTry = append(jidsToTry, info.LID.String())
			}
		} else {
			slog.Warn("whatsapp_read_messages: identity resolution failed", "jid", targetJID, "error", err)
		}
	}

	s := t.sessions()
	slog.Info("whatsapp_read_messages: probing", "agent", agentKey, "jids", jidsToTry)
	type msgEntry struct {
		Role      string    `json:"role"`
		Content   string    `json:"content"`
		CreatedAt time.Time `json:"created_at,omitempty"`
	}
	var allEntries []msgEntry

	for _, id := range jidsToTry {
		kind := "direct"
		if strings.Contains(id, "@g.us") {
			kind = "group"
		}
		sessionKey := fmt.Sprintf("agent:%s:whatsapp:%s:%s", agentKey, kind, id)
		
		history := s.GetHistory(ctx, sessionKey)
		if history == nil {
			continue
		}

		for _, m := range history {
			if m.Role == "tool" {
				continue
			}
			if m.Role == "assistant" && len(m.ToolCalls) > 0 && strings.TrimSpace(m.Content) == "" {
				continue
			}
			content := m.Content
			if utf8.RuneCountInString(content) > 2000 {
				content = string([]rune(content)[:2000]) + "..."
			}
			createdAt := time.Now()
			if m.CreatedAt != nil {
				createdAt = *m.CreatedAt
			}
			allEntries = append(allEntries, msgEntry{
				Role:      m.Role,
				Content:   content,
				CreatedAt: createdAt,
			})
		}
	}

	if len(allEntries) == 0 {
		return NewResult(fmt.Sprintf("No interaction history found for JID %s.", jidStr))
	}

	// Sort by creation time if available
	sort.Slice(allEntries, func(i, j int) bool {
		return allEntries[i].CreatedAt.Before(allEntries[j].CreatedAt)
	})

	// Keep last N
	if len(allEntries) > limit {
		allEntries = allEntries[len(allEntries)-limit:]
	}

	data, _ := json.Marshal(map[string]any{
		"jid":      jidStr,
		"messages": allEntries,
		"count":    len(allEntries),
	})
	return NewResult(string(data))
}
