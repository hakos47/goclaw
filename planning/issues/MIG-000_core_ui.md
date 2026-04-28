# 🧱 EPIC 0: CORE UI FOUNDATION (Svelte 5)

## Inventario de Componentes React (`ui/web/src/components/ui/`)
Cada componente debe ser implementado en `ui/svelte-v2/src/lib/components/ui/` utilizando `$props()`, `class-variance-authority`, `tailwind-merge` y snippets (`{@render children()}`).

| Componente React | Estado Svelte | Notas y Requerimientos Estéticos | Dependencias Svelte Equivalentes |
| :--- | :--- | :--- | :--- |
| `button.tsx` | 🟢 DONE | Variante "glass" y "neon". Hover states fluidos. | Ninguna |
| `card.tsx` | 🟢 DONE | Clase `@utility glass-panel` base. Bordes translúcidos. | Ninguna |
| `badge.tsx` | 🟢 DONE | Semántica de colores (Success, Warning, Error). | Ninguna |
| `alert.tsx` | 🔴 PENDING | Iconos Lucide, fondo rojo/amarillo translúcido. | `lucide-svelte` |
| `combobox.tsx` | 🔴 PENDING | Menú desplegable interactivo. Cerrar al perder foco. | Nativos o Melt UI (si es necesario) |
| `dialog.tsx` | 🔴 PENDING | Modales. Fondo `backdrop-blur` muy denso (`bg-black/80`). | `<dialog>` HTML5 API nativa |
| `input.tsx` | 🔴 PENDING | Borde translúcido, glow en `:focus`. | Ninguna |
| `textarea.tsx` | 🔴 PENDING | Auto-resize basado en contenido. | Ninguna |
| `tabs.tsx` | 🔴 PENDING | Píldoras animadas. Svelte Transitions para indicador activo. | Ninguna |
| `switch.tsx` | 🔴 PENDING | Reemplazo del "Smart Economy Toggle". Animación de Svelte. | Ninguna |
| `toaster.tsx` | 🔴 PENDING | Notificaciones apiladas (Hot-toast equivalente). | `svelte-sonner` o nativo |

## Pruebas de Validación (QA ChromeMCP)
1. Levantar una página de "Styleguide" (`/svelte-v2/styleguide`) que renderice todos los componentes.
2. Comprobar contraste de texto, estado "disabled" y estado ":hover".