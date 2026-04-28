import { useHttp } from "$lib/state/ws.svelte";

export interface GraphNodeDTO {
  id: string;
  type: string;
  label: string;
  agent_id?: string;
  scope: string;
  created_at: string;
}

export interface GraphEdgeDTO {
  id: string;
  source: string;
  target: string;
  type: string;
  context: string;
  created_at: string;
}

export interface VaultGraphResponse {
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
  total_nodes: number;
  total_edges: number;
}

export interface VaultGraphFilter {
  teamId?: string;
  limit?: number;
}

export function useVaultGraphData(getAgentId: () => string, getFilter: () => VaultGraphFilter = () => ({})) {
  const http = useHttp();
  
  let nodes = $state<GraphNodeDTO[]>([]);
  let edges = $state<GraphEdgeDTO[]>([]);
  let totalNodes = $state(0);
  let totalEdges = $state(0);
  let loading = $state(false);

  const loadGraph = async () => {
    const agentId = getAgentId();
    if (!agentId) {
      nodes = [];
      edges = [];
      totalNodes = 0;
      totalEdges = 0;
      return;
    }

    const filter = getFilter();
    loading = true;
    try {
      const params: Record<string, string> = {};
      if (filter.teamId) params.team_id = filter.teamId;
      if (filter.limit !== undefined) params.limit = String(filter.limit);

      const res = await http.get<VaultGraphResponse>(
        `/v1/agents/${agentId}/vault/graph`,
        params
      );
      nodes = res.nodes ?? [];
      edges = res.edges ?? [];
      totalNodes = res.total_nodes ?? 0;
      totalEdges = res.total_edges ?? 0;
    } catch (err) {
      console.error("[useVaultGraphData] Failed to load graph", err);
      nodes = [];
      edges = [];
      totalNodes = 0;
      totalEdges = 0;
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    loadGraph();
  });

  return {
    get nodes() { return nodes; },
    get edges() { return edges; },
    get totalNodes() { return totalNodes; },
    get totalEdges() { return totalEdges; },
    get loading() { return loading; },
    refresh: loadGraph,
  };
}
