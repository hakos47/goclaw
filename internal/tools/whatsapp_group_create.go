package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

// WhatsAppGroupCreateTool creates a new WhatsApp group.
type WhatsAppGroupCreateTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppGroupCreateTool() *WhatsAppGroupCreateTool {
	return &WhatsAppGroupCreateTool{}
}

func (t *WhatsAppGroupCreateTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppGroupCreateTool) Name() string { return "whatsapp_group_create" }

func (t *WhatsAppGroupCreateTool) Description() string {
	return "Create a new WhatsApp group chat. Provide a group name (max 25 characters) and list of participant JIDs to add initially. Returns the new group JID. The linked WhatsApp account becomes the group admin."
}

func (t *WhatsAppGroupCreateTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"channel": map[string]any{
				"type":        "string",
				"description": "Channel instance name (default: current channel from context)",
			},
			"name": map[string]any{
				"type":        "string",
				"description": "Group name (max 25 characters)",
			},
			"participants": map[string]any{
				"type":        "array",
				"items": map[string]any{"type": "string"},
				"description": "List of participant JIDs to add initially",
			},
		},
		"required": []string{"name", "participants"},
	}
}

func (t *WhatsAppGroupCreateTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_group_create: no client getter available")
	}

	channel, _ := args["channel"].(string)
	if channel == "" {
		channel = ToolChannelFromCtx(ctx)
	}

	client, authenticated, exists := t.getter(channel)
	if !exists || client == nil {
		return ErrorResult("whatsapp_group_create: channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_group_create: WhatsApp not authenticated (scan QR code first)")
	}

	name, _ := args["name"].(string)
	if name == "" {
		return ErrorResult("whatsapp_group_create: 'name' is required")
	}

	participantsRaw, ok := args["participants"].([]any)
	if !ok || len(participantsRaw) == 0 {
		return ErrorResult("whatsapp_group_create: at least one participant is required")
	}

	var participants []types.JID
	for _, p := range participantsRaw {
		pStr, ok := p.(string)
		if !ok {
			continue
		}
		jid, err := types.ParseJID(pStr)
		if err != nil {
			return ErrorResult(fmt.Sprintf("whatsapp_group_create: invalid participant JID %q: %v", pStr, err))
		}
		participants = append(participants, jid)
	}

	if len(participants) == 0 {
		return ErrorResult("whatsapp_group_create: at least one valid participant JID is required")
	}

	groupInfo, err := client.CreateGroup(context.Background(), whatsmeow.ReqCreateGroup{
		Name:        name,
		Participants: participants,
	})
	if err != nil {
		return ErrorResult("whatsapp_group_create: failed to create group: " + err.Error())
	}

	data, _ := json.Marshal(map[string]any{
		"success":      true,
		"group_jid":    groupInfo.JID.String(),
		"group_name":   name,
		"participant_count": len(participants),
	})
	return NewResult(string(data))
}
