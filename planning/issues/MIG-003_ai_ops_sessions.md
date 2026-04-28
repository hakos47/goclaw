# 🧠 EPIC 3: AI OPERATIONS - FASE 1 (Vista de Sesiones)
**TICKET:** MIG-003_sessions_view
**ESTRATEGIA:** Migración Atómica "Pixel-Perfect Líquida"

## 1. VISIÓN TÉCNICA
La página de "Sessions" (`/sessions`) es el historial forense del sistema. La versión actual de React sufre de constricciones de ancho (no aprovecha monitores Ultrawide) y un Virtual DOM pesado. La migración a Svelte 5 (V2) debe garantizar un diseño 100% responsive (ancho líquido `w-full` sin `max-w-7xl`), renderizado instantáneo de cientos de filas y la estética *Dark Industrial Glass*.

## 2. MAPEO DE DEPENDENCIAS (React -> Svelte 5)

### A. Endpoints & Estado (Backend)
- **React Hook:** `useSessions` (Llama a `Methods.SESSIONS_LIST`, `DELETE`, `RESET`, `PATCH`, `PREVIEW`).
- **Equivalente Svelte (`ws.svelte.ts`):** 
  - Usaremos `useWsCall<SessionListPayload>("sessions.list")` para cargar las sesiones con paginación (`limit`, `offset`) y filtrado (`category`).
  - Crearemos un hook reactivo similar `$derived` para calcular `totalPages` y manejar el `search` en el cliente si es necesario, o pasar el query param al backend.

### B. Componentes UI (Inventario a Replicar)
Todos estos deben ser portados o re-usados de `ui/svelte-v2/src/lib/components/`:
1. **`PageHeader.svelte`**: (Ya migrado en Hito 1). Se actualizará para mostrar dinámicamente el icono según la categoría (`Target` para inbound, `LifeBuoy` para support, etc.).
2. **`SearchInput.svelte`**: Input con icono de lupa, estilo *Glassmorphism* (`bg-white/5 border-white/10 focus:ring-goclaw-neon-purple`).
3. **`EmptyState.svelte`**: Contenedor centrado con icono translúcido cuando no hay sesiones.
4. **`TableSkeleton.svelte`**: Efecto de carga "shimmer" (pulsación) usando gradientes neón oscuros para disimular la latencia de red.
5. **`Pagination.svelte`**: Botones `glass-panel` para navegar `Prev` y `Next`, sincronizados con el estado de la página.
6. **`SessionRow.svelte`**: Fila de la tabla con `hover:bg-white/[0.02]`.
7. **`ContextUsageBar.svelte`**: Barra de progreso vital. 
   - *Estética NIX-0:* En lugar de un color sólido, usaremos `bg-gradient-to-r` (Verde para <60%, Ámbar para >60%, Rojo Neón para >85%). Reflejará el uso de tokens contra el `contextWindow`.

### C. Enrutamiento Svelte (SPA)
El componente principal será `ui/svelte-v2/src/pages/Sessions.svelte`.
Será montado condicionalmente en `App.svelte` cuando la ruta sea `/sessions`. Se leerán los parámetros de la URL (`?category=evolution`) nativamente.

## 3. REGLAS DE DISEÑO LÍQUIDO Y ATRACCIÓN SISTÉMICA
1. **Containerización Libre:** A diferencia de React, el contenedor principal en `App.svelte` para esta vista dejará de estar limitado por `max-w-7xl`. Ocupará el espacio disponible (`flex-1 w-full`).
2. **Tipografía Cinética:** La columna de *Tokens* y *Mensajes* usará tipografía monoespaciada estricta (`font-mono`) para alineación perfecta de cifras.
3. **Badges:** Se reutilizará el componente `Badge.svelte` (migrado en Hito 1) para las etiquetas de Canal y Agente.

## 4. CHECKPOINTS DE VALIDACIÓN (ChromeMCP)
- [ ] **CP-1:** El endpoint de WebSockets devuelve las sesiones y se pintan en pantalla en `< 50ms`.
- [ ] **CP-2:** La barra `ContextUsageBar` escala dinámicamente su color (verde/naranja/rojo) con bordes neón dependiendo de la presión de contexto.
- [ ] **CP-3:** Al redimensionar la ventana (Ultrawide), la tabla se estira líquidamente sin romper columnas.
- [ ] **CP-4:** Cero errores de TypeScript y Cero advertencias de A11y en consola.

---
*Blueprint Listo para Ejecución por el Trabajador (Generalist).*