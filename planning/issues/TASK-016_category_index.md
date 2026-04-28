# TICKET: TASK-016
## Título: Migración sessions - Columna Category Indexada

### 1. Resumen
Se debe implementar el soporte nativo para la columna `category` en todas las capas del manejador de sesiones. La migración 000060 ya ha creado la columna indexada en base de datos. Esta tarea sincroniza la lógica de negocio y los endpoints.

### 2. Cambios Requeridos
- **`internal/sessions/manager.go`**: Añadir el campo `Category string` al struct `Session` (JSON `category,omitempty`). Implementar el método `SetCategory(ctx context.Context, key, category string)` de la interfaz `SessionMetadataStore`.
- **`internal/store/pg/sessions.go`**: Asegurar que las queries SQL incluyan la lectura y escritura de `category`. Específicamente revisar que `loadFromDB` y la inserción de sesiones iniciales (en `getOrInit` o `GetOrCreate`) consideren esta columna.
- **`internal/store/sqlitestore/sessions.go`**: Sincronizar la lectura/escritura en SQLite (`loadFromDB`, inserts) para manejar la columna `category`, manteniendo la paridad estructural.
- **`internal/gateway/methods/sessions.go`**: Asegurar que el filtro `Category` que se recibe en `sessionsListParams` y se delega a `SessionListOpts` funciona correctamente contra la base de datos (se requerirá que las queries de listado en los stores respeten `opts.Category`).

### 3. Restricciones de Memoria y Rendimiento (Go 1.26.2 & Postgres)
- **Go 1.26.2 Memory Alignment**: El campo `Category` (tipo string) debe ubicarse inteligentemente en el struct `SessionData` / `Session` junto con otros strings para evitar bytes de padding ineficientes.
- **Postgres Indexing**: La agrupación en `handleSummary` debe apoyarse estrictamente en la base de datos, usando la consulta optimizada por el índice `idx_sessions_category_tenant`. Se prohíbe el uso de regex o `LIKE` en caliente para deducir categorías.

### 4. Plan de Pruebas (ChromeMCP) -> NIX-TESTER
El agente de QA (`nix-tester`) deberá validar la funcionalidad usando **ChromeMCP**:
1. **Navegación Visual**: Confirmar que el frontend renderiza la lista de sesiones filtrada por categoría usando los "tabs" o selectores rápidos (ej: "Support", "Inbound").
2. **Inspección de Red**: Verificar que la petición `sessions.list` viaja con el parámetro `{"category": "inbound"}` y la respuesta es rápida (gracias al índice DB).
3. **Métricas**: Validar que el endpoint `sessions.summary` devuelve un JSON con las keys `categories` correctamente tabuladas sin fallos de conversión de tipos.

### 5. Notas de Auditoría (Taskmaster)
Aprobado para ejecución. El worker (`generalist`) debe atenerse al plano detallado.
