import { useHttp } from "$lib/state/ws.svelte";
import { buildTree, mergeSubtree, setNodeLoading, type TreeNode } from "$lib/file-helpers";

export interface VaultTreeEntry {
  name: string;
  path: string;
  isDir: boolean;
  hasChildren?: boolean;
  docId?: string;
  docType?: string;
  scope?: string;
  title?: string;
  updatedAt?: string;
}

interface VaultTreeResponse { entries: VaultTreeEntry[] }

export interface VaultTreeFilter {
  agent_id?: string;
  scope?: string;
  doc_type?: string;
  team_id?: string;
}

function toTreeInputs(entries: VaultTreeEntry[]) {
  return entries.map((e) => ({
    path: e.path, name: e.name, isDir: e.isDir, size: 0, hasChildren: e.hasChildren,
  }));
}

export function useVaultTree(getFilter: () => VaultTreeFilter) {
  const http = useHttp();
  let tree = $state<TreeNode[]>([]);
  let meta = $state<Map<string, VaultTreeEntry>>(new Map());
  let loading = $state(false);
  let treeVersion = $state(0);

  const buildParams = (extraPath?: string): Record<string, string> => {
    const filter = getFilter();
    const p: Record<string, string> = {};
    if (extraPath) p.path = extraPath;
    if (filter.agent_id) p.agent_id = filter.agent_id;
    if (filter.scope) p.scope = filter.scope;
    if (filter.doc_type) p.doc_type = filter.doc_type;
    if (filter.team_id) p.team_id = filter.team_id;
    return p;
  };

  const loadRoot = async () => {
    loading = true;
    try {
      const res = await http.get<VaultTreeResponse>("/v1/vault/tree", buildParams());
      const entries = res.entries ?? [];
      
      const newMeta = new Map(meta);
      for (const e of entries) newMeta.set(e.path, e);
      meta = newMeta;
      
      tree = buildTree(toTreeInputs(entries));
      treeVersion++;
    } catch (err) {
      console.error("Failed to load vault tree root", err);
    } finally {
      loading = false;
    }
  };

  const loadSubtree = async (path: string) => {
    tree = setNodeLoading(tree, path, true);
    try {
      const res = await http.get<VaultTreeResponse>("/v1/vault/tree", buildParams(path));
      const entries = res.entries ?? [];
      
      const newMeta = new Map(meta);
      for (const e of entries) newMeta.set(e.path, e);
      meta = newMeta;
      
      tree = mergeSubtree(tree, path, toTreeInputs(entries));
    } catch (err) {
      console.error("Failed to load vault subtree", err);
      tree = setNodeLoading(tree, path, false);
    }
  };

  $effect(() => {
    // Automatically fetch when filters change
    loadRoot();
  });

  return {
    get tree() { return tree; },
    get meta() { return meta; },
    get loading() { return loading; },
    get treeVersion() { return treeVersion; },
    loadRoot,
    loadSubtree,
  };
}
