# QA Test Plan: TASK-016 (Migración sessions - Categorización)

## 1. Objetivo
Validar que la refactorización del frontend de GoClaw (Dashboard/Sessions) maneja correctamente la nueva columna indexada de categorías. El agrupamiento y visualización debe ser fluido, sin romper el DOM y manteniendo un rendimiento óptimo.

## 2. Herramientas Requeridas
- Worker especializado en QA Frontend.
- Capacidad: `ChromeMCP` (Navegación automatizada y aserción de DOM).

## 3. Entorno de Prueba
- **Target URL:** `http://localhost:18790/login`
- **Credenciales:** Usuario `system`, Token: `goclaw_dev_token_12345`

## 4. Casos de Prueba (E2E)

### Test Case 1: Autenticación
- **Acción:** Acceder a la URL de login y rellenar las credenciales.
- **Resultado Esperado:** Redirección exitosa al Dashboard de GoClaw.

### Test Case 2: Renderizado de Sesiones y Categorías
- **Acción:** Navegar a la sección "Sessions" (si no es la por defecto).
- **Resultado Esperado:** Las sesiones deben mostrarse agrupadas por categoría. No deben existir errores en consola (Console Errors = 0).

### Test Case 3: Performance y TTI (Time to Interactive)
- **Acción:** Medir el tiempo de renderizado de los tabs/secciones de categorías al cambiar entre ellas.
- **Resultado Esperado:** TTI bajo. La UI debe reaccionar de manera inmediata y sin cuelgues (jankiness) en el DOM.

## 5. Criterios de Aceptación (DoD)
- Todos los tests anteriores pasan.
- Reporte emitido con latencias de respuesta del frontend.
- Validación de que la indexación reduce el impacto de procesamiento en el cliente.
