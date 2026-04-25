package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"go.mau.fi/whatsmeow/types"
)

// WhatsAppGetStatusTool retrieves the bio/status for a JID.
type WhatsAppGetStatusTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppGetStatusTool() *WhatsAppGetStatusTool {
	return &WhatsAppGetStatusTool{}
}

func (t *WhatsAppGetStatusTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppGetStatusTool) Name() string { return "whatsapp_get_status" }

func (t *WhatsAppGetStatusTool) Description() string {
	return "Get the current bio/status text of a WhatsApp user JID."
}

func (t *WhatsAppGetStatusTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"jid": map[string]any{
				"type":        "string",
				"description": "User JID (e.g. 34612345678@s.whatsapp.net)",
			},
		},
		"required": []string{"jid"},
	}
}

func (t *WhatsAppGetStatusTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_get_status: no client getter available")
	}

	client, authenticated, exists := t.getter("whatsapp")
	if !exists || client == nil {
		return ErrorResult("whatsapp_get_status: WhatsApp channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_get_status: WhatsApp not authenticated")
	}

	jidStr, _ := args["jid"].(string)
	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_get_status: invalid JID: %v", err))
	}

	resp, err := client.GetUserInfo(ctx, []types.JID{jid})
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_get_status: failed: %v", err))
	}

	info, ok := resp[jid]
	if !ok {
		return ErrorResult("whatsapp_get_status: no info found for JID")
	}

	data, _ := json.Marshal(map[string]any{
		"jid":    jidStr,
		"status": info.Status,
	})
	return NewResult(string(data))
}
