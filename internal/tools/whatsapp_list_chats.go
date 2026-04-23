package tools

import (
	"context"
	"encoding/json"
)

// WhatsAppListChatsTool lists all joined WhatsApp group chats.
type WhatsAppListChatsTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppListChatsTool() *WhatsAppListChatsTool {
	return &WhatsAppListChatsTool{}
}

func (t *WhatsAppListChatsTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppListChatsTool) Name() string { return "whatsapp_list_chats" }

func (t *WhatsAppListChatsTool) Description() string {
	return "List all WhatsApp group chats that the linked account has joined. Returns group JIDs, names, and participant counts. Use this to find groups, get invite links, or identify which groups are available before sending messages."
}

func (t *WhatsAppListChatsTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"channel": map[string]any{
				"type":        "string",
				"description": "Channel instance name (default: current channel from context)",
			},
		},
		"required": []string{},
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

	client, authenticated, exists := t.getter(channel)
	if !exists || client == nil {
		return ErrorResult("whatsapp_list_chats: channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_list_chats: WhatsApp not authenticated (scan QR code first)")
	}

	groups, err := client.GetJoinedGroups(context.Background())
	if err != nil {
		return ErrorResult("whatsapp_list_chats: failed to get groups: " + err.Error())
	}

	type chatInfo struct {
		JID               string `json:"jid"`
		Name              string `json:"name"`
		ParticipantCount int    `json:"participant_count"`
	}

	out := make([]chatInfo, 0, len(groups))
	for _, g := range groups {
		name := g.GroupName.Name
		if name == "" {
			name = g.JID.String()
		}
		out = append(out, chatInfo{
			JID:              g.JID.String(),
			Name:             name,
			ParticipantCount: g.ParticipantCount,
		})
	}

	data, _ := json.Marshal(map[string]any{
		"count":  len(out),
		"chats": out,
	})
	return NewResult(string(data))
}
