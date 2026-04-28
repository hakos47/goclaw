import { useHttp } from "../../../lib/state/ws.svelte";
import type { ToolAggregate, RetrievalAggregate, AggregatedMetrics } from "../../../../lib/types/evolution";

export function useEvolutionMetrics(agentId: string, timeRange: () => string) {
  const http = useHttp();
  
  let toolAggs = $state<ToolAggregate[]>([]);
  let retrievalAggs = $state<RetrievalAggregate[]>([]);
  let loading = $state(true);

  async function load() {
    if (!agentId) return;
    loading = true;
    
    // Stable cache key logic (start of day)
    const tr = timeRange();
    const d = new Date();
    d.setDate(d.getDate() - (tr === "90d" ? 90 : tr === "30d" ? 30 : 7));
    d.setHours(0, 0, 0, 0);
    const since = d.toISOString();

    try {
      const res = await http.get<AggregatedMetrics>(`/v1/agents/${agentId}/evolution/metrics`, {
        aggregate: "true",
        since,
      });
      toolAggs = res.tool_aggregates ?? [];
      retrievalAggs = res.retrieval_aggregates ?? [];
    } catch (e) {
      console.error("Failed to load evolution metrics", e);
    } finally {
      loading = false;
    }
  }

  // Load when agentId or timeRange changes
  $effect(() => {
    if (agentId && timeRange()) {
      load();
    }
  });

  return {
    get toolAggs() { return toolAggs; },
    get retrievalAggs() { return retrievalAggs; },
    get loading() { return loading; },
    refresh: load
  };
}
