import { useWs, wsState } from "../../../lib/state/ws.svelte";

export interface HeartbeatConfig {
  id: string;
  agentId: string;
  enabled: boolean;
  intervalSec: number;
  ackMaxChars: number;
  maxRetries: number;
  providerId?: string;
  model?: string;
  isolatedSession: boolean;
  lightContext: boolean;
  activeHoursStart?: string;
  activeHoursEnd?: string;
  timezone?: string;
  channel?: string;
  chatId?: string;
  nextRunAt?: string;
  lastRunAt?: string;
  lastStatus?: string;
  lastError?: string;
  runCount: number;
  suppressCount: number;
}

export interface DeliveryTarget {
  channel: string;
  chatId: string;
  title?: string;
  kind: string;
}

export interface HeartbeatLog {
  id: string;
  status: string;
  summary?: string;
  error?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  skipReason?: string;
  ranAt: string;
}

export function useAgentHeartbeat(agentId: string) {
  const client = useWs();
  
  let config = $state<HeartbeatConfig | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  async function refresh() {
    if (!wsState.connected || !agentId) return;
    loading = true;
    error = null;
    try {
      const res = await client.call<{ heartbeat: HeartbeatConfig | null }>("heartbeat.get", { agentId });
      config = res.heartbeat || null;
    } catch (err: any) {
      error = err.message || "Failed to load heartbeat";
    } finally {
      loading = false;
    }
  }

  // Load initially
  $effect(() => {
    if (wsState.connected && agentId) {
      refresh();
    }
  });

  // Polling logic
  $effect(() => {
    if (!config?.enabled || !config?.nextRunAt || !wsState.connected) {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      return;
    }

    const nextMs = new Date(config.nextRunAt).getTime();
    const nowMs = Date.now();
    
    if (nextMs > nowMs) {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      const delay = nextMs - nowMs + 1000;
      const timeout = setTimeout(() => {
        refresh();
        pollInterval = setInterval(() => refresh(), 5000);
      }, delay);
      
      return () => { 
        clearTimeout(timeout); 
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      };
    }

    if (!pollInterval) {
      refresh();
      pollInterval = setInterval(() => refresh(), 5000);
    }

    return () => { 
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    };
  });

  async function toggle(enabled: boolean) {
    if (!agentId) return;
    saving = true;
    try {
      await client.call("heartbeat.toggle", { agentId, enabled });
      setTimeout(() => refresh(), 2000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to toggle heartbeat");
    } finally {
      saving = false;
    }
  }

  async function update(params: Partial<HeartbeatConfig>) {
    if (!agentId) return;
    saving = true;
    error = null;
    try {
      const res = await client.call<{ heartbeat: HeartbeatConfig }>("heartbeat.set", { agentId, ...params });
      config = res.heartbeat;
      setTimeout(() => refresh(), 2000);
    } catch (err: any) {
      error = err.message || "Failed to update heartbeat config";
      console.error(err);
      throw err;
    } finally {
      saving = false;
    }
  }

  async function test() {
    if (!agentId) return;
    saving = true;
    try {
      await client.call("heartbeat.test", { agentId });
      alert("Test run triggered");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Test run failed");
    } finally {
      saving = false;
    }
  }

  async function fetchLogs(limit = 20, offset = 0): Promise<{ logs: HeartbeatLog[]; total: number }> {
    if (!agentId) return { logs: [], total: 0 };
    try {
      const res = await client.call<{ logs: HeartbeatLog[]; total: number }>("heartbeat.logs", { agentId, limit, offset });
      return { logs: res.logs ?? [], total: res.total ?? 0 };
    } catch {
      return { logs: [], total: 0 };
    }
  }

  async function getChecklist(): Promise<string> {
    if (!agentId) return "";
    try {
      const res = await client.call<{ content: string }>("heartbeat.checklist.get", { agentId });
      return res.content ?? "";
    } catch {
      return "";
    }
  }

  async function setChecklist(content: string) {
    if (!agentId) return;
    await client.call("heartbeat.checklist.set", { agentId, content });
  }

  async function fetchTargets(): Promise<DeliveryTarget[]> {
    if (!agentId || !wsState.connected) return [];
    try {
      const res = await client.call<{ targets: DeliveryTarget[] }>("heartbeat.targets", { agentId });
      return res.targets ?? [];
    } catch {
      return [];
    }
  }

  return {
    get config() { return config; },
    get loading() { return loading; },
    get saving() { return saving; },
    get error() { return error; },
    toggle,
    update,
    test,
    fetchLogs,
    getChecklist,
    setChecklist,
    fetchTargets,
    refresh
  };
}
