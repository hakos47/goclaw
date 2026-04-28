import { useHttp } from "../../../lib/state/ws.svelte";
import type { EpisodicSummary, EpisodicSearchResult } from "../types";

export interface EpisodicFilters {
  limit?: number;
}

export function useEpisodicSummaries(getAgentId: () => string, filters?: EpisodicFilters) {
  let summaries = $state<EpisodicSummary[]>([]);
  let loading = $state(true);
  let error = $state<Error | null>(null);

  const http = useHttp();

  const loadSummaries = async () => {
    const agentId = getAgentId();
    if (!agentId) return;
    loading = true;
    error = null;
    try {
      const params: Record<string, string> = {};
      if (filters?.limit) params.limit = filters.limit.toString();
      
      const res = await http.get<EpisodicSummary[]>(
        `/v1/agents/${agentId}/episodic`,
        params
      );
      summaries = res ?? [];
    } catch (err: any) {
      error = err;
      console.error("[useEpisodicSummaries] Failed to load summaries", err);
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    // Re-run whenever getAgentId() or filters change
    loadSummaries();
  });

  return {
    get summaries() { return summaries; },
    get loading() { return loading; },
    get error() { return error; },
    refresh: loadSummaries,
  };
}

export function useEpisodicSearch(getAgentId: () => string) {
  const http = useHttp();

  const search = async (query: string, maxResults = 10, minScore = 0) => {
    const agentId = getAgentId();
    if (!agentId || !query.trim()) return [];
    
    try {
      const res = await http.post<EpisodicSearchResult[]>(
        `/v1/agents/${agentId}/episodic/search`,
        {
          query,
          max_results: maxResults,
          min_score: minScore,
        }
      );
      return res ?? [];
    } catch (err) {
      console.error("[useEpisodicSearch] failed:", err);
      return [];
    }
  };

  return { search };
}
