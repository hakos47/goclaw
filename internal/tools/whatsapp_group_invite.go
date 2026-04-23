package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"go.mau.fi/whatsmeow/types"
)

// WhatsAppGroupInviteTool gets the invite link for a WhatsApp group.
type WhatsAppGroupInviteTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppGroupInviteTool() *WhatsAppGroupInviteTool {
	return &WhatsAppGroupInviteTool{}
}

func (t *WhatsAppGroupInviteTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppGroupInviteTool) Name() string { return "whatsapp_group_invite" }

func (t *WhatsAppGroupInviteTool) Description() string {
	return "Get the WhatsApp invite link for a group. Provide the group JID to get its invite link. The link can be shared to let others join the group. Only works for groups where the linked account is an admin."
}

func (t *WhatsAppGroupInviteTool) Parameters() map[string]any {
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
			"reset": map[string]any{
				"type":        "boolean",
				"description": "Whether to reset the invite link before returning it (default: false)",
			},
		},
		"required": []string{"group_jid"},
	}
}

func (t *WhatsAppGroupInviteTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_group_invite: no client getter available")
	}

	channel, _ := args["channel"].(string)
	if channel == "" {
		channel = ToolChannelFromCtx(ctx)
	}

	client, authenticated, exists := t.getter(channel)
	if !exists || client == nil {
		return ErrorResult("whatsapp_group_invite: channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_group_invite: WhatsApp not authenticated (scan QR code first)")
	}

	groupJIDStr, _ := args["group_jid"].(string)
	if groupJIDStr == "" {
		return ErrorResult("whatsapp_group_invite: 'group_jid' is required")
	}

	groupJID, err := types.ParseJID(groupJIDStr)
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_group_invite: invalid group JID %q: %v", groupJIDStr, err))
	}

	reset := false
	if r, ok := args["reset"].(bool); ok {
		reset = r
	}

	inviteLink, err := client.GetGroupInviteLink(ctx, groupJID, reset)
	if err != nil {
		return ErrorResult("whatsapp_group_invite: failed to get invite link: " + err.Error())
	}

	data, _ := json.Marshal(map[string]any{
		"success":    true,
		"group_jid":  groupJIDStr,
		"invite_link": inviteLink,
	})
	return NewResult(string(data))
}
