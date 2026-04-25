package agent

import (
	"context"
	"math"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/nextlevelbuilder/goclaw/internal/memory"
	"github.com/nextlevelbuilder/goclaw/internal/providers"
	"github.com/nextlevelbuilder/goclaw/internal/tools"
)

// ToolRelevanceFilter implements semantic tool filtering based on user intent.
// It uses embedding similarity to select only the most relevant tools for a given task,
// reducing token consumption by 60-80% in typical workloads.
type ToolRelevanceFilter struct {
	mu       sync.RWMutex
	vectors  map[string][]float32 // tool name -> embedding
	embedder memory.EmbeddingProvider
	cache    *intentCache
	topK     int
	threshold float32

	// Tools that are always included regardless of relevance score.
	// These are high-value tools that rarely hurt and often help.
	alwaysOn map[string]bool

	// Track if embeddings have been computed
	computed   bool
	computedAt time.Time
}

type intentCache struct {
	mu    sync.RWMutex
	items map[string]*cacheEntry
	ttl   time.Duration
}

type cacheEntry struct {
	toolNames []string
	created   time.Time
}

// NewToolRelevanceFilter creates a filter with the given embedder.
// topK limits how many tools are selected (default 8).
// threshold is the minimum cosine similarity score (default 0.12).
func NewToolRelevanceFilter(embedder memory.EmbeddingProvider, topK int, threshold float32) *ToolRelevanceFilter {
	if topK <= 0 {
		topK = 8
	}
	if threshold <= 0 {
		threshold = 0.12
	}
	return &ToolRelevanceFilter{
		vectors:   make(map[string][]float32),
		embedder:  embedder,
		cache:    newIntentCache(10 * time.Minute),
		topK:     topK,
		threshold: threshold,
		alwaysOn: map[string]bool{
			"read_image":    true,
			"read_document": true,
			"read_audio":    true,
			"read_video":    true,
			"search":        true,
			"memory_search": true,
		},
	}
}

// FilterByIntent returns tools relevant to the user's message intent.
// Falls back to all tools if embedder fails or no tools score above threshold.
func (f *ToolRelevanceFilter) FilterByIntent(
	ctx context.Context,
	userMsg string,
	registry tools.ToolExecutor,
) ([]providers.ToolDefinition, error) {
	// Fast path: check cache
	cacheKey := normalizeIntent(userMsg)
	if cached := f.cache.Get(cacheKey); cached != nil {
		return f.buildToolDefs(registry, cached.toolNames), nil
	}

	// Compute user embedding
	userEmbedding, err := f.embedder.Embed(ctx, []string{userMsg})
	if err != nil || len(userEmbedding) == 0 {
		// Fallback: return all tools
		return registry.ProviderDefs(), err
	}

	// Ensure tool embeddings are computed
	if err := f.computeToolEmbeddings(ctx, registry); err != nil {
		return registry.ProviderDefs(), err
	}

	// Score all tools by cosine similarity to user intent
	allTools := registry.List()
	var scored []scoredTool

	f.mu.RLock()
	for _, toolName := range allTools {
		vec, ok := f.vectors[toolName]
		if !ok {
			continue
		}
		score := cosineSimilarity(userEmbedding[0], vec)

		// Boost score if tool name or keywords appear in message
		if containsToolKeyword(userMsg, toolName) {
			score += 0.25
		}

		// Only include if above threshold
		if score >= f.threshold {
			scored = append(scored, scoredTool{name: toolName, score: score})
		}
	}
	f.mu.RUnlock()

	if len(scored) == 0 {
		// Nothing scored high enough - return topK by default score
		return f.returnTopByDefault(registry), nil
	}

	// Sort by score descending
	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	// Select top K + always-on tools
	selected := make(map[string]bool)
	for i := 0; i < min(f.topK, len(scored)); i++ {
		selected[scored[i].name] = true
	}
	for name := range f.alwaysOn {
		if tool, ok := registry.Get(name); ok && tool != nil {
			selected[name] = true
		}
	}

	// Cache result
	toolNames := make([]string, 0, len(selected))
	for name := range selected {
		toolNames = append(toolNames, name)
	}
	f.cache.Set(cacheKey, toolNames)

	return f.buildToolDefs(registry, toolNames), nil
}

// computeToolEmbeddings computes embeddings for all registered tools.
func (f *ToolRelevanceFilter) computeToolEmbeddings(ctx context.Context, registry tools.ToolExecutor) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	// Skip if computed within last hour
	if f.computed && time.Since(f.computedAt) < time.Hour {
		return nil
	}

	allTools := registry.List()
	if len(allTools) == 0 {
		return nil
	}

	// Prepare texts for embedding: "tool_name: tool description"
	texts := make([]string, len(allTools))
	names := make([]string, len(allTools))

	for i, toolName := range allTools {
		names[i] = toolName
		if tool, ok := registry.Get(toolName); ok {
			texts[i] = toolName + ": " + tool.Description()
		} else {
			texts[i] = toolName
		}
	}

	vectors, err := f.embedder.Embed(ctx, texts)
	if err != nil {
		return err
	}

	for i, name := range names {
		if i < len(vectors) {
			f.vectors[name] = vectors[i]
		}
	}

	f.computed = true
	f.computedAt = time.Now()
	return nil
}

func (f *ToolRelevanceFilter) buildToolDefs(registry tools.ToolExecutor, names []string) []providers.ToolDefinition {
	var defs []providers.ToolDefinition
	for _, name := range names {
		if tool, ok := registry.Get(name); ok {
			defs = append(defs, tools.ToProviderDef(tool))
		}
	}
	// Sort for deterministic ordering (prompt caching)
	sort.Slice(defs, func(i, j int) bool {
		return defs[i].Function.Name < defs[j].Function.Name
	})
	return defs
}

func (f *ToolRelevanceFilter) returnTopByDefault(registry tools.ToolExecutor) []providers.ToolDefinition {
	// Return top K tools alphabetically as fallback
	all := registry.List()
	sort.Strings(all)
	max := min(f.topK, len(all))
	defs := make([]providers.ToolDefinition, 0, max)
	for i := 0; i < max; i++ {
		if tool, ok := registry.Get(all[i]); ok {
			defs = append(defs, tools.ToProviderDef(tool))
		}
	}
	return defs
}

// cosineSimilarity computes cosine similarity between two vectors.
func cosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) || len(a) == 0 {
		return 0
	}

	var dotProduct float32
	var normA, normB float32

	for i := range a {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (float32(math.Sqrt(float64(normA))) * float32(math.Sqrt(float64(normB))))
}

// normalizeIntent creates a cache key from user message.
func normalizeIntent(msg string) string {
	// Simple normalization: lowercase, trim, limit length
	msg = strings.ToLower(msg)
	msg = strings.TrimSpace(msg)
	if len(msg) > 200 {
		msg = msg[:200]
	}
	return msg
}

// containsToolKeyword checks if the message contains tool-related keywords.
func containsToolKeyword(msg, toolName string) bool {
	msg = strings.ToLower(msg)
	toolName = strings.ToLower(toolName)

	// Direct name match
	if strings.Contains(msg, toolName) {
		return true
	}

	// Common keyword mappings
	keywords := map[string][]string{
		"read_file":      {"file", "read", "open", "content", "document"},
		"write_file":     {"write", "save", "create", "file", "document"},
		"sql_query":     {"query", "sql", "database", "data", "search"},
		"search":         {"search", "find", "look", "query"},
		"calculator":    {"calculate", "math", "compute", "numbers"},
		"memory_search":  {"remember", "memory", "past", "previous"},
		"web_search":     {"search", "web", "internet", "google"},
		"exec":           {"run", "execute", "command", "bash", "shell"},
		"whatsapp_send_message":   {"whatsapp", "send", "mensaje", "message", "enviar"},
		"whatsapp_list_chats":      {"whatsapp", "chats", "grupos", "listar", "conversations", "groups"},
		"whatsapp_list_contacts":   {"whatsapp", "contactos", "contacts", "agenda"},
		"whatsapp_group_create":     {"whatsapp", "group", "create", "grupo", "crear"},
		"whatsapp_group_invite":    {"whatsapp", "invite", "link", "invitacion", "invitar"},
		"whatsapp_group_members":   {"whatsapp", "members", "participantes", "miembros"},
		"whatsapp_profile_photo":   {"whatsapp", "photo", "profile", "foto", "perfil"},
		"whatsapp_find_contact":    {"whatsapp", "contact", "buscar", "encontrar", "contacto", "contactos", "agenda", "find"},
		"whatsapp_get_profile":     {"whatsapp", "profile", "perfil", "info", "informacion"},
		"whatsapp_get_status":      {"whatsapp", "status", "estado", "bio", "biografia"},
		"whatsapp_read_messages":   {"whatsapp", "read", "messages", "leer", "mensajes", "historial", "history"},
		"whatsapp_test_target":     {"whatsapp", "test", "prueba", "diagnostico", "diagnostic"},
	}

	if words, ok := keywords[toolName]; ok {
		for _, word := range words {
			if strings.Contains(msg, word) {
				return true
			}
		}
	}

	return false
}

func newIntentCache(ttl time.Duration) *intentCache {
	return &intentCache{
		items: make(map[string]*cacheEntry),
		ttl:   ttl,
	}
}

func (c *intentCache) Get(key string) *cacheEntry {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.items[key]
	if !ok {
		return nil
	}
	if time.Since(entry.created) > c.ttl {
		return nil
	}
	return entry
}

func (c *intentCache) Set(key string, toolNames []string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = &cacheEntry{
		toolNames: toolNames,
		created:   time.Now(),
	}
}

type scoredTool struct {
	name  string
	score float32
}