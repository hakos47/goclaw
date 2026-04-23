package memory

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// pgAutoInjector implements AutoInjector backed by EpisodicStore + FTS search.
type pgAutoInjector struct {
	episodicStore store.EpisodicStore
	metricsStore  store.EvolutionMetricsStore // nil = metrics disabled
}

// NewAutoInjector creates an AutoInjector backed by episodic store search.
func NewAutoInjector(es store.EpisodicStore, ms store.EvolutionMetricsStore) AutoInjector {
	return &pgAutoInjector{episodicStore: es, metricsStore: ms}
}

// Inject searches episodic memory for relevant L0 abstracts and formats a prompt section.
// Budget enforcement: respects MaxTokens limit (default 200) by truncating entries
// if they would exceed the budget. MaxEntries limits how many entries are considered.
func (a *pgAutoInjector) Inject(ctx context.Context, params InjectParams) (*InjectResult, error) {
	if a.episodicStore == nil {
		return &InjectResult{}, nil
	}
	if isTrivialMessage(params.UserMessage) {
		return &InjectResult{}, nil
	}

	maxEntries := params.MaxEntries
	if maxEntries <= 0 {
		maxEntries = 5
	}
	maxTokens := params.MaxTokens
	if maxTokens <= 0 {
		maxTokens = 200
	}
	threshold := params.Threshold
	if threshold <= 0 {
		threshold = 0.3
	}

	// Phase 9: context-aware recall. When the caller supplied RecentContext,
	// build a richer search query that captures conversational intent. Without
	// this, vector search on "what's my favorite?" misses memories about the
	// topic under discussion. With it, the query embedding captures the
	// follow-up semantics and returns materially better matches.
	searchQuery := buildRecallQuery(params.UserMessage, params.RecentContext)

	// Search with FTS bias (faster than pure vector for auto-inject)
	// Fetch 3x candidates for budget filtering
	results, err := a.episodicStore.Search(ctx, searchQuery, params.AgentID, params.UserID,
		store.EpisodicSearchOptions{
			MaxResults:   maxEntries * 3,
			MinScore:     threshold,
			VectorWeight: 0.3,
			TextWeight:   0.7,
		})
	if err != nil {
		return nil, fmt.Errorf("auto-inject search: %w", err)
	}
	if len(results) == 0 {
		return &InjectResult{}, nil
	}

	// Build prompt section with STRICT token budget enforcement
	var sb strings.Builder
	sb.WriteString("## Memory Context\n\nRelevant memories from past sessions (use memory_search for details):\n")

	// Estimate prefix overhead (header text above entries)
	prefix := sb.String()
	usedTokens := a.estimateTokens(prefix)

	injected := 0
	var topScore float64

	for _, r := range results {
		if injected >= maxEntries {
			break
		}
		if r.L0Abstract == "" {
			continue
		}

		entryTokens := a.estimateTokens(r.L0Abstract)

		// STRICT token budget enforcement - respect MaxTokens
		if usedTokens+entryTokens > maxTokens {
			// Try to fit a truncated entry if we have at least 50 tokens remaining
			remaining := maxTokens - usedTokens
			if remaining >= 50 {
				truncated := truncateToTokenBudget(r.L0Abstract, remaining)
				sb.WriteString("- ")
				sb.WriteString(truncated)
				sb.WriteString("\n")
				usedTokens = maxTokens
			}
			// Budget exhausted - stop adding entries
			break
		}

		sb.WriteString("- ")
		sb.WriteString(r.L0Abstract)
		sb.WriteString("\n")
		usedTokens += entryTokens
		injected++

		if r.Score > topScore {
			topScore = r.Score
		}
	}

	if injected == 0 {
		return &InjectResult{MatchCount: len(results)}, nil
	}

	result := &InjectResult{
		Section:    sb.String(),
		MatchCount: len(results),
		Injected:   injected,
		UsedTokens: usedTokens,
		TopScore:   topScore,
	}

	// Record retrieval metric non-blocking (best-effort).
	a.recordRetrievalMetric(params, result)

	return result, nil
}

// estimateTokens converts text to approximate token count.
// Uses 4 chars per token as baseline approximation (rune-based fallback).
func (a *pgAutoInjector) estimateTokens(text string) int {
	return utf8.RuneCountInString(text) / 4
}

// truncateToTokenBudget truncates text to fit within token budget.
// Keeps the beginning where key information typically resides.
func truncateToTokenBudget(text string, maxTokens int) string {
	maxChars := maxTokens * 4 // rough 4 chars per token
	runes := []rune(text)
	if len(runes) <= maxChars {
		return text
	}
	return string(runes[:maxChars]) + "..."
}

// recordRetrievalMetric records an auto-inject retrieval metric in a background goroutine.
func (a *pgAutoInjector) recordRetrievalMetric(params InjectParams, result *InjectResult) {
	if a.metricsStore == nil || params.TenantID == "" {
		return
	}
	tenantID, err := uuid.Parse(params.TenantID)
	if err != nil {
		return
	}
	agentID, err := uuid.Parse(params.AgentID)
	if err != nil {
		return
	}
	go func() {
		bgCtx, cancel := context.WithTimeout(store.WithTenantID(context.Background(), tenantID), 5*time.Second)
		defer cancel()
		value, _ := json.Marshal(map[string]any{
			"result_count":  result.MatchCount,
			"injected":      result.Injected,
			"top_score":     result.TopScore,
			"used_in_reply": result.Injected > 0,
		})
		if err := a.metricsStore.RecordMetric(bgCtx, store.EvolutionMetric{
			ID:         uuid.New(),
			TenantID:   tenantID,
			AgentID:    agentID,
			MetricType: store.MetricRetrieval,
			MetricKey:  "auto_inject",
			Value:      value,
		}); err != nil {
			slog.Debug("evolution.metric.auto_inject_failed", "error", err)
		}
	}()
}
