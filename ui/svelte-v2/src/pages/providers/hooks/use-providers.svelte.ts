import { useHttp } from "../../../lib/state/ws.svelte";
import type { ProviderData, ProviderInput } from "../../../../../web/src/types/provider";

export const providersState = $state({
  providers: [] as ProviderData[],
  loading: false,
  error: null as string | null,
  initialized: false
});

export function useProviders(enabled = true) {
  const http = useHttp();

  async function loadProviders(force = false) {
    if (!enabled) return;
    if (providersState.loading) return;
    if (providersState.initialized && !force) return;

    providersState.loading = true;
    providersState.error = null;
    try {
      const res = await http.get<{ providers: ProviderData[] }>("/v1/providers");
      providersState.providers = res?.providers ?? [];
      providersState.initialized = true;
    } catch (e: any) {
      console.error("Failed to load providers", e);
      providersState.error = e.message || "Failed to load providers";
    } finally {
      providersState.loading = false;
    }
  }

  async function createProvider(data: ProviderInput) {
    try {
      const res = await http.post<ProviderData>("/v1/providers", data);
      await loadProviders(true);
      return res;
    } catch (e: any) {
      console.error("Failed to create provider", e);
      throw e;
    }
  }

  async function updateProvider(id: string, data: Partial<ProviderInput>) {
    try {
      const res = await http.put(`/v1/providers/${id}`, data);
      await loadProviders(true);
      return res;
    } catch (e: any) {
      console.error("Failed to update provider", e);
      throw e;
    }
  }

  async function deleteProvider(id: string) {
    try {
      await http.delete(`/v1/providers/${id}`);
      await loadProviders(true);
    } catch (e: any) {
      console.error("Failed to delete provider", e);
      throw e;
    }
  }

  return {
    get providers() { return providersState.providers; },
    get loading() { return providersState.loading; },
    get error() { return providersState.error; },
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
  };
}
