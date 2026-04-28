import { useHttp } from "../../../lib/state/ws.svelte";

export interface V3Flags {
  v3_pipeline_enabled: boolean;
  v3_memory_enabled: boolean;
  v3_retrieval_enabled: boolean;
  self_evolution_metrics: boolean;
  self_evolution_suggestions: boolean;
}

export function useV3Flags(agentId: string) {
  const http = useHttp();
  
  let flags = $state<V3Flags | null>(null);
  let loading = $state(true);

  async function load() {
    if (!agentId) return;
    loading = true;
    try {
      flags = await http.get<V3Flags>(`/v1/agents/${agentId}/v3-flags`);
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (agentId) {
      load();
    }
  });

  async function toggleFlag(key: keyof V3Flags, value: boolean) {
    if (flags) {
      flags = { ...flags, [key]: value };
    }
    try {
      await http.patch(`/v1/agents/${agentId}/v3-flags`, { [key]: value });
      await load();
    } catch (e) {
      console.error("Failed to update flag", e);
    }
  }

  return {
    get flags() { return flags; },
    get loading() { return loading; },
    toggleFlag,
    refresh: load
  };
}
