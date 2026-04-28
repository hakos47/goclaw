package handlers

import (
	"context"
	"log/slog"
	"strings"

	"github.com/nextlevelbuilder/goclaw/internal/hooks"
	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// ClassificationHandler handles asynchronous category classification.
type ClassificationHandler struct {
	SessStore store.SessionStore
}

// NewClassificationHandler creates a new ClassificationHandler.
func NewClassificationHandler(s store.SessionStore) *ClassificationHandler {
	return &ClassificationHandler{
		SessStore: s,
	}
}

// HandleEvent classifies the session based on the raw input.
func (h *ClassificationHandler) HandleEvent(ctx context.Context, ev hooks.Event) {
	if h.SessStore == nil {
		return
	}

	lowerInput := strings.ToLower(ev.RawInput)
	category := "inbound"

	if strings.Contains(lowerInput, "error") || strings.Contains(lowerInput, "ayuda") || strings.Contains(lowerInput, "help") || strings.Contains(lowerInput, "soporte") {
		category = "support"
	} else if strings.Contains(lowerInput, "bug") || strings.Contains(lowerInput, "issue") {
		category = "technical"
	}

	// Persist the classification category independently.
	h.SessStore.SetCategory(ctx, ev.SessionID, category)
	slog.Info("inbound: session auto-classified async", "session", ev.SessionID, "category", category)
}
