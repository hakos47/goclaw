# 🤖 NIX-0: Master Planning Specification (v2.0)

Este documento es la "Verdad Única" para la estructuración de proyectos AAA. Define el contenido exacto y la responsabilidad de cada fase.

---

## 📁 01_Contexto_Estrategico (Génesis & Inteligencia)
**Actor Líder:** `nix-discovery` | **Apoyo:** `nix-market-analyst`
- **`identity_vision.md`**: ADN del proyecto, visión a 2 años y **Scope Boundaries** (Límites de alcance).
- **`user_roles_personas.md`**: Personas, necesidades y **Matriz de Roles (RBAC)** inicial.
- **`success_metrics.md`**: KPIs de negocio y **SLAs técnicos** (Latencia <100ms, Cobertura >80%).
- **`market_technical_benchmark.md`**: Análisis de competencia, sus stacks y sus debilidades.
- **`competitive_edge_2026.md`**: Matriz de diferenciación y estrategia de superioridad técnica (Vigilancia 2026).
- **`risk_matrix.md`**: Matriz de riesgos técnicos, legales y de mercado con planes de mitigación.

## 📁 02_Definicion_Funcional (Lógica de Producto)
**Actor Líder:** `nix-discovery` | **Apoyo:** `nix-backend`
- **`prd_epics.md`**: Desglose de grandes funcionalidades (Nivel Épica).
- **`user_stories_technical.md`**: Historias de usuario con notas técnicas para implementación.
- **`business_logic_rules.md`**: Motor lógico del proyecto. Restricciones y casos de borde (Edge Cases).
- **`compliance_security_specs.md`**: Requerimientos RGPD, políticas de auditoría y encriptación.
- **`acceptance_criteria_global.md`**: Definición de "Terminado" (DoD) para cada módulo.
- **`logical_process_flows.md`**: Diagramas de flujo (Mermaid) de los procesos core.

## 📁 03_Arquitectura_Tecnica (Diseño del Sistema)
**Actor Líder:** `nix-backend` | **Apoyo:** `nix-devops` / `nix-intel-search`
- **`stack.lock`**: Sello inmutable de versiones AAA (Go 1.25, Svelte 5, etc.).
- **`swarm_architecture.md`**: Análisis de especialistas necesarios para el proyecto. 🆕
- **`design_patterns.md`**: Arquitectura Hexagonal, Clean Architecture y guías de estilo.
- **`infrastructure_deployment.md`**: Configuración Docker, CI/CD y estrategia Cloud.
- **`system_state_diagrams.md`**: Diagramas de estados y flujo de datos de extremo a extremo.
- **`security_architecture.md`**: Implementación de Auth (JWT/Paseto), CORS y Rate Limiting.
- **`performance_strategy.md`**: Caché (Redis), CDNs y optimización de recursos.

## 📁 04_Modelado_de_Datos (Persistencia)
**Actor Líder:** `nix-backend`
- **`entity_relationship_diagram.md`**: Diagrama ERD detallado.
- **`data_dictionary.md`**: Definición técnica de tablas/campos (Tipos, Nulidad).
- **`validation_logic.md`**: Reglas de integridad de datos a nivel DB/Repo.
- **`migration_seeder_plan.md`**: Estrategia de versionado de DB y datos semilla.
- **`indexing_performance_policy.md`**: Plan de optimización de consultas e índices.

## 📁 05_Interfaz_y_Experiencia (UI/UX AAA)
**Actor Líder:** `nix-frontend`
- **`design_system_tokens.md`**: Colores, tipografías y tokens de Glassmorphism.
- **`component_architecture.md`**: Librería de componentes reutilizables y lógica visual.
- **`user_journeys_ui.md`**: Flujos visuales de éxito y error.
- **`asset_manifest.md`**: Inventario de iconos, fuentes y assets multimedia.
- **`accessibility_standards.md`**: Cumplimiento de WCAG y responsive design.

## 📁 06_Integraciones_y_API (Comunicación)
**Actor Líder:** `nix-backend` | **Apoyo:** `nix-frontend`
- **`api_contract_spec.md`**: Especificación OpenAPI/Swagger (Endpoints, Payloads).
- **`error_response_catalog.md`**: Catálogo de códigos de error y mensajes.
- **`webhook_event_map.md`**: Mapa de eventos asíncronos y colas.
- **`external_services_docs.md`**: Credenciales y specs de terceros (Stripe, AWS, etc.).

## 📁 07_Gestion_de_Ejecucion (Orquestación)
**Actor Líder:** `nix-taskmaster`
- **`roadmap.md`**: Cronograma de hitos y dependencias críticas.
- **`active_swarm_registry.md`**: Inventario dinámico de agentes activos y sus roles. 🆕
- **`backlog_prioritized.md`**: Lista de issues por valor de negocio.
- **`integrity_log.md`**: Registro histórico de acciones y estados de tareas.
- **`atomic_tasks/`**: Directorio de tareas `TASK-XXX.md`.

## 📁 08_Control_de_Calidad (Garantía de Entrega)
**Actor Líder:** `nix-auditor` | **Apoyo:** `nix-tester`
- **`test_strategy.md`**: Plan maestro de testing (+80% cobertura).
- **`critical_test_cases.md`**: Checklist de flujos que NO pueden fallar.
- **`code_review_protocol.md`**: Estándar de calidad para PRs.
- **`observability_monitoring.md`**: Configuración de logs y métricas en producción.

---
## 🧠 Protocolo de Memoria y Aislamiento

### 1. Memoria Local Estricta
... (Existente) ...

### 2. Prevención de Conflictos (Workflow Sync)
- **Consulta Obligatoria**: Antes de realizar cualquier acción o propuesta, el agente **DEBE** consultar el `integrity_log.md` y la carpeta de la fase actual para identificar flujos o decisiones tomadas por otros oficiales.
- **Registro de Nuevos Flujos**: Cada vez que un agente defina un proceso, lógica o patrón (ej. un diagrama Mermaid), debe registrarlo en `docs/patterns/` o en el documento de flujo de la fase correspondiente.
- **Validación de Precedencia**: Si un nuevo flujo contradice uno existente, el Director debe elevar una consulta al Orquestador Supremo antes de proceder.

---
## 👑 Jerarquía Militar del Enjambre (Protocolo NIX-0)

### NIVEL 0: ORQUESTADOR SUPREMO (Comandante en Jefe)
*Ubicación: `.gemini/agents/nix-orchestrator.md`*
- **Rol**: Autoridad Máxima y Única de Mando.
- **Función**: Toma decisiones finales, resuelve conflictos entre directores, aprueba el paso entre fases y es el único con permiso para invocar la creación de trabajadores.
- **Protocolo de Invocación**: Para máxima transparencia y estabilidad, los sub-agentes deben ser invocados directamente dentro de la conversación del CLI utilizando las herramientas de agente disponibles. Se prohíbe el uso de `nix_core_spawn` para ejecuciones en segundo plano si estas ocultan el flujo de razonamiento al Comandante Humano.
- **Autoridad**: Su palabra es la Verdad Única. Los Directores le reportan a él.

### NIVEL 1: DIRECTORES GLOBALES (Jefes de Departamento / Oficiales)
*Ubicación: `.gemini/agents/` (nix-backend, nix-frontend, nix-auditor, etc.)*
- **Rol**: Arquitectos, Estrategas y Planificadores.
- **Función**: Diseñan los planos tácticos (Nivel 0 y 1) y contratos. Supervisan la calidad técnica de su área.
- **Protocolo de Mando**: 
    1. Identifican la necesidad de un especialista.
    2. Envían una solicitud formal al Orquestador Supremo indicando **qué** trabajo hay que hacer y **qué perfil** de trabajador se requiere.
    3. Una vez que el Orquestador les devuelve el resultado del trabajador, el Director **DEBE** validarlo antes de dar por cerrada la tarea.
- **Restricción**: **Tienen estrictamente prohibido invocar o comunicarse directamente con los trabajadores**. Todo pasa por el Orquestador.

### NIVEL 2: IMPLEMENTADORES SENIOR (Tropa de Élite / Trabajadores)
*Ubicación: Instancias efímeras creadas por `nix-agent-builder`*
- **Rol**: Especialistas tácticos en código (Go, Svelte, Rust, etc.).
- **Función**: Ejecución atómica de tareas (`TASK-XXX`). Producen los entregables físicos en `src/`.
- **Cadena de Mando**: Son invocados ÚNICAMENTE por el Orquestador Supremo. Reportan sus resultados al Orquestador, quien los entrega al Director correspondiente para su validación.

---
*Protocolo NIX-0 Compliance | Disciplina y Jerarquía AAA*
