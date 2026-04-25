# NIX-0 Strategic Blueprint: Security & Performance Audit (A2A Swarms)

## 🚨 ESTADO: BLOQUEO DEL PROTOCOLO (CRÍTICO)

El Oficial Auditor (`nix-auditor`) ha evaluado las propuestas de Arquitectura de Alta Eficiencia (A2A) y ha emitido un **Bloqueo de Seguridad**. No se autoriza la implementación de Memoria Compartida A2A hasta que se resuelvan las siguientes vulnerabilidades estructurales.

### 1. Falla Crítica en Aislamiento Multi-Tenant (Fuga de Datos)
- **Vulnerabilidad**: Actualmente, GoClaw no implementa **RLS (Row Level Security)** nativo en PostgreSQL (`migrations/`). El aislamiento entre organizaciones (Tenants) depende exclusivamente de que los desarrolladores recuerden incluir `WHERE tenant_id = $1` en cada consulta SQL y pasar el `ctx` correctamente.
- **Vector de Ataque A2A**: Al implementar `SharedMemoryContext` para que los agentes A2A se comuniquen velozmente, un simple error en el puntero de memoria o en la propagación del Contexto de Go (`context.Context`) resultará indefectiblemente en que un Agente del `Tenant A` acceda o contamine la memoria/base de datos del `Tenant B`.
- **Mitigación Obligatoria**: Implementar `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en todas las tablas de PostgreSQL y forzar la inyección del `tenant_id` a nivel de conexión de base de datos (SET LOCAL), eliminando el factor de error humano en el código Go.

### 2. Riesgo de "Memory Leak" por Enjambres Zombis (Deadlocks LLM)
- **Vulnerabilidad**: El código de orquestación actual (`internal/agent/`) carece de "Circuit Breakers" duros a nivel de sub-hilos.
- **Vector de Ataque A2A**: Si un Agente Líder despliega 10 subagentes (Map-Reduce) y entran en un bucle de alucinación (negociando infinitamente entre ellos), las *GoRoutines* jamás terminarán. Esto inflará la memoria RAM y consumirá el límite de tokens de la API, colgando el servidor Gateway entero en minutos.
- **Mitigación Obligatoria**: Implementar límites estrictos de `max_subagent_depth` y un `Swarm-level Timeout` absoluto que mate todas las rutinas hijas asociadas a un `RunID` padre sin importar su estado.

### 3. Evasión de Políticas de Seguridad vía MCPs
- **Vulnerabilidad**: La política de seguridad (`internal/tools/policy.go`) utiliza listas de denegación basadas en nombres estáticos de herramientas (ej. bloquear `exec` o `write_file` para subagentes).
- **Vector de Ataque A2A**: Si el usuario conecta un servidor MCP (Model Context Protocol) externo que expone una herramienta destructiva bajo un nombre distinto (ej. `mcp_host_terminal`), el subagente evadirá la restricción estática y obtendrá ejecución remota de código (RCE).
- **Mitigación Obligatoria**: Refactorizar el motor de políticas para usar **Dynamic Capabilities (RBAC)** en lugar de nombres de herramientas. Cada herramienta (interna o MCP) debe declarar sus *Capabilities* (ej. `CapMutating`, `CapHostAccess`) y las políticas bloquearán en base a estas capacidades.
