import { useHttp } from "$lib/state/ws.svelte";

export interface ActivityLog {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: unknown;
  ip_address: string;
  created_at: string;
}

interface ActivityListResponse {
  logs: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
}

interface ActivityFilters {
  action?: string;
  entity_type?: string;
  actor_id?: string;
  limit?: number;
  offset?: number;
}

export function useActivity() {
  const http = useHttp();
  let logs = $state<ActivityLog[]>([]);
  let total = $state(0);
  let loading = $state(true);

  const load = async (filters?: ActivityFilters) => {
    loading = true;
    try {
      const params: Record<string, string> = {};
      if (filters?.action) params.action = filters.action;
      if (filters?.entity_type) params.entity_type = filters.entity_type;
      if (filters?.actor_id) params.actor_id = filters.actor_id;
      if (filters?.limit !== undefined) params.limit = String(filters.limit);
      if (filters?.offset !== undefined) params.offset = String(filters.offset);

      const res = await http.get<ActivityListResponse>("/v1/activity", params);
      logs = res.logs ?? [];
      total = res.total ?? 0;
    } catch {
      // ignore
    } finally {
      loading = false;
    }
  };

  return {
    get logs() { return logs; },
    get total() { return total; },
    get loading() { return loading; },
    load
  };
}
