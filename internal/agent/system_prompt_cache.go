package agent

import (
	"crypto/sha256"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/nextlevelbuilder/goclaw/internal/providers"
)

// SystemPromptCache caches built system prompts to avoid expensive rebuilds.
// Cache key is based on agent ID, version, context file hashes, locale, and prompt mode.
// The cache is invalidated when agent config changes (via InvalidateForAgent).
type SystemPromptCache struct {
	mu      sync.RWMutex
	entries map[cacheKey]*promptCacheEntry
	maxAge  time.Duration
	maxSize int
	hit     int64
	miss    int64
}

type cacheKey struct {
	AgentID      string
	AgentVersion int64
	ContextHash  string
	Locale       string
	PromptMode   PromptMode
}

type promptCacheEntry struct {
	Prompt      providers.Message
	BuiltAt     time.Time
	AccessCount int64
	LastAccess  time.Time
}

// NewSystemPromptCache creates a new cache with the given TTL and max size.
func NewSystemPromptCache(maxAge time.Duration, maxSize int) *SystemPromptCache {
	if maxAge <= 0 {
		maxAge = 5 * time.Minute
	}
	if maxSize <= 0 {
		maxSize = 100
	}
	return &SystemPromptCache{
		entries: make(map[cacheKey]*promptCacheEntry),
		maxAge:  maxAge,
		maxSize: maxSize,
	}
}

// Get returns a cached system prompt if available and not expired.
// Returns the prompt and true if found, otherwise returns empty prompt and false.
func (c *SystemPromptCache) Get(key cacheKey) (providers.Message, bool) {
	c.mu.RLock()
	entry, ok := c.entries[key]
	c.mu.RUnlock()

	if !ok {
		c.miss++
		return providers.Message{}, false
	}

	// Check TTL
	if time.Since(entry.BuiltAt) > c.maxAge {
		c.mu.Lock()
		delete(c.entries, key)
		c.mu.Unlock()
		c.miss++
		return providers.Message{}, false
	}

	// Update access stats
	c.mu.Lock()
	entry.AccessCount++
	entry.LastAccess = time.Now()
	c.mu.Unlock()

	c.hit++
	return entry.Prompt, true
}

// Set stores a system prompt in the cache.
func (c *SystemPromptCache) Set(key cacheKey, prompt providers.Message) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Evict oldest if at capacity
	if len(c.entries) >= c.maxSize {
		c.evictOldest()
	}

	c.entries[key] = &promptCacheEntry{
		Prompt:     prompt,
		BuiltAt:    time.Now(),
		AccessCount: 1,
		LastAccess: time.Now(),
	}
}

// InvalidateForAgent removes all cached entries for a specific agent.
// Call this when agent config or context files are updated.
func (c *SystemPromptCache) InvalidateForAgent(agentID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.entries {
		if key.AgentID == agentID {
			delete(c.entries, key)
		}
	}
}

// Stats returns cache hit/miss statistics for monitoring.
func (c *SystemPromptCache) Stats() (hits, misses int64, size int) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.hit, c.miss, len(c.entries)
}

// evictOldest removes the least recently accessed entry.
func (c *SystemPromptCache) evictOldest() {
	var oldestKey cacheKey
	var oldestTime time.Time

	for key, entry := range c.entries {
		if oldestTime.IsZero() || entry.LastAccess.Before(oldestTime) {
			oldestKey = key
			oldestTime = entry.LastAccess
		}
	}

	if !oldestTime.IsZero() {
		delete(c.entries, oldestKey)
	}
}

// ComputeContextHash creates a deterministic hash of context file names and content.
// This is used as part of the cache key - if any context file changes, the hash changes.
func ComputeContextHash(files map[string]string) string {
	if len(files) == 0 {
		return ""
	}

	// Sort keys for deterministic ordering
	keys := make([]string, 0, len(files))
	for k := range files {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Build hash input
	var sb strings.Builder
	for _, k := range keys {
		sb.WriteString(k)
		sb.WriteString(":")
		sb.WriteString(files[k])
		sb.WriteString(";")
	}

	h := sha256.Sum256([]byte(sb.String()))
	return fmt.Sprintf("%x", h[:16]) // first 16 bytes for brevity
}

// BuildCacheKey creates a cache key from components.
func BuildCacheKey(agentID string, agentVersion int64, contextHash, locale string, mode PromptMode) cacheKey {
	return cacheKey{
		AgentID:      agentID,
		AgentVersion: agentVersion,
		ContextHash:  contextHash,
		Locale:       locale,
		PromptMode:   mode,
	}
}
