# 🗺️ PLAN MAESTRO DE MIGRACIÓN: STRANGLER FIG V3 (Svelte 5 - Pixel Perfect)
**TICKET:** TASK-023-MASTER
**DIRECTOR:** NIX-ORCHESTRATOR / NIX-TASKMASTER

## 1. VISIÓN ESTRATÉGICA
La migración desde React 19 hacia Svelte 5.55.0 será atómica, reversible y de alta fidelidad. Cada componente visual (UI) y cada página se mapeará con su equivalente en Svelte 5 (Runes), asegurando que consuma los mismos endpoints del backend (vía WebSocket o HTTP) y mantenga la estética de **Atracción Sistémica** (Dark Industrial Glass). 

## 2. DESGLOSE DE HITOS (EPICS)
Para evitar el caos, la migración se ejecutará en Fases Estrictas. Ningún Epic comenzará hasta que el anterior haya sido validado con `ChromeMCP`.

### 🧱 EPIC 0: CORE UI FOUNDATION (`planning/issues/MIG-000_core_ui.md`)
*   **Componentes a portar (React a Svelte):** `alert.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `combobox.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`, `textarea.tsx`, `toaster.tsx`.
*   **Objetivo:** Asegurar que Svelte V2 tenga la misma capacidad de renderizar *Glassmorphism* y animaciones nativas sin depender de librerías externas pesadas.

### 🏠 EPIC 1: AUTH & APP SHELL (`planning/issues/MIG-001_app_shell.md`)
*   **Directorios:** `src/pages/login`, `src/components/layout`.
*   **Endpoints:** `Methods.CONNECT`, Validación de Token (LocalStorage).
*   **Objetivo:** Montar el `Sidebar` multinivel, el `DynamicBackground` interactivo y el sistema de ruteo estático SPA.

### 📊 EPIC 2: TELEMETRY & OVERVIEW (`planning/issues/MIG-002_telemetry.md`)
*   **Directorios:** `src/pages/overview`, `src/pages/usage`, `src/pages/traces`, `src/pages/logs`.
*   **Endpoints:** `Methods.HEALTH`, `Methods.STATUS`, `Methods.QUOTA_USAGE`, `Methods.CRON_LIST`, `Methods.CHANNELS_STATUS`, `Methods.TRACES_LIST`, `Methods.LOGS_TAIL`.
*   **Objetivo:** Replicar las gráficas complejas (`Sparkline`, `AreaChart`) y tablas de alta densidad.

### 🧠 EPIC 3: AI OPERATIONS (El Corazón) (`planning/issues/MIG-003_ai_ops.md`)
*   **Directorios:** `src/pages/chat`, `src/pages/agents`, `src/pages/sessions`, `src/pages/pending-messages`.
*   **Endpoints:** `Methods.CHAT_STREAM`, `Methods.AGENTS_LIST`, `Methods.SESSIONS_LIST`, `Methods.SESSIONS_SUMMARY`.
*   **Objetivo:** El test de fuego para Svelte 5. Demostrar que puede re-renderizar hilos de mensajes Markdown largos y gestionar estado reactivo de sesiones más rápido que el Virtual DOM de React.

### 🔗 EPIC 4: CONNECTIVITY & KNOWLEDGE (`planning/issues/MIG-004_connectivity.md`)
*   **Directorios:** `src/pages/channels`, `src/pages/nodes`, `src/pages/vault`, `src/pages/knowledge-graph`, `src/pages/memory`.
*   **Objetivo:** Formularios complejos y representaciones de grafos.

### ⚙️ EPIC 5: SYSTEM & CONFIG (`planning/issues/MIG-005_system.md`)
*   **Directorios:** `src/pages/skills`, `src/pages/builtin-tools`, `src/pages/mcp`, `src/pages/tts`, `src/pages/cron`, `src/pages/hooks`, `src/pages/tenants-admin`, `src/pages/providers`, etc.
*   **Objetivo:** Formularios CRUD (Create, Read, Update, Delete) puros.

## 3. REGLA DE "PASO DE PÁGINA" (Strangler Routing)
El backend en `internal/webui/handler.go` se mantendrá híbrido durante todos los Epics:
1. `GET /chat` -> Sirve React.
2. `GET /svelte-v2/chat` -> Sirve Svelte (en pruebas).
3. Cuando Svelte-Chat pasa la auditoría `ChromeMCP`, el router de Go se invierte: `/chat` -> Svelte, `/react/chat` -> React (Fallback temporal).

---
*DOCUMENTO ACTIVO - NIX-0 PROTOCOL*