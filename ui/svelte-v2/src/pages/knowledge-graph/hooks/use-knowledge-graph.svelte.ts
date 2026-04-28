import { useHttp } from "$lib/state/ws.svelte";
import type { KGEntity, KGRelation, KGStats, KGDedupCandidate, KGTraversalResult } from "../../../types/knowledge-graph";

// We need an external state to simulate React Query's reactive queries
class KGStore {
  entities = $state<KGEntity[]>([]);
  loading = $state(false);
  error = $state<Error | null>(null);
  
  constructor(private getFilters: () => { agentId: string; userId?: string; entityType?: string; query?: string }) {
    // Add reactivity effect to auto-fetch when filters change
    $effect(() => {
      const filters = this.getFilters();
      if (filters.agentId) {
        this.fetchEntities(filters);
      } else {
        this.entities = [];
      }
    });
  }

  async fetchEntities(filters: { agentId: string; userId?: string; entityType?: string; query?: string }) {
    this.loading = true;
    this.error = null;
    const http = useHttp();
    try {
      const params: Record<string, string> = { limit: "200" };
      if (filters.userId) params.user_id = filters.userId;
      if (filters.entityType) params.type = filters.entityType;
      if (filters.query) params.q = filters.query;
      
      const res = await http.get<KGEntity[]>(`/v1/agents/${filters.agentId}/kg/entities`, params);
      this.entities = res ?? [];
    } catch (e: any) {
      this.error = e;
      this.entities = [];
    } finally {
      this.loading = false;
    }
  }

  refresh() {
    const filters = this.getFilters();
    if (filters.agentId) this.fetchEntities(filters);
  }

  async deleteEntity(entityId: string, userId?: string) {
    const filters = this.getFilters();
    if (!filters.agentId) return;
    const http = useHttp();
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    await http.delete(`/v1/agents/${filters.agentId}/kg/entities/${entityId}${qs}`);
    this.refresh();
  }

  async extractFromText(text: string, provider: string, model: string, userId?: string) {
    const filters = this.getFilters();
    if (!filters.agentId) throw new Error("No agent selected");
    const http = useHttp();
    const res = await http.post<{ entities: number; relations: number }>(
      `/v1/agents/${filters.agentId}/kg/extract`,
      { text, provider, model, user_id: userId || "" }
    );
    this.refresh();
    return res;
  }
}

export function useKnowledgeGraph(getFilters: () => { agentId: string; userId?: string; entityType?: string; query?: string }) {
  return new KGStore(getFilters);
}

class KGStatsStore {
  stats = $state<KGStats | null>(null);
  loading = $state(false);

  constructor(private getAgentId: () => string, private getUserId: () => string | undefined) {
    $effect(() => {
      const agentId = this.getAgentId();
      const userId = this.getUserId();
      if (agentId) {
        this.fetchStats(agentId, userId);
      } else {
        this.stats = null;
      }
    });
  }

  async fetchStats(agentId: string, userId?: string) {
    this.loading = true;
    const http = useHttp();
    try {
      const params: Record<string, string> = {};
      if (userId) params.user_id = userId;
      const res = await http.get<KGStats>(`/v1/agents/${agentId}/kg/stats`, params);
      this.stats = res;
    } catch (e) {
      this.stats = null;
    } finally {
      this.loading = false;
    }
  }
}

export function useKGStats(getAgentId: () => string, getUserId: () => string | undefined) {
  return new KGStatsStore(getAgentId, getUserId);
}

class KGGraphStore {
  entities = $state<KGEntity[]>([]);
  relations = $state<KGRelation[]>([]);
  loading = $state(false);

  constructor(private getAgentId: () => string, private getUserId: () => string | undefined) {
    $effect(() => {
      const agentId = this.getAgentId();
      const userId = this.getUserId();
      if (agentId) {
        this.fetchGraph(agentId, userId);
      } else {
        this.entities = [];
        this.relations = [];
      }
    });
  }

  async fetchGraph(agentId: string, userId?: string) {
    this.loading = true;
    const http = useHttp();
    try {
      const params: Record<string, string> = { limit: "500" };
      if (userId) params.user_id = userId;
      const res = await http.get<{ entities: KGEntity[]; relations: KGRelation[] }>(`/v1/agents/${agentId}/kg/graph`, params);
      this.entities = res?.entities ?? [];
      this.relations = res?.relations ?? [];
    } catch (e) {
      this.entities = [];
      this.relations = [];
    } finally {
      this.loading = false;
    }
  }
}

export function useKGGraph(getAgentId: () => string, getUserId: () => string | undefined) {
  return new KGGraphStore(getAgentId, getUserId);
}

class KGDedupStore {
  candidates = $state<KGDedupCandidate[]>([]);
  loading = $state(false);

  constructor(private getAgentId: () => string, private getUserId: () => string | undefined) {
    $effect(() => {
      const agentId = this.getAgentId();
      if (agentId) {
        this.fetchCandidates();
      } else {
        this.candidates = [];
      }
    });
  }

  async fetchCandidates() {
    this.loading = true;
    const http = useHttp();
    try {
      const agentId = this.getAgentId();
      const userId = this.getUserId();
      const params: Record<string, string> = { limit: "50" };
      if (userId) params.user_id = userId;
      const res = await http.get<KGDedupCandidate[]>(`/v1/agents/${agentId}/kg/dedup`, params);
      this.candidates = res ?? [];
    } catch (e) {
      this.candidates = [];
    } finally {
      this.loading = false;
    }
  }

  refresh() {
    if (this.getAgentId()) this.fetchCandidates();
  }

  async scan() {
    const agentId = this.getAgentId();
    if (!agentId) return;
    const http = useHttp();
    const res = await http.post<{ candidates_found: number }>(
      `/v1/agents/${agentId}/kg/dedup/scan`,
      { user_id: this.getUserId() || "", threshold: 0.90, limit: 100 }
    );
    this.refresh();
    return res.candidates_found;
  }

  async merge(targetId: string, sourceId: string) {
    const agentId = this.getAgentId();
    if (!agentId) return;
    const http = useHttp();
    await http.post(`/v1/agents/${agentId}/kg/merge`, {
      target_id: targetId,
      source_id: sourceId,
      user_id: this.getUserId() || "",
    });
    this.refresh();
  }

  async dismiss(candidateId: string) {
    const agentId = this.getAgentId();
    if (!agentId) return;
    const http = useHttp();
    await http.post(`/v1/agents/${agentId}/kg/dedup/dismiss`, { candidate_id: candidateId });
    this.refresh();
  }
}

export function useKGDedup(getAgentId: () => string, getUserId: () => string | undefined) {
  return new KGDedupStore(getAgentId, getUserId);
}
