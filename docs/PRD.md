# 📜 PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 📌 1. EXECUTIVE SUMMARY
**GoClaw Gateway** (NIX-0 Core Architecture) es una plataforma de orquestación de agentes IA de grado industrial y altísima eficiencia (Zero-Docker-Overhead para el backend). Su propósito fundamental es proporcionar un entorno de ejecución persistente, seguro, multi-tenant y de bajo consumo para automatizar flujos de trabajo empresariales y comunicaciones multicanal (e.g. WhatsApp). 

Esta infraestructura difiere de las soluciones tradicionales (pesadas en Python/Node.js) al compilarse como un binario estático en Go, permitiendo integraciones profundas y control granular a nivel de memoria (PostgreSQL/pgvector) e interfaz de usuario (Svelte 5 embebido).

## 🎯 2. TARGET AUDIENCE (PÚBLICO OBJETIVO)
El producto está diseñado estratégicamente para dos perfiles críticos:
1.  **Empresas (B2B):** Organizaciones que buscan automatizar flujos de trabajo repetitivos (atención al cliente, ventas, soporte técnico, operaciones internas) de manera segura, escalable y sin depender de plataformas de terceros con altos costos recurrentes.
2.  **Programadores (B2D - Business to Developer):** Desarrolladores y arquitectos de sistemas que necesitan un framework, backend y gateway robusto para desplegar agentes LLM personalizados, integrando lógicas de negocio complejas sin tener que reconstruir la infraestructura base (autenticación, ruteo, persistencia, UI).

## 💎 3. CORE VALUE PROPOSITION (PROPUESTA DE VALOR)
**"Automatización de flujos de empresas mediante agentes LLM con eficiencia industrial"**

El problema crítico que resuelve GoClaw es el excesivo consumo de recursos y la fragmentación en el despliegue de soluciones AI. Su valor central se define por:
*   **Aislamiento y Seguridad Multi-Tenant:** Arquitectura RLS (Row-Level Security) embebida que garantiza la total segregación de los datos empresariales.
*   **Rendimiento Extremo (Green AI):** Consumo mínimo de CPU/RAM gracias al binario compilado (Go) en lugar de pesados intérpretes interpretados.
*   **Conectividad Multicanal Unificada:** Orquestación nativa para WhatsApp, APIs y web embebida sin dependencias inestables (Puppeteer).
*   **Memoria e Inteligencia Continua:** Soporte nativo de *Knowledge Graphs* y memoria vectorial con `pgvector` acoplada directamente.

## 📊 4. MARKET ANALYSIS (ANÁLISIS DE COMPETENCIA)
*   **n8n:** Muy visual y orientado a flujos (DAGs). Falla en ser un gateway robusto y persistente para IA conversacional multicanal. Su consumo de recursos bajo alta concurrencia es elevado.
*   **Flowise / Langflow:** Excelentes para prototipado rápido, pero sufren de *vendor lock-in* con Node.js/Python y consumen grandes cantidades de memoria en entornos productivos. No manejan seguridad empresarial nativa.
*   **AutoGPT / LangChain:** Librerías para programadores, pero requieren que la empresa construya toda la infraestructura (BBDD, UI, Gateway, Autenticación) desde cero.
*   **Diferenciador de GoClaw (NIX-0):** Unifica la infraestructura, UI, Gateway y Seguridad en un solo despliegue autónomo y altamente eficiente de backend (Golang) acoplado a un frontend moderno (Svelte 5).

## 🚀 5. MVP FEATURES (CARACTERÍSTICAS DEL PRODUCTO MÍNIMO VIABLE)
Para el cumplimiento del MVP, se establecen las siguientes funcionalidades core:
1.  **Motor Orquestador en Go (NIX-0 Core):** Binario autónomo (GoClaw) conectable a PostgreSQL (`goclaw-main-db`).
2.  **Dashboard de Control (WebUI):** Interfaz embebida en el mismo binario construida en Svelte 5 para el monitoreo de tareas, agentes y configuración.
3.  **Aislamiento Multi-Tenant:** Capacidad de manejar múltiples clientes (Tenant ID) con seguridad Row-Level en base de datos.
4.  **Integración Omnicanal (Fase 1: WhatsApp):** Conexión persistente y de reconexión autónoma con la API de WhatsApp sin dependencia crítica de navegadores pesados.
5.  **Despacho de Herramientas y Subagentes:** Sistema RBAC Dinámico para asignar y denegar herramientas (`tools`) según el agente o usuario.
6.  **Persistencia Vectorial Base:** Memoria funcional soportada por `pgvector`.

## 📈 6. SUCCESS METRICS & KPIs
El éxito de la plataforma como un orquestador industrial y de bajo consumo se medirá mediante los siguientes KPIs:
1.  **Resource Efficiency (Eficiencia de Recursos):**
    *   RAM consumida por proceso de agente o conexión (Objetivo: < 50MB base).
    *   CPU Peak Utilization bajo una carga de 1,000 requests concurrentes (Objetivo: < 30%).
2.  **System Stability (Estabilidad del Sistema):**
    *   Uptime de los canales persistentes (WhatsApp, WebSockets) (Objetivo: > 99.9%).
    *   Tasa de reconexión autónoma exitosa tras pérdida de red (Objetivo: 100%).
3.  **Execution Latency (Latencia de Ejecución):**
    *   Tiempo de ruteo del Gateway desde la recepción del *prompt* hasta el disparo al proveedor LLM (Objetivo: < 5ms).
4.  **User/Tenant Capacity (Escalabilidad):**
    *   Número máximo de Agentes simultáneos sin degradación de latencia.
    *   Volumen de inserción vectorial por segundo en RLS (Multi-tenant).

---
*Aprobado por: NIX-ORCHESTRATOR (Protocolo NIX-0 v6.6)*
*Modelo asignado a la ejecución: gemini-3.1-pro-preview*