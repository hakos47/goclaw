package tools

import (
	"context"
	"encoding/json"
	"sort"
	"strings"

	"github.com/nextlevelbuilder/goclaw/internal/store"
	"go.mau.fi/whatsmeow"
)

// ContactStoreGetterFunc is the function signature for contact store injection.
type ContactStoreGetterFunc func() store.ContactStore

// WhatsAppFindContactTool searches for a WhatsApp contact by name across both
// GoClaw's contact store (channels.contacts table) and WhatsApp's local contact list,
// returning the best matching JID for use with whatsapp_send_message.
type WhatsAppFindContactTool struct {
	getter   WhatsAppClientGetter
	contacts func() store.ContactStore
}

func NewWhatsAppFindContactTool() *WhatsAppFindContactTool {
	return &WhatsAppFindContactTool{}
}

// SetWhatsAppClientGetter wires the WhatsApp client getter.
func (t *WhatsAppFindContactTool) SetWhatsAppClientGetter(getter WhatsAppClientGetter) { t.getter = getter }

// SetContactStoreGetter wires the GoClaw contact store getter.
func (t *WhatsAppFindContactTool) SetContactStoreGetter(fn ContactStoreGetterFunc) { t.contacts = fn }

func (t *WhatsAppFindContactTool) Name() string { return "whatsapp_find_contact" }

func (t *WhatsAppFindContactTool) Description() string {
	return "Find a WhatsApp contact by name or partial name. Searches GoClaw's contact database first, then falls back to the WhatsApp local contact list. Returns the contact's JID and display name — use the JID with whatsapp_send_message to send a message."
}

func (t *WhatsAppFindContactTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"name": map[string]any{
				"type":        "string",
				"description": "Name or partial name to search for (case-insensitive).",
			},
			"channel": map[string]any{
				"type":        "string",
				"description": "Channel instance name (default: current channel from context)",
			},
		},
		"required": []string{"name"},
	}
}

// Execute searches both GoClaw contacts and WhatsApp local contacts for a match.
func (t *WhatsAppFindContactTool) Execute(ctx context.Context, args map[string]any) *Result {
	if t.getter == nil {
		return ErrorResult("whatsapp_find_contact: no client getter available")
	}

	name := ""
	if v, ok := args["name"].(string); ok {
		name = v
	}
	if name == "" {
		return ErrorResult("whatsapp_find_contact: name is required")
	}

	channel := ""
	if v, ok := args["channel"].(string); ok {
		channel = v
	}
	if channel == "" {
		channel = ToolChannelFromCtx(ctx)
	}

	var gocloudContacts []contactMatch
	if t.contacts != nil {
		gocloudContacts = t.searchGocloudContacts(ctx, name, channel)
	}

	var waContacts []contactMatch
	if t.getter != nil {
		if client, authenticated, exists := t.getter(channel); exists && authenticated && client != nil {
			waContacts = t.searchWhatsAppContacts(client, name)
		}
	}

	// Merge and deduplicate by JID, preferring GoClaw results (they have display_name)
	combined := append(gocloudContacts, waContacts...)
	sort.Slice(combined, func(i, j int) bool {
		if combined[i].Score != combined[j].Score {
			return combined[i].Score > combined[j].Score
		}
		return combined[i].Name < combined[j].Name
	})

	type resultContact struct {
		JID    string `json:"jid"`
		Name   string `json:"name"`
		Score  int    `json:"score"`
		Source string `json:"source"` // "goclaw" or "whatsapp"
	}
	out := make([]resultContact, 0, len(combined))
	seen := make(map[string]bool)
	for _, c := range combined {
		if seen[c.JID] {
			continue
		}
		seen[c.JID] = true
		src := "goclaw"
		if c.InWhatsApp {
			src = "whatsapp"
		}
		out = append(out, resultContact{
			JID:    c.JID,
			Name:   c.Name,
			Score:  c.Score,
			Source: src,
		})
	}

	data, _ := json.Marshal(map[string]any{
		"query":    name,
		"count":   len(out),
		"contacts": out,
	})
	return NewResult(string(data))
}

type contactMatch struct {
	JID         string
	Name        string
	Score       int  // higher = better match
	InWhatsApp  bool // came from WhatsApp local store
}

// searchGocloudContacts searches the GoClaw contact store for WhatsApp contacts matching name.
func (t *WhatsAppFindContactTool) searchGocloudContacts(ctx context.Context, name, channel string) []contactMatch {
	cs := t.contacts()
	if cs == nil {
		return nil
	}

	searchLower := strings.ToLower(name)
	contacts, err := cs.ListContacts(ctx, store.ContactListOpts{
		Search:      name,
		ChannelType: "whatsapp",
		Limit:       20,
	})
	if err != nil {
		return nil
	}

	var matches []contactMatch
	for _, c := range contacts {
		displayName := ""
		if c.DisplayName != nil {
			displayName = *c.DisplayName
		}
		if displayName == "" && c.Username != nil {
			displayName = *c.Username
		}
		if displayName == "" {
			displayName = c.SenderID
		}
		lower := strings.ToLower(displayName)
		score := scoreMatch(searchLower, lower)
		if score > 0 {
			matches = append(matches, contactMatch{
				JID:   c.SenderID,
				Name:  displayName,
				Score: score,
			})
		}
	}
	return matches
}

// searchWhatsAppContacts searches the WhatsApp local contact store for name.
func (t *WhatsAppFindContactTool) searchWhatsAppContacts(client *whatsmeow.Client, name string) []contactMatch {
	contactsMap, err := client.Store.Contacts.GetAllContacts(context.Background())
	if err != nil {
		return nil
	}

	searchLower := strings.ToLower(name)
	var matches []contactMatch
	for jid, c := range contactsMap {
		fullName := c.FullName
		if fullName == "" {
			fullName = c.FirstName
		}
		if fullName == "" {
			fullName = jid.User
		}
		lower := strings.ToLower(fullName)
		score := scoreMatch(searchLower, lower)
		if score > 0 {
			matches = append(matches, contactMatch{
				JID:        jid.String(),
				Name:       fullName,
				Score:      score,
				InWhatsApp: true,
			})
		}
	}
	return matches
}

// scoreMatch returns an integer score for how well a haystack matches needle.
// 0 = no match. Higher score = better match.
func scoreMatch(needle, haystack string) int {
	if haystack == needle {
		return 100
	}
	if strings.HasPrefix(haystack, needle) {
		return 80
	}
	if strings.Contains(haystack, needle) {
		return 60
	}
	// Simple prefix match on words
	words := strings.Fields(haystack)
	for _, w := range words {
		if strings.HasPrefix(w, needle) {
			return 40
		}
	}
	return 0
}
