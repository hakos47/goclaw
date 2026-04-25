package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"go.mau.fi/whatsmeow/types"
)

// WhatsAppGetProfileTool retrieves comprehensive profile info for a JID.
type WhatsAppGetProfileTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppGetProfileTool() *WhatsAppGetProfileTool {
	return &WhatsAppGetProfileTool{}
}

func (t *WhatsAppGetProfileTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppGetProfileTool) Name() string { return "whatsapp_get_profile" }

func (t *WhatsAppGetProfileTool) Description() string {
	return "Get comprehensive profile information for a WhatsApp JID, including push name and phone number."
}

func (t *WhatsAppGetProfileTool) Parameters() map[string]any {
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

func (t *WhatsAppGetProfileTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_get_profile: no client getter available")
	}

	client, authenticated, exists := t.getter("whatsapp")
	if !exists || client == nil {
		return ErrorResult("whatsapp_get_profile: WhatsApp channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_get_profile: WhatsApp not authenticated")
	}

	jidStr, _ := args["jid"].(string)
	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_get_profile: invalid JID: %v", err))
	}

	// Try to get cached contact info from store
	contact, _ := client.Store.Contacts.GetContact(ctx, jid)
	
	// Fetch fresh info from WhatsApp servers
	resp, err := client.GetUserInfo(ctx, []types.JID{jid})
	var serverInfo any
	if err == nil && len(resp) > 0 {
		serverInfo = resp[jid]
	}

	data, _ := json.Marshal(map[string]any{
		"jid":           jidStr,
		"push_name":     contact.PushName,
		"full_name":     contact.FullName,
		"business_name": contact.BusinessName,
		"phone":         jid.User,
		"server_info":   serverInfo,
	})
	return NewResult(string(data))
}
