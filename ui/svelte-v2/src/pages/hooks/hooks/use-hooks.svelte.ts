import { useWs } from "../../../lib/state/ws.svelte.ts";
import type { HookConfig, HookTestResult, HookExecution } from "../../../../../web/src/hooks/use-hooks";
import { toast } from "../../../lib/components/ui/toast/toast.svelte.ts";

// Since Svelte 5 runes allow us to create a local state manager:
export const hooksState = $state({
  hooks: [] as HookConfig[],
  loading: false,
  error: null as string | null,
  initialized: false
});

export function useHooksList(getFilters: () => { event?: string; scope?: string; agentId?: string; enabled?: boolean } = () => ({})) {
  const ws = useWs();

  async function loadHooks(force = false) {
    if (hooksState.loading) return;
    if (hooksState.initialized && !force) return;

    hooksState.loading = true;
    hooksState.error = null;
    try {
      const res = await ws.call<{ hooks: HookConfig[] }>("hooks.list", getFilters());
      hooksState.hooks = res?.hooks ?? [];
      hooksState.initialized = true;
    } catch (e: any) {
      console.error("Failed to load hooks", e);
      hooksState.error = e.message || "Failed to load hooks";
    } finally {
      hooksState.loading = false;
    }
  }

  $effect(() => {
    getFilters(); // Track dependencies
    loadHooks();
  });

  async function createHook(params: Partial<HookConfig>) {
    try {
      const res = await ws.call<{ hookId: string }>("hooks.create", params);
      await loadHooks(true);
      return res;
    } catch (e: any) {
      console.error("Failed to create hook", e);
      throw e;
    }
  }

  async function updateHook(hookId: string, updates: Record<string, unknown>) {
    try {
      const res = await ws.call<{ hookId: string }>("hooks.update", { hookId, updates });
      await loadHooks(true);
      return res;
    } catch (e: any) {
      console.error("Failed to update hook", e);
      throw e;
    }
  }

  async function deleteHook(hookId: string) {
    try {
      await ws.call<{ hookId: string }>("hooks.delete", { hookId });
      await loadHooks(true);
    } catch (e: any) {
      console.error("Failed to delete hook", e);
      throw e;
    }
  }

  async function toggleHook(hookId: string, enabled: boolean) {
    try {
      await ws.call<{ hookId: string; enabled: boolean }>("hooks.toggle", { hookId, enabled });
      await loadHooks(true);
    } catch (e: any) {
      console.error("Failed to toggle hook", e);
      throw e;
    }
  }

  return {
    get hooks() { return hooksState.hooks; },
    get loading() { return hooksState.loading; },
    get error() { return hooksState.error; },
    loadHooks,
    createHook,
    updateHook,
    deleteHook,
    toggleHook
  };
}

export function useTestHook() {
  const ws = useWs();
  
  async function testHook(config: Partial<HookConfig>, sampleEvent: { toolName: string; toolInput: Record<string, unknown>; rawInput?: string }) {
    try {
      return await ws.call<{ result: HookTestResult }>("hooks.test", { config, sampleEvent });
    } catch (e: any) {
      console.error("Failed to test hook", e);
      throw e;
    }
  }

  return { testHook };
}

export function useHookHistory() {
  const ws = useWs();
  
  let executions = $state<HookExecution[]>([]);
  let loading = $state(false);

  async function loadHistory(hookId: string) {
    if (!hookId) return;
    loading = true;
    try {
      const res = await ws.call<{ executions: HookExecution[]; nextCursor: string; note?: string }>("hooks.history", { hookId });
      executions = res?.executions ?? [];
    } catch (e: any) {
      console.error("Failed to load hook history", e);
    } finally {
      loading = false;
    }
  }

  return {
    get executions() { return executions; },
    get loading() { return loading; },
    loadHistory
  };
}
