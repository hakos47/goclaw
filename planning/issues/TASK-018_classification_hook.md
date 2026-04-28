# TASK-018: Hook de Pre-procesamiento de Clasificación

## 1. Objetivo Técnico (Mission)
Crear un hook en el backend de Go (`internal/hooks/handlers/classification.go` o un handler similar en `internal/hooks/`) que intercepte la primera interacción de una nueva sesión, la clasifique (usando un LLM ligero o reglas estáticas) y actualice el campo `Category` usando el método `SetCategory` de `internal/sessions/store.go` (implementado en TASK-016).

## 2. Restricciones de Memoria/Rendimiento (NIX-0 v6.6 Strict Rules)
- **No Bloqueante:** El procesamiento debe realizarse en Goroutines (Go 1.26.2) o a través del Event Bus para **no penalizar la latencia** de la primera respuesta al usuario.
- **Green AI:** Si se utiliza LLM (ej. modelo `economy`), debe invocarse con un prompt altamente optimizado (low-tokens) y limitador de latencia. Si es posible, emplear un fallback de reglas estáticas (Regex / Keywords) antes de invocar la red neuronal.

## 3. Dependencias y Mapeo del Pipeline (Codebase Investigator)
- **Trigger Actual:** Ya existe un trigger síncrono parcial en `cmd/gateway_consumer_normal.go` (líneas 100-120 aprox) que emite `hooks.EventUserPromptSubmit` cuando `sessData.Category == ""`. 
- **Implementación del Hook:** 
  1. Crear un Handler específico de Clasificación en `internal/hooks/handlers/classification_handler.go`.
  2. **Refactorización de Pipeline:** Modificar la llamada actual `deps.HookDispatcher.Fire(ctx, hEv)` en `cmd/gateway_consumer_normal.go` para que sea **asíncrona** o que dispare un evento en el `msgBus`.
  3. El consumer del hook ejecutará la inferencia, y una vez tenga el resultado, llamará de forma independiente a `deps.SessStore.SetCategory(ctx, sessionKey, res.UpdatedCategory)`.
  4. Emitir un evento WebSocket (si está cableado el channel streaming para sessions) para notificar al frontend que los metadatos de la sesión mutaron.

## 4. Plan de Pruebas y Validación (ChromeMCP / nix-tester)
- **Simulación (Backend):** Utilizar `nix-tester` (o testing e2e) para inyectar el primer mensaje vía canal (ej. test channel) y observar el tiempo que tarda la goroutine en clasificar y hacer commit de la categoría en DB.
- **Verificación UI (Dashboard Svelte 5.55.0):** 
  - La interfaz debe hidratar la vista sin recargar la página.
  - La sesión debe aparecer en su categoría asignada ("support", "technical", etc.) en `< 200ms` posterior a la respuesta del LLM de clasificación.
- **Métricas Criterio de Éxito:** Latencia inyectada al *first byte* de respuesta del bot debe ser 0ms (debido a asincronía).
