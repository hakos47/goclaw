# Blueprint: MiniMax <think> Tag Extractor (Adapter OpenAI)

## 1. Problema Identificado
El modelo MiniMax (a través del pipeline `openai_compat`) envía su razonamiento dentro del campo `content` usando etiquetas `<think>...</think>`, en lugar de usar `reasoning_content` u otras extensiones estándar.
Actualmente, `OpenAIAdapter` en `internal/providers/adapter_openai.go` no extrae esto, lo que provoca que el razonamiento "Thinking" se filtre en la interfaz de usuario como contenido normal.

## 2. Objetivo
Implementar una extracción robusta (stateful para streaming y estática para non-streaming) que separe el texto en `Content` y `Thinking` antes de ser emitido en el bus de mensajes.

## 3. Solución Propuesta (Blueprint No Destructivo)

### A. Nuevo Componente: `ThinkExtractor`
Crear `internal/providers/think_extractor.go` para aislar la lógica de estado.

```go
package providers

import (
	"strings"
)

// ThinkExtractor es un procesador con estado para separar las etiquetas <think> en streams.
type ThinkExtractor struct {
	InThinkBlock bool
	Buffer       string
}

// ProcessChunk analiza un fragmento en modo streaming y acumula o emite tokens.
func (t *ThinkExtractor) ProcessChunk(text string) (content string, thinking string) {
	if text == "" {
		return "", ""
	}

	// Combinar el texto nuevo con cualquier fragmento sobrante previo
	raw := t.Buffer + text
	t.Buffer = ""

	var cBuf, tBuf strings.Builder

	for len(raw) > 0 {
		if !t.InThinkBlock {
			// Buscamos el inicio de <think>
			idx := strings.Index(raw, "<think>")
			if idx != -1 {
				cBuf.WriteString(raw[:idx])
				t.InThinkBlock = true
				raw = raw[idx+7:] // Avanzamos después de <think>
			} else {
				// Manejo de fragmentación: si termina en algo que parece ser <think> parcial
				if partial := extractPartialTag(raw, "<think>"); partial != "" {
					cBuf.WriteString(raw[:len(raw)-len(partial)])
					t.Buffer = partial
					break
				}
				cBuf.WriteString(raw)
				break
			}
		} else {
			// Buscamos el cierre de </think>
			idx := strings.Index(raw, "</think>")
			if idx != -1 {
				tBuf.WriteString(raw[:idx])
				t.InThinkBlock = false
				raw = raw[idx+8:] // Avanzamos después de </think>
			} else {
				// Fragmentación de </think>
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
	// Verifica si los últimos N caracteres coinciden con el inicio de la etiqueta
	for i := 1; i < len(tag); i++ {
		if len(text) >= i && strings.HasSuffix(text, tag[:i]) {
			return text[len(text)-i:]
		}
	}
	return ""
}

// ExtractFromFull extrae etiquetas en modo request completo (non-streaming)
func ExtractFromFull(text string) (content string, thinking string) {
	start := strings.Index(text, "<think>")
	if start == -1 {
		return text, ""
	}
	end := strings.Index(text[start+7:], "</think>")
	if end == -1 {
		// Etiqueta no cerrada
		return strings.TrimSpace(text[:start]), strings.TrimSpace(text[start+7:])
	}
	
	content = text[:start] + text[start+7+end+8:]
	thinking = text[start+7 : start+7+end]
	return strings.TrimSpace(content), strings.TrimSpace(thinking)
}
```

### B. Modificación en `adapter_openai.go`
1. **Modificar `OpenAIAdapter` para incluir el extractor:**
   Como `FromStreamChunk` necesita mantener estado entre fragmentos sucesivos del mismo stream, el adapter debe poseer una instancia del `ThinkExtractor`.
   *(Nota arquitectónica: Si `OpenAIAdapter` es compartido entre múltiples requests concurrentes por proveedor en el Registry, esto generará Data Races. Si esto es así, sugerimos cambiar la firma de `FromStreamChunk` para aceptar un contexto de estado, o envolver la instancia en una fábrica de scopes. Asumiremos por ahora que se puede instanciar per-request o incluir un mutex per-stream, pero lo ideal es usar `ThinkExtractor` directamente en el bucle `ChatStream` local o crear un `StreamParser` derivado).*

2. **Implementación de `FromResponse` (Completo):**
```go
func (a *OpenAIAdapter) FromResponse(data []byte) (*ChatResponse, error) {
	// ... (código existente) ...
	resp := a.provider.parseResponse(&oaiResp)
	
	// Integrar Extractor
	if resp != nil && resp.Content != "" {
		content, thinking := ExtractFromFull(resp.Content)
		if thinking != "" {
			resp.Content = content
			resp.Thinking += thinking
		}
	}
	return resp, nil
}
```

3. **Implementación en `FromStreamChunk`:**
```go
// Añadir struct field en OpenAIAdapter o inicializar uno para el request
func (a *OpenAIAdapter) FromStreamChunk(data []byte) (*StreamChunk, error) {
	// ... (código existente hasta obtención de Content) ...
	
	rawContent := delta.Content
	content, thinking := a.extractor.ProcessChunk(rawContent)
	
	if thinking != "" {
		sc.Thinking += thinking
		hasContent = true
	}
	if content != "" {
		sc.Content = content
		hasContent = true
	}
	
	if !hasContent && (delta.Reasoning != "" || delta.ReasoningContent != "") {
		// Preserve native reasoning logic
	}
	
	// ... (return) ...
}
```

### C. Handover
Solicitamos a `nix-agent-builder` la generación de un Worker `Expert-Go` para ejecutar la implementación y escribir los test unitarios pertinentes sobre `ThinkExtractor` usando fragmentos divididos simulando SSE (Server Sent Events).