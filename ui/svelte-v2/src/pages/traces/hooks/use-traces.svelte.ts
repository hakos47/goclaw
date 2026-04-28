import { useHttp } from "$lib/state/ws.svelte";
import type { TraceData, SpanData } from "$lib/types/trace";

export interface TraceFilters {
  agentId?: string;
  userId?: string;
  status?: string;
  channel?: string;
  limit?: number;
  offset?: number;
}

export function useTraces() {
  const http = useHttp();
  let traces = $state<TraceData[]>([]);
  let total = $state(0);
  let loading = $state(false);

  const loadTraces = async (filters: TraceFilters = {}) => {
    loading = true;
    try {
      const params: Record<string, string> = {};
      if (filters.agentId) params.agent_id = filters.agentId;
      if (filters.userId) params.user_id = filters.userId;
      if (filters.status) params.status = filters.status;
      if (filters.channel) params.channel = filters.channel;
      if (filters.limit) params.limit = String(filters.limit);
      if (filters.offset !== undefined) params.offset = String(filters.offset);

      const res = await http.get<{ traces: TraceData[]; total?: number }>("/v1/traces", params);
      traces = res.traces ?? [];
      total = res.total ?? 0;
    } catch (e) {
      console.error("Failed to load traces", e);
    } finally {
      loading = false;
    }
  };

  const getTrace = async (traceId: string): Promise<{ trace: TraceData; spans: SpanData[] } | null> => {
    try {
      return await http.get<{ trace: TraceData; spans: SpanData[] }>(`/v1/traces/${traceId}`);
    } catch (e) {
      console.error(`Failed to fetch trace ${traceId}`, e);
      return null;
    }
  };

  return {
    get traces() { return traces; },
    get total() { return total; },
    get loading() { return loading; },
    loadTraces,
    getTrace
  };
}
