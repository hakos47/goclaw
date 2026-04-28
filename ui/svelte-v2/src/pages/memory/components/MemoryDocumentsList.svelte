<script lang="ts">
  import { Database, Eye, RefreshCw, Trash2, CheckCircle2, Clock, AlertTriangle, Search, FileText } from "lucide-svelte";
  import type { MemoryDocument } from "../types";
  import { fade, slide } from "svelte/transition";
  import { formatRelativeTime } from "$lib/format";

  let { 
    documents, 
    loading, 
    agentMap,
    onView,
    onReindex,
    onDelete
  } = $props<{
    documents: MemoryDocument[];
    loading: boolean;
    agentMap: Map<string, string>;
    onView: (doc: MemoryDocument) => void;
    onReindex: (doc: MemoryDocument) => void;
    onDelete: (doc: MemoryDocument) => void;
  }>();

  // Search filter
  let searchQuery = $state("");
  let filteredDocs = $derived(
    documents.filter(d => d.path.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-400 bg-emerald-400/10 border-emerald-500/30";
      case "indexing": return "text-blue-400 bg-blue-400/10 border-blue-500/30 animate-pulse";
      case "error": return "text-red-400 bg-red-400/10 border-red-500/30";
      default: return "text-amber-400 bg-amber-400/10 border-amber-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle2;
      case "indexing": return RefreshCw;
      case "error": return AlertTriangle;
      default: return Clock;
    }
  };
</script>

<div class="flex flex-col gap-4 w-full h-full">
  
  {#if loading && documents.length === 0}
    <div class="w-full flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <RefreshCw class="h-8 w-8 text-purple-500 animate-spin" />
        <span class="text-white/40 text-sm font-medium uppercase tracking-widest">Scanning Memory Banks...</span>
      </div>
    </div>
  {:else if documents.length === 0}
    <div class="w-full flex-1 flex flex-col items-center justify-center border border-white/5 border-dashed rounded-[2rem] bg-white/[0.01] p-8">
      <Database class="h-12 w-12 text-white/20 mb-4" />
      <h3 class="text-lg font-black text-white/70 uppercase tracking-widest">No Documents Found</h3>
      <p class="text-white/40 text-sm text-center max-w-md mt-2">
        Upload text files, code snippets, or documentation to expand your agent's semantic knowledge base.
      </p>
    </div>
  {:else}
    <!-- Search / Filter bar -->
    <div class="relative w-full max-w-md">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search class="h-4 w-4 text-white/30" />
      </div>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Filter by filename/path..."
        class="w-full h-10 pl-10 pr-4 bg-[#050510]/80 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-bold text-white/90 placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6 auto-rows-max">
      {#each filteredDocs as doc (`${doc.agent_id}-${doc.user_id}-${doc.path}`)}
        {@const StatusIcon = getStatusIcon(doc.status)}
        <div in:fade={{ duration: 200 }} class="group flex flex-col p-4 bg-[#050510]/60 backdrop-blur-md border border-white/10 hover:border-purple-500/30 rounded-2xl transition-all hover:bg-white/[0.03] hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
          
          <div class="flex justify-between items-start gap-4 mb-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="p-2 bg-purple-500/10 rounded-lg shrink-0">
                <FileText class="h-5 w-5 text-purple-400" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-bold text-white/90 truncate" title={doc.path}>
                  {doc.path}
                </span>
                <span class="text-[10px] uppercase tracking-widest text-white/40">
                  {agentMap.get(doc.agent_id) || doc.agent_id.substring(0, 8)}
                </span>
              </div>
            </div>

            <!-- Action Menu -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button 
                onclick={() => onView(doc)}
                class="p-1.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-md text-white/50 hover:text-white transition-colors"
                title="View / Edit Content"
              >
                <Eye class="h-3.5 w-3.5" />
              </button>
              <button 
                onclick={() => onReindex(doc)}
                class="p-1.5 bg-white/5 hover:bg-blue-500/20 border border-transparent hover:border-blue-500/30 rounded-md text-white/50 hover:text-blue-400 transition-colors"
                title="Re-index Document"
              >
                <RefreshCw class="h-3.5 w-3.5" />
              </button>
              <button 
                onclick={() => onDelete(doc)}
                class="p-1.5 bg-white/5 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 rounded-md text-white/50 hover:text-red-400 transition-colors"
                title="Delete Document"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <!-- Status & Metrics -->
          <div class="flex flex-wrap items-center gap-2 mt-auto">
            <div class="flex items-center gap-1.5 px-2 py-1 border rounded-md text-[10px] font-bold uppercase tracking-widest {getStatusColor(doc.status)}">
              <StatusIcon class="h-3 w-3 {doc.status === 'indexing' ? 'animate-spin' : ''}" />
              {doc.status}
            </div>

            <div class="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/5 rounded-md text-[10px] font-bold uppercase tracking-widest text-white/50">
              <span>{doc.chunk_count} Chunks</span>
              <span class="w-1 h-1 rounded-full bg-white/20"></span>
              <span>{doc.token_count} Tokens</span>
            </div>

            <span class="ml-auto text-[10px] text-white/30 uppercase tracking-wider">
              {formatRelativeTime(doc.created_at)}
            </span>
          </div>

          {#if doc.error_message}
            <div class="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p class="text-xs text-red-400 font-medium">{doc.error_message}</p>
            </div>
          {/if}

        </div>
      {/each}
    </div>
  {/if}
</div>
