# TASK-015: Refactorización de la WebUI - Sidebar Multinivel

## 🎯 Objetivo Técnico
Refactorizar la barra lateral (Sidebar) del panel de administración (`ui/web/src/components/layout/sidebar.tsx`) para consumir el nuevo endpoint de resúmenes `/api/v3/sessions/summary`.

## 🛠 Requisitos y Directivas (NIX-0 v6.6)
*   **Atracción Sistémica**: UI moderna (Tailwind 4.2.4, Glassmorphism o alto contraste) con extrema eficiencia. Svelte 5.55.0 con hidratación instantánea exigida en las directivas.
*   **Dependencias Actuales**: El sidebar en React (`sidebar.tsx`) utiliza `useSessionsSummary` y renderiza categorías (inbound, support, ops, evolution) con conteos numéricos (badges) sobre un background sólido (`bg-sidebar`).
*   **Transición**: Se requiere adaptar o portar la lógica a los estándares dictados, maximizando el Glassmorphism y la jerarquía visual de categorías de sesiones (inbound, support, ops, evolution).
*   **Eficiencia (Green AI)**: LCP (Largest Contentful Paint) < 1.2s.

## ⚙️ Plan de Acción (Blueprint)
1. **Auditoría de Estado de UI**:
    *   Actualmente el `sidebar.tsx` utiliza componentes estilizados con Tailwind (`cn`).
    *   Extrae datos sincrónicos o por hook de `/api/v3/sessions/summary` vía `useSessionsSummary`.
2. **Refactorización Visual y de Framework**:
    *   *Soporte Multilenguaje/Framework (Svelte 5 / React)*: La interfaz requiere una refactorización de estilos a **Glassmorphism**. Eliminar el background sólido `bg-sidebar` o `bg-background` e implementar clases translúcidas como `backdrop-blur-md bg-white/10 dark:bg-black/20`.
    *   *Jerarquía de Categorías*: Las categorías debajo de "Conversations" (Inbound, Support, Ops, Evolution) deben ser colapsables, animadas con transiciones suaves, y mostrar el badge devuelto por la API.
3. **Optimización de Hidratación y LCP**:
    *   Desacoplar la petición del resumen del renderizado inicial del layout para evitar bloqueos del main thread.
    *   Utilizar *suspense* o estados de carga diferidos (Skeleton/Shimmering) en los badges numéricos de las sesiones.
    *   Revisar importaciones de `lucide-react` u otros íconos para evitar bundles pesados (solo cargar los necesarios o usar SSR/SSG parcial).

## 🧪 Validación ChromeMCP (nix-tester)
Plan de pruebas requerido para validar el DOD:
*   [ ] **Test de Rendimiento**: Cargar la ruta principal (`/`) en el ChromeMCP, medir las métricas de carga (Performance API), y validar LCP (Largest Contentful Paint) estrictamente menor a 1.2s.
*   [ ] **Test Jerárquico**: Verificar (DOM Querying) que las carpetas/categorías están debidamente indentadas y presentan correcta anidación en "Conversations".
*   [ ] **Test Visual**: Analizar el elemento Sidebar computado y asegurar la presencia de propiedades CSS de glassmorphism (`backdrop-filter: blur`, `background-color` con alpha < 1).
