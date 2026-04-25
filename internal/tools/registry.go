package tools

import (
	"context"
	"log/slog"
	"slices"
	"strings"
	"sync"

	"github.com/nextlevelbuilder/goclaw/internal/providers"
)

// Registry stores and executes available tools.
type Registry struct {
	rateLimiter RateLimiter
	mu          sync.RWMutex
	tools       map[string]Tool
	metadata    map[string]ToolMetadata
	aliases     map[string]string
	disabled    map[string]bool
	toolGroups  map[string][]string
	
	toolGroupsMu sync.RWMutex
	deferredActivator func(name string) bool
}

// NewRegistry creates a new tool registry.
func NewRegistry() *Registry {
	return &Registry{
		tools:      make(map[string]Tool),
		metadata:   make(map[string]ToolMetadata),
		aliases:    make(map[string]string),
		disabled:   make(map[string]bool),
		toolGroups: make(map[string][]string),
	}
}

func (r *Registry) SetDeferredActivator(fn func(name string) bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.deferredActivator = fn
}

func (r *Registry) TryActivateDeferred(name string) bool {
	r.mu.RLock()
	if r.deferredActivator == nil {
		r.mu.RUnlock()
		return false
	}
	fn := r.deferredActivator
	r.mu.RUnlock()
	return fn(name)
}

// MetadataAware tools can report their own metadata.
type MetadataAware interface {
	Metadata() ToolMetadata
}

func (r *Registry) Register(tool Tool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	name := tool.Name()
	r.tools[name] = tool
	if ma, ok := tool.(MetadataAware); ok {
		r.metadata[name] = ma.Metadata()
	}
}

func (r *Registry) RegisterWithMetadata(tool Tool, meta ToolMetadata) {
	r.mu.Lock()
	defer r.mu.Unlock()
	name := tool.Name()
	r.tools[name] = tool
	meta.Name = name
	r.metadata[name] = meta
}

func (r *Registry) GetMetadata(name string) ToolMetadata {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if m, ok := r.metadata[name]; ok {
		return m
	}
	return inferMetadata(name)
}

func (r *Registry) RegisterAlias(alias, canonical string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.aliases[alias] = canonical
}

func (r *Registry) Get(name string) (Tool, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.resolve(name)
}

func (r *Registry) resolve(name string) (Tool, bool) {
	if t, ok := r.tools[name]; ok {
		if r.disabled[name] {
			return nil, false
		}
		return t, true
	}
	if canonical, ok := r.aliases[name]; ok {
		if r.disabled[canonical] {
			return nil, false
		}
		t, ok := r.tools[canonical]
		return t, ok
	}
	return nil, false
}

func (r *Registry) Unregister(name string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.tools, name)
}

func (r *Registry) Execute(ctx context.Context, name string, args map[string]any) *Result {
	return r.ExecuteWithContext(ctx, name, args, "", "", "", "", nil)
}

func (r *Registry) ExecuteWithContext(ctx context.Context, name string, args map[string]any, channel, chatID, peerKind, sessionKey string, asyncCB AsyncCallback) *Result {
	if strings.HasPrefix(name, "whatsapp_") {
		all := r.List()
		slog.Info("debug.registry.execute", "requested", name, "available", all)
	}

	t, ok := r.Get(name)
	if !ok {
		return ErrorResult("unknown tool: " + name)
	}

	if channel != "" {
		ctx = WithToolChannel(ctx, channel)
	}
	if chatID != "" {
		ctx = WithToolChatID(ctx, chatID)
	}
	if peerKind != "" {
		ctx = WithToolPeerKind(ctx, peerKind)
	}

	return t.Execute(ctx, args)
}

func (r *Registry) ProviderDefs() []providers.ToolDefinition {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var defs []providers.ToolDefinition
	for name, t := range r.tools {
		if !r.disabled[name] {
			defs = append(defs, ToProviderDef(t))
		}
	}
	return defs
}

func (r *Registry) List() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var names []string
	for name := range r.tools {
		if !r.disabled[name] {
			names = append(names, name)
		}
	}
	slices.Sort(names)
	return names
}

func (r *Registry) Aliases() map[string]string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	m := make(map[string]string)
	for k, v := range r.aliases {
		m[k] = v
	}
	return m
}

func (r *Registry) Disable(name string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.disabled[name] = true
}

func (r *Registry) Enable(name string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.disabled, name)
}

func (r *Registry) Clone() *Registry {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	newReg := &Registry{
		tools:    make(map[string]Tool),
		metadata: make(map[string]ToolMetadata),
		aliases:  make(map[string]string),
		disabled: make(map[string]bool),
		toolGroups: make(map[string][]string),
	}
	
	for k, v := range r.tools { newReg.tools[k] = v }
	for k, v := range r.metadata { newReg.metadata[k] = v }
	for k, v := range r.aliases { newReg.aliases[k] = v }
	for k, v := range r.disabled { newReg.disabled[k] = v }
	
	r.toolGroupsMu.RLock()
	for k, v := range r.toolGroups {
		newReg.toolGroups[k] = append([]string(nil), v...)
	}
	r.toolGroupsMu.RUnlock()
	
	return newReg
}

func (r *Registry) RegisterToolGroup(name string, members []string) {
	r.toolGroupsMu.Lock()
	r.toolGroups[name] = members
	r.toolGroupsMu.Unlock()
}

func (r *Registry) GetToolGroup(name string) ([]string, bool) {
	r.toolGroupsMu.RLock()
	defer r.toolGroupsMu.RUnlock()
	members, ok := r.toolGroups[name]
	if !ok {
		return nil, false
	}
	return append([]string(nil), members...), true
}

func (r *Registry) ExpandToolGroups(available []string, spec []string) []string {
	r.toolGroupsMu.RLock()
	defer r.toolGroupsMu.RUnlock()

	expanded := make(map[string]bool)
	for _, s := range spec {
		if after, ok := strings.CutPrefix(s, "group:"); ok {
			if members, ok := r.toolGroups[after]; ok {
				for _, m := range members {
					expanded[m] = true
				}
			}
		} else {
			expanded[s] = true
		}
	}

	availableSet := make(map[string]bool, len(available))
	for _, a := range available {
		availableSet[a] = true
	}

	var result []string
	for name := range expanded {
		if availableSet[name] {
			result = append(result, name)
		}
	}
	slices.Sort(result)
	return result
}

func (r *Registry) MatchDenySpec(name string, spec []string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, s := range spec {
		if after, ok := strings.CutPrefix(s, "group:"); ok {
			r.toolGroupsMu.RLock()
			members := r.toolGroups[after]
			r.toolGroupsMu.RUnlock()
			for _, m := range members {
				if m == name { return true }
			}
		} else if s == name {
			return true
		}
	}
	return false
}

func (r *Registry) UnregisterToolGroup(name string) {
	r.toolGroupsMu.Lock()
	defer r.toolGroupsMu.Unlock()
	delete(r.toolGroups, name)
}

func (r *Registry) MergeToolGroup(name string, members []string) {
	r.toolGroupsMu.Lock()
	defer r.toolGroupsMu.Unlock()
	existing := r.toolGroups[name]
	seen := make(map[string]bool)
	for _, m := range existing { seen[m] = true }
	for _, m := range members {
		if !seen[m] {
			existing = append(existing, m)
			seen[m] = true
		}
	}
	r.toolGroups[name] = existing
}

func (r *Registry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.tools)
}

func (r *Registry) SetRateLimiter(rl RateLimiter) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.rateLimiter = rl
}

func (r *Registry) SetScrubbing(enabled bool) {
	// Noop for now, just to satisfy interface
}
