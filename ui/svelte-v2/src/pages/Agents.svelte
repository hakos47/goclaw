<script lang="ts">
  import { onMount } from "svelte";
  import { Plus, Bot, LayoutGrid, List, ArrowLeftRight, ChevronDown, Search, Globe } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import PageHeader from "../lib/components/shared/PageHeader.svelte";
  import EmptyState from "../lib/components/shared/EmptyState.svelte";
  import SearchInput from "../lib/components/shared/SearchInput.svelte";
  import Pagination from "../lib/components/shared/Pagination.svelte";
  import AgentCard from "./agents/components/AgentCard.svelte";
  import AgentListRow from "./agents/components/AgentListRow.svelte";
  import AgentCreateDialog from "./agents/components/AgentCreateDialog.svelte";
  import AgentDetail from "./agents/components/agent-detail/AgentDetail.svelte";
  import { agentsState, loadAgents, resummonAgent, deleteAgent, createAgent } from "./agents/hooks/use-agents.svelte";
  import type { AgentData } from "../lib/types/agent";

  type Props = { path?: string };
  let { path = window.location.pathname }: Props = $props();
  
  let agentId = $derived(path.split('/')[2]);

  let search = $state("");
  let viewMode = $state<"card" | "list">("card");
  let ownerFilter = $state<string | undefined>(undefined);
  let typeFilter = $state<string | undefined>(undefined);
  
  let typeMenuOpen = $state(false);
  let ownerMenuOpen = $state(false);
  
  let page = $state(1);
  let pageSize = $state(12);
  let createDialogOpen = $state(false);

  onMount(() => {
    loadAgents();
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (typeMenuOpen && !target.closest('.type-dropdown')) {
        typeMenuOpen = false;
      }
      if (ownerMenuOpen && !target.closest('.owner-dropdown')) {
        ownerMenuOpen = false;
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  });

  $effect(() => {
    // Reset page on filter change
    const dummy = search + ownerFilter + typeFilter;
    page = 1;
  });

  let ownerIDs = $derived([...new Set(agentsState.agents.map(a => a.owner_id).filter(Boolean))]);
  
  let filtered = $derived(agentsState.agents.filter(a => {
    if (ownerFilter && ownerFilter !== "__all__" && a.owner_id !== ownerFilter) return false;
    if (typeFilter && typeFilter !== "__all__" && a.agent_type !== typeFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      a.agent_key.toLowerCase().includes(q) ||
      (a.display_name ?? "").toLowerCase().includes(q)
    );
  }));

  let totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
  let pageItems = $derived(filtered.slice((page - 1) * pageSize, page * pageSize));

  function handleResummon(agent: AgentData) {
    if (agent.id) {
       resummonAgent(agent.id)
         .catch(e => console.error(e));
    }
  }

  function handleDeleteTarget(agent: AgentData) {
    if (confirm($_('agents.delete.deleteWarning', {default: "Are you sure you want to delete this agent?"}))) {
        deleteAgent(agent.id)
          .catch(e => console.error(e));
    }
  }

  function resolveOwnerName(id: string) {
     return id; // Placeholder for contact resolver if not implemented yet
  }

  function handleClick(agent: AgentData) {
    if (agent.status !== "summoning") {
       window.history.pushState({}, '', `/agents/${agent.id}`);
       const popStateEvent = new PopStateEvent('popstate');
       window.dispatchEvent(popStateEvent);
    }
  }

// ...]

  // TODO: Create Dialog implementation
</script>

{#if agentId}
  <AgentDetail
    {agentId}
    onBack={() => {
       window.history.pushState({}, '', '/agents');
       window.dispatchEvent(new PopStateEvent('popstate'));
    }}
  />
{:else}
<div class="relative isolate p-4 sm:p-6 pb-10 min-h-full">
  
  <!-- Global Background Effects for Dashboard -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.05)_0%,transparent_50%)] pointer-events-none"></div>

  <!-- Radical Telemetry HUD Header -->
  <div class="relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-goclaw-neon-cyan/10 rounded-full blur-[80px] pointer-events-none"></div>
    <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50"></div>
    
    <div class="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      
      <!-- Identity & Title -->
      <div class="flex items-start gap-5">
        <div class="relative hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-[#030014] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)] group">
          <div class="absolute inset-0 bg-goclaw-neon-purple/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Bot class="w-8 h-8 text-goclaw-neon-purple drop-shadow-[0_0_10px_rgba(217,70,239,0.8)] animate-pulse-slow" strokeWidth={1.5} />
          <div class="absolute -right-1.5 -top-1.5 w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)] border-[3px] border-[#030014] animate-pulse"></div>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[9px] font-bold text-goclaw-neon-purple uppercase tracking-[0.3em] bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 px-2.5 py-0.5 rounded shadow-[inset_0_0_8px_rgba(217,70,239,0.2)]">Agents: Online</span>
            <span class="text-[9px] text-white/40 font-bold tracking-[0.2em] uppercase">Entity Management</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/30 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            {$_('agents.title', {default: "Agents"})}
          </h1>
        </div>
      </div>

      <!-- Controls & Actions -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button onclick={() => {
           window.history.pushState({}, '', '/import-export?tab=agents');
           window.dispatchEvent(new PopStateEvent('popstate'));
        }} class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105">
          <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          <ArrowLeftRight class="h-3.5 w-3.5 relative z-10 text-white/30 group-hover:text-white/70 transition-colors duration-500" />
          <span class="relative z-10 drop-shadow-md">{$_('agents.transfer.title', {default: "Transfer"})}</span>
        </button>

        <button onclick={() => { createDialogOpen = true; }} class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105">
          <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
          <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none"></div>
          <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
          
          <Plus class="h-3.5 w-3.5 relative z-10 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] transition-colors duration-500" strokeWidth={3} />
          <span class="relative z-10 drop-shadow-md">{$_('agents.createAgent', {default: "New Agent"})}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Controls & Filters -->
  <div class="mt-8 flex flex-wrap items-center gap-3 relative z-20">
    <div class="max-w-sm w-full sm:w-auto relative group">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Search class="h-4 w-4 text-white/40 group-focus-within:text-goclaw-neon-purple transition-colors" />
      </div>
      <input 
        type="text" 
        bind:value={search} 
        placeholder={$_('agents.searchPlaceholder', {default: "Search agents..."})} 
        class="block w-full sm:w-64 pl-10 pr-4 h-10 rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md text-xs font-semibold text-white placeholder-white/30 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner"
      />
    </div>

    <!-- Type Filter Tabs -->
    <div class="flex items-center gap-2 p-1.5 rounded-2xl bg-[#030014]/80 backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-x-auto scroller-no-scrollbar">
      {#each [
        { id: '__all__', label: $_('agents.allTypes', {default: "All Types"}), icon: LayoutGrid },
        { id: 'open', label: $_('agents.typeOpen', {default: "Open"}), icon: Globe },
        { id: 'predefined', label: $_('agents.typePredefined', {default: "Predefined"}), icon: Bot }
      ] as opt}
        {@const isActive = typeFilter === opt.id || (opt.id === '__all__' && typeFilter === undefined)}
        {@const Icon = opt.icon}
        <button 
          onclick={() => typeFilter = opt.id === '__all__' ? undefined : opt.id}
          class={`relative flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group whitespace-nowrap ${isActive ? 'text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]' : 'text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105'}`}
        >
          {#if isActive}
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
            <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none"></div>
            <!-- Shimmer effect -->
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
          {:else}
            <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          {/if}
          <Icon class={`h-3.5 w-3.5 relative z-10 transition-colors duration-500 ${isActive ? 'text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'text-white/30 group-hover:text-white/70'}`} />
          <span class="relative z-10 drop-shadow-md">{opt.label}</span>
        </button>
      {/each}
    </div>

    <!-- Creator Filter Tabs -->
    {#if ownerIDs.length > 0}
      <div class="flex items-center gap-2 p-1.5 rounded-2xl bg-[#030014]/80 backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-x-auto scroller-no-scrollbar max-w-full sm:max-w-md">
        <button 
          onclick={() => ownerFilter = undefined}
          class={`relative flex flex-shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group whitespace-nowrap ${ownerFilter === undefined || ownerFilter === '__all__' ? 'text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105'}`}
        >
          {#if ownerFilter === undefined || ownerFilter === '__all__'}
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-cyan/30 to-transparent border border-goclaw-neon-cyan/50 rounded-xl"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,1)] rounded-t-full"></div>
            <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-cyan pointer-events-none"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
          {:else}
            <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          {/if}
          <div class={`w-1.5 h-1.5 rounded-full relative z-10 transition-colors duration-500 ${ownerFilter === undefined || ownerFilter === '__all__' ? 'bg-goclaw-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-white/20 group-hover:bg-white/50'}`}></div>
          <span class="relative z-10 drop-shadow-md">{$_('agents.allCreators', {default: "All Creators"})}</span>
        </button>

        {#each ownerIDs as id}
          {@const isActive = ownerFilter === id}
          <button 
            onclick={() => ownerFilter = id}
            class={`relative flex flex-shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group whitespace-nowrap ${isActive ? 'text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105'}`}
          >
            {#if isActive}
              <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-cyan/30 to-transparent border border-goclaw-neon-cyan/50 rounded-xl"></div>
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,1)] rounded-t-full"></div>
              <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-cyan pointer-events-none"></div>
              <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
            {:else}
              <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
            {/if}
            <div class={`w-1.5 h-1.5 rounded-full relative z-10 transition-colors duration-500 ${isActive ? 'bg-goclaw-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-white/20 group-hover:bg-white/50'}`}></div>
            <span class="relative z-10 drop-shadow-md">{resolveOwnerName(id)}</span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- View toggle -->
    <div class="ml-auto flex items-center gap-1 rounded-2xl bg-[#030014]/80 backdrop-blur-3xl border border-white/10 p-1.5 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] relative overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_100%] pointer-events-none"></div>
      
      <button
        class={`relative z-10 inline-flex items-center justify-center rounded-xl text-sm transition-all duration-500 h-9 w-9 p-0 group overflow-hidden ${viewMode === 'card' ? 'text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'text-white/40 hover:bg-white/5 hover:text-white/90 hover:scale-105'}`}
        onclick={() => viewMode = "card"}
        title={$_('agents.viewCard', {default: "Cards"})}
      >
        {#if viewMode === 'card'}
          <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
          <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
        {/if}
        <LayoutGrid class={`h-4 w-4 relative z-10 transition-colors duration-500 ${viewMode === 'card' ? 'text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : ''}`} />
      </button>

      <button
        class={`relative z-10 inline-flex items-center justify-center rounded-xl text-sm transition-all duration-500 h-9 w-9 p-0 group overflow-hidden ${viewMode === 'list' ? 'text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'text-white/40 hover:bg-white/5 hover:text-white/90 hover:scale-105'}`}
        onclick={() => viewMode = "list"}
        title={$_('agents.viewList', {default: "List"})}
      >
        {#if viewMode === 'list'}
          <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-cyan/30 to-transparent border border-goclaw-neon-cyan/50 rounded-xl"></div>
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,1)] rounded-t-full"></div>
          <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
        {/if}
        <List class={`h-4 w-4 relative z-10 transition-colors duration-500 ${viewMode === 'list' ? 'text-goclaw-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''}`} />
      </button>
    </div>
  </div>

  <div class="mt-8 relative z-10">
    {#if agentsState.loading && agentsState.agents.length === 0}
      <!-- Tactical Skeleton Loaders -->
      {#if viewMode === "card"}
        <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {#each Array(6) as _}
            <div class="relative rounded-2xl bg-[#030014]/60 backdrop-blur-2xl border border-white/5 p-6 h-[180px] overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-white/5 animate-pulse"></div>
                  <div class="space-y-2">
                    <div class="w-32 h-4 rounded-md bg-white/10 animate-pulse"></div>
                    <div class="w-24 h-3 rounded-md bg-white/5 animate-pulse"></div>
                  </div>
                </div>
                <div class="w-16 h-5 rounded-full bg-white/5 animate-pulse"></div>
              </div>
              <div class="mt-6 space-y-2">
                <div class="w-full h-2 rounded-full bg-white/5 animate-pulse"></div>
                <div class="w-2/3 h-2 rounded-full bg-white/5 animate-pulse"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="flex flex-col gap-3">
          {#each Array(6) as _}
            <div class="relative flex items-center justify-between rounded-xl bg-[#030014]/60 backdrop-blur-2xl border border-white/5 p-4 overflow-hidden">
               <div class="flex items-center gap-4">
                 <div class="w-10 h-10 rounded-xl bg-white/5 animate-pulse"></div>
                 <div class="space-y-2">
                   <div class="w-40 h-4 rounded-md bg-white/10 animate-pulse"></div>
                   <div class="w-20 h-3 rounded-md bg-white/5 animate-pulse"></div>
                 </div>
               </div>
               <div class="w-24 h-6 rounded-md bg-white/5 animate-pulse"></div>
            </div>
          {/each}
        </div>
      {/if}
    {:else if filtered.length === 0}
      <div class="py-12 relative">
        <div class="absolute inset-0 bg-goclaw-neon-purple/5 blur-[100px] pointer-events-none"></div>
        <EmptyState
          icon={Bot}
          title={search || ownerFilter || typeFilter ? $_('agents.noMatchTitle', {default: "No agents found"}) : $_('agents.emptyTitle', {default: "No agents"})}
          description={search || ownerFilter || typeFilter ? $_('agents.noMatchDescription', {default: "Try adjusting filters."}) : $_('agents.emptyDescription', {default: "Create your first agent."})}
        />
      </div>
    {:else}
      {#if viewMode === "card"}
        <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {#each pageItems as agent}
            <AgentCard
              {agent}
              onClick={() => handleClick(agent)}
              onResummon={() => handleResummon(agent)}
              onDelete={() => handleDeleteTarget(agent)}
            />
          {/each}
        </div>
      {:else}
        <div class="flex flex-col gap-3">
          {#each pageItems as agent}
             <AgentListRow
              {agent}
              ownerName={resolveOwnerName(agent.owner_id)}
              onClick={() => handleClick(agent)}
              onResummon={() => handleResummon(agent)}
              onDelete={() => handleDeleteTarget(agent)}
             />
          {/each}
        </div>
      {/if}

      <!-- Telemetry Footer Pagination -->
      <div class="mt-8 p-3 rounded-2xl bg-[#030014]/60 backdrop-blur-2xl border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden">
        <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none opacity-50"></div>
        <div class="relative z-10 flex items-center justify-between">
          <Pagination
            {page}
            {pageSize}
            total={filtered.length}
            {totalPages}
            onPageChange={(p) => page = p}
            onPageSizeChange={(s) => { pageSize = s; page = 1; }}
          />
        </div>
      </div>
    {/if}
  </div>

  <AgentCreateDialog
    open={createDialogOpen}
    onOpenChange={(v) => createDialogOpen = v}
    onCreate={async (data) => {
       await createAgent(data);
       createDialogOpen = false;
    }}
  />
</div>
{/if}
