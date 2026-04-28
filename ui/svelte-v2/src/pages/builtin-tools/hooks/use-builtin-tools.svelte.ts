import { useHttp } from "../../../lib/state/ws.svelte";
import { authState } from "../../../lib/state/auth.svelte";

export interface BuiltinToolData {
  name: string;
  display_name: string;
  description: string;
  category: string;
  enabled: boolean;
  tenant_enabled: boolean | null;
  settings: Record<string, unknown>;
  tenant_settings: Record<string, unknown> | null;
  requires: string[];
  metadata: Record<string, unknown>;
  secrets_set?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export function useBuiltinTools() {
  const http = useHttp();
  
  let tools = $state<BuiltinToolData[]>([]);
  let loading = $state(true);

  async function load() {
    if (!authState.connected) return;
    loading = true;
    try {
      const res = await http.get<{ tools: BuiltinToolData[] }>("/v1/tools/builtin");
      tools = res.tools ?? [];
    } catch (e) {
      console.error("Failed to load builtin tools", e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (authState.connected) {
      load();
    }
  });

  async function updateTool(name: string, data: { enabled?: boolean; settings?: Record<string, unknown> }) {
    try {
      // Optimistic update
      if (data.enabled !== undefined) {
        tools = tools.map((t) => (t.name === name ? { ...t, enabled: data.enabled! } : t));
      }
      await http.put(`/v1/tools/builtin/${name}`, data);
      await load();
    } catch (err) {
      console.error("Failed to update builtin tool", err);
      await load(); // revert
      throw err;
    }
  }

  async function setTenantConfig(name: string, enabled: boolean) {
    try {
      tools = tools.map((t) => (t.name === name ? { ...t, tenant_enabled: enabled } : t));
      await http.put(`/v1/tools/builtin/${name}/tenant-config`, { enabled });
      await load();
    } catch (err) {
      console.error("Failed to set tenant config", err);
      await load();
      throw err;
    }
  }

  async function setTenantSettings(name: string, settings: Record<string, unknown> | null) {
    try {
      tools = tools.map((t) => (t.name === name ? { ...t, tenant_settings: settings } : t));
      await http.put(`/v1/tools/builtin/${name}/tenant-config`, { settings });
      await load();
    } catch (err) {
      console.error("Failed to set tenant settings", err);
      await load();
      throw err;
    }
  }

  async function clearTenantSettings(name: string) {
    return setTenantSettings(name, null);
  }

  async function deleteTenantConfig(name: string) {
    try {
      await http.delete(`/v1/tools/builtin/${name}/tenant-config`);
      await load();
    } catch (err) {
      console.error("Failed to delete tenant config", err);
      throw err;
    }
  }

  return {
    get tools() { return tools; },
    get loading() { return loading; },
    refresh: load,
    updateTool,
    setTenantConfig,
    deleteTenantConfig,
    setTenantSettings,
    clearTenantSettings,
  };
}
