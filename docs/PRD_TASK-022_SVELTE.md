# 📜 PRODUCT REQUIREMENTS DOCUMENT (PRD) - REVOLUCIÓN UI SVELTE 5 (HYPER-MODERN EDITION)
**TICKET:** TASK-022 (Demolición React y Migración a Svelte 5)
**AUTOR:** NIX-DISCOVERY & NIX-MARKET-ANALYST [Override by NIX-ORCHESTRATOR]

## 1. VISIÓN DEL MVP (Atracción Masiva Extrema)
El mercado no solo exige que funcione; exige que fascine. El Dashboard de GoClaw no será solo un panel de control, será una **experiencia sensorial**. La misión es demoler React 19 y construir una interfaz en Svelte 5.55.0 que implemente las tendencias más agresivas y cautivadoras de Abril de 2026 para garantizar la adopción instantánea por parte de nuevos usuarios.

## 2. USER JOURNEY CRÍTICO Y ESTÉTICA (Hyper-Modern Spatial & Glass)
El diseño debe gritar "Herramienta del Futuro". Integraremos conceptos de Spatial UI y renderizado acelerado por GPU:

*   **Fondo Dinámico Acelerado por GPU (Opcional pero Impactante):**
    *   Fondo base interactivo (Canvas/WebGL muy ligero) con partículas sutiles o una malla de red neuronal fluida que reacciona levemente al movimiento del ratón. Esto genera una sensación de "sistema vivo" inmediatamente al hacer login.
*   **Neomorfismo Industrial + Glassmorphism 3.0:**
    *   No solo fondos borrosos. Hablamos de **Glassmorphism Refractivo**: bordes con luz volumétrica simulada que sigue el cursor del usuario (efecto *Glow Reveal* o *Spotlight* en las tarjetas).
    *   Materiales translúcidos con ruido (Noise/Film Grain) sutil superpuesto para darle textura táctil a las pantallas.
*   **Paleta de Colores Dinámica (AI-Driven):**
    *   Dark Mode Absoluto (OLED Black `#000000` a `#0A0A0A`).
    *   Acentos holográficos: Tonos neón cian (`#00f2fe`), violeta eléctrico (`#8b5cf6`) y rosa magenta (`#ec4899`) que pulsan sutilmente cuando hay actividad de red (ej. cuando un agente procesa una tarea).
*   **Tipografía Cinética:**
    *   Fuentes grotescas/monoespaciadas (ej. *Geist Mono* o *JetBrains Mono*) para los datos, combinadas con fuentes sans-serif geométricas muy limpias (ej. *Inter Tight* o *Plus Jakarta Sans*) para la UI general. Los números en los dashboards deben tener un efecto de "rolling" o "odometer" al actualizarse, en lugar de cambiar de golpe.
*   **Feedback Háptico Visual:**
    *   Las interacciones (clics, toggles) deben tener micro-animaciones físicas (Svelte Spring/Motion) que den peso y gravedad a los elementos de la UI.

## 3. ARQUITECTURA TÉCNICA (Svelte 5 Runes & Tailwind 4)
Para lograr este nivel de "Eye Candy" sin destruir el rendimiento (Green AI):
*   **Tailwind 4.2.4 + CSS Variables:** Uso agresivo de variables CSS para orquestar los efectos de luz del ratón y los gradientes sin repintar el DOM, calculados nativamente en el navegador.
*   **Svelte 5 Runes (`$state`, `$effect`):** Control quirúrgio de las animaciones. Svelte compilará estas animaciones complejas en Vanilla JS altamente optimizado, garantizando 60/120fps estables.
*   **Lazy Loading de Efectos:** Si el dispositivo del usuario no tiene aceleración por hardware (detectado dinámicamente), el sistema hace un *graceful degradation* a Glassmorphism estático.

## 4. CRITERIOS DE ACEPTACIÓN (Harness de Atracción - ChromeMCP)
1.  **Impresión Inicial (The "Wow" Factor):** ChromeMCP debe validar que el LCP siga siendo `< 800ms` a pesar de los efectos visuales inyectados.
2.  **Validación de Renderizado Estético:** Verificación de las clases de Tailwind avanzadas (`backdrop-blur-2xl`, mix-blend-modes, y gradientes radiales complejos).
3.  **Stress Test de UI:** Mantener 60fps constantes mientras se actualizan cientos de logs en pantalla simultáneamente con las animaciones de neón activas.

---
*"En el mercado de 2026, la mediocridad es un error de redondeo. GoClaw no será solo el mejor gateway; será el software que todos quieran mirar."*