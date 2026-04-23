package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
)

// WhatsAppSendTool sends a text message to a WhatsApp JID.
type WhatsAppSendTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppSendTool() *WhatsAppSendTool {
	return &WhatsAppSendTool{}
}

func (t *WhatsAppSendTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppSendTool) Name() string { return "whatsapp_send_message" }

func (t *WhatsAppSendTool) Description() string {
	return "Send a text message to a WhatsApp user or group. Provide the recipient JID (e.g. 34612345678@s.whatsapp.net for a user, or 123456789-987654321@g.us for a group). The message will be sent immediately. Use this to send alerts, notifications, or replies."
}

func (t *WhatsAppSendTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"channel": map[string]any{
				"type":        "string",
				"description": "Channel instance name (default: current channel from context)",
			},
			"to": map[string]any{
				"type":        "string",
				"description": "Recipient JID (e.g. 34612345678@s.whatsapp.net or 123456789-987654321@g.us)",
			},
			"message": map[string]any{
				"type":        "string",
				"description": "Message text to send",
			},
		},
		"required": []string{"to", "message"},
	}
}

func (t *WhatsAppSendTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_send_message: no client getter available")
	}

	channel, _ := args["channel"].(string)
	if channel == "" {
		channel = ToolChannelFromCtx(ctx)
	}

	client, authenticated, exists := t.getter(channel)
	if !exists || client == nil {
		return ErrorResult("whatsapp_send_message: channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_send_message: WhatsApp not authenticated (scan QR code first)")
	}

	to, _ := args["to"].(string)
	if to == "" {
		return ErrorResult("whatsapp_send_message: 'to' JID is required")
	}

	message, _ := args["message"].(string)
	if message == "" {
		return ErrorResult("whatsapp_send_message: 'message' is required")
	}

	chatJID, err := types.ParseJID(to)
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_send_message: invalid JID %q: %v", to, err))
	}

	waMsg := &waE2E.Message{
		Conversation: new(message),
	}

	resp, err := client.SendMessage(context.Background(), chatJID, waMsg)
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_send_message: send failed: %v", err))
	}

	data, _ := json.Marshal(map[string]any{
		"success":    true,
		"message_id": resp.ID,
		"to":         to,
	})
	return NewResult(string(data))
}
