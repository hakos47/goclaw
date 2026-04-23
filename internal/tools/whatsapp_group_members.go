package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"go.mau.fi/whatsmeow/types"
)

// WhatsAppGroupMembersTool lists members of a WhatsApp group.
type WhatsAppGroupMembersTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppGroupMembersTool() *WhatsAppGroupMembersTool {
	return &WhatsAppGroupMembersTool{}
}

func (t *WhatsAppGroupMembersTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppGroupMembersTool) Name() string { return "whatsapp_group_members" }

func (t *WhatsAppGroupMembersTool) Description() string {
	return "List all members of a WhatsApp group. Provide the group JID to get the list of all participants with their display names and JIDs. Use this to find members before sending direct messages or managing group membership."
}

func (t *WhatsAppGroupMembersTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"channel": map[string]any{
				"type":        "string",
				"description": "Channel instance name (default: current channel from context)",
			},
			"group_jid": map[string]any{
				"type":        "string",
				"description": "Group JID (e.g. 123456789-987654321@g.us)",
			},
		},
		"required": []string{"group_jid"},
	}
}

func (t *WhatsAppGroupMembersTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_group_members: no client getter available")
	}

	channel, _ := args["channel"].(string)
	if channel == "" {
		channel = ToolChannelFromCtx(ctx)
	}

	client, authenticated, exists := t.getter(channel)
	if !exists || client == nil {
		return ErrorResult("whatsapp_group_members: channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_group_members: WhatsApp not authenticated (scan QR code first)")
	}

	groupJIDStr, _ := args["group_jid"].(string)
	if groupJIDStr == "" {
		return ErrorResult("whatsapp_group_members: 'group_jid' is required")
	}

	groupJID, err := types.ParseJID(groupJIDStr)
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_group_members: invalid group JID %q: %v", groupJIDStr, err))
	}

	info, err := client.GetGroupInfo(ctx, groupJID)
	if err != nil {
		return ErrorResult("whatsapp_group_members: failed to get group info: " + err.Error())
	}

	type memberInfo struct {
		JID   string `json:"jid"`
		Name  string `json:"name"`
		Admin bool   `json:"admin"`
	}

	members := make([]memberInfo, 0, len(info.Participants))
	for _, p := range info.Participants {
		name := p.DisplayName
		if name == "" {
			name = p.JID.String()
		}
		members = append(members, memberInfo{
			JID:   p.JID.String(),
			Name:  name,
			Admin: p.IsAdmin,
		})
	}

	data, _ := json.Marshal(map[string]any{
		"group_jid": groupJIDStr,
		"group_name": info.Name,
		"count":     len(members),
		"members":   members,
	})
	return NewResult(string(data))
}
