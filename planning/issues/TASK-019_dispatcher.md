# Blueprint: TASK-019 (Dispatcher Multi-Modelo - Economy vs Reasoning)

## 1. Visión Técnica y Objetivo
Implementar un enrutador inteligente de LLMs (Dispatcher) embebido en GoClaw para decidir de forma autónoma entre un modelo "Economy" y uno "Reasoning". Esta decisión se basará en heurísticas simples para habilitar un ahorro masivo de tokens. Los ahorros se mostrarán en tiempo real mediante métricas visuales atractivas en la UI de Svelte 5.

## 2. Inyección y Modificación Backend (Go 1.26.2)
**Archivo Objetivo Crítico:** `internal/agent/loop.go` (o el interceptor equivalente en `internal/gateway/methods/chat.go`).
*Punto de inyección:* Antes de invocar la interfaz del proveedor LLM, durante la conformación de la request.

**Estructuras y Datos:**
- Modificar el modelo de base de datos (Ent/SQL) para incluir el campo `EconomyRouting bool` en la tabla `channels`.
- Incluir este flag en la memoria caché del canal para garantizar acceso inmediato.

**Lógica de Enrutamiento O(1):**
- La resolución del modelo debe ocurrir estrictamente en memoria RAM sin consultas a DB.
- **Heurística Propuesta:**
  ```go
  var selectedModel string
  if channelConfig.EconomyRouting && len(prompt) < 200 && !containsCodeTokens(prompt) {
      selectedModel = provider.EconomyModelID // ej: gemini-3-flash
  } else {
      selectedModel = provider.ReasoningModelID // ej: gemini-3.1-pro
  }
  ```
- Este bloque lógico asegura un consumo < 1ms de CPU y cero network hops previos al disparo.
- **Métricas:** Si se usa `EconomyRouting`, inyectar un valor en los traces/sesiones o incrementar un contador Redis para calcular el "Token Saving", lo cual alimentará el Dashboard.
- **Fallback Tolerante a Fallos:** Si el llamado al modelo Economy falla (timeout/429), capturar el error y reintentar silenciosamente con el Reasoning model, garantizando 0 impacto al usuario.

## 3. Interfaz de Atracción y Métricas (Svelte 5)
**Configuración de Canal:**
- Archivo: `ui/web/src/pages/channels/channel-details.svelte` (o equivalente).
- Añadir un control visual tipo Toggle/Switch: **Smart Economy Routing**.
- Debe ofrecer feedback instantáneo (mutación optimista) y SPA routing (<100ms de animación).

**Visualización de Beneficios (Dashboard):**
- Archivo: `ui/web/src/pages/overview/overview-page.svelte` (o equivalente).
- Añadir un `AreaChart` con estilo "Glassmorphism" (clase de Tailwind: `backdrop-blur-md` con bordes de cristal translúcido o neón).
- Métrica a mostrar: "Tokens ahorrados hoy" o "Economía de Escala".

## 4. Criterios de Aceptación ChromeMCP (nix-tester)
El Agente de Pruebas ejecutará los siguientes pasos:
1. Activar el toggle "Smart Economy Routing" para el canal activo (ej. WhatsApp).
2. Enviar prompt de prueba simple (ej. "Hola") y verificar en logs que se usa un modelo Economy (Flash).
3. Enviar prompt complejo de desarrollo (ej. "Escribe un script en Rust") y verificar en logs que se escala a un modelo Reasoning (Pro).
4. Validar en la pantalla "Overview" que las métricas de tokens ahorrados registren incremento.
5. Simular fallo de API del modelo Economy y confirmar que el enrutamiento realiza fallback silencioso hacia Pro sin errores 500 en la UI.