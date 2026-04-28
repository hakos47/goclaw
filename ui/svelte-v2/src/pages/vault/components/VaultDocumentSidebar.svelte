<script lang="ts">
  import { Search, X, Loader2, FileText, Brain, StickyNote, Sparkles, Clock, Image, FileType } from "lucide-svelte";
  import { formatRelativeTime } from "$lib/format";
  import type { TreeNode } from "$lib/file-helpers";
  import type { VaultDocument, VaultSearchResult } from "../../types/vault";
  import type { VaultTreeEntry } from "../hooks/use-vault-tree.svelte";
  import VaultTree from "./VaultTree.svelte";
  import { useHttp } from "$lib/state/ws.svelte";

  let {
    tree,
    meta,
    selectedPath,
    onSelect,
    onLoadMore,
    loading,
    docType,
    onDocTypeChange,
    agentId,
    teamId,
    treeVersion
  } = $props<{
    tree: TreeNode[];
    meta: Map<string, VaultTreeEntry>;
    selectedPath: string | null;
    onSelect: (path: string) => void;
    onLoadMore: (path: string) => void;
    loading: boolean;
    docType: string;
    onDocTypeChange: (type: string) => void;
    agentId: string;
    teamId: string;
    treeVersion: number;
  }>();

  const http = useHttp();

  const DOC_TYPE_CONFIG: Record<string, { color: string; bg: string; icon: any; dotColor: string }> = {
    context:  { color: "text-blue-400",    bg: "bg-blue-500/10",    icon: FileText, dotColor: "bg-blue-500" },
    memory:   { color: "text-purple-400",  bg: "bg-purple-500/10",  icon: Brain,    dotColor: "bg-purple-500" },
    note:     { color: "text-amber-400",   bg: "bg-amber-500/10",   icon: StickyNote, dotColor: "bg-amber-500" },
    skill:    { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Sparkles, dotColor: "bg-emerald-500" },
    episodic: { color: "text-orange-400",  bg: "bg-orange-500/10",  icon: Clock,    dotColor: "bg-orange-500" },
    media:    { color: "text-rose-400",    bg: "bg-rose-500/10",    icon: Image,    dotColor: "bg-rose-500" },
    document: { color: "text-cyan-400",    bg: "bg-cyan-500/10",    icon: FileType, dotColor: "bg-cyan-500" },
  };
  const DEFAULT_CONFIG = { color: "text-white/40", bg: "bg-white/5", icon: FileText, dotColor: "bg-white/40" };
  const DOC_TYPES = ["context", "memory", "note", "skill", "episodic", "media", "document"] as const;

  let query = $state("");
  let searchResults = $state<VaultSearchResult[] | null>(null);
  let searching = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const doSearch = async (q: string) => {
    if (!q.trim()) { searchResults = null; return; }
    searching = true;
    try {
      const res = await http.post<{ results: VaultSearchResult[] }>("/v1/vault/search-all", {
        query: q,
        agent_id: agentId || undefined,
        doc_types: docType ? [docType] : undefined,
        team_id: teamId || undefined,
        max_results: 30
      });
      // The API might return an array directly just like Episodic, let's assume it returns an array if results is undefined
      searchResults = res.results ?? (Array.isArray(res) ? res : []);
    } catch {
      searchResults = [];
    } finally {
      searching = false;
    }
  };

  const handleQueryChange = (value: string) => {
    query = value;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!value.trim()) { searchResults = null; return; }
    debounceTimer = setTimeout(() => doSearch(value), 300);
  };

  const clearSearch = () => {
    query = "";
    searchResults = null;
  };

  let isSearchMode = $derived(query.trim().length > 0);

</script>

<div class="flex h-full flex-col bg-transparent">
  <!-- Top Search & Filter Bar -->
  <div class="shrink-0 border-b border-white/5 p-3 space-y-3 bg-black/20">
    
    <!-- Filter Tags -->
    <div class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
      <button 
        onclick={() => onDocTypeChange("")}
        class="shrink-0 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all {!docType ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-transparent'}"
      >
        All Types
      </button>
      
      {#each DOC_TYPES as dt}
        {@const cfg = DOC_TYPE_CONFIG[dt] ?? DEFAULT_CONFIG}
        {@const active = docType === dt}
        <button 
          onclick={() => onDocTypeChange(active ? "" : dt)}
          class="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all {active ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-transparent'}"
        >
          <span class="h-1.5 w-1.5 rounded-full {active ? 'bg-white' : cfg.dotColor}"></span>
          {dt}
        </button>
      {/each}
    </div>

    <!-- Search Input -->
    <div class="relative group">
      {#if searching}
        <Loader2 class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-400 animate-spin" />
      {:else}
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
      {/if}
      
      <input 
        type="text" 
        value={query}
        oninput={(e) => handleQueryChange(e.currentTarget.value)}
        placeholder="Search documents by content..."
        class="w-full h-9 pl-9 pr-8 bg-black/40 border border-white/10 rounded-lg text-xs font-medium text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
      />
      
      {#if query}
        <button 
          onclick={clearSearch} 
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <X class="h-3 w-3" />
        </button>
      {/if}
    </div>
  </div>

  <!-- Content Area (Tree or Search Results) -->
  <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
    {#if isSearchMode}
      
      {#if searching && !searchResults}
        <!-- Loading Skeletons -->
        <div class="flex flex-col gap-2 p-2">
          {#each Array(6) as _}
            <div class="flex items-center gap-3 p-2 rounded-xl bg-white/5 animate-pulse">
              <div class="h-8 w-8 rounded-lg bg-white/10 shrink-0"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3 w-3/4 rounded bg-white/10"></div>
                <div class="h-2 w-1/2 rounded bg-white/10"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if searchResults && searchResults.length === 0}
        <div class="flex flex-col items-center justify-center h-40 gap-3 text-white/30">
          <FileText class="h-8 w-8 opacity-50" />
          <span class="text-[10px] font-black uppercase tracking-widest">No matching contents</span>
        </div>
      {:else}
        <div class="flex flex-col gap-1.5 p-1">
          <div class="px-2 pb-2 text-[9px] font-black text-indigo-400/70 uppercase tracking-widest">
            {searchResults?.length} Results Found
          </div>
          {#each searchResults || [] as r (r.document.id)}
            {@const doc = r.document}
            {@const cfg = DOC_TYPE_CONFIG[doc.doc_type] ?? DEFAULT_CONFIG}
            {@const Icon = cfg.icon}
            
            <button 
              onclick={() => onSelect(doc.path)}
              class="w-full flex items-start gap-3 p-2.5 rounded-xl text-left bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all"
            >
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {cfg.bg} border border-white/5">
                <Icon class="h-4 w-4 {cfg.color}" />
              </div>
              <div class="min-w-0 flex-1">
                <span class="block truncate text-xs font-bold text-white/90">{doc.title || doc.path.split("/").pop()}</span>
                <div class="mt-1 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/40">
                  <span class="{cfg.color}">{doc.doc_type}</span>
                  <span class="w-[3px] h-[3px] rounded-full bg-white/20"></span>
                  <span>{doc.scope}</span>
                  <span class="w-[3px] h-[3px] rounded-full bg-white/20"></span>
                  <span>{formatRelativeTime(doc.updated_at)}</span>
                  
                  <span class="ml-auto px-1.5 py-0.5 rounded text-indigo-400 bg-indigo-500/20 border border-indigo-500/30">
                    {(r.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
      
    {:else}
      <VaultTree 
        {tree} 
        {meta} 
        {loading}
        activePath={selectedPath} 
        {onSelect} 
        {onLoadMore} 
        {treeVersion} 
      />
    {/if}
  </div>
</div>
