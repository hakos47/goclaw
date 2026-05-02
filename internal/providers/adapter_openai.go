package providers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// OpenAIAdapter implements ProviderAdapter for OpenAI Chat Completions API.
// Delegates to OpenAIProvider's buildRequestBody/parseResponse for DRY.
type OpenAIAdapter struct {
	provider  *OpenAIProvider
	extractor *ThinkExtractor
}

// NewOpenAIAdapter creates an adapter from ProviderConfig.
func NewOpenAIAdapter(cfg ProviderConfig) (ProviderAdapter, error) {
	p := NewOpenAIProvider(cfg.Name, cfg.APIKey, cfg.BaseURL, cfg.Model)
	return &OpenAIAdapter{
		provider:  p,
		extractor: &ThinkExtractor{},
	}, nil
}

func (a *OpenAIAdapter) Name() string { return "openai" }

// Capabilities delegates to the wrapped provider for single source of truth.
func (a *OpenAIAdapter) Capabilities() ProviderCapabilities {
	return a.provider.Capabilities()
}

// ToRequest converts ChatRequest to OpenAI Chat Completions JSON + headers.
func (a *OpenAIAdapter) ToRequest(req ChatRequest) ([]byte, http.Header, error) {
	stream := true
	if v, ok := req.Options["stream"].(bool); ok {
		stream = v
	}

	model := a.provider.resolveModel(req.Model)
	body := a.provider.buildRequestBody(model, req, stream)

	data, err := json.Marshal(body)
	if err != nil {
		return nil, nil, fmt.Errorf("openai adapter: marshal: %w", err)
	}

	h := make(http.Header)
	h.Set("Content-Type", "application/json")

	// Azure uses api-key header; others use Bearer token
	if strings.Contains(strings.ToLower(a.provider.apiBase), "azure.com") {
		h.Set("api-key", a.provider.apiKey)
	} else {
		prefix := a.provider.authPrefix
		if prefix == "" {
			prefix = "Bearer "
		}
		h.Set("Authorization", prefix+a.provider.apiKey)
	}

	if a.provider.siteURL != "" {
		h.Set("HTTP-Referer", a.provider.siteURL)
	}
	if a.provider.siteTitle != "" {
		h.Set("X-Title", a.provider.siteTitle)
	}

	return data, h, nil
}

// FromResponse parses OpenAI Chat Completions response JSON into ChatResponse.
func (a *OpenAIAdapter) FromResponse(data []byte) (*ChatResponse, error) {
	var resp openAIResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("openai adapter: decode: %w", err)
	}
	result := a.provider.parseResponse(&resp)

	// Extract <think> tags from content (Phase 11: MiniMax fix)
	if result != nil && result.Content != "" {
		content, thinking := ExtractFromFull(result.Content)
		if thinking != "" {
			result.Content = content
			result.Thinking += thinking
		}
	}

	return result, nil
}

// FromStreamChunk parses a single OpenAI SSE data payload.
// Returns content/thinking for deltas, Done for [DONE].
// Returns nil for non-content chunks (usage-only, empty choices).
func (a *OpenAIAdapter) FromStreamChunk(data []byte) (*StreamChunk, error) {
	// OpenAI signals end with literal "[DONE]"
	if string(data) == "[DONE]" {
		return &StreamChunk{Done: true}, nil
	}

	var chunk openAIStreamChunk
	if err := json.Unmarshal(data, &chunk); err != nil {
		return nil, nil
	}

	if len(chunk.Choices) == 0 {
		return nil, nil
	}

	delta := chunk.Choices[0].Delta
	sc := &StreamChunk{}
	hasContent := false

	// Extract <think> tags from streaming content (Phase 11: MiniMax fix)
	if delta.Content != "" {
		content, thinking := a.extractor.ProcessChunk(delta.Content)
		if thinking != "" {
			sc.Thinking = thinking
			hasContent = true
		}
		if content != "" {
			sc.Content = content
			hasContent = true
		}
	}

	// Native reasoning content (thinking)
	if delta.ReasoningContent != "" || delta.Reasoning != "" {
		reasoning := delta.ReasoningContent
		if reasoning == "" {
			reasoning = delta.Reasoning
		}
		sc.Thinking += reasoning
		hasContent = true
	}


	if !hasContent {
		return nil, nil
	}
	return sc, nil
}
