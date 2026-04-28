import { WsClient } from "../api/ws-client";
import { HttpClient } from "../api/http-client";
import { onMount } from "svelte";
import { authState, type TenantMembership } from "./auth.svelte";
import { Methods } from "../api/protocol";
import { teamEventStore } from "./team-event-store.svelte.ts";

export const wsState = $state({
    connected: false,
    client: null as WsClient | null,
    currentPath: window.location.pathname,
    currentSearch: window.location.search
});

// Singleton client instances
let wsClientInstance: WsClient | null = null;
let httpClientInstance: HttpClient | null = null;

const getToken = () => localStorage.getItem("goclaw:token") || "";
const getUserId = () => localStorage.getItem("goclaw:user_id") || "";
const getSenderID = () => localStorage.getItem("goclaw:sender_id") || crypto.randomUUID();

export function initClients() {
    if (wsClientInstance && httpClientInstance) return { ws: wsClientInstance, http: httpClientInstance };

    const WS_URL = import.meta.env.DEV
        ? `ws://${window.location.host}/ws`
        : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
        
    const HTTP_URL = "";

    httpClientInstance = new HttpClient(HTTP_URL, getToken, getUserId, getSenderID);

    wsClientInstance = new WsClient(
        WS_URL,
        getToken,
        getUserId,
        getSenderID,
        (state) => {
            wsState.connected = state === "connected";
            if (wsState.connected && wsClientInstance) {
                const client = wsClientInstance;
                authState.connected = true;
                authState.role = client.role;
                authState.tenantId = client.tenantId;
                authState.tenantName = client.tenantName;
                authState.tenantSlug = client.tenantSlug;
                authState.isOwner = client.isOwner;
                authState.isMasterScope = client.isMasterScope;
                authState.edition = client.edition;
                
                // Fetch tenant memberships asynchronously
                client.call<{ tenants: TenantMembership[] }>(Methods.TENANTS_MINE)
                    .then((res) => {
                        authState.availableTenants = res?.tenants ?? [];
                        authState.tenantSelected = true;
                    })
                    .catch(() => {
                        // Non-critical
                        authState.tenantSelected = true;
                    });

                console.log("[Svelte V2] WS Connected as", client.role);
            } else if (state === "disconnected") {
                authState.connected = false;
                authState.role = "";
                authState.tenantId = "";
                authState.tenantName = "";
                authState.tenantSlug = "";
                authState.availableTenants = [];
                authState.tenantSelected = false;
            }
        }
    );

    // Bind telemetry store immediately before connect()
    teamEventStore.bind(wsClientInstance);

    wsState.client = wsClientInstance;
    wsClientInstance.connect();
    
    return { ws: wsClientInstance, http: httpClientInstance };
}

export function useHttp() {
    if (!httpClientInstance) initClients();
    return httpClientInstance!;
}

// Alias for migration compatibility
export const getHttpClient = useHttp;

export function useWs() {
    if (!wsClientInstance) initClients();
    return wsClientInstance!;
}

export function useWsCall<T>(method: string) {
    let data = $state<T | null>(null);
    let loading = $state(false);
    let error = $state<Error | null>(null);

    const call = async (params?: Record<string, unknown>) => {
        const client = useWs();
        loading = true;
        error = null;
        try {
            const result = await client.call<T>(method, params);
            data = result;
            return result;
        } catch (err: any) {
            error = err;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        get data() { return data; },
        get loading() { return loading; },
        get error() { return error; },
        call
    };
}

export function useWsEvent(event: string, handler: (payload: any) => void) {
    onMount(() => {
        const client = useWs();
        const unsubscribe = client.on(event, handler);
        return () => unsubscribe();
    });
}
