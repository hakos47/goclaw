import { onMount } from "svelte";

// Define keys to match React's useAuthStore (zustand/persist)
const AUTH_STORE_KEY = "goclaw:auth";

interface PersistedState {
    token: string;
    userId: string;
    senderID: string;
}

export interface TenantMembership {
    id: string;
    name: string;
    slug: string;
    role: string;
}

export type UserRole = "owner" | "admin" | "operator" | "viewer" | "";
export type Edition = "standard" | "lite";

export const authState = $state({
    token: "",
    userId: "",
    senderID: "",
    initialized: false,
    connected: false,
    role: "" as UserRole,
    tenantId: "",
    tenantName: "",
    tenantSlug: "",
    isOwner: false,
    isMasterScope: false,
    edition: "standard" as Edition,
    availableTenants: [] as TenantMembership[],
    tenantSelected: false
});

export function saveCredentials(token: string, userId: string) {
    authState.token = token;
    authState.userId = userId;
    
    const storageData = {
        state: {
            token: authState.token,
            userId: authState.userId,
            senderID: authState.senderID
        },
        version: 0
    };
    localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(storageData));
    localStorage.setItem("goclaw:token", token);
    localStorage.setItem("goclaw:user_id", userId);
}

export function logout() {
    authState.token = "";
    authState.userId = "";
    authState.connected = false;
    authState.role = "";
    authState.tenantId = "";
    authState.availableTenants = [];
    
    localStorage.removeItem(AUTH_STORE_KEY);
    localStorage.removeItem("goclaw:token");
    localStorage.removeItem("goclaw:user_id");
    localStorage.removeItem("goclaw:tenant_id");
    localStorage.removeItem("goclaw:tenant_hint");
    window.location.href = "/login";
}

export function initAuth() {
    const raw = localStorage.getItem(AUTH_STORE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            const state = parsed.state as PersistedState;
            authState.token = state.token || "";
            authState.userId = state.userId || "";
            authState.senderID = state.senderID || "";
        } catch (e) {
            console.error("Failed to parse auth state", e);
        }
    }
    
    // Ensure senderID exists
    if (!authState.senderID) {
        authState.senderID = crypto.randomUUID();
    }
    
    authState.initialized = true;
    
    // Auto-redirect if not logged in and not on login page
    if (!authState.token && window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}
