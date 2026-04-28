import { useHttp } from "../../../lib/state/ws.svelte";
import { authState } from "../../../lib/state/auth.svelte";

export interface RuntimeInfo {
  name: string;
  available: boolean;
  version?: string;
}

export interface RuntimeStatus {
  runtimes: RuntimeInfo[];
  ready: boolean;
}

export function useRuntimes() {
  const http = useHttp();
  
  let runtimes = $state<RuntimeStatus | null>(null);
  let loading = $state(true);

  async function load() {
    if (!authState.connected) return;
    loading = true;
    try {
      const res = await http.get<RuntimeStatus>("/v1/skills/runtimes");
      runtimes = res ?? null;
    } catch (e) {
      console.error("Failed to load runtimes", e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (authState.connected) {
      load();
    }
  });

  return {
    get runtimes() { return runtimes; },
    get loading() { return loading; },
    refresh: load
  };
}
