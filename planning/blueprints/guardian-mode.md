# Blueprint: Guardian Mode (Device Authorization)

## 1. Lógica de "Guardian Mode"
- **Detección:** Cuando un dispositivo desconocido (cuyo `device_id` o `public_key` no esté en la tabla de dispositivos autorizados del usuario) intenta firmar un inicio de sesión (`connect` vía WebAuthn/FIDO2 o nueva sesión WebSocket).
- **Acción Inmediata:** El servidor evalúa la firma. Si el dispositivo no tiene el flag de `trusted` (autorizado), la conexión es denegada o puesta en estado `PENDING_AUTHORIZATION` (HTTP 403 Forbidden / WS Close con código custom).
- **Bloqueo Preventivo:** El acceso al sistema queda bloqueado para esa sesión hasta que se resuelva la autorización.

## 2. Integración con el Message Bus
- **Publicación de Evento:** El servicio de autenticación publica un evento de dominio `DEVICE_UNAUTHORIZED_ATTEMPT` en el Message Bus interno.
- **Enrutamiento:** El evento contiene metadatos críticos: `user_id`, `device_id`, `ip_address`, `user_agent` y `timestamp`.
- **Consumo por Evelyn:** El agente especializado 'evelyn', que opera la interfaz de WhatsApp, está suscrito a estos eventos de seguridad. Al recibirlo, formula una alerta en lenguaje natural.
- **Notificación:** Evelyn envía un mensaje de WhatsApp al administrador/propietario de la cuenta:
  > ⚠️ *Alerta de Seguridad (Guardian Mode)*
  > Se ha detectado un intento de conexión desde un dispositivo no reconocido.
  > **IP:** `192.168.1.5`
  > **Device ID:** `dev_8f72a9b1`
  > ¿Deseas autorizar este dispositivo?

## 3. Comando de respuesta (Evelyn)
- **Autorización:** Para permitir el acceso, el usuario debe responder a Evelyn en WhatsApp con el comando:
  `/approve [device_id]` (ej. `/approve dev_8f72a9b1`)
- **Bloqueo Definitivo:** Para rechazar proactivamente y enviar a lista negra:
  `/deny [device_id]` (ej. `/deny dev_8f72a9b1`)
- **Proceso de Aprobación:**
  1. Evelyn parsea el comando y valida el emisor (el admin verificado en WhatsApp).
  2. Emite un evento `DEVICE_AUTHORIZED` (o `DEVICE_DENIED`) al Message Bus.
  3. El backend procesa el evento y actualiza la base de datos (marca el dispositivo como `TRUSTED`).
  4. Evelyn confirma al usuario: "✅ Dispositivo dev_8f72a9b1 autorizado. Ya puede iniciar sesión."

## 4. Auditoría de logs
- **Registro Inmutable:** Cada intento de acceso que dispara el Guardian Mode debe registrarse en una tabla dedicada `security_audit_logs`.
- **Estructura Requerida:**
  - `event_id` (UUID)
  - `event_type` (e.g., `GUARDIAN_MODE_TRIGGERED`, `GUARDIAN_MODE_APPROVED`, `GUARDIAN_MODE_DENIED`)
  - `device_id` (String)
  - `user_id` (UUID)
  - `ip_address` (String)
  - `user_agent` (String)
  - `created_at` (Timestamp)
- **Monitoreo:** Estos logs formarán la base para análisis forense y detección de ataques de fuerza bruta o suplantación, visibles en el Neural Dashboard.
