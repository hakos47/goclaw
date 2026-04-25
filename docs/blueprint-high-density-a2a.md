# Blueprint: High-Density Event Visualization (A2A Architecture)

## 1. Executive Summary
El Oficial de Backend ha propuesto una arquitectura "Agent-to-Agent (A2A)" basada en Memoria Compartida. Esto provocará un aumento exponencial en el volumen de eventos WebSocket (negociaciones, poda de contexto, sub-tareas en paralelo). La arquitectura actual basada en mutabilidad ineficiente (ej. esparcir arrays para cada evento en tiendas globales) colapsará bajo esta carga, provocando bloqueos del DOM y memory leaks. Este Blueprint establece el diseño de la UI/UX y la gestión de estado utilizando Svelte 5 (Runes) para soportar esta alta densidad.

## 2. Gestión de Estado y Eventos (Real-time) con Svelte 5
Para evitar bloqueos en el hilo principal y picos de Garbage Collection (GC) causados por la inmutabilidad clásica, implementaremos los siguientes patrones con Svelte 5 Runes:

### 2.1. Ring Buffers (Buffers Circulares) en `$state`
En lugar de hacer `[...events, newEvent]`, pre-asignaremos un buffer circular reactivo.
```svelte
// Concepto en Svelte 5
const MAX_EVENTS = 5000;
let events = $state(new Array(MAX_EVENTS));
let head = $state(0);

export function pushEvent(event) {
    events[head] = event;
    head = (head + 1) % MAX_EVENTS; // Reactividad O(1)
}
```

### 2.2. Batching y Throttling (rAF)
No reaccionaremos a cada mensaje WebSocket individualmente. Acumularemos eventos en una cola en memoria no reactiva y los volcaremos al `$state` en lotes usando `requestAnimationFrame`.
```js
let pendingBatch = [];
let isScheduled = false;

ws.on('event', (e) => {
    pendingBatch.push(e);
    if (!isScheduled) {
        isScheduled = true;
        requestAnimationFrame(() => {
            // Aplicar mutaciones en bloque al $state
            processBatch(pendingBatch);
            pendingBatch = [];
            isScheduled = false;
        });
    }
});
```

### 2.3. Web Worker Offloading
Para JSON parsing de alto volumen, la deserialización de mensajes WebSocket crudos se delegará a un Web Worker. El Worker procesará, clasificará y enviará "Chunks" ya estructurados al Main Thread para su renderizado.

## 3. Estrategia UI/UX para Enjambres (Agent Swarms)
La visualización debe distinguir entre la comunicación "Lenta" (Humano-Agente) y la comunicación "Rápida/Densa" (Máquina-Máquina).

### 3.1. Renderizado Virtual (DOM Virtualization)
El DOM no puede contener 5000 nodos de eventos. Implementaremos un Virtual Scroller (Windowing). Solo se renderizan los ~30-50 elementos visibles en el viewport, reciclando los nodos del DOM mientras el usuario hace scroll. Svelte 5 hace que la actualización de estas propiedades ligadas sea extremadamente rápida.

### 3.2. Jerarquía Visual y Map-Reduce
- **Human Thread (Main)**: Renderizado como chat clásico, amigable, con burbujas de texto, markdown enriquecido y avatares claros.
- **A2A Threads (Sub-threads)**: Cuando un agente delega a 5 subagentes (Map-Reduce), esto se representa como un bloque de "Procesamiento" colapsable en el hilo principal.
- **Densidad Visual A2A**: Al expandir un bloque A2A, la interfaz cambia de un modo "Chat" a un modo "Telemetry/Terminal".
  - Fuente Monospace.
  - Diseño tabular o de timeline compacto (líneas finas, sin márgenes excesivos).
  - Uso de colores semánticos (Verde=Voto Positivo, Amarillo=Negociación, Azul=Poda de contexto).
  - Grafos en vivo: Usar Sigma.js o echarts para representar las conexiones neuronales entre los subagentes, en lugar de solo texto.

### 3.3. Indicadores de Estado de Enjambre
- En lugar de mostrar el texto exacto de lo que dicen 10 agentes simultáneamente, la UI agregará la información:
  - *"5 agentes evaluando opciones..."*
  - Un mini-dashboard por subtarea con un `ProgressRing` que muestra la convergencia de la negociación.

## 4. Recursos Solicitados (Workers)
Para ejecutar este Blueprint, se requiere la intervención del Comandante para desplegar los siguientes recursos (Nivel 3):
- **Worker Frontend Svelte**: Para implementar el Virtual Scroller y migrar la lógica de WebSockets a Svelte 5 Runes.
- **Worker WebGL/Canvas**: Para implementar la vista topológica (grafo) de la interacción A2A si se decide usar renderizado por GPU para los nodos.