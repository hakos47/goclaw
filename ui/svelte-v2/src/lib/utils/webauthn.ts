import { create, get, supported } from '@github/webauthn-json';
import { useHttp } from '../state/ws.svelte';

/**
 * Checks if WebAuthn is supported by the current browser and environment.
 */
export async function isWebAuthnSupported() {
    return supported();
}

/**
 * Checks if the device has a local platform authenticator (e.g. TouchID, FaceID, Windows Hello)
 */
export async function hasPlatformAuthenticator(): Promise<boolean> {
    if (!window.PublicKeyCredential || typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
        return false;
    }
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

/**
 * Initiates the WebAuthn registration process for the current authenticated user.
 * Requires the user to be already logged in via token.
 */
export async function registerWebAuthn() {
    const http = useHttp();
    
    // 1. Fetch challenge from server
    const data = await http.post<{ options: any, session_id: string }>('/v1/auth/webauthn/register/challenge');
    
    // 2. Invoke browser's native biometric prompt
    const credential = await create(data.options);
    
    // 3. Send the credential back to the server
    const res = await fetch(http.rawUrl('/v1/auth/webauthn/register/verify'), {
        method: "POST",
        headers: {
            ...http.getAuthHeaders(),
            "Content-Type": "application/json",
            "X-WebAuthn-Session": data.session_id
        },
        body: JSON.stringify(credential)
    });

    if (!res.ok) {
        throw new Error("Failed to verify registration");
    }
    return res.json();
}

/**
 * Initiates the WebAuthn login process.
 * Does not require the user to be logged in.
 */
export async function authenticateWebAuthn() {
    const http = useHttp();
    
    // 1. Fetch challenge from server
    const data = await http.post<{ options: any, session_id: string }>('/v1/auth/webauthn/login/challenge');
    
    // 2. Invoke browser's native biometric prompt
    const credential = await get(data.options);
    
    // 3. Send the signed challenge back to the server
    const res = await fetch(http.rawUrl('/v1/auth/webauthn/login/verify'), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-WebAuthn-Session": data.session_id
        },
        body: JSON.stringify(credential)
    });

    if (!res.ok) {
        throw new Error("Failed to verify authentication");
    }
    return res.json();
}

