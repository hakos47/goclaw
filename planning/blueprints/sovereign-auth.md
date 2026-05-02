# Blueprint: Protocolo de Acceso Soberano NIX-0

## 1. Resumen Ejecutivo
Sustitución de autenticación por tokens estáticos por **Passkeys (WebAuthn/FIDO2)** y un sistema de **Aprobación Delegada (Guardian Mode)**. El acceso queda ligado físicamente al hardware del usuario.

## 2. Componentes Técnicos

### A. Backend (Go) - TASK-026
- Librería: `github.com/go-webauthn/webauthn`.
- Endpoints:
    - `POST /v1/auth/register/begin`: Genera opciones de creación de credencial.
    - `POST /v1/auth/register/finish`: Valida y guarda la llave pública en la base de datos.
    - `POST /v1/auth/login/begin`: Genera el desafío (nonce) para la firma hardware.
    - `POST /v1/auth/login/finish`: Valida la firma y establece la sesión.

### B. Frontend (Svelte 5) - TASK-027
- Integración con `@github/webauthn-json` para facilitar el manejo de buffers.
- UI: Botón de "Login Biométrico" con fallback a token (mientras se completa la transición).
- Flujo de "Registrar este dispositivo" una vez logueado.

### C. Guardian Mode - TASK-028
- Tabla `authorized_devices`: `device_id, public_key, label, approved_at, last_seen_at`.
- Lógica: Si un dispositivo intenta loguearse y no está en la lista blanca, queda en `PENDING` y activa un evento en el Message Bus.
- Alerta: El agente `evelyn` enviará un mensaje de WhatsApp preguntando: "¿Autorizas el acceso del dispositivo [Nombre]?".

## 3. Riesgos y Mitigación
- **Riesgo:** Pérdida del único dispositivo autorizado.
- **Mitigación:** Mantener el token maestro (`GOCLAW_GATEWAY_TOKEN`) como llave de emergencia física en el servidor (acceso local requerido).

## 4. Plan de Rollback
- Mantener compatibilidad con el handshake actual de WebSockets hasta que el sistema de Passkeys sea declarado estable.
