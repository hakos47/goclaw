package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// WhatsAppVerifyOwnerTool allows an agent to designate a phone number as the channel owner.
// It resolves the number to a JID, updates the config, and sends a handshake message.
type WhatsAppVerifyOwnerTool struct {
	getter        WhatsAppClientGetter
	instanceStore store.ChannelInstanceStore
}

func NewWhatsAppVerifyOwnerTool(instanceStore store.ChannelInstanceStore) *WhatsAppVerifyOwnerTool {
	return &WhatsAppVerifyOwnerTool{instanceStore: instanceStore}
}

func (t *WhatsAppVerifyOwnerTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

func (t *WhatsAppVerifyOwnerTool) Name() string { return "whatsapp_verify_owner" }

func (t *WhatsAppVerifyOwnerTool) Description() string {
	return "Designate a phone number as the owner of the WhatsApp channel. Provide the phone number (e.g. '34603440920'). The tool will resolve the identity, update the configuration to grant full privileges, and send a verification message to the user. Use this when the user says 'my number is X' or 'I am the owner'."
}

func (t *WhatsAppVerifyOwnerTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"channel": map[string]any{
				"type":        "string",
				"description": "Channel instance name (default: current channel from context)",
			},
			"phone": map[string]any{
				"type":        "string",
				"description": "Phone number of the owner (digits only, or with + prefix)",
			},
			"user_id": map[string]any{
				"type":        "string",
				"description": "GoClaw UserID to map to (default: system)",
			},
		},
		"required": []string{"phone"},
	}
}

func (t *WhatsAppVerifyOwnerTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_verify_owner: no client getter available")
	}

	channel := ToolChannelFromCtx(ctx)
	if name, ok := args["channel"].(string); ok && name != "" {
		channel = name
	}

	client, authenticated, exists := t.getter(channel)
	if !exists || client == nil {
		return ErrorResult("whatsapp_verify_owner: channel not found")
	}
	if !authenticated {
		return ErrorResult("whatsapp_verify_owner: WhatsApp not authenticated")
	}

	phone, _ := args["phone"].(string)
	if phone == "" {
		return ErrorResult("whatsapp_verify_owner: 'phone' is required")
	}

	// Basic cleanup of phone number
	phone = strings.TrimPrefix(phone, "+")
	phone = strings.ReplaceAll(phone, " ", "")

	// Resolve JID
	targetJID := types.NewJID(phone, types.DefaultUserServer)
	ownerJID := targetJID.String()
	resp, err := client.GetUserInfo(ctx, []types.JID{targetJID})
	if err == nil {
		if info, ok := resp[targetJID]; ok && !info.LID.IsEmpty() {
			// Prefer LID for stable identification
			ownerJID = info.LID.String()
			slog.Info("whatsapp_verify_owner: resolved stable identity (LID)", "phone", phone, "jid", targetJID, "lid", info.LID)
		}
	}

	// Update Instance Config if possible
	if t.instanceStore != nil {
		inst, err := t.instanceStore.GetByName(ctx, channel)
		if err == nil && inst != nil {
			var config map[string]any
			json.Unmarshal(inst.Config, &config)
			if config == nil {
				config = make(map[string]any)
			}
			
			config["owner_jid"] = ownerJID
			if userID, ok := args["user_id"].(string); ok && userID != "" {
				config["owner_user_id"] = userID
			} else if config["owner_user_id"] == nil {
				config["owner_user_id"] = "system"
			}

			configBytes, _ := json.Marshal(config)
			updates := map[string]any{
				"config": configBytes,
			}
			if err := t.instanceStore.Update(ctx, inst.ID, updates); err != nil {
				slog.Warn("whatsapp_verify_owner: failed to update db config", "error", err)
			} else {
				slog.Info("whatsapp_verify_owner: database config updated", "channel", channel, "owner", ownerJID)
			}
		}
	}

	// Send Handshake (always send to the phone JID as it's the reachable address)
	handshake := "🛡️ GoClaw: Te he designado como el Owner de este canal.\n\n" +
		"Para tu seguridad, he vinculado tu Identidad Estable (ID: " + ownerJID + "). " +
		"Desde ahora tienes acceso total, sin filtros y con privilegios de Administrador.\n\n" +
		"¿Confirmas la vinculación? Responde 'CONFIRMAR' para activar."
	waMsg := &waE2E.Message{
		Conversation: &handshake,
	}

	_, err = client.SendMessage(ctx, targetJID, waMsg)
	if err != nil {
		return ErrorResult(fmt.Sprintf("whatsapp_verify_owner: failed to send handshake: %v", err))
	}

	data, _ := json.Marshal(map[string]any{
		"success":   true,
		"owner_jid": ownerJID,
		"message":   "Verification message sent. Identity will be fully active after owner confirmation.",
	})
	return NewResult(string(data))
}
