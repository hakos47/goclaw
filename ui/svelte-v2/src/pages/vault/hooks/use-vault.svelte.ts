import { useHttp } from "$lib/state/ws.svelte";
import type { VaultDocument } from "../../../types/vault";

export function useRescanWorkspace() {
  const http = useHttp();
  let isPending = $state(false);

  const rescan = async () => {
    isPending = true;
    try {
      await http.post("/v1/vault/scan");
    } catch (err) {
      console.error("Rescan failed", err);
    } finally {
      isPending = false;
    }
  };

  return {
    get isPending() { return isPending; },
    rescan,
  };
}

export function useStopEnrichment() {
  const http = useHttp();
  let isPending = $state(false);

  const stop = async () => {
    isPending = true;
    try {
      await http.post("/v1/vault/scan/stop");
    } catch (err) {
      console.error("Stop enrichment failed", err);
    } finally {
      isPending = false;
    }
  };

  return {
    get isPending() { return isPending; },
    stop,
  };
}

export function useVaultDocument(getDocId: () => string | null) {
  const http = useHttp();
  let document = $state<VaultDocument | null>(null);
  let loading = $state(false);

  const load = async () => {
    const id = getDocId();
    if (!id) {
      document = null;
      return;
    }
    loading = true;
    try {
      document = await http.get<VaultDocument>(`/v1/vault/documents/${id}`);
    } catch (err) {
      console.error("Failed to load vault document", err);
      document = null;
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    load();
  });

  return {
    get document() { return document; },
    get loading() { return loading; },
    refresh: load,
  };
}

export function useVaultFileContent(getPath: () => string | null) {
  const http = useHttp();
  let content = $state<string | null>(null);
  let size = $state(0);
  let loading = $state(false);
  let error = $state(false);

  const load = async () => {
    const path = getPath();
    if (!path) {
      content = null;
      size = 0;
      error = false;
      return;
    }
    loading = true;
    error = false;
    try {
      const res = await http.get<{ content: string; path: string; size: number }>(
        `/v1/storage/files/${encodeURIComponent(path)}`
      );
      content = res.content ?? null;
      size = res.size ?? 0;
    } catch (err) {
      console.error("Failed to load vault file content", err);
      content = null;
      error = true;
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    load();
  });

  return {
    get content() { return content; },
    get size() { return size; },
    get loading() { return loading; },
    get error() { return error; },
    refresh: load,
  };
}

export interface VaultBacklink {
  from_doc_id: string;
  context: string;
  title: string;
  path: string;
  team_id?: string;
}

export function useVaultLinks(getDocId: () => string | null) {
  const http = useHttp();
  
  let outlinks = $state<any[]>([]);
  let backlinks = $state<VaultBacklink[]>([]);
  let docNames = $state<Record<string, string>>({});
  let loading = $state(false);

  const load = async () => {
    const docId = getDocId();
    if (!docId) {
      outlinks = [];
      backlinks = [];
      docNames = {};
      return;
    }
    loading = true;
    try {
      const res = await http.get<{
        outlinks: any[];
        backlinks: VaultBacklink[];
        doc_names: Record<string, string>;
      }>(`/v1/vault/documents/${docId}/links`);
      
      outlinks = res.outlinks ?? [];
      backlinks = res.backlinks ?? [];
      docNames = res.doc_names ?? {};
    } catch (err) {
      console.error("Failed to load vault links", err);
      outlinks = [];
      backlinks = [];
      docNames = {};
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    load();
  });

  return {
    get outlinks() { return outlinks; },
    get backlinks() { return backlinks; },
    get docNames() { return docNames; },
    get loading() { return loading; },
    refresh: load,
  };
}

export function useUpdateDocument() {
  const http = useHttp();
  let isPending = $state(false);

  const update = async (id: string, payload: { title?: string; doc_type?: string; scope?: string }) => {
    isPending = true;
    try {
      await http.put(`/v1/vault/documents/${id}`, payload);
    } catch (err) {
      console.error("Failed to update document", err);
      throw err;
    } finally {
      isPending = false;
    }
  };

  return {
    get isPending() { return isPending; },
    update,
  };
}

export function useDeleteDocument() {
  const http = useHttp();
  let isPending = $state(false);

  const remove = async (id: string) => {
    isPending = true;
    try {
      await http.delete(`/v1/vault/documents/${id}`);
    } catch (err) {
      console.error("Failed to delete document", err);
      throw err;
    } finally {
      isPending = false;
    }
  };

  return {
    get isPending() { return isPending; },
    remove,
  };
}

export function useCreateLink() {
  const http = useHttp();
  let isPending = $state(false);

  const create = async (payload: { from_doc_id: string; to_doc_id: string; link_type: string; context?: string }) => {
    isPending = true;
    try {
      const res = await http.post("/v1/vault/links", payload);
      return res;
    } catch (err) {
      console.error("Failed to create link", err);
      throw err;
    } finally {
      isPending = false;
    }
  };

  return {
    get isPending() { return isPending; },
    create,
  };
}

export function useVaultDocuments(getAgentId: () => string | null | undefined, params: { limit?: number; offset?: number } = {}) {
  const http = useHttp();
  let documents = $state<VaultDocument[]>([]);
  let loading = $state(false);

  const load = async () => {
    loading = true;
    try {
      const agentId = getAgentId();
      const p: Record<string, string> = {};
      if (agentId) p.agent_id = agentId;
      if (params.limit) p.limit = String(params.limit);
      if (params.offset) p.offset = String(params.offset);

      const res = await http.get<{ documents: VaultDocument[] }>("/v1/vault/documents", p);
      documents = res.documents ?? [];
    } catch (err) {
      console.error("Failed to load documents", err);
      documents = [];
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    load();
  });

  return {
    get documents() { return documents; },
    get loading() { return loading; },
    refresh: load,
  };
}
