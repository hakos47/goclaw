# Blueprint: TASK-017 Context Router e Integración de Pruning Diferenciado

## 1. Objetivo
Implementar una lógica de retención de historial diferenciada según el canal de origen (`channelType`), optimizando el consumo de tokens y ajustando la profundidad del contexto a las características de la plataforma.

## 2. Auditoría de Dependencias
- **`internal/agent/loop_history.go` (`buildMessages`)**: Es el punto de entrada para la construcción del contexto de la sesión. Recibe el parámetro `channelType`. Aquí se llama a `limitHistoryTurns(history, historyLimit)`.
- **`internal/agent/loop_pipeline_callbacks.go`**: Expone `channelType` hacia la etapa de poda (`makePruneMessages(req.ChannelType)`).
- **`internal/agent/pruning.go` (`pruneContextMessages`)**: Ya posee una lógica de "soft trim" / "hard clear" para el contenido de los `tool_results` basada en `channelType` (ej. `whatsapp`, `facebook`), pero no limita la cantidad total de mensajes conservados.

## 3. Modificaciones Propuestas (Blueprint)

### A. Modificación de `buildMessages` en `internal/agent/loop_history.go`
Antes de llamar a `limitHistoryTurns`, debemos interceptar el parámetro `historyLimit` y sobreescribirlo de forma dinámica según `channelType`.

**Ejemplo de Lógica a Implementar:**
```go
// En internal/agent/loop_history.go, dentro de Loop.buildMessages

effectiveLimit := historyLimit

switch channelType {
case "whatsapp", "telegram":
    effectiveLimit = 15 // Contexto corto para mensajería instantánea
case "ws", "webui":
    effectiveLimit = 50 // Contexto profundo para dashboards e interfaces ricas
default:
    if effectiveLimit <= 0 {
        effectiveLimit = 30 // Valor por defecto seguro si no se provee límite
    }
}

// Reemplazar la llamada original:
trimmed := limitHistoryTurns(history, effectiveLimit)
```

### B. Pruebas Unitarias (NIX-0)
El agente ejecutante (`generalist`) DEBE modificar o agregar pruebas en `internal/agent/loop_history_test.go`.

**Plan de Pruebas:**
1.  **TestWhatsAppLimit:** Llamar a `buildMessages` con `channelType = "whatsapp"`, proveyendo un historial de 30 turnos. Verificar que `trimmed` retorne exactamente los últimos 15 turnos.
2.  **TestWSLimit:** Llamar a `buildMessages` con `channelType = "ws"`, proveyendo un historial de 60 turnos. Verificar que se conserven 50 turnos.
3.  **TestDefaultLimit:** Llamar a `buildMessages` con un `channelType` no registrado (ej. `"api"`) y verificar que el límite provisto (o el valor por defecto) se respete correctamente.

## 4. Pasos de Ejecución para el Worker
1. Abrir `internal/agent/loop_history.go`.
2. Ubicar la llamada a `limitHistoryTurns`.
3. Inyectar la evaluación de `channelType` (switch/case) para mutar `historyLimit` en `effectiveLimit`.
4. Abrir `internal/agent/loop_history_test.go`.
5. Escribir las pruebas que instancian un `Loop` falso y llaman a `buildMessages`, midiendo el tamaño del arreglo de mensajes resultante.
6. Ejecutar los tests (`go test ./internal/agent/... -v`).
7. Confirmar el DOD en `/api/tasks`.
