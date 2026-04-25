package tools

import (
	"context"

	"go.mau.fi/whatsmeow"

	"github.com/google/uuid"

	"github.com/nextlevelbuilder/goclaw/internal/bus"
	"github.com/nextlevelbuilder/goclaw/internal/providers"
	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// Tool is the interface all tools must implement.
type Tool interface {
	Name() string
	Description() string
	Parameters() map[string]any
	Execute(ctx context.Context, args map[string]any) *Result
}

// RateLimiter defines the interface for tool rate limiting.
type RateLimiter interface {
	Allow(key string) error
}

// ContextualTool receives channel/chat context before execution.
type ContextualTool interface {
	Tool
	SetContext(channel, chatID string)
}

// PeerKindAware interface.
type PeerKindAware interface {
	SetPeerKind(peerKind string)
}

// SandboxAware tools.
type SandboxAware interface {
	SetSandboxKey(key string)
}

// AsyncCallback is invoked when an async tool completes.
type AsyncCallback func(ctx context.Context, result *Result)

// AsyncTool supports asynchronous execution.
type AsyncTool interface {
	Tool
	SetCallback(cb AsyncCallback)
}

// InterceptorAware tools.
type InterceptorAware interface {
	SetContextFileInterceptor(*ContextFileInterceptor)
	SetMemoryInterceptor(*MemoryInterceptor)
}

// ConfigPermAware tools.
type ConfigPermAware interface {
	SetConfigPermStore(store.ConfigPermissionStore)
}

// WorkspaceInterceptorAware tools.
type WorkspaceInterceptorAware interface {
	SetWorkspaceInterceptor(*WorkspaceInterceptor)
}

// MemoryStoreAware tools.
type MemoryStoreAware interface {
	SetMemoryStore(store.MemoryStore)
}

// ApprovalAware tools.
type ApprovalAware interface {
	SetApprovalManager(*ExecApprovalManager, string)
}

// PathAllowable tools.
type PathAllowable interface {
	AllowPaths(...string)
}

// PathDenyable tools.
type PathDenyable interface {
	DenyPaths(...string)
}

// SessionStoreAware tools.
type SessionStoreAware interface {
	SetSessionStore(store.SessionStore)
}

// BusAware tools.
type BusAware interface {
	SetMessageBus(*bus.MessageBus)
}

// ChannelSender abstracts sending a message.
type ChannelSender func(ctx context.Context, channel, chatID, content string) error

// ChannelSenderAware tools.
type ChannelSenderAware interface {
	SetChannelSender(ChannelSender)
}

// ChannelTenantChecker returns tenant UUID for channel.
type ChannelTenantChecker func(channelName string) (tenantID uuid.UUID, exists bool)

// ChannelTenantCheckerAware tools.
type ChannelTenantCheckerAware interface {
	SetChannelTenantChecker(ChannelTenantChecker)
}

// WhatsAppClientGetter returns (client, authenticated, exists).
type WhatsAppClientGetter func(channelName string) (*whatsmeow.Client, bool, bool)

// WhatsAppClientGetterAware tools.
type WhatsAppClientGetterAware interface {
	SetWhatsAppClientGetter(WhatsAppClientGetter)
}

// ChannelAware tools.
type ChannelAware interface {
	RequiredChannelTypes() []string
}

// ToProviderDef converts a Tool to a providers.ToolDefinition.
func ToProviderDef(t Tool) providers.ToolDefinition {
	return providers.ToolDefinition{
		Type: "function",
		Function: providers.ToolFunctionSchema{
			Name:        t.Name(),
			Description: t.Description(),
			Parameters:  t.Parameters(),
		},
	}
}
