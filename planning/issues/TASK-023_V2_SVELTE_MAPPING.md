# TASK-023-V2: Svelte 5 Strangler Fig Migration (Pixel Perfect)

## 🎯 Objetivo Principal
Ejecutar una migración "Strangler Fig" desde la actual UI en React 19 hacia Svelte 5.55.0. La directiva estricta es una **Copia Pixel a Pixel**. No se permiten desviaciones estéticas ni funcionales. Cada página Svelte bajo la subruta `/svelte-v2/` debe ser indistinguible de su contraparte original de React.

---

## 🏗️ Hito 1: Componentes Base y Arquitectura (El Cimiento)
Antes de migrar cualquier página, la librería de componentes base debe ser replicada exactamente usando Svelte 5 Runes y Tailwind CSS.

### 1.1 UI Components (React `src/components/ui/` -> Svelte `src/lib/components/ui/`)
- `Button` -> `Button.svelte` (Respetar variantes: default, outline, ghost, destructive, etc.)
- `Card` -> `Card.svelte`, `CardHeader.svelte`, `CardTitle.svelte`, `CardContent.svelte`
- `Badge` -> `Badge.svelte`
- `Input` / `Textarea` -> `Input.svelte`, `Textarea.svelte`
- `Table` -> `Table.svelte`, `TableHeader.svelte`, `TableRow.svelte`, `TableCell.svelte`
- `Tabs` -> `Tabs.svelte`, `TabsList.svelte`, `TabsTrigger.svelte`, `TabsContent.svelte`
- `Dialog` (Modales) -> `Dialog.svelte`
- `DropdownMenu` -> `DropdownMenu.svelte`
- `PageHeader` -> `PageHeader.svelte`

### 1.2 Estado Global y Capa de Datos
- **React Context/Zustand** -> **Svelte 5 Runes**: Reemplazar la gestión de estado con `$state` y `$derived`. Crear stores en `src/lib/stores/`.
- **WebSocket (Crucial)**: Mapear el hook `useWsCall` de React a un módulo funcional/store en Svelte que mantenga la misma firma de envío y recepción de payloads (ej. `createWsStore()` usando Runes).

### 1.3 Layout Base
- `Sidebar`: Navegación lateral idéntica.
- `Topbar/Header`: Menús de usuario, breadcrumbs, selectores de tenant.
- `Main Content Area`: Contenedor principal con los mismos paddings y márgenes.

---

## 🗺️ Hito 2: Mapeo y Migración de Rutas Core (The Pages)
Rutas principales a migrar bajo el prefijo `/svelte-v2/` para pruebas en paralelo ("Strangler Fig").

- **Dashboard / Resumen**
  - React: `/overview` -> Svelte: `/svelte-v2/overview`
  - *Dependencias*: Tarjetas de métricas, gráficos base, feeds de actividad.
- **Gestión de Agentes**
  - React: `/agents` -> Svelte: `/svelte-v2/agents`
  - *Dependencias*: Tablas de datos, avatares, modales de creación/edición.
- **Gestión de Equipos**
  - React: `/teams` -> Svelte: `/svelte-v2/teams`

---

## 💬 Hito 3: Comunicación y Chat
- **Interfaz de Chat (Core AI Interaction)**
  - React: `/chat` -> Svelte: `/svelte-v2/chat`
  - *Dependencias*: Burbujas de mensajes, input de texto enriquecido, streaming de texto vía WebSocket, renderizado de Markdown/Bloques de código.
- **Sesiones**
  - React: `/sessions` -> Svelte: `/svelte-v2/sessions`
- **Canales**
  - React: `/channels` -> Svelte: `/svelte-v2/channels`

---

## ⚙️ Hito 4: Configuración Avanzada y Administración
- **Habilidades (Skills)**
  - React: `/skills` -> Svelte: `/svelte-v2/skills`
- **Integraciones MCP**
  - React: `/mcp` -> Svelte: `/svelte-v2/mcp`
- **Administración de Tenants**
  - React: `/admin/tenants` -> Svelte: `/svelte-v2/admin/tenants`
- **Configuración General**
  - React: `/config` -> Svelte: `/svelte-v2/config`

---

## 🛡️ Checkpoints de Validación (ChromeMCP & nix-tester)
El Agente Tester (`nix-tester`) usará `ChromeMCP` para garantizar la directiva "Pixel Perfect".

### Flujo de Validación por Página:
1. **Captura Base (React)**: Navegar a `http://localhost:PORT/ruta` y tomar screenshot completo.
2. **Captura Candidata (Svelte)**: Navegar a `http://localhost:PORT/svelte-v2/ruta` y tomar screenshot completo.
3. **Análisis de Discrepancias**: Evaluar paddings, colores, tipografía (peso y tamaño), bordes y sombras. *Si hay diferencia visual > 1%, la tarea regresa a `IN PROGRESS`.*
4. **Validación de Interacciones**:
   - Hacer clic en menús desplegables y verificar animaciones/posición.
   - Abrir modales (Dialogs) y verificar el overlay de fondo (`backdrop-blur`).
   - Cambiar de pestaña (Tabs) y verificar transiciones de contenido sin recarga.
5. **Validación de Red/WebSocket**:
   - Monitorear que los eventos emitidos por el UI de Svelte sean idénticos en payload JSON a los de React.
   - Confirmar reactividad en tiempo real (ej. cuando llega un mensaje de chat, el scroll baja automáticamente igual que en React).
