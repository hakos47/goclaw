<script lang="ts">
  import { Brain, Search, Network, Clock, ChevronDown, ChevronUp } from "lucide-svelte";
  import type { EpisodicSummary, EpisodicSearchResult } from "../types";
  import { useEpisodicSummaries, useEpisodicSearch } from "../hooks/use-episodic.svelte";
  import { formatRelativeTime } from "$lib/format";
  import { fade, slide } from "svelte/transition";

  let { agentId } = $props<{ agentId: string }>();

  const episodicStore = useEpisodicSummaries(() => agentId, { limit: 50 });
  const episodicSearch = useEpisodicSearch(() => agentId);

  let searchQuery = $state("");
  let searchResults = $state<EpisodicSearchResult[] | null>(null);
  let searching = $state(false);
  let expanded = $state<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      searchResults = null;
      return;
    }
    searching = true;
    searchResults = await episodicSearch.search(searchQuery.trim());
    searching = false;
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expanded = next;
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "session": return "text-blue-400 border-blue-500/30 bg-blue-500/10";
      case "v2_daily": return "text-purple-400 border-purple-500/30 bg-purple-500/10";
      case "manual": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      default: return "text-white/70 border-white/20 bg-white/5";
    }
  };
</script>

<div class="flex flex-col gap-4 w-full h-full">
  
  {#if !agentId}
    <div class="w-full flex-1 flex flex-col items-center justify-center border border-white/5 border-dashed rounded-[2rem] bg-white/[0.01] p-8">
      <Network class="h-12 w-12 text-white/20 mb-4" />
      <h3 class="text-lg font-black text-white/70 uppercase tracking-widest">Select an Agent</h3>
      <p class="text-white/40 text-sm text-center mt-2">
        You must select a specific agent from the global overview to view its episodic memory graph.
      </p>
    </div>
  {:else}
    
    <!-- Search Bar -->
    <div class="flex gap-2 w-full max-w-2xl">
      <div class="relative flex-1">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-4 w-4 text-white/30" />
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          onkeydown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search through past memories and conversations..."
          class="w-full h-10 pl-10 pr-4 bg-[#050510]/80 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-bold text-white/90 placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
        />
      </div>
      <button 
        onclick={handleSearch}
        disabled={searching}
        class="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-xl text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-all disabled:opacity-50"
      >
        {#if searching}
          <Clock class="h-4 w-4 animate-spin" />
        {:else}
          Search
        {/if}
      </button>
      {#if searchResults}
        <button 
          onclick={() => { searchResults = null; searchQuery = ""; }}
          class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-all"
        >
          Clear
        </button>
      {/if}
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2 mt-2 gap-3">
      
      {#if episodicStore.loading && episodicStore.summaries.length === 0}
        <div class="w-full flex-1 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3">
            <Clock class="h-8 w-8 text-blue-500 animate-spin" />
            <span class="text-white/40 text-sm font-medium uppercase tracking-widest">Reconstructing Episodes...</span>
          </div>
        </div>
      {:else if episodicStore.summaries.length === 0 && !searchResults}
        <div class="w-full flex-1 flex flex-col items-center justify-center p-8">
          <Brain class="h-12 w-12 text-white/10 mb-4" />
          <h3 class="text-lg font-black text-white/50 uppercase tracking-widest">No Episodic Data</h3>
          <p class="text-white/30 text-sm text-center mt-2 max-w-sm">
            This agent hasn't formed any episodic memories yet. Chat sessions automatically generate memories after they conclude.
          </p>
        </div>
      {:else if searchResults && searchResults.length === 0}
        <p class="text-white/40 text-sm font-medium uppercase tracking-widest p-4">No results found for "{searchQuery}"</p>
      {:else if searchResults}
        <div class="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{searchResults.length} Matches Found</div>
        {#each searchResults as r (r.episodic_id)}
          <div class="flex flex-col p-4 bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl">
            <p class="text-sm text-white/90 font-medium mb-3">{r.l0_abstract}</p>
            <div class="flex items-center gap-2 mt-auto">
              <span class="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md text-[10px] font-black uppercase">
                Match: {(r.score * 100).toFixed(0)}%
              </span>
              <span class="text-[10px] text-white/40 uppercase tracking-widest">{r.session_key}</span>
              <span class="ml-auto text-[10px] text-white/30 uppercase tracking-wider">{formatRelativeTime(r.created_at)}</span>
            </div>
          </div>
        {/each}
      {:else}
        {#each episodicStore.summaries as s (s.id)}
          <div in:fade={{ duration: 200 }} class="flex flex-col p-4 bg-[#050510]/60 backdrop-blur-md border border-white/10 hover:border-blue-500/30 rounded-2xl transition-all">
            
            <div class="flex justify-between items-start gap-4">
              <p class="text-sm font-bold text-white/90 flex-1 leading-relaxed">{s.l0_abstract}</p>
              
              <button 
                onclick={() => toggleExpand(s.id)}
                class="p-1.5 bg-white/5 hover:bg-white/10 border border-transparent rounded-lg text-white/50 hover:text-white transition-colors shrink-0"
              >
                {#if expanded.has(s.id)}
                  <ChevronUp class="h-4 w-4" />
                {:else}
                  <ChevronDown class="h-4 w-4" />
                {/if}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 mt-3">
              <span class="px-2 py-1 border rounded-md text-[9px] font-black uppercase tracking-widest {getSourceColor(s.source_type)}">
                {s.source_type}
              </span>
              
              {#each s.key_topics as topic}
                <span class="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold uppercase tracking-widest text-white/60">
                  {topic}
                </span>
              {/each}
              
              <div class="ml-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <span>{s.turn_count} Turns</span>
                <span class="w-1 h-1 rounded-full bg-white/10"></span>
                <span>{s.token_count} Tokens</span>
                <span class="w-1 h-1 rounded-full bg-white/10"></span>
                <span>{formatRelativeTime(s.created_at)}</span>
              </div>
            </div>

            {#if expanded.has(s.id)}
              <div transition:slide={{ duration: 200 }} class="mt-4 pt-4 border-t border-white/10">
                <p class="text-xs text-white/60 font-medium whitespace-pre-wrap leading-relaxed">
                  {s.summary}
                </p>
              </div>
            {/if}
            
          </div>
        {/each}
      {/if}
      
    </div>
  {/if}

</div>
