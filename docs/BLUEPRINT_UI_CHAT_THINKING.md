# BLUEPRINT: UI CHAT THINKING (Svelte V2)

## 1. Contexto y Problema
El usuario ha reportado que el razonamiento ("thinking") de los modelos se está mostrando mezclado con el contenido principal del chat. Esto ocurre porque el contenido (content) contiene etiquetas `<think>...</think>` que no están siendo extraídas o limpiadas correctamente, lo que provoca que el texto del pensamiento se renderice como parte de la respuesta del bot.

## 2. Objetivos
1. Asegurar que la interfaz `ChatMessage` soporta el campo `thinking` (ya lo hace al extender de `Message`, pero se debe confirmar).
2. Modificar el frontend para que **extraiga dinámicamente** y limpie cualquier etiqueta `<think>` que provenga en el `content` (tanto en mensajes de historial como en *streaming*).
3. Asegurar que la estética "Dark Industrial Glass" (Tonos oscuros, neón púrpura/cian, bordes de cristal ahumado) se mantenga en los bloques de pensamiento y chat.

## 3. Archivos a Modificar (Scope estricto de Workers)

### A. `ui/svelte-v2/src/lib/types/chat.ts`
*   **Acción:** Verificar (ya lo posee) o asegurar que `ChatMessage` hereda `thinking?: string`. 
*   **Detalle:** `export interface Message { role: string; content: string; thinking?: string; }`

### B. `ui/svelte-v2/src/lib/state/chat.svelte.ts`
*   **Acción:** Implementar un extractor/limpiador de `<think>` en la hidratación de historial y en el guardado final del stream.
*   **Lógica sugerida (Extractor):**
    ```typescript
    function extractThinking(content: string): { cleanContent: string, thinking?: string } {
        const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch) {
            return {
                thinking: thinkMatch[1].trim(),
                cleanContent: content.replace(/<think>[\s\S]*?<\/think>/, '').trim()
            };
        }
        return { cleanContent: content };
    }
    ```
*   Aplicar este filtro:
    1. En `loadChatHistory`, mapear `msg.content` y, si contiene `<think>`, poblar `msg.thinking` y actualizar `msg.content`.
    2. En `handleAgentEvent` (`run.completed`), procesar `finalContent` usando el extractor antes de pushear al estado `session.messages`.
    3. Para el streaming en tiempo real (`chunk`), el backend ya envía eventos `thinking`, pero si el chunk trae texto crudo `<think>`, puede ser problemático. Lo ideal es limpiar el `streamText` al vuelo o al finalizar.

### C. `ui/svelte-v2/src/lib/components/chat/ChatThread.svelte`
*   **Acción:** Limpieza robusta en tiempo real para el Markdown.
*   **Detalle:** En la función `renderMarkdown(content: string)`, añadir un `replace(/<think>[\s\S]*?<\/think>/g, '')` antes de pasar a `marked.parse(content)`. Esto evitará que, durante el streaming de un `chunk` mal formado que escape hacia el `content`, se vea el XML crudo en la UI.
*   **Estética Visual:** Mantener `ThinkingBlock.svelte` con su estilo oscuro translúcido (`bg-black/40 border-l-[#d946ef]`). Validar que en `ChatThread.svelte` el `msg.thinking` se renderiza sobre el mensaje principal, envuelto apropiadamente.

## 4. Estética Requerida: Dark Industrial Glass
*   Bloque de Pensamiento: Fondo oscuro `bg-black/80`, bordes sutiles púrpura `#d946ef`, estilo "Internal Monologue".
*   Filtros de desenfoque (`backdrop-blur-3xl`).
*   Textos en fuente monospace o serif oscura para el thinking.

## 5. Instrucciones para el Especialista (Worker)
- Procede a editar `chat.svelte.ts` y `ChatThread.svelte` aplicando estas limpiezas con RegEx y asegurando que las variables reactivas (`$state`) no se desincronicen.
- No modifiques los estilos a menos que sea estrictamente necesario para acatar el "Dark Industrial Glass", en cuyo caso, usa las clases Tailwind existentes en el proyecto (`#d946ef`, `goclaw-neon-cyan`, `bg-black/40`, etc).
