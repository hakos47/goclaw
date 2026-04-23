package tools

import (
	"context"
	"encoding/json"
)

// WhatsAppListContactsTool lists all WhatsApp contacts.
type WhatsAppListContactsTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppListContactsTool() *WhatsAppListContactsTool {
	return &WhatsAppListContactsTool{}
}

func (t *WhatsAppListContactsTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppListContactsTool) Name() string { return "whatsapp_list_contacts" }

func (t *WhatsAppListContactsTool) Description() string {
	return "List all WhatsApp contacts stored by the linked account. Returns contact JIDs, display names, and nicknames. Use this to find a contact's JID before sending a message or adding them to a group."
}

func (t *WhatsAppListContactsTool) Parameters() map[string]any {
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

func (t *WhatsAppListContactsTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_list_contacts: no client getter available")
	}

	channel, _ := args["channel"].(string)
	if channel == "" {
		channel = ToolChannelFromCtx(ctx)
	}

	client, authenticated, exists := t.getter(channel)
	if !exists || client == nil {
		return ErrorResult("whatsapp_list_contacts: channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_list_contacts: WhatsApp not authenticated (scan QR code first)")
	}

	contactsMap, err := client.Store.Contacts.GetAllContacts(context.Background())
	if err != nil {
		return ErrorResult("whatsapp_list_contacts: failed to get contacts: " + err.Error())
	}

	type contactInfo struct {
		JID   string `json:"jid"`
		Name  string `json:"name"`
	}
	out := make([]contactInfo, 0, len(contactsMap))
	for jid, c := range contactsMap {
		name := c.FullName
		if name == "" {
			name = c.FirstName
		}
		if name == "" {
			name = jid.User
		}
		out = append(out, contactInfo{
			JID:  jid.String(),
			Name: name,
		})
	}

	data, _ := json.Marshal(map[string]any{
		"count":     len(out),
		"contacts": out,
	})
	return NewResult(string(data))
}
