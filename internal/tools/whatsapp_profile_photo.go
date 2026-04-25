package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

// WhatsAppProfilePhotoTool gets the profile photo URL for a WhatsApp JID.
type WhatsAppProfilePhotoTool struct {
	getter WhatsAppClientGetter
}

func NewWhatsAppProfilePhotoTool() *WhatsAppProfilePhotoTool {
	return &WhatsAppProfilePhotoTool{}
}

func (t *WhatsAppProfilePhotoTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppProfilePhotoTool) Name() string { return "whatsapp_profile_photo" }

func (t *WhatsAppProfilePhotoTool) Description() string {
	return "Get the profile photo URL for a WhatsApp user or group. Provide the JID and optionally request the HD version of the photo. Returns the photo URL if available."
}

func (t *WhatsAppProfilePhotoTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"channel": map[string]any{
				"type":        "string",
				"description": "Channel instance name (default: current channel from context)",
			},
			"jid": map[string]any{
				"type":        "string",
				"description": "User or group JID (e.g. 34612345678@s.whatsapp.net)",
			},
			"hd": map[string]any{
				"type":        "boolean",
				"description": "Request HD version of the photo (default: false)",
			},
		},
		"required": []string{"jid"},
	}
}

func (t *WhatsAppProfilePhotoTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_profile_photo: no client getter available")
	}

	channel, _ := args["channel"].(string)
	if channel == "" {
		channel = ToolChannelFromCtx(ctx)
	}

	client, authenticated, exists := t.getter(channel)
	if !exists || client == nil {
		return ErrorResult("whatsapp_profile_photo: channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_profile_photo: WhatsApp not authenticated (scan QR code first)")
	}

	jidStr, _ := args["jid"].(string)
	if jidStr == "" {
		return ErrorResult("whatsapp_profile_photo: 'jid' is required")
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_profile_photo: invalid JID %q: %v", jidStr, err))
	}

	hd := false
	if h, ok := args["hd"].(bool); ok {
		hd = h
	}

	params := &whatsmeow.GetProfilePictureParams{
		Preview: !hd,
	}
	picInfo, err := client.GetProfilePictureInfo(ctx, jid, params)
	
	result := map[string]any{
		"jid":          jidStr,
		"has_photo":    false,
		"photo_url":    "",
		"hd_photo_url": "",
		"is_hd":        hd,
	}

	if err == nil && picInfo != nil && picInfo.URL != "" {
		result["has_photo"] = true
		if hd {
			result["hd_photo_url"] = picInfo.URL
		} else {
			result["photo_url"] = picInfo.URL
		}
		// If we got one, we can sometimes guess the other or just report what we have
		result["direct_url"] = picInfo.URL
	}

	data, _ := json.Marshal(result)
	return NewResult(string(data))
}
