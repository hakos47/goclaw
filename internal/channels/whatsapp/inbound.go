package whatsapp

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"github.com/nextlevelbuilder/goclaw/internal/bus"
	"github.com/nextlevelbuilder/goclaw/internal/channels"
	"github.com/nextlevelbuilder/goclaw/internal/channels/media"
	"github.com/nextlevelbuilder/goclaw/internal/store"
)

const emptyMessageSentinel = "[empty message]"

// handleIncomingMessage processes an incoming WhatsApp message.
func (c *Channel) handleIncomingMessage(evt *events.Message) {
	ctx := context.Background()
	ctx = store.WithTenantID(ctx, c.TenantID())

	if evt.Info.IsFromMe {
		return
	}

	senderJID := evt.Info.Sender
	chatJID := evt.Info.Chat

	// WhatsApp uses dual identity: phone JID (@s.whatsapp.net) and LID (@lid).
	// Groups may use LID addressing. Normalize to phone JID for consistent
	// policy checks, pairing lookups, allowlists, and contact collection.
	if evt.Info.AddressingMode == types.AddressingModeLID && !evt.Info.SenderAlt.IsEmpty() {
		senderJID = evt.Info.SenderAlt
	}

	senderID := senderJID.String()
	chatID := chatJID.String()

	peerKind := "direct"
	if chatJID.Server == "g.us" {
		peerKind = "group"
	}

	// Owner Bypass: if sender is the designated owner, skip all policy checks and force identity.
	isOwner := c.OwnerJID() != "" && (senderID == c.OwnerJID() || strings.HasPrefix(senderID, strings.Split(c.OwnerJID(), "@")[0]))
	forceUserID := ""
	if isOwner {
		forceUserID = c.OwnerUserID()
		slog.Debug("whatsapp inbound: owner bypass applied", "sender_id", senderID, "as_user", forceUserID)
	}

	slog.Debug("whatsapp inbound", "sender_id", senderID, "chat_id", chatID, "peer_kind", peerKind,
		"addressing", evt.Info.AddressingMode, "policy", c.config.GroupPolicy, "is_owner", isOwner)

	// DM/Group policy check (skipped for owner).
	if !isOwner {
		if peerKind == "direct" {
			if !c.checkDMPolicy(ctx, senderID, chatID) {
				return
			}
		} else {
			if !c.checkGroupPolicy(ctx, senderID, chatID) {
				slog.Info("whatsapp group message rejected by policy", "sender_id", senderID, "chat_id", chatID, "policy", c.config.GroupPolicy)
				return
			}
		}

		if !c.IsAllowed(senderID) {
			slog.Info("whatsapp message rejected by allowlist", "sender_id", senderID)
			return
		}
	}

	content := extractTextContent(evt.Message)

	// Handshake Confirmation Logic
	if isOwner && strings.ToUpper(strings.TrimSpace(content)) == "CONFIRMAR" {
		slog.Info("whatsapp inbound: owner confirmed linkage", "sender_id", senderID)
		response := "✅ Vinculación confirmada. Tus privilegios de Administrador (UserID: " + forceUserID + ") están ahora activos en este canal. Hablamos sin filtros."
		waMsg := &waE2E.Message{
			Conversation: &response,
		}
		c.client.SendMessage(ctx, chatJID, waMsg)
		// Handshake fully consumed by system — do not propagate to agents
		return
	}

	var mediaList []media.MediaInfo
	mediaList = c.downloadMedia(evt)

	if content == "" && len(mediaList) == 0 {
		return
	}
	if content == "" {
		content = emptyMessageSentinel
	}

	// Group history + mention detection.
	historyLimit := c.config.HistoryLimit
	if historyLimit == 0 {
		historyLimit = channels.DefaultGroupHistoryLimit
	}
	if peerKind == "group" && c.config.RequireMention != nil && *c.config.RequireMention {
		if !c.isMentioned(evt) {
			// Not mentioned — record for context and skip.
			senderLabel := evt.Info.PushName
			if senderLabel == "" {
				senderLabel = senderID
			}
			c.GroupHistory().Record(chatID, channels.HistoryEntry{
				Sender:    senderLabel,
				SenderID:  senderID,
				Body:      content,
				Timestamp: evt.Info.Timestamp,
				MessageID: string(evt.Info.ID),
			}, historyLimit)
			return
		}
		// Mentioned — prepend accumulated group context.
		content = c.GroupHistory().BuildContext(chatID, content, historyLimit)
		c.GroupHistory().Clear(chatID)
	}

	metadata := map[string]string{
		"message_id": string(evt.Info.ID),
	}
	if evt.Info.PushName != "" {
		metadata["user_name"] = evt.Info.PushName
	}

	// STT: transcribe audio items (opt-in via builtin_tools[stt].settings.whatsapp_enabled,
	// default false per Decision 6 — enabling breaks E2E encryption for voice messages).
	waSttSettings := c.loadSTTSettings(ctx)
	locale := "" // i18n.T falls back to English when locale is empty
	for i := range mediaList {
		m := &mediaList[i]
		if m.Type == media.TypeAudio || m.Type == media.TypeVoice {
			mimeType := m.ContentType
			if mimeType == "" {
				mimeType = "audio/ogg"
			}
			m.Transcript = c.transcribeVoice(ctx, m.FilePath, mimeType, locale, waSttSettings)
		}
	}

	// Build media tags and bus.MediaFile list.
	var mediaFiles []bus.MediaFile
	if len(mediaList) > 0 {
		mediaTags := media.BuildMediaTags(mediaList)
		if mediaTags != "" {
			if content != emptyMessageSentinel {
				content = mediaTags + "\n\n" + content
			} else {
				content = mediaTags
			}
		}
		for _, m := range mediaList {
			if m.FilePath != "" {
				mediaFiles = append(mediaFiles, bus.MediaFile{
					Path: m.FilePath, MimeType: m.ContentType, Filename: m.FileName,
				})
			}
		}
	}

	// Annotate with sender identity.
	if senderName := metadata["user_name"]; senderName != "" {
		content = fmt.Sprintf("[From: %s]\n%s", senderName, content)
	}

	// Collect contacts.
	if cc := c.ContactCollector(); cc != nil {
		// 1. Sender (always an individual user)
		cc.EnsureContact(ctx, c.Type(), c.Name(), senderID, senderID,
			metadata["user_name"], "", "direct", "user", "", "")

		// 2. Group (if this is a group message)
		if peerKind == "group" {
			// Try to get group name from whatsmeow store if we don't have a specific title here.
			groupName := ""
			if info, err := c.client.Store.Contacts.GetContact(ctx, chatJID); err == nil {
				groupName = info.FullName
				if groupName == "" {
					groupName = info.PushName
				}
			}
			cc.EnsureContact(ctx, c.Type(), c.Name(), chatID, "",
				groupName, "", "group", "group", "", "")
		}
	}

	// Typing indicator.
	if prevCancel, ok := c.typingCancel.LoadAndDelete(chatID); ok {
		if fn, ok := prevCancel.(context.CancelFunc); ok {
			fn()
		}
	}
	typingCtx, typingCancel := context.WithCancel(context.Background())
	c.typingCancel.Store(chatID, typingCancel)
	go c.keepTyping(typingCtx, chatJID)

	// Derive userID from senderID.
	userID := senderID
	if idx := strings.IndexByte(senderID, '@'); idx > 0 {
		userID = senderID[:idx]
	}
	if forceUserID != "" {
		userID = forceUserID
	}

	c.Bus().PublishInbound(bus.InboundMessage{
		Channel:  c.Name(),
		SenderID: senderID,
		ChatID:   chatID,
		Content:  content,
		Media:    mediaFiles,
		PeerKind: peerKind,
		UserID:   userID,
		AgentID:  c.AgentID(),
		TenantID: c.TenantID(),
		Metadata: metadata,
	})

	// Schedule temp media file cleanup after agent pipeline has had time to process.
	var tmpPaths []string
	for _, mf := range mediaFiles {
		tmpPaths = append(tmpPaths, mf.Path)
	}
	scheduleMediaCleanup(tmpPaths, 5*time.Minute)
}

// extractTextContent extracts text from any WhatsApp message variant.
// Includes quoted message context when present (reply-to messages).
func extractTextContent(msg *waE2E.Message) string {
	if msg == nil {
		return ""
	}

	var text string
	var quotedText string

	if msg.GetConversation() != "" {
		text = msg.GetConversation()
	} else if ext := msg.GetExtendedTextMessage(); ext != nil {
		text = ext.GetText()
		// Extract quoted (replied-to) message text.
		if ci := ext.GetContextInfo(); ci != nil {
			if qm := ci.GetQuotedMessage(); qm != nil {
				quotedText = extractQuotedText(qm)
			}
		}
	} else if img := msg.GetImageMessage(); img != nil {
		text = img.GetCaption()
	} else if vid := msg.GetVideoMessage(); vid != nil {
		text = vid.GetCaption()
	} else if doc := msg.GetDocumentMessage(); doc != nil {
		text = doc.GetCaption()
	}

	if quotedText != "" && text != "" {
		return fmt.Sprintf("[Replying to: %s]\n%s", quotedText, text)
	}
	if quotedText != "" {
		return fmt.Sprintf("[Replying to: %s]", quotedText)
	}
	return text
}

// extractQuotedText extracts plain text from a quoted message (no recursion).
func extractQuotedText(msg *waE2E.Message) string {
	if msg == nil {
		return ""
	}
	if msg.GetConversation() != "" {
		return msg.GetConversation()
	}
	if ext := msg.GetExtendedTextMessage(); ext != nil {
		return ext.GetText()
	}
	if img := msg.GetImageMessage(); img != nil && img.GetCaption() != "" {
		return img.GetCaption()
	}
	if vid := msg.GetVideoMessage(); vid != nil && vid.GetCaption() != "" {
		return vid.GetCaption()
	}
	return ""
}

// isMentioned checks if the linked account is @mentioned in a group message.
// WhatsApp uses dual identity: phone JID and LID. Mentions may use either format.
func (c *Channel) isMentioned(evt *events.Message) bool {
	c.lastQRMu.RLock()
	myJID := c.myJID
	myLID := c.myLID
	c.lastQRMu.RUnlock()

	if myJID.IsEmpty() && myLID.IsEmpty() {
		return false // fail closed: unknown identity = not mentioned
	}

	// Check mentioned JIDs from extended text.
	if ext := evt.Message.GetExtendedTextMessage(); ext != nil {
		if ci := ext.GetContextInfo(); ci != nil {
			for _, jidStr := range ci.GetMentionedJID() {
				mentioned, _ := types.ParseJID(jidStr)
				if !myJID.IsEmpty() && mentioned.User == myJID.User {
					return true
				}
				if !myLID.IsEmpty() && mentioned.User == myLID.User {
					return true
				}
			}
		}
	}
	return false
}
