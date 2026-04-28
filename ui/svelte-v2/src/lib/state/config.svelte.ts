import { useWsCall, useWs } from "./ws.svelte";
import { Methods } from "../api/protocol";

export interface ConfigData {
  config: Record<string, any>;
  hash: string;
  path: string;
}

export const configStore = $state({
  config: null as Record<string, any> | null,
  hash: "",
  configPath: "",
  loading: false,
  saving: false,
  error: null as string | null,
});

export async function fetchConfig() {
  configStore.loading = true;
  configStore.error = null;
  const ws = useWs();
  try {
    const res = await ws.call<ConfigData>(Methods.CONFIG_GET);
    configStore.config = res.config;
    configStore.hash = res.hash;
    configStore.configPath = res.path;
  } catch (err: any) {
    configStore.error = err.message || "Failed to load configuration";
  } finally {
    configStore.loading = false;
  }
}

export async function patchConfig(updates: Record<string, any>) {
  configStore.saving = true;
  configStore.error = null;
  const ws = useWs();
  try {
    const res = await ws.call<{ hash: string }>(Methods.CONFIG_PATCH, {
      raw: JSON.stringify(updates),
      baseHash: configStore.hash,
    });
    configStore.hash = res.hash;
    
    // Update local state optimistically
    if (configStore.config) {
      configStore.config = { ...configStore.config, ...updates };
    }
  } catch (err: any) {
    configStore.error = err.message || "Failed to patch configuration";
    throw err;
  } finally {
    configStore.saving = false;
  }
}
