<script lang="ts">
  import { Brain, Search, Plus, Database, Network } from "lucide-svelte";
  import { agentsState, loadAgents } from "../../pages/agents/hooks/use-agents.svelte";
  import { useMemoryDocuments, useMemorySearch } from "./hooks/use-memory.svelte";
  import MemoryDocumentsList from "./components/MemoryDocumentsList.svelte";
  import EpisodicList from "./components/EpisodicList.svelte";
  import MemoryDocumentDialog from "./documents/MemoryDocumentDialog.svelte";
  import MemoryCreateDialog from "./documents/MemoryCreateDialog.svelte";
  import type { MemoryDocument } from "./types";
  import { fade } from "svelte/transition";
  import { scale } from "svelte/transition";
  import { onMount } from "svelte";

  let agentId = $state("");
  let userIdFilter = $state("");
  let activeTab = $state<"documents" | "episodic" | "knowledge-graph">("documents");
  
  // Dialog states
  let showCreate = $state(false);
  let showSearch = $state(false);
  let viewDoc = $state<MemoryDocument | null>(null);

  onMount(() => {
    loadAgents();
  });
  
  const memoryStore = useMemoryDocuments(() => ({ agentId: agentId || undefined, userId: userIdFilter || undefined }));

  const agentMap = $derived.by(() => {
    const map = new Map<string, string>();
    for (const a of agentsState.agents) {
      map.set(a.id, a.display_name || a.agent_key);
    }
    return map;
  });

  const handleIndexAll = async () => {
    // TODO: implement logic
  };

  const setTab = (tab: "documents" | "episodic" | "knowledge-graph") => {
    activeTab = tab;
  };
</script>

<div class="p-4 sm:p-6 pb-10 flex-1 flex flex-col max-w-7xl mx-auto w-full min-h-0 overflow-y-auto custom-scrollbar">
  
  <!-- Bento Brutalist HUD Header -->
  <div class="shrink-0 relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
    <div class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
    
    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-start gap-4">
        <div class="relative">
          <div class="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-inner backdrop-blur-sm">
            <Brain class="h-8 w-8 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
          </div>
        </div>
        
        <div class="flex flex-col">
          <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tight uppercase">
            Memory Banks
          </h1>
          <p class="text-sm font-medium text-white/50 mt-1">
            Agent knowledge bases, documents, and episodic summaries
          </p>
        </div>
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        {#if agentId}
          <button 
            onclick={() => showSearch = true}
            class="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95"
          >
            <Search class="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
            Search
          </button>
          
          <button 
            onclick={() => showCreate = true}
            class="group flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl text-xs font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95"
          >
            <Plus class="h-4 w-4" />
            Upload
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Filter Toolbar & Tabs -->
  <div class="shrink-0 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <!-- Agent Selector -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Target Agent</label>
        <div class="relative">
          <select
            bind:value={agentId}
            class="appearance-none h-10 pl-4 pr-10 bg-[#050510]/80 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-bold text-white/90 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all cursor-pointer shadow-inner min-w-[200px]"
          >
            <option value="">Global Overview (All Agents)</option>
            {#each agentsState.agents as agent}
              <option value={agent.id}>{agent.display_name || agent.agent_key}</option>
            {/each}
          </select>
          <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Switch -->
    <div class="flex lg:justify-end items-end overflow-x-auto custom-scrollbar pb-1">
      <div class="flex p-1 bg-[#050510]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-inner min-w-max">
        <button 
          onclick={() => setTab('documents')}
          class="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all {activeTab === 'documents' ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400 shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]' : 'text-white/40 hover:text-white/70 border border-transparent'}"
        >
          <Database class="h-4 w-4" /> Documents
        </button>
        <button 
          onclick={() => setTab('episodic')}
          class="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all {activeTab === 'episodic' ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]' : 'text-white/40 hover:text-white/70 border border-transparent'}"
        >
          <Network class="h-4 w-4" /> Episodic
        </button>
        <button 
          onclick={() => setTab('knowledge-graph')}
          class="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all {activeTab === 'knowledge-graph' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]' : 'text-white/40 hover:text-white/70 border border-transparent'}"
        >
          <Brain class="h-4 w-4" /> Knowledge Graph
        </button>
      </div>
    </div>
  </div>

  <!-- Content Area -->
  <div class="flex-1 min-h-0 mt-6 relative">
    {#if activeTab === 'documents'}
      <div in:fade={{ duration: 200, delay: 100 }} class="absolute inset-0 overflow-y-auto custom-scrollbar pr-2">
        <MemoryDocumentsList
          documents={memoryStore.documents}
          loading={memoryStore.loading}
          {agentMap}
          onView={(doc) => {
            viewDoc = doc;
          }}
          onReindex={(doc) => {
            memoryStore.indexDocument(doc.path, doc.user_id);
          }}
          onDelete={(doc) => {
            memoryStore.deleteDocument(doc.path, doc.user_id, doc.agent_id);
          }}
        />
      </div>
    {:else if activeTab === 'episodic'}
      <div in:fade={{ duration: 200, delay: 100 }} class="absolute inset-0">
        <EpisodicList {agentId} />
      </div>
    {/if}
  </div>

  <MemoryDocumentDialog 
    bind:open={() => !!viewDoc, (v) => { if (!v) viewDoc = null; }}
    document={viewDoc}
    agentId={viewDoc?.agent_id || agentId}
    onSave={async (path, content, userId) => {
      await memoryStore.updateDocument(path, content, userId);
    }}
  />

  <MemoryCreateDialog
    bind:open={showCreate}
    agentId={agentId}
    knownUserIds={[]} 
    onCreate={async (path, content, userId) => {
      await memoryStore.createDocument(path, content, userId);
    }}
  />
</div>
