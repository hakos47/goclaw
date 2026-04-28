# 🧠 EPIC 3: AI OPERATIONS (Chat & Sessions Migration)

## 🎯 Objetivo de la Misión
Migrar la vista completa de Chat desde React 19 (`ui/web/src/pages/chat/...`) a Svelte 5.55.0 (`ui/svelte-v2/...`), garantizando una arquitectura de alto rendimiento (O(1) Memory), estado reactivo nativo con Runes, y renderizado de Markdown por streaming sin bloqueos del hilo principal.

---

## 🏗️ 1. Mapeo de la Interfaz (UI Architecture)
La interfaz de React se dividirá y traducirá a los siguientes componentes Svelte bajo `ui/svelte-v2/src/routes/chat/`:

- **Layout Principal (`+layout.svelte` o `ChatLayout.svelte`):** Contenedor Flexbox/Grid principal.
- **Sidebar de Sesiones (`ChatSidebar.svelte`):**
  - Reemplaza a `session-switcher.tsx` / `chat-sidebar.tsx`.
  - Lista de sesiones ordenadas cronológicamente y agrupadas.
  - Botón de "Nueva Sesión".
  - Estética Dark Industrial Glass (Glassmorphism).
- **Panel Central de Mensajes (`ChatPane.svelte`):**
  - Reemplaza a `chat-pane.tsx` / `chat-thread.tsx`.
  - Contenedor scrolleable para los mensajes de la sesión activa.
  - Input de texto en la parte inferior (`ChatInput.svelte`) para enviar prompts, heredando el textarea adaptativo del Epic 0.

---

## ⚡ 2. Estado Reactivo (Svelte 5 Runes)
En lugar de depender de stores pesados como Zustand, utilizaremos el sistema de `$state` de Svelte 5 para una reactividad granular y predecible.

- **Estado Global/Inyectado (`chatState.svelte.ts`):**
  ```typescript
  export const chatState = $state({
      sessions: [],
      activeSessionId: null,
      messages: [],
      isStreaming: false
  });
  ```
- **Context API (Opcional):** Si el estado crece, inyectarlo usando `setContext` en el Layout para que `ChatSidebar` y `ChatPane` lo consuman vía `getContext`, evitando el prop-drilling.
- **Mutaciones:** Solo el módulo de estado o funciones dedicadas mutarán `chatState.messages` (ej. haciendo `push` al array) para activar la reactividad de Svelte optimizada.

---

## 🔌 3. WebSockets (O(1) Memory)
El frontend aprovechará `ws.svelte.ts` (creado en el Hito 2) para la comunicación en tiempo real.

- **Carga Inicial:**
  - Al montar, invocar `Methods.SESSIONS_LIST` vía WebSockets (o usar `useSessionsSummary` / `GET /api/v3/sessions/summary` por HTTP) para popular `chatState.sessions`.
- **Selección de Sesión:**
  - Al hacer click en una sesión, cargar su historial llamando a `Methods.SESSION_HISTORY` (o equivalente) y actualizar `chatState.messages`.
- **Streaming de Chat:**
  - Al enviar un mensaje, hacer `wsCall(Methods.CHAT_STREAM, { prompt, sessionId })`.
  - Escuchar los eventos entrantes del WebSocket. Cada chunk de token recibido se añade al último mensaje en `chatState.messages` (mutando `$state`), asegurando un consumo de memoria estable (O(1) en el pipeline de red).

---

## 📝 4. Renderizado de Markdown Seguro (Streaming Optimizado)
El mayor cuello de botella en React ha sido el parseo completo de Markdown en cada render. En Svelte, lo resolveremos así:

- **Estrategia de Renderizado (Perezoso/Diferencial):**
  - Utilizar una librería ligera como `marked` (con un worker si es posible) o `snarkdown`.
  - **Diferencial:** Solo parsear y re-renderizar activamente el *último mensaje* (el que está en streaming). Los mensajes anteriores (historial) son estáticos y se renderizan una sola vez (o se guardan ya parseados a HTML seguro en el estado).
- **Protección del Main Thread:**
  - Si el streaming de tokens es muy rápido (throttle requestAnimationFrame), el parseo se ejecutará en lotes (batching) usando `$effect` de Svelte combinado con un temporizador o `requestAnimationFrame`.
  - Sanear el HTML resultante usando `DOMPurify` para prevenir ataques XSS.

---

## 🚀 5. Hitos de Ejecución para el Worker (`generalist`)
1. **Scaffolding:** Crear la estructura de carpetas en `ui/svelte-v2/src/routes/chat/` y los componentes vacíos (`ChatSidebar.svelte`, `ChatPane.svelte`).
2. **Estado Base:** Implementar `chatState.svelte.ts` y conectarlo en la raíz del módulo chat.
3. **WebSockets:** Integrar `ws.svelte.ts`. Programar la carga de sesiones y selección.
4. **Markdown Streaming Component:** Crear `MarkdownMessage.svelte` que reciba el contenido crudo, lo parseé eficientemente y renderice HTML seguro.
5. **Estilos y Ensamblaje:** Aplicar el diseño *Dark Industrial Glass* utilizando TailwindCSS. Asegurar que el scroll del chat funcione correctamente y se mantenga abajo (auto-scroll) durante el streaming.