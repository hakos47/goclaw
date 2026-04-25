package tools

import (
	"context"
	"encoding/json"
	"sort"
	"strings"
	"time"

	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// WhatsAppListChatsTool lists WhatsApp conversations.
type WhatsAppListChatsTool struct {
	getter   WhatsAppClientGetter
	contacts func() store.ContactStore
	sessions func() store.SessionStore
}

func NewWhatsAppListChatsTool() *WhatsAppListChatsTool {
	return &WhatsAppListChatsTool{}
}

func (t *WhatsAppListChatsTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }
func (t *WhatsAppListChatsTool) SetContactStoreGetter(fn func() store.ContactStore)  { t.contacts = fn }
func (t *WhatsAppListChatsTool) SetSessionStore(fn func() store.SessionStore)       { t.sessions = fn }

func (t *WhatsAppListChatsTool) Name() string { return "whatsapp_list_chats" }

func (t *WhatsAppListChatsTool) Description() string {
	return "List WhatsApp conversations. Use parameter type='all' (default), 'group', or 'direct'. Returns JIDs, names, and timestamps. Conversations are sorted by most recent activity."
}

func (t *WhatsAppListChatsTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"channel": map[string]any{
				"type":        "string",
				"description": "Channel instance name",
			},
			"type": map[string]any{
				"type":        "string",
				"description": "Filter: 'group', 'direct', or 'all'",
				"enum":        []string{"group", "direct", "all"},
			},
		},
	}
}

func (t *WhatsAppListChatsTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_list_chats: no client getter available")
	}

	channel, _ := args["channel"].(string)
	if channel == "" {
		channel = ToolChannelFromCtx(ctx)
	}

	filterType, _ := args["type"].(string)
	if filterType == "" {
		filterType = "all"
	}

	client, authenticated, exists := t.getter(channel)
	if !exists || client == nil {
		return ErrorResult("whatsapp_list_chats: channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_list_chats: WhatsApp not authenticated")
	}

	type chatInfo struct {
		JID               string    `json:"jid"`
		Name              string    `json:"name"`
		Type              string    `json:"type"`
		Timestamp         time.Time `json:"timestamp,omitempty"`
		ParticipantCount int       `json:"participant_count,omitempty"`
		Source            string    `json:"source,omitempty"`
	}
	seen := make(map[string]bool)
	var out []chatInfo

	// 1. Get Active Sessions (True active conversations in GoClaw)
	if t.sessions != nil {
		s := t.sessions()
		if s != nil {
			agentID := store.AgentKeyFromContext(ctx)
			tenantID := store.TenantIDFromContext(ctx)
			res := s.ListPaged(ctx, store.SessionListOpts{
				AgentID:  agentID,
				Channel:  "whatsapp",
				TenantID: tenantID,
				Limit:    100,
			})
			for _, si := range res.Sessions {
				// Parse JID from session key: agent:<id>:whatsapp:<kind>:<jid>
				parts := strings.Split(si.Key, ":")
				if len(parts) >= 5 {
					jid := parts[4]
					if !seen[jid] {
						name := si.Label
						if name == "" {
							name = jid
						}
						out = append(out, chatInfo{
							JID:       jid,
							Name:      name,
							Type:      parts[3],
							Timestamp: si.Updated,
							Source:    "session",
						})
						seen[jid] = true
					}
				}
			}
		}
	}

	// 2. Get Interaction History (Contacts we've seen)
	if filterType == "all" || filterType == "direct" || filterType == "group" {
		if t.contacts != nil {
			s := t.contacts()
			if s != nil {
				peerKind := filterType
				if filterType == "all" {
					peerKind = ""
				}
				contacts, _ := s.ListContacts(ctx, store.ContactListOpts{
					ChannelType: "whatsapp",
					PeerKind:    peerKind,
					Limit:       100,
				})
				for _, c := range contacts {
					if !seen[c.SenderID] {
						name := ""
						if c.DisplayName != nil {
							name = *c.DisplayName
						}
						if name == "" && c.Username != nil {
							name = *c.Username
						}
						if name == "" {
							name = c.SenderID
						}
						peerKind := ""
						if c.PeerKind != nil {
							peerKind = *c.PeerKind
						}
						out = append(out, chatInfo{
							JID:       c.SenderID,
							Name:      name,
							Type:      peerKind,
							Timestamp: c.LastSeenAt,
							Source:    "interaction",
						})
						seen[c.SenderID] = true
					}
				}
			}
		}
	}

	// 3. Groups from Session (ensure joined groups are visible)
	if filterType == "all" || filterType == "group" {
		groups, _ := client.GetJoinedGroups(ctx)
		for _, g := range groups {
			if !seen[g.JID.String()] {
				name := g.GroupName.Name
				if name == "" {
					name = g.JID.String()
				}
				out = append(out, chatInfo{
					JID:              g.JID.String(),
					Name:             name,
					Type:             "group",
					ParticipantCount: g.ParticipantCount,
					Source:           "active_connection",
				})
				seen[g.JID.String()] = true
			}
		}
	}

	// Final Sort (by timestamp DESC)
	sort.Slice(out, func(i, j int) bool {
		if !out[i].Timestamp.IsZero() && !out[j].Timestamp.IsZero() {
			return out[i].Timestamp.After(out[j].Timestamp)
		}
		if !out[i].Timestamp.IsZero() {
			return true
		}
		if !out[j].Timestamp.IsZero() {
			return false
		}
		return out[i].Name < out[j].Name
	})

	// Limit to 50 results
	if len(out) > 50 {
		out = out[:50]
	}

	data, _ := json.Marshal(map[string]any{
		"count": len(out),
		"chats": out,
		"note":  "Showing active conversations with interaction history.",
	})
	return NewResult(string(data))
}
