import { useWsCall, useWs } from "../../../lib/state/ws.svelte";
import { authState } from "../../../lib/state/auth.svelte";
import { Methods } from "../../../lib/api/protocol";

export interface CronSchedule {
  kind: "at" | "every" | "cron";
  atMs?: number;
  everyMs?: number;
  expr?: string;
  tz?: string;
}

export interface CronPayload {
  kind: string;
  message: string;
  command?: string;
}

export interface CronJobPatch {
  name?: string;
  agentId?: string;
  enabled?: boolean;
  schedule?: CronSchedule;
  message?: string;
  deliver?: boolean;
  deliverChannel?: string;
  deliverTo?: string;
  deleteAfterRun?: boolean;
  wakeHeartbeat?: boolean;
  stateless?: boolean;
}

export interface CronJob {
  id: string;
  name: string;
  agentId?: string;
  enabled: boolean;
  schedule: CronSchedule;
  payload: CronPayload;
  deliver?: boolean;
  deliverChannel?: string;
  deliverTo?: string;
  wakeHeartbeat?: boolean;
  stateless?: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  deleteAfterRun?: boolean;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastError?: string;
  };
}

export interface CronRunLogEntry {
  ts: number;
  jobId: string;
  status?: string;
  error?: string;
  summary?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export const cronState = $state({
  jobs: [] as CronJob[],
  loading: false,
  error: null as Error | null,
  initialized: false
});

export function useCron() {
  const ws = useWs();
  const listCall = useWsCall<{ jobs: CronJob[] }>(Methods.CRON_LIST);

  async function refresh() {
    if (!authState.connected) return;
    cronState.loading = true;
    cronState.error = null;
    try {
      const res = await listCall.call({ includeDisabled: true });
      cronState.jobs = res?.jobs || [];
      cronState.initialized = true;
    } catch (err: any) {
      cronState.error = err;
      console.error("Failed to load crons:", err);
    } finally {
      cronState.loading = false;
    }
  }

  async function createJob(params: {
    name: string;
    schedule: CronSchedule;
    message: string;
    agentId?: string;
    deliver?: boolean;
    channel?: string;
    to?: string;
  }) {
    await ws.call(Methods.CRON_CREATE, params);
    await refresh();
  }

  async function toggleJob(jobId: string, enabled: boolean) {
    // Optimistic update
    const job = cronState.jobs.find(j => j.id === jobId);
    if (job) job.enabled = enabled;

    try {
      await ws.call(Methods.CRON_TOGGLE, { jobId, enabled });
      await refresh();
    } catch (err) {
      // Revert on error
      if (job) job.enabled = !enabled;
      throw err;
    }
  }

  async function deleteJob(jobId: string) {
    await ws.call(Methods.CRON_DELETE, { jobId });
    await refresh();
  }

  async function runJob(jobId: string) {
    await ws.call(Methods.CRON_RUN, { jobId, mode: "force" });
  }

  async function getRunLog(jobId: string, limit = 20, offset = 0): Promise<{ entries: CronRunLogEntry[]; total: number }> {
    if (!ws.isConnected) return { entries: [], total: 0 };
    const res = await ws.call<{ entries: CronRunLogEntry[]; total: number }>(Methods.CRON_RUNS, {
      jobId,
      limit,
      offset,
    });
    return { entries: res?.entries ?? [], total: res?.total ?? 0 };
  }

  async function updateJob(jobId: string, params: CronJobPatch) {
    await ws.call(Methods.CRON_UPDATE, { jobId, patch: params });
    await refresh();
  }

  return {
    get jobs() { return cronState.jobs; },
    get loading() { return cronState.loading; },
    get initialized() { return cronState.initialized; },
    refresh,
    createJob,
    toggleJob,
    deleteJob,
    runJob,
    getRunLog,
    updateJob
  };
}
