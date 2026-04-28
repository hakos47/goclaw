# PLAN DE PRUEBAS: FUNCIONALIDAD DE CATEGORIZACIÓN DE SESIONES (TASK-014 / TASK-016 / TASK-015)

## 1. OBJETIVO
Verificar que la nueva categorización nativa en "Sessions" (pestañas/filtros) funciona correctamente en la WebUI, se comunica adecuadamente con el endpoint WebSocket (`sessions.summary` y `sessions.list`), y refleja el estado real de la base de datos particionada.

## 2. PRERREQUISITOS DE EJECUCIÓN (WORKERS)
- **Rol requerido**: QA E2E Automation Worker.
- **Herramientas requeridas**: `ChromeMCP` / Puppeteer / Playwright.
- **Credenciales**:
  - `UserID`: system
  - `Gateway Token`: goclaw_dev_token_12345

## 3. COMPROBACIÓN FÍSICA (PASSED)
- La compilación del backend GoClaw fue exitosa (`go build ./...`).
- Los tests unitarios pasaron correctamente (`go test ./...`).
- El binario arranca sin problemas en el puerto 18790.

## 4. CASOS DE PRUEBA (UI/E2E)

### Test Case 1: Carga Inicial de Categorías (Sidebar)
1. Abrir `http://localhost:18790`.
2. Iniciar sesión con las credenciales indicadas.
3. Navegar a la sección de "Sessions".
4. **Validación**: La UI debe enviar la solicitud `sessions.summary` por WebSocket y mostrar los conteos iniciales de las categorías (`personal`, `inbound`, `support`, `system`, `evolution`).

### Test Case 2: Filtrado por Categoría
1. Estando en la vista de Sessions, hacer clic en la pestaña o filtro "Inbound".
2. **Validación**: La tabla/lista debe recargar mostrando únicamente sesiones con `category = "inbound"`. La latencia debe ser mínima (el agrupamiento se hace por índice en DB).

### Test Case 3: Persistencia de Filtros y Navegación Intensiva (Stress/Latency)
1. Abrir 10 pestañas simultáneas de diferentes categorías.
2. Navegar rápidamente entre ellas.
3. **Validación**: Ningún cierre inesperado (vinculado a TASK-020). La latencia de red e interactividad (mental check del Worker) debe mantenerse fluida y sin bloqueos del event loop del DOM.

## 5. PROCEDIMIENTO DE ESCALAMIENTO
Cualquier fallo de latencia > 500ms o error 500 en WebSocket debe marcar la tarea como **FALLIDA** y retornar el reporte al Mando (nix-tester).