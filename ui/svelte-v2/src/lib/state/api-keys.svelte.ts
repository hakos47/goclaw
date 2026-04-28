import { useWs } from "./ws.svelte";
import { Methods } from "../api/protocol";

export interface ApiKeyData {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expires_at: string | null;
  last_used_at: string | null;
  revoked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface ApiKeyCreateInput {
  name: string;
  scopes: string[];
  expires_in?: number; // seconds; undefined = never
  tenant_id?: string;
}

export interface ApiKeyCreateResponse extends ApiKeyData {
  key: string;
}

export const apiKeysStore = $state({
  items: [] as ApiKeyData[],
  loading: false,
  error: null as string | null,
  initialized: false
});

export async function fetchApiKeys() {
  if (apiKeysStore.loading) return;
  
  apiKeysStore.loading = true;
  apiKeysStore.error = null;
  const ws = useWs();
  console.log("[ApiKeysStore] Calling api_keys.list via WS...");
  try {
    const res = await ws.call<ApiKeyData[]>(Methods.API_KEYS_LIST);
    console.log("[ApiKeysStore] Received response:", res);
    apiKeysStore.items = res || [];
    apiKeysStore.initialized = true;
  } catch (err: any) {
    console.error("[ApiKeysStore] RPC Error:", err);
    apiKeysStore.error = err.message || "Failed to load API keys";
  } finally {
    apiKeysStore.loading = false;
  }
}

export async function createApiKey(input: ApiKeyCreateInput): Promise<ApiKeyCreateResponse> {
  const ws = useWs();
  try {
    const res = await ws.call<ApiKeyCreateResponse>(Methods.API_KEYS_CREATE, input as any);
    await fetchApiKeys();
    return res;
  } catch (err: any) {
    console.error("Failed to create API key", err);
    throw err;
  }
}

export async function revokeApiKey(id: string) {
  const ws = useWs();
  try {
    await ws.call(Methods.API_KEYS_REVOKE, { id });
    await fetchApiKeys();
  } catch (err: any) {
    console.error("Failed to revoke API key", err);
    throw err;
  }
}
