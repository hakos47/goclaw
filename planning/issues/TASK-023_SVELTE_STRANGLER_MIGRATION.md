# 🗺️ ROADMAP DE MIGRACIÓN NO DESTRUCTIVA (React 19 -> Svelte 5.55.0)
**TICKET:** TASK-023 (Strangler Fig UI Migration)
**ESTRATEGIA:** "Strangler Fig Pattern" (Migración por Inyección Progresiva)

## 1. PRINCIPIOS DE LA CIRUGÍA (Protocolo NIX-0)
No borraremos `ui/web` de golpe. Mantendremos el empaquetador de React (Vite) funcionando mientras construimos la nueva aplicación Svelte en paralelo (`ui/svelte-v2`).
Una vez que una ruta de Svelte esté 100% probada con ChromeMCP (interacción por interacción, con el diseño *Dark Industrial Glass* y el logo `goclaw-nix.png`), redirigiremos esa ruta específica en el backend de GoClaw para que sirva la versión Svelte. El resto seguirá sirviendo React.

## 2. FASES DEL DESPLIEGUE (Página por Página)

### FASE 1: Fundación y Sistema de Enrutamiento Híbrido
*   **Paso 1.1:** Inicializar `ui/svelte-v2` con SvelteKit 2.55.0, Svelte 5.55.0 (Runes) y Tailwind 4.2.4.
*   **Paso 1.2:** Migrar los assets estáticos: Copiar `goclaw-nix.png` y la configuración de Tailwind (`index.css` con variables Neón).
*   **Paso 1.3:** Recrear el Layout Maestro (Sidebar + Header con Glassmorphism 3.0). Validar animaciones (60fps) sin romper nada de React.
*   **Paso 1.4:** Configurar GoClaw Backend (`internal/webui/webui.go`) para servir `/svelte/*` desde el nuevo bundle, y el resto desde el bundle React.

### FASE 2: Migración de Vistas de Solo-Lectura (Bajo Riesgo)
*   **Paso 2.1 (Overview):** Reconstruir `/overview` en Svelte. Consumir `/api/v3/metrics`. Aplicar `AreaCharts` nativos y tipografía cinética para los números.
*   **Paso 2.2 (Logs & Traces):** Reconstruir las tablas de alta densidad. Validar que Svelte renderiza 10,000 filas de logs más rápido que React sin colgar el navegador.
*   **Paso 2.3:** Redirigir las rutas en el Go Router. React ya no servirá estas vistas.

### FASE 3: Migración de Vistas Interactivas (Riesgo Medio)
*   **Paso 3.1 (Agents & Providers):** Reconstruir los formularios de edición de agentes y configuración de LLMs. Asegurar que el estado reactivo (`$state`) maneja correctamente los inputs de los tokens.
*   **Paso 3.2 (Knowledge Graph & Vault):** Migrar la visualización de nodos.
*   **Paso 3.3:** Redirigir rutas en Go Router.

### FASE 4: El Corazón del Sistema (Alto Riesgo)
*   **Paso 4.1 (Chat & Sessions):** Recrear la interfaz de Chat WebSocket en Svelte. Este es el 99% del valor del panel. Replicar la reconexión automática, el auto-scroll y el renderizado de Markdown/Matemáticas en tiempo real usando Runes.
*   **Paso 4.2:** Test de Tortura con ChromeMCP (`nix-tester`): Enviar 500 mensajes por segundo al WebSocket y medir si Svelte mantiene los 60fps donde React se atascaba.

### FASE 5: Purga Final (Ejecución de la Guillotina)
*   **Paso 5.1:** Una vez que el 100% de las rutas de SvelteKit pasan la auditoría de calidad, el directorio `ui/web` (React) es declarado obsoleto.
*   **Paso 5.2:** Eliminar `ui/web`, renombrar `ui/svelte-v2` a `ui/web`.
*   **Paso 5.3:** Limpiar el router de GoClaw para servir unificado.

## 3. CRITERIOS DE ACEPTACIÓN POR PÁGINA
Antes de cambiar el tráfico de React a Svelte para una ruta específica, debe cumplir:
1.  **Identidad Visual:** El logo `goclaw-nix.png` y el tema Dark Industrial Glass deben ser idénticos o superiores.
2.  **Paridad Funcional:** Si en React había un botón de "Exportar JSON", en Svelte debe estar y funcionar.
3.  **Harness de Pruebas:** `ChromeMCP` debe confirmar cero errores en consola al navegar por esa ruta.

---
*LOCKED BY: NIX-ORCHESTRATOR & CODEIQ-AGENT-ANALIZE*