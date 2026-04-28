import { useWs } from "../../../lib/state/ws.svelte";

export interface HookConfig {
  id: string;
  tenant_id: string;
  agent_id?: string | null;
  agent_ids?: string[];
  name?: string;
  event: string;
  handler_type: "command" | "http" | "prompt" | "script";
  scope: "global" | "tenant" | "agent";
  config: Record<string, unknown>;
  enabled: boolean;
  version: number;
  source: "ui" | "api" | "seed" | "builtin";
}

export function useHooksList(filters?: { agentId?: string; scope?: string; event?: string }) {
  const ws = useWs();
  
  let hooks = $state<HookConfig[]>([]);
  let loading = $state(true);

  async function load() {
    loading = true;
    try {
      const res = await ws.call<{ hooks: HookConfig[] }>("hooks.list", filters ?? {});
      hooks = res.hooks ?? [];
    } catch (e) {
      console.error(e);
      hooks = [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    load();
  });

  return {
    get hooks() { return hooks; },
    get loading() { return loading; },
    refresh: load
  };
}

export async function createHook(ws: ReturnType<typeof useWs>, data: Partial<HookConfig>) {
  return await ws.call<{ hook: HookConfig }>("hooks.create", data);
}

export async function updateHook(ws: ReturnType<typeof useWs>, id: string, data: Partial<HookConfig>) {
  return await ws.call<{ hook: HookConfig }>("hooks.update", { id, ...data });
}

export async function deleteHook(ws: ReturnType<typeof useWs>, id: string) {
  return await ws.call<{ success: boolean }>("hooks.delete", { id });
}
