# Blueprint: TASK-022 - React 19 Upgrade & Dark Industrial Glass UI

## 🎯 Objetivo
Mejorar y modernizar la estética de la aplicación React 19 + Tailwind 4 para lograr una "Atracción Sistémica" mediante un diseño "Dark Industrial Glass", **sin romper ninguna lógica ni flujo existente**. Todo el estado, hooks y ruteo deben permanecer intactos.

## 🎨 Paleta y Estilo Base (Dark Industrial Glass)
- **Fondo Global (Dark)**: `#0a0a0a` (Negro industrial profundo).
- **Paneles y Tarjetas**: `backdrop-blur-xl bg-white/5 border border-white/10`.
- **Acentos**: Neón Púrpura (`#d946ef` / radiant purple) y Cian.
- **Transiciones**: Suaves, `transition-all duration-300`.

## 🛠️ Instrucciones de Implementación (Para el Worker)

### 1. `ui/web/src/index.css` (Tematización Tailwind 4)
- **Misión**: Sobrescribir las variables CSS de `.dark`.
- **Cambios**:
  - `--background`: Actualizar a oklch para que represente `#0a0a0a` o directamente usar rgb.
  - `--sidebar`: Debe ser transparente o semi-transparente para que el blur funcione. Ej: `rgba(255,255,255,0.02)`.
  - `--sidebar-border`: `rgba(255,255,255,0.1)`.
  - `--primary`: Neón púrpura (oklch equivalente a `#d946ef`).
  - Definir una clase de utilidad `@utility glass-panel { @apply backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl shadow-2xl; }` si Tailwind 4 lo permite, o aplicarlo directamente en los componentes.

### 2. `ui/web/src/components/layout/sidebar.tsx`
- **Misión**: Modernizar el Sidebar para que parezca un panel de cristal flotante.
- **Cambios**:
  - En la etiqueta `<aside>`, modificar las clases de fondo y borde:
    - Cambiar `bg-sidebar` a un fondo transparente con blur: `bg-black/40 backdrop-blur-2xl border-white/10`.
  - Los ítems del menú (`SidebarItem`) al estar activos o en hover, deben usar brillos púrpuras tenues (`hover:bg-purple-500/10 hover:text-purple-400`).

### 3. `ui/web/src/pages/overview/overview-page.tsx`
- **Misión**: Transformar el Dashboard en una interfaz de cristal de alto rendimiento.
- **Cambios**:
  - El contenedor principal puede tener un fondo sutil o un gradiente radial oscuro.
  - Las tarjetas (`StatCard`, `SystemHealthCard`, etc.) deben adoptar la estética Glass.
  - No modificar la lógica de WebSocket (`useWsCall`, `useWsEvent`) ni el renderizado condicional.
  - Los Tabs (`TabsList`, `TabsTrigger`) deben lucir como píldoras de cristal o selectores de neón.
  - Modificar los componentes base (ej. `src/components/ui/card.tsx`, si existen) o pasar clases directamente a los componentes del overview para aplicar `backdrop-blur-xl bg-white/5 border-white/10`.

### 4. `ui/web/src/components/ui/*` (Componentes Base)
- **Misión**: Propagar el estilo Glass a tarjetas, botones y diálogos.
- **Cambios**:
  - Localizar `Card` (`ui/web/src/components/ui/card.tsx`) y cambiar sus clases default a `bg-white/5 backdrop-blur-md border-white/10 text-foreground`.
  - Localizar `Button` (`ui/web/src/components/ui/button.tsx`) y darle variantes neón o estilos sutiles semitransparentes en su variante por defecto/secundaria.

## ⚠️ Restricciones Estrictas
1. **NO TOCAR** la lógica de negocio, hooks (`useAuthStore`, `useWsCall`, etc.).
2. **NO CAMBIAR** Svelte, esto es un Rollback a React. Svelte queda descartado para este panel.
3. El Orquestador o Worker que ejecute esto debe realizar un build exitoso y verificar que todo levanta correctamente.

---
**[FIN DEL BLUEPRINT]**
