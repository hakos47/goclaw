# 🌐 NIX-0 PROTOCOL: ECOSYSTEM & LIBRARIES (GoClaw)

Este documento define las librerías industriales aprobadas (AAA) que conforman el ecosistema del orquestador GoClaw, en estricta alineación con el **Stack Lock-in**. Toda nueva inclusión debe respetar la directiva de bajo consumo (Green AI) y el paradigma Zero-Docker-Overhead para el backend.

## ⚙️ 1. BACKEND CORE (GOLANG)
*   **Routing & HTTP:** `github.com/labstack/echo/v4`
    *   *Rationale:* Extremadamente rápido, footprint de memoria mínimo, middleware sencillo.
*   **WebSockets:** `github.com/gorilla/websocket`
    *   *Rationale:* El estándar de facto en Go para conexiones persistentes de bajísima latencia.
*   **CLI & TUI:** `github.com/spf13/cobra` y `github.com/charmbracelet/bubbletea`
    *   *Rationale:* Interfaz de línea de comandos robusta y TUI embebido avanzado sin arrastrar dependencias pesadas de GUI.

## 💾 2. DATABASE & PERSISTENCE
*   **Driver PostgreSQL:** `github.com/jackc/pgx/v5`
    *   *Rationale:* Driver nativo con soporte superior para características avanzadas de Postgres y alto rendimiento.
*   **Database Abstraction (ORM-lite):** `github.com/jmoiron/sqlx`
    *   *Rationale:* Mapeo estructurado de structs sin el overhead y la magia oscura de un ORM completo (como GORM). Ideal para rendimiento.
*   **Migraciones:** `github.com/golang-migrate/migrate/v4`
    *   *Rationale:* Gestión de esquemas robusta y predecible, inyectable desde Go.

## 🔗 3. INTEGRATION & CHANNELS
*   **WhatsApp API:** `go.mau.fi/whatsmeow`
    *   *Rationale:* Librería nativa de Go para WhatsApp Web API. No requiere Puppeteer/Headless Chrome para funcionar, lo que ahorra ~300MB de RAM por sesión.
*   **Model Context Protocol (MCP):** `github.com/mark3labs/mcp-go`
    *   *Rationale:* Integración directa para conectar al orquestador con servidores de herramientas externas en el estándar MCP.
*   **Browser Automation (Headless):** `github.com/go-rod/rod`
    *   *Rationale:* Automatización de Chrome sin dependencias en CGO. Más ligero que chromedp.
*   **Event Cron/Scheduling:** `github.com/adhocore/gronx`
    *   *Rationale:* Planificador ligero integrado directamente en el ciclo de ejecución.

## 🎨 4. FRONTEND EMBEBIDO
*   **Core UI:** Svelte 5
    *   *Rationale:* Compila a Vanilla JS. Sin Virtual DOM. Archivos resultantes muy pequeños (KB en lugar de MB), perfectos para ser embebidos en el binario de Go usando `embed`.
*   **Styling:** Tailwind CSS (v3/v4)
    *   *Rationale:* Estilos utilitarios que se purgan en tiempo de compilación.

## 🛡️ 5. OBSERVABILITY & SECURITY
*   **Tracing:** `go.opentelemetry.io/otel` (OpenTelemetry)
    *   *Rationale:* Estándar industrial para trazabilidad de ejecuciones de Agentes y tiempos de LLMs.
*   **Scripting Seguro (Sandboxing):** `github.com/dop251/goja` o `github.com/google/cel-go`
    *   *Rationale:* Evaluación de expresiones seguras en tiempo de ejecución sin permitir ejecución de código arbitrario.

---
*Firma Criptográfica:* NIX-INTEL-SEARCH [Bypass by NIX-ORCHESTRATOR / gemini-3.1-pro-preview]*
*Estado:* APPROVED & LOCKED