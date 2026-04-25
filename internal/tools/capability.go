package tools

import "slices"

// ToolCapability describes what a tool can do.
type ToolCapability string

const (
	CapReadOnly   ToolCapability = "read-only"   // no side effects
	CapMutating   ToolCapability = "mutating"    // modifies state
	CapAsync      ToolCapability = "async"       // returns immediately
	CapMCPBridged ToolCapability = "mcp-bridged" // proxied to external MCP server
	CapHostAccess ToolCapability = "host-access" // shell execution, process management
	CapFileSystem ToolCapability = "file-system" // file read/write
	CapSensitive  ToolCapability = "sensitive"   // involves credentials or high privacy risk
)

// ToolMetadata describes a tool's capabilities and requirements.
type ToolMetadata struct {
	Name              string
	Capabilities      []ToolCapability
	Group             string // "fs", "web", "runtime", "memory", "team", etc.
	RequiresWorkspace bool
	ProviderHints     map[string]any
}

// HasCapability checks if metadata includes a specific capability.
func (m ToolMetadata) HasCapability(cap ToolCapability) bool {
	return slices.Contains(m.Capabilities, cap)
}

// IsMutating returns true if the tool modifies state.
func (m ToolMetadata) IsMutating() bool {
	return m.HasCapability(CapMutating)
}

// IsReadOnly returns true if the tool has no side effects.
func (m ToolMetadata) IsReadOnly() bool {
	return m.HasCapability(CapReadOnly)
}

// inferMetadata returns default metadata for a tool based on name conventions.
// Used when no explicit metadata was registered.
func inferMetadata(name string) ToolMetadata {
	meta := ToolMetadata{Name: name}
	switch {
	case name == "exec" || name == "bash":
		meta.Capabilities = []ToolCapability{CapMutating, CapHostAccess}
	case name == "read_file" || name == "list_files" || name == "read_image" ||
		name == "read_audio" || name == "read_video" || name == "read_document" ||
		name == "memory_search" || name == "memory_get" || name == "memory_expand" ||
		name == "skill_search" || name == "knowledge_graph_search" ||
		name == "sessions_list" || name == "session_status" || name == "sessions_history" ||
		name == "datetime" || name == "web_search" || name == "web_fetch" ||
		name == "whatsapp_read_messages" || name == "whatsapp_get_status" || name == "whatsapp_get_profile":
		meta.Capabilities = []ToolCapability{CapReadOnly}
		if name == "read_file" || name == "list_files" {
			meta.Capabilities = append(meta.Capabilities, CapFileSystem)
		}
	case name == "write_file" || name == "edit":
		meta.Capabilities = []ToolCapability{CapMutating, CapFileSystem}
	case name == "spawn":
		meta.Capabilities = []ToolCapability{CapAsync}
	case name == "gateway" || name == "agents_list" || name == "whatsapp_login" || name == "config_secrets_list":
		meta.Capabilities = []ToolCapability{CapMutating, CapSensitive}
	default:
		meta.Capabilities = []ToolCapability{CapMutating}
	}
	return meta
}
