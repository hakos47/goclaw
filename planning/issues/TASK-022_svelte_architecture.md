# Blueprint: TASK-022 Migración a Svelte 5.55.0

## 1. Configuración Base

**Modificaciones en `package.json`**:
- **Eliminar dependencias de React**:
  - `react`, `react-dom`, `react-router`, `react-router-dom`
  - Tipos correspondientes (`@types/react`, `@types/react-dom`, etc.)
- **Añadir dependencias de Svelte 5**:
  - `svelte` (versión `^5.55.0`)
  - `@sveltejs/vite-plugin-svelte`
  - `svelte-routing` (o router SPA ligero equivalente para Svelte)
  - `tailwindcss` (asegurar versión 4) y sus plugins de Vite correspondientes si aplica.

**Modificaciones en `vite.config.ts`**:
- Reemplazar el plugin de React por el de Svelte.
```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  // Mantener la configuración del proxy/build que exige GoClaw
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
```

## 2. Arquitectura de Componentes Reutilizables

Ubicación: `src/lib/components/`

- **DynamicBackground.svelte**: Fondo dinámico de la aplicación usando WebGL o CSS effects. Implementar gradientes animados simulando luz refractiva.
- **GlassCard.svelte**: Tarjeta base con efecto glassmorphism.
  - Clases Tailwind sugeridas: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]`.
- **GlassButton.svelte**: Botón con estilo neón/glassmorphism interactivo.
  - Transiciones suaves al hover: `hover:bg-white/10 transition-all duration-300 ease-out`.

Las variables CSS para la paleta "Radiant Purple" y acentos neón (#d946ef) deben definirse en el CSS global y ser consumidas vía Tailwind 4.

## 3. Estrategia de Estado (Runes)

Svelte 5 introduce Runes para el estado reactivo.

Crear archivo de estado global en `src/lib/state/global.svelte.ts`:

```typescript
export const globalState = $state({
    session: null,
    theme: 'dark', // Radiant Purple mode
    sidebarOpen: true
});

export function toggleSidebar() {
    globalState.sidebarOpen = !globalState.sidebarOpen;
}

export function setSession(data) {
    globalState.session = data;
}
```

Este estado puede ser importado directamente en cualquier componente Svelte para lectura o escritura con reactividad instantánea.

## 4. Diseño Hyper-Moderno y Layout

**Layout Base (App.svelte)**:
- Contenedor principal relativo.
- Fondo: `<DynamicBackground />` anclado en `absolute inset-0 z-[-1]`.
- Estructura: Flexbox para un Sidebar lateral izquierdo y el contenido a la derecha.
- **Animaciones**: 
  - Usar directivas de Svelte: `transition:fade`, `transition:slide` o `transition:fly` para la entrada de componentes y páginas.
  - El Sidebar puede utilizar `svelte/animate` para reestructuraciones del layout.
- **Clases Base UI**: 
  - Textos: Altos contrastes (`text-white`, `text-purple-200`).
  - Bordes y separadores: `border-white/10`.

## 5. Paso a Paso para el Worker (`generalist`)

1. **Modificar `package.json`**: Eliminar todas las trazas de React. Instalar las dependencias de Svelte 5.55.0 y Vite para Svelte.
2. **Actualizar `vite.config.ts`**: Cambiar plugins e importar Svelte plugin preservando configuraciones de `dist`.
3. **Limpieza**: Eliminar todos los archivos `.tsx` de `src/`.
4. **Setup CSS**: Actualizar el archivo de estilos global con Tailwind 4 y definir variables para Radiant Purple (#d946ef).
5. **Crear `src/main.ts`**: 
   ```typescript
   import { mount } from 'svelte';
   import App from './App.svelte';
   import './app.css';

   const app = mount(App, {
     target: document.getElementById('app')!,
   });

   export default app;
   ```
6. **Crear `src/App.svelte`**: Montar el layout base con `svelte-routing` (Header + Sidebar + Contenido) y el `DynamicBackground`.
7. **Crear Componentes Base**: 
   - `src/lib/components/DynamicBackground.svelte`
   - `src/lib/components/GlassCard.svelte`
   - `src/lib/components/GlassButton.svelte`
8. **Crear Estado**:
   - `src/lib/state/global.svelte.ts`
9. **Build & Test**: Ejecutar compilación para asegurar que los archivos estáticos en `dist` se generen y el pipeline de GoClaw no se rompa.