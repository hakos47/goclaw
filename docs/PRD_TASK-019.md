# 📜 PRODUCT REQUIREMENTS DOCUMENT (PRD) - ATRACCIÓN SISTÉMICA
**TICKET:** TASK-019 (Dispatcher Multi-Modelo - Economy vs Reasoning)
**AUTOR:** NIX-DISCOVERY [Override by NIX-ORCHESTRATOR]

## 1. VISIÓN DEL MVP
Un enrutador inteligente de LLMs (Multi-Model Dispatcher) embebido en el núcleo de GoClaw. Este sistema interceptará cada petición del usuario y, basándose en la configuración del canal (ej. WhatsApp) y heurísticas simples (como la complejidad o longitud del historial), decidirá de forma autónoma si enviar el prompt a un modelo "Economy" (ej. `gemini-3-flash`) para velocidad extrema y bajo coste, o a un modelo "Reasoning" (ej. `gemini-3.1-pro`) para tareas que requieran código o análisis profundo.

## 2. USER JOURNEY CRÍTICO
1.  **Configuración Visual:** El administrador entra en el Dashboard (Svelte 5) -> "Channels".
2.  **Toggle de Economía:** Para el canal "hakos-p1" (WhatsApp), activa un elegante switch: *“Smart Economy Routing”*.
3.  **Transparencia (Feedback):** Al chatear por WhatsApp, si el usuario pide "Hola", el sistema usa Flash (respuesta en 400ms). Si pide "Escribe un script en Rust", el sistema usa Pro (respuesta en 2s). 
4.  **Recompensa Cognitiva:** En el Dashboard -> "Overview", el administrador ve un gráfico AreaChart (Glassmorphism) mostrando los "Tokens ahorrados hoy" gracias al enrutamiento dinámico.

## 3. TRADUCCIÓN DE INTELIGENCIA (Estética & Tech)
*   **Svelte 5.55.0 / Tailwind 4.2.4:** 
    *   Implementar el *Smart Economy Toggle* en la vista de configuración del canal (`ui/web/src/pages/channels/channel-details.tsx`).
    *   Añadir un componente de métricas "Savings" en el Overview (`ui/web/src/pages/overview/overview-page.tsx`) utilizando las librerías gráficas actuales, con bordes translúcidos (`backdrop-blur-md`).
*   **Go 1.26.2 Backend:** 
    *   En `internal/agent/loop.go` o `internal/gateway/methods/chat.go`, interceptar la inyección del modelo. 
    *   Si el canal tiene `EconomyRouting = true`, usar un modelo ligero de la base de datos de proveedores. Si no hay modelo de economía configurado, hacer fallback al modelo principal.

## 4. CRITERIOS DE ACEPTACIÓN (Harness de Atracción - ChromeMCP)
1.  **Funcionalidad:** Enviar un mensaje de prueba simulando WhatsApp con EconomyRouting activado. Verificar en los logs o traces que se utilizó el modelo económico.
2.  **Sensación de Uso (UX):** El *toggle* en la interfaz de Svelte debe tener una animación `< 100ms`. Al guardar la configuración del canal, no debe haber recargas completas de la página (SPA routing).
3.  **Fallback Cero-Fallos:** Si el modelo "Economy" da timeout o *Rate Limit*, el sistema debe intentar silenciosamente con el modelo "Reasoning" sin que el usuario reciba un error.

---
*"Una idea sin un PRD técnico es solo ruido. En NIX, diseñamos herramientas de precisión, no juguetes."*