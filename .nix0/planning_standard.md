# 📏 Estándar de Planificación NIX-0 (Planning Standard)

Este documento define el protocolo estricto para la creación, gestión y evolución de planes de trabajo dentro del ecosistema NIX-0. La adherencia a este estándar es obligatoria para garantizar la integridad del proyecto y la coordinación del enjambre.

## 1. Jerarquía y Nomenclatura de Archivos
La carpeta `planning/` es el cerebro del proyecto. Su estructura debe ser predecible:

### 1.1. Documentos de Definición (Nivel 0)
- `identity.md`: Nombre, propósito y valores del proyecto.
- `PRD.md`: Documento de Requerimientos del Producto (Funcionalidades).
- `stack.lock`: El "Sello de Versiones". Lista inmutable de tecnologías y versiones.

### 1.2. El Roadmap (Nivel 1)
- `roadmap.md`: El mapa de fases cronológicas. Contiene los Milestones (M1, M2...).

### 1.3. Gestión de Tareas (Nivel 2)
Todas las tareas individuales deben residir en el subdirectorio `planning/issues/`:
- **Nomenclatura**: `TASK-[ID]_[SLUG].md`
- **Ejemplo**: `TASK-001_setup_backend_structure.md`

## 2. Estructura Interna de una Tarea (Atomic Task)
Cada archivo de tarea debe seguir este template estricto:

```markdown
# TASK-XXX: [Nombre Descriptivo]

## 🛠️ Metadatos
- **Estado**: [TODO | IN_PROGRESS | BLOCKED | DONE | VERIFIED]
- **Prioridad**: [URGENTE | ALTA | MEDIA | BAJA]
- **Asignado**: [nix-backend | nix-frontend | nix-devops | etc.]
- **Depende de**: [TASK-ID o "Ninguna"]
- **Fecha de Creación**: YYYY-MM-DD

## 🎯 Objetivo
[Breve descripción del resultado final deseado]

## 📝 Checklists (Regla de la Sombra / TDD)
- [ ] [DEV] Implementación: [Acción específica]
- [ ] [TEST] Validación: [Acción de prueba específica]

## 📦 Entregables Verificables
- [ ] [Path/al/archivo/o/directorio]
- [ ] [Resultado del test / Log]

## ⚠️ Riesgos y Bloqueos
- [Identificar posibles impedimentos]
```

## 3. Flujo de Aprobación y Ciclo de Vida
El **Taskmaster** es el único con autoridad para mover estados:

1. **DRAFT**: Tarea en diseño. No ejecutable.
2. **TODO**: Tarea aprobada por Taskmaster, dependencias cumplidas.
3. **IN_PROGRESS**: Agente trabajando. Se debe actualizar el `integrity_log.md` al iniciar.
4. **DONE**: Agente ha completado los entregables y el checklist de [DEV].
5. **VERIFIED**: El Taskmaster (o nix-auditor) confirma que los archivos existen físicamente y pasan los tests. Solo en este estado la tarea se considera "cerrada".

## 4. Gestión del `integrity_log.md`
Este archivo es el registro histórico de la realidad.

### Reglas de Escritura:
- **Timestamp**: Formato ISO `YYYY-MM-DD HH:MM`.
- **Actor**: Agente que realiza la acción.
- **Acción**: `CREATED`, `STARTED`, `COMPLETED`, `FAILED`, `VERIFIED`.
- **Referencia**: Siempre incluir el `TASK-ID`.

**Ejemplo de entrada:**
`2026-02-18 10:15 | nix-taskmaster | CREATED | TASK-001: Estructura inicial del backend`

## 5. Protocolo de "Realidad sobre Papel" (NIX-0 Core)
1. **Cero Deuda de Seguimiento**: Si un archivo se crea en `src/`, su tarea correspondiente en `planning/issues/` debe estar en `IN_PROGRESS` o `DONE`.
2. **Atomicidad**: Una tarea no debe superar las 100 líneas de código proyectadas. Si es mayor, se divide.
3. **Bloqueo Preventivo**: Si una tarea `DEPENDS_ON` otra que no está en estado `VERIFIED`, su estado cambia automáticamente a `BLOCKED`.

## 6. Estándar de la API de Tareas (Neural Dashboard)
El Dashboard visual es servido por el Panel Neón de Nix-Maker consumiendo `/api/tasks`. Todos los agentes deben asegurar que los datos enviados mediante `POST` o `PUT` sigan el esquema definido en `api_contracts.md`. No se permiten archivos Markdown para gestionar el estado global.

### 6.1. Estructura Obligatoria (Schema Canónico)
El archivo DEBE mantener los siguientes encabezados de nivel 2 (`##`) en este orden exacto:

1. `## 📊 Resumen Global`: Indicadores de progreso total, estado de salud del sistema y versión actual.
2. `## 🗺️ Roadmap de Fases`: Lista de Milestones y su estado (Completado, En curso, Pendiente).
3. `## 🏗️ Kanban Board`: El corazón del dashboard. Dividido en columnas:
   - `### 🔴 TODO`: Tareas aprobadas pendientes de inicio.
   - `### 🟡 IN PROGRESS`: Tareas que están siendo ejecutadas actualmente (incluyendo subtareas/issues activos).
   - `### 🔵 DONE / VERIFIED`: Tareas completadas y verificadas.
4. `## ⚡ Ejecución Actual`: Detalle del agente activo, tarea específica y progreso inmediato (logs rápidos).

### 6.2. Reglas de Actualización
- **Prohibición de Borrado**: No se deben eliminar secciones de nivel 2 ni alterar sus nombres.
- **Visibilidad de Subtareas**: Dentro del Kanban, cada entrada debe referenciar explícitamente el `TASK-ID` y listar sus subtareas/issues críticos debajo del item principal para garantizar visibilidad total.
- **Formato de Tarea**: `[TASK-ID] - [Breve Descripción] (@agente-asignado)`

---
*Protocolo generado por nix-taskmaster bajo directiva NIX-0.*
