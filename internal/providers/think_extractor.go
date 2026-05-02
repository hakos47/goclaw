package providers

import (
	"strings"
)

// ThinkExtractor is a stateful processor for separating <think> tags in LLM output streams.
// It handles fragmentation across SSE chunks and supports both streaming and full responses.
type ThinkExtractor struct {
	InThinkBlock bool
	Buffer       string
}

// ProcessChunk analyzes a text fragment in streaming mode and splits it into content and thinking.
func (t *ThinkExtractor) ProcessChunk(text string) (content string, thinking string) {
	if text == "" {
		return "", ""
	}

	// Combine new text with any leftover fragment from previous chunk
	raw := t.Buffer + text
	t.Buffer = ""

	var cBuf, tBuf strings.Builder

	for len(raw) > 0 {
		if !t.InThinkBlock {
			// Look for the start of <think>
			idx := strings.Index(raw, "<think>")
			if idx != -1 {
				cBuf.WriteString(raw[:idx])
				t.InThinkBlock = true
				raw = raw[idx+7:] // Advance after <think>
			} else {
				// Fragment handling: if ends with something that looks like a partial <think>
				if partial := extractPartialTag(raw, "<think>"); partial != "" {
					cBuf.WriteString(raw[:len(raw)-len(partial)])
					t.Buffer = partial
					break
				}
				cBuf.WriteString(raw)
				break
			}
		} else {
			// Look for the end of </think>
			idx := strings.Index(raw, "</think>")
			if idx != -1 {
				tBuf.WriteString(raw[:idx])
				t.InThinkBlock = false
				raw = raw[idx+8:] // Advance after </think>
			} else {
				// Fragment handling for </think>
				if partial := extractPartialTag(raw, "</think>"); partial != "" {
					tBuf.WriteString(raw[:len(raw)-len(partial)])
					t.Buffer = partial
					break
				}
				tBuf.WriteString(raw)
				break
			}
		}
	}

	return cBuf.String(), tBuf.String()
}

func extractPartialTag(text, tag string) string {
	// Checks if the last N characters match the start of the tag
	for i := 1; i < len(tag); i++ {
		if len(text) >= i && strings.HasSuffix(text, tag[:i]) {
			return text[len(text)-i:]
		}
	}
	return ""
}

// ExtractFromFull extracts tags in non-streaming mode.
func ExtractFromFull(text string) (content string, thinking string) {
	start := strings.Index(text, "<think>")
	if start == -1 {
		return text, ""
	}
	end := strings.Index(text[start+7:], "</think>")
	if end == -1 {
		// Unclosed tag
		return strings.TrimSpace(text[:start]), strings.TrimSpace(text[start+7:])
	}

	content = text[:start] + text[start+7+end+8:]
	thinking = text[start+7 : start+7+end]
	return strings.TrimSpace(content), strings.TrimSpace(thinking)
}
