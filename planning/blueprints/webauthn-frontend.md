# Blueprint: Integración WebAuthn en Svelte 5 (Frontend) - TASK-027

## 1. Visión General
Este blueprint define la arquitectura y experiencia de usuario para integrar WebAuthn (Autenticación Biométrica/FIDO2) en la interfaz Svelte 5 de GoClaw. Se asume el uso de la librería `@github/webauthn-json` para facilitar la interacción con la API de credenciales del navegador.

## 2. Flujos de Usuario (User Flows)

### 2.1 Flujo de Registro (Device Registration)
Este flujo ocurre **después** de que el usuario se haya autenticado por primera vez utilizando el método tradicional (Token Auth).

1. **Trigger:** Dentro de la vista de "Settings" o "Profile" (o al detectar un nuevo login exitoso sin biometría configurada), se mostrará un banner/botón: "Register This Device for Biometric Login".
2. **Action:** Al hacer clic, el frontend llama al endpoint `POST /api/v1/auth/webauthn/register/challenge`.
3. **Prompt Biométrica:** Con el challenge recibido, se invoca `create()` de `@github/webauthn-json`. El navegador despliega la UI nativa (huella, FaceID, Windows Hello, etc.).
4. **Validación:** El resultado se envía a `POST /api/v1/auth/webauthn/register/verify`.
5. **Feedback:** Notificación de éxito al usuario ("Device registered successfully. You can now use biometric login on this device.").

### 2.2 Flujo de Autenticación (Biometric Login)
Este flujo se ubicará en la pantalla principal de Login (`ui/svelte-v2/src/pages/Login.svelte`).

1. **Modo Adicional:** Se añade una nueva pestaña "Biometric" (o "Passkey") junto a "Token Auth" y "Device Pairing".
2. **Acción Automática/Manual:** 
   - El usuario selecciona la pestaña y pulsa el botón "Authenticate with Biometrics".
   - Se llama a `POST /api/v1/auth/webauthn/login/challenge` para obtener el reto.
3. **Prompt Biométrica:** Se llama a `get()` de `@github/webauthn-json` con el reto.
4. **Validación:** El frontend envía el payload firmado a `POST /api/v1/auth/webauthn/login/verify`.
5. **Sesión Establecida:** Si el backend aprueba, devuelve un token de acceso normal que se guarda en `saveCredentials()`.

## 3. Modificaciones de UI (Login.svelte)

Se añadirá un tercer tab en el componente de tabs de `Login.svelte`:

```svelte
<!-- Tab Biométrico -->
<button 
    onclick={() => { mode = 'biometric'; error = ""; }}
    class="relative flex-1 flex items-center justify-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group whitespace-nowrap {mode === 'biometric' ? 'text-white' : 'text-white/40 hover:text-white/90'}"
>
    <ScanFace class="h-3.5 w-3.5 relative z-10" />
    <span class="relative z-10 drop-shadow-md">Biometrics</span>
</button>
```

Y su respectivo bloque de formulario:

```svelte
{#if mode === "biometric"}
  <div class="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col items-center py-4">
    <div class="h-24 w-24 rounded-full border border-green-400/30 bg-green-400/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(74,222,128,0.1)]">
        <ScanFace class="w-12 h-12 text-green-400 animate-pulse" />
    </div>
    
    <p class="text-center text-[10px] text-white/50 tracking-widest uppercase mb-8">
      Use your device's biometric sensor to securely access the gateway.
    </p>

    {#if error}
        <p class="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-4 border-l-2 border-red-500 pl-2">{error}</p>
    {/if}

    <button 
      onclick={handleBiometricLogin} 
      disabled={loading} 
      class="w-full h-14 relative flex items-center justify-center gap-2 px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5"
    >
      <!-- Estilos Neon Green similares al botón de Pairing pero en Verde para Biometría -->
      <span>{loading ? "Waiting for sensor..." : "Authenticate"}</span>
    </button>
  </div>
{/if}
```

## 4. Gestión de Estado y Errores (Svelte Runes)

- Se deben crear variables de estado con Runes `$state` para manejar:
  - `loading`: Mostrar "Waiting for sensor..." o spinners.
  - `error`: Mensajes localizados sobre fallos.
- **Tipos de Errores Comunes:**
  - `NotAllowedError`: El usuario canceló o denegó el acceso biométrico.
  - `InvalidStateError`: El dispositivo no está registrado o la llave no corresponde.
  - "Browser Not Supported": Si `window.PublicKeyCredential` es undefined, el botón debe deshabilitarse y mostrar una advertencia.

## 5. Integración @github/webauthn-json

Se implementará un archivo utilitario `src/lib/utils/webauthn.ts` que exportará las funciones asíncronas para invocar `create` (Registro) y `get` (Login), empaquetando las llamadas a los endpoints del backend y las llamadas nativas del navegador.

```typescript
import { create, get, supported } from '@github/webauthn-json';

export async function isWebAuthnSupported() {
    return supported();
}

// Pseudo-código de abstracción
export async function authenticateWebAuthn(username?: string) {
    // 1. Fetch challenge de /api/v1/auth/webauthn/login/challenge
    // 2. response = await get(challengePayload)
    // 3. Post response a /api/v1/auth/webauthn/login/verify
    // 4. Return API Token
}
```

## 6. Recursos Necesarios (Workers)
Se requiere un Worker `Expert-Svelte` para implementar esta UI, y un Worker `Expert-Go` para asegurar que los endpoints del Backend coincidan con este flujo (TASK-026).
