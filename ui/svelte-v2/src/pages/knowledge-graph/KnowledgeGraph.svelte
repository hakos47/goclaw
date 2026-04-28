<script lang="ts">
  import { Network, Sparkles, LayoutGrid, Share2, Search, Merge, RefreshCw } from "lucide-svelte";
  import { agentsState, loadAgents } from "../agents/hooks/use-agents.svelte";
  import { useKGStats, useKnowledgeGraph } from "./hooks/use-knowledge-graph.svelte";
  import KGEntitiesTable from "./components/KGEntitiesTable.svelte";
  import KGGraphView from "./components/KGGraphView.svelte";
  import KGDedupDialog from "./dialogs/KGDedupDialog.svelte";
  import KGExtractDialog from "./dialogs/KGExtractDialog.svelte";
  import { authState } from "$lib/state/auth.svelte";
  import { wsState } from "$lib/state/ws.svelte";

  let agentId = $state("");
  let userIdFilter = $state("");
  let viewMode = $state<"graph" | "table">("graph");
  
  let searchQuery = $state("");
  let appliedQuery = $state("");

  let dedupOpen = $state(false);
  let extractOpen = $state(false);

  $effect(() => {
    if (wsState.connected && authState.tenantId) {
      loadAgents();
    }
  });

  const statsStore = useKGStats(() => agentId, () => userIdFilter);
  const kgStore = useKnowledgeGraph(() => ({ agentId, userId: userIdFilter, query: appliedQuery }));

  let scopeOptions = $derived.by(() => {
    if (!statsStore.stats?.user_ids) return [];
    return statsStore.stats.user_ids.map(uid => ({ value: uid, label: uid }));
  });

  const handleSearch = () => {
    appliedQuery = searchQuery.trim();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };
</script>

<div class="flex h-full flex-col p-4 sm:p-6 overflow-hidden max-w-[1600px] mx-auto w-full">
  
  <!-- Header & Filters -->
  <div class="shrink-0 flex flex-wrap items-center gap-4 mb-4">
    <div class="mr-auto">
      <h1 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tight uppercase flex items-center gap-3">
        <Network class="h-6 w-6 text-emerald-400" />
        Knowledge Graph
      </h1>
      <p class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">
        Semantic entity relationships
      </p>
    </div>

    <!-- Agent Selector -->
    <select
      bind:value={agentId}
      onchange={() => userIdFilter = ""}
      class="appearance-none h-10 px-4 bg-[#050510]/80 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-bold text-white/90 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all cursor-pointer shadow-inner min-w-[200px]"
    >
      <option value="">-- Select Agent --</option>
      {#each agentsState.agents as a}
        <option value={a.id}>{a.display_name || a.agent_key}</option>
      {/each}
    </select>

    {#if agentId}
      <select
        bind:value={userIdFilter}
        class="appearance-none h-10 px-4 bg-[#050510]/80 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-bold text-white/90 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all cursor-pointer shadow-inner min-w-[150px]"
      >
        <option value="">All Users</option>
        {#each scopeOptions as o}
          <option value={o.value}>{o.label}</option>
        {/each}
      </select>
    {/if}
  </div>

  <!-- Main Toolbar -->
  {#if agentId}
    <div class="shrink-0 flex flex-wrap items-center gap-3 mb-4 bg-black/40 border border-white/5 p-2 rounded-2xl">
      <!-- Search Input -->
      <div class="flex items-center gap-2 flex-1 min-w-[200px] max-w-[300px]">
        <div class="relative w-full">
          <input
            type="text"
            bind:value={searchQuery}
            onkeydown={handleKeyDown}
            placeholder="Search entities..."
            class="w-full h-9 pl-10 pr-4 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        </div>
        <button
          onclick={handleSearch}
          class="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white/70 hover:text-white transition-all"
        >
          Search
        </button>
        {#if appliedQuery}
          <button
            onclick={() => { appliedQuery = ""; searchQuery = ""; }}
            class="px-3 py-2 text-xs font-black uppercase text-white/40 hover:text-white transition-all"
          >
            Clear
          </button>
        {/if}
      </div>

      <div class="flex-1"></div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- View Toggle -->
        <div class="flex p-1 bg-black/50 border border-white/10 rounded-xl shadow-inner mr-2">
          <button 
            onclick={() => viewMode = 'graph'}
            class="p-1.5 rounded-lg transition-all {viewMode === 'graph' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}"
            title="Graph View"
          >
            <Share2 class="h-4 w-4" />
          </button>
          <button 
            onclick={() => viewMode = 'table'}
            class="p-1.5 rounded-lg transition-all {viewMode === 'table' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}"
            title="Table View"
          >
            <LayoutGrid class="h-4 w-4" />
          </button>
        </div>

        <button 
          onclick={() => kgStore.refresh()}
          class="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-all"
          title="Refresh"
        >
          <RefreshCw class="h-4 w-4 {kgStore.loading ? 'animate-spin text-emerald-400' : ''}" />
        </button>
        
        <button 
          onclick={() => dedupOpen = true}
          class="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white/70 hover:text-white transition-all"
        >
          <Merge class="h-4 w-4" /> Dedup
        </button>

        <button 
          onclick={() => extractOpen = true}
          class="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <Sparkles class="h-4 w-4" /> Extract
        </button>
      </div>
    </div>

    <!-- Stats -->
    {#if statsStore.stats}
      <div class="shrink-0 flex flex-wrap gap-x-4 gap-y-2 mb-4 px-2 text-[10px] font-black uppercase tracking-widest text-white/40">
        <span>Entities: <span class="text-white">{statsStore.stats.entity_count}</span></span>
        <span>Relations: <span class="text-white">{statsStore.stats.relation_count}</span></span>
        <span class="text-white/20">|</span>
        {#each Object.entries(statsStore.stats.entity_types) as [type, count]}
          <span>{type}: <span class="text-white">{count}</span></span>
        {/each}
      </div>
    {/if}
  {/if}

  <!-- Main Content Area -->
  <div class="flex-1 min-h-0 relative bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    {#if !agentId}
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
        <Network class="h-16 w-16 text-emerald-400/20 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
        <h3 class="text-xl font-black text-white uppercase tracking-widest mb-2">Select Agent</h3>
        <p class="text-sm text-white/40 max-w-md">Choose an agent from the dropdown above to view and manage its semantic Knowledge Graph.</p>
      </div>
    {:else}
      {#if viewMode === 'graph'}
        <KGGraphView 
          {agentId} 
          userId={userIdFilter} 
          query={appliedQuery} 
          onEntityClick={(e) => {}} 
        />
      {:else}
        <KGEntitiesTable 
          entities={kgStore.entities} 
          loading={kgStore.loading} 
          onView={(e) => {}} 
          onDelete={(e) => kgStore.deleteEntity(e.id, e.user_id)} 
        />
      {/if}
    {/if}
  </div>

  <KGDedupDialog 
    bind:open={dedupOpen} 
    {agentId} 
    userId={userIdFilter} 
  />

  <KGExtractDialog 
    bind:open={extractOpen} 
    onExtract={(text, provider, model) => kgStore.extractFromText(text, provider, model, userIdFilter)} 
  />

</div>
