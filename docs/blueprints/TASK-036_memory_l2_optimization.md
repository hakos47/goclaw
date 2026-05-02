# TASK-036: Optimización de Memoria L2 (Dreaming Pipeline)

## 1. Análisis del Estado Actual

### Flujo de Consolidación
1. Al completarse una sesión (`session.completed`), el `episodicWorker` genera un resumen y publica el evento `episodic.created`.
2. El evento `episodic.created` es consumido concurrentemente por dos workers:
   - `semanticWorker`: Extrae entidades y relaciones para el Knowledge Graph llamando a un LLM inmediatamente.
   - `dreamingWorker`: Evalúa si se debe consolidar la memoria a largo plazo llamando a un LLM y guardando el resumen en la BD vectorial.

### Problemas Detectados
1. **Condición de Carrera y Competición de Recursos**: Ambos workers (Semantic y Dreaming) se activan ante el mismo evento y hacen uso intensivo del LLM y escrituras en base de datos al mismo tiempo. Esto eleva los tiempos de latencia y dispara errores de "rate limiting" o agota el pool de conexiones de PostgreSQL.
2. **Falla del Debounce Multi-Tenant**: El `dreamingWorker` implementa una política de debounce (por defecto 10 minutos) usando un `sync.Map` en memoria local (`lastRun`).
   - En una arquitectura escalada horizontalmente (múltiples réplicas en Docker/K8s), el `sync.Map` no es global. Si una réplica ya procesó el resumen de un usuario, otra réplica distinta no lo sabe y consolidará nuevamente, provocando duplicación masiva de consumos y degradación grave.
3. **Bloqueo Ineficiente**: Las validaciones de umbrales (ej: `CountUnpromoted`) ocurren en cada réplica independientemente, saturando la BD si hay ráfagas de mensajes.

## 2. Propuesta de Optimización Arquitectónica (Blueprint)

### A. Refactorización del Tracker de Debounce (Estado Distribuido)
Es OBLIGATORIO eliminar el `sync.Map` en `internal/consolidation/dreaming_worker.go` y reemplazarlo por un mecanismo de control de estado distribuido.
- **Implementación**: Utilizar un Lock distribuido apoyado en Redis (a través de la abstracción existente en el Gateway) o mediante PostgreSQL (`INSERT ... ON CONFLICT ... UPDATE ... RETURNING`).
- **Beneficio**: Garantiza que un mismo par `agentID:userID` respete el tiempo de `Debounce` cluster-wide, previniendo que distintas instancias procesen la consolidación de forma simultánea.

### B. Desacoplamiento de Pipelines (Jittering / Deferred Execution)
Para evitar que el LLM sea llamado dos veces en el mismo milisegundo por `semanticWorker` y `dreamingWorker`:
1. **Introducción de Jittering**: En `dreaming_worker.go`, antes de llamar a la base de datos o al LLM, introducir un retraso con *Jitter* (ej. 10 a 60 segundos) para que la extracción semántica finalice antes de iniciar el "sueño".
2. **(Alternativa recomendada)** Desacoplar el trigger: Dejar que `episodic.created` encole un evento de `dreaming.scheduled` en una cola de Redis con retraso, o simplemente migrar el `dreamingWorker` a un Cron Job (vía `gateway_cron.go`) que barra la BD buscando agentes con `Unpromoted >= Threshold` cada 15 minutos de manera distribuida.

### C. Ajustes en `dreaming_config.go`
Se requiere actualizar el parseo de configuración en `resolvedDreamingConfig` para soportar mitigaciones dinámicas en entornos Multi-Tenant:
```go
type resolvedDreamingConfig struct {
    Enabled        bool
    Debounce       time.Duration
    Jitter         time.Duration // Nueva propiedad para desfasar la ejecución concurrente
    Threshold      int
    VerboseLog     bool
}
```
*Se debe asegurar que al mergear la configuración desde la BD del Tenant (`mergeDreamingConfig`), se establezcan mínimos seguros (ej. un Debounce nunca menor a 5 minutos).*

## 3. Handover / Criterios de Aceptación para Workers
- [ ] Eliminar el uso de `sync.Map` en `internal/consolidation/dreaming_worker.go`.
- [ ] Implementar un Lock/Debounce distribuido (usando Redis PubSub/Locks o PostgreSQL).
- [ ] Introducir estrategia de *Jitter* o cola diferida para separar temporalmente la ejecución del `dreamingWorker` de la extracción inmediata del `semanticWorker` (que lee el Knowledge Graph).
- [ ] Modificar `internal/consolidation/dreaming_config.go` y su respectiva estructura de config para incluir `JitterMs`.
- [ ] Todos los tests de la pipeline de consolidación (`workers_test.go`) deben ser actualizados y pasar correctamente.