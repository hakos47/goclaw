package tools

import (
	"context"
	"encoding/json"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

// WhatsAppTestTargetTool runs a battery of tests against a specific phone number.
type WhatsAppTestTargetTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppTestTargetTool() *WhatsAppTestTargetTool {
	return &WhatsAppTestTargetTool{}
}

func (t *WhatsAppTestTargetTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppTestTargetTool) Name() string { return "whatsapp_test_target" }

func (t *WhatsAppTestTargetTool) Description() string {
	return "Run a complete diagnostic test against a phone number."
}

func (t *WhatsAppTestTargetTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"phone": map[string]any{
				"type":        "string",
				"description": "Phone number with country code (e.g. 34612345678)",
			},
		},
		"required": []string{"phone"},
	}
}

func (t *WhatsAppTestTargetTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_test_target: no client getter available")
	}

	client, authenticated, exists := t.getter("whatsapp")
	if !exists || client == nil {
		return ErrorResult("whatsapp_test_target: WhatsApp channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_test_target: WhatsApp not authenticated")
	}

	phone, _ := args["phone"].(string)
	jid := types.NewJID(phone, types.DefaultUserServer)
	
	results := make(map[string]any)
	results["target_jid"] = jid.String()
	results["timestamp"] = time.Now().Format(time.RFC3339)

	// 1. Identity Test (GetUserInfo)
	info, err := client.GetUserInfo(ctx, []types.JID{jid})
	if err != nil {
		results["identity_test"] = "FAILED: " + err.Error()
	} else if _, ok := info[jid]; ok {
		results["identity_test"] = "SUCCESS"
		results["user_info"] = info[jid]
	} else {
		results["identity_test"] = "NOT_FOUND"
	}

	// 2. Profile Photo Test
	pic, err := client.GetProfilePictureInfo(ctx, jid, &whatsmeow.GetProfilePictureParams{Preview: true})
	if err != nil {
		results["photo_test"] = "FAILED: " + err.Error()
	} else if pic != nil {
		results["photo_test"] = "SUCCESS"
		results["photo_url"] = pic.URL
	} else {
		results["photo_test"] = "NO_PHOTO"
	}

	// 3. Status/Bio Test (already covered by GetUserInfo, but let's be explicit if needed)
	if _, ok := info[jid]; ok {
		results["bio_test"] = "SUCCESS"
		results["bio"] = info[jid].Status
	} else {
		results["bio_test"] = "NOT_FOUND"
	}

	// 4. Message Delivery Test (Dry run equivalent)
	results["delivery_check"] = "PENDING: Use whatsapp_send_message for actual delivery test"

	data, _ := json.Marshal(results)
	return NewResult(string(data))
}
