import { useHttp } from "../../../lib/state/ws.svelte";
import type { MemoryDocument, MemoryDocumentDetail, MemoryChunk, MemorySearchResult } from "../types";

export interface MemoryDocFilters {
  agentId?: string;
  userId?: string;
}

export function useMemoryDocuments(getFilters: () => MemoryDocFilters) {
  let documents = $state<MemoryDocument[]>([]);
  let loading = $state(true);
  let fetching = $state(false);
  let error = $state<Error | null>(null);

  const http = useHttp();

  const loadDocuments = async () => {
    fetching = true;
    error = null;
    const filters = getFilters();
    try {
      if (!filters.agentId) {
        const res = await http.get<MemoryDocument[]>("/v1/memory/documents");
        documents = res ?? [];
      } else {
        const params: Record<string, string> = {};
        if (filters.userId) params.user_id = filters.userId;
        const res = await http.get<MemoryDocument[]>(
          `/v1/agents/${filters.agentId}/memory/documents`,
          params
        );
        documents = res ?? [];
      }
    } catch (err: any) {
      error = err;
      console.error("[useMemoryDocuments] Failed to load documents", err);
    } finally {
      loading = false;
      fetching = false;
    }
  };

  const getDocument = async (path: string, userId?: string) => {
    const filters = getFilters();
    const params: Record<string, string> = {};
    if (userId) params.user_id = userId;
    return http.get<MemoryDocumentDetail>(
      `/v1/agents/${filters.agentId}/memory/documents/${path}`,
      params
    );
  };

  const createDocument = async (path: string, content: string, userId?: string) => {
    const filters = getFilters();
    await http.put(`/v1/agents/${filters.agentId}/memory/documents/${path}`, {
      content,
      user_id: userId || "",
    });
    await loadDocuments();
  };

  const updateDocument = async (path: string, content: string, userId?: string) => {
    const filters = getFilters();
    await http.put(`/v1/agents/${filters.agentId}/memory/documents/${path}`, {
      content,
      user_id: userId || "",
    });
    await loadDocuments();
  };

  const deleteDocument = async (path: string, userId?: string, agentId?: string) => {
    const filters = getFilters();
    const aid = agentId || filters.agentId;
    if (!aid) throw new Error("No agent selected");
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    await http.delete(`/v1/agents/${aid}/memory/documents/${path}${qs}`);
    await loadDocuments();
  };

  const getChunks = async (path: string, userId?: string) => {
    const filters = getFilters();
    const params: Record<string, string> = { path };
    if (userId) params.user_id = userId;
    return http.get<MemoryChunk[]>(`/v1/agents/${filters.agentId}/memory/chunks`, params);
  };

  const indexDocument = async (path: string, userId?: string) => {
    const filters = getFilters();
    await http.post(`/v1/agents/${filters.agentId}/memory/index`, {
      path,
      user_id: userId || "",
    });
    // Optimistic refresh, actual index might take time but status will update
    await loadDocuments();
  };

  const indexAll = async (userId?: string) => {
    const filters = getFilters();
    await http.post(`/v1/agents/${filters.agentId}/memory/index-all`, {
      user_id: userId || "",
    });
    await loadDocuments();
  };

  $effect(() => {
    // Automatically fetch when filters change
    loadDocuments();
  });

  return {
    get documents() { return documents; },
    get loading() { return loading; },
    get fetching() { return fetching; },
    get error() { return error; },
    refresh: loadDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    getChunks,
    indexDocument,
    indexAll,
  };
}

export function useMemorySearch(agentId: string) {
  const http = useHttp();
  let results = $state<MemorySearchResult[]>([]);
  let searching = $state(false);

  const search = async (query: string, userId?: string, maxResults?: number, minScore?: number) => {
    searching = true;
    try {
      const res = await http.post<{ results: MemorySearchResult[]; count: number }>(
        `/v1/agents/${agentId}/memory/search`,
        {
          query,
          user_id: userId || "",
          max_results: maxResults || 10,
          min_score: minScore || 0,
        }
      );
      results = res.results ?? [];
      return res.results ?? [];
    } catch (err) {
      console.error("[useMemorySearch] failed:", err);
      results = [];
      return [];
    } finally {
      searching = false;
    }
  };

  return { 
    get results() { return results; },
    get searching() { return searching; },
    search 
  };
}
