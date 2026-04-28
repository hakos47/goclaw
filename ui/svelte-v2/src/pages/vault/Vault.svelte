<script lang="ts">
  import { FileArchive, PanelLeftOpen, Search, FolderSync, Plus, StopCircle, Loader2 } from "lucide-svelte";
  import { useHttp, wsState } from "$lib/state/ws.svelte";
  import { authState } from "$lib/state/auth.svelte";
  import { useRescanWorkspace, useStopEnrichment } from "./hooks/use-vault.svelte";
  import { useEnrichmentProgress } from "./hooks/use-enrichment-progress.svelte";
  import { agentsState, loadAgents } from "$lib/state/agents.svelte";
  import { teamsState, loadTeams } from "$lib/state/teams.svelte";
  import { useVaultTree } from "./hooks/use-vault-tree.svelte";
  import type { VaultDocument } from "../../types/vault";
  // Import components as they are built
  import VaultDocumentSidebar from "./components/VaultDocumentSidebar.svelte";
  import VaultGraphView from "./components/VaultGraphView.svelte";
  import VaultDetailView from "./components/VaultDetailView.svelte";
  import VaultCreateDialog from "./dialogs/VaultCreateDialog.svelte";

  let selectedAgent = $state("");
  let selectedTeam = $state("");
  let docType = $state("");
  
  let searchOpen = $state(false);
  let createOpen = $state(false);
  let sidebarOpen = $state(true);
  
  let detailDoc = $state<VaultDocument | null>(null);
  let selectedDocId = $state<string | null>(null);
  let selectedPath = $state<string | null>(null);

  
  $effect(() => {
    if (wsState.connected && authState.tenantId) {
      loadTeams();
      loadAgents();
    }
  });

  const rescanStore = useRescanWorkspace();
  const stopStore = useStopEnrichment();
  const enrichmentStore = useEnrichmentProgress();
  
  let enrichment = $derived(enrichmentStore.progress);
  let enriching = $derived(enrichment?.running ?? false);

  const vaultTree = useVaultTree(() => ({
    agent_id: selectedAgent || undefined,
    doc_type: docType || undefined,
    team_id: selectedTeam || undefined,
  }));

</script>

<div class="relative flex h-full overflow-hidden bg-[#030014] text-white">
  <!-- Sidebar -->
  <div class="transition-all duration-300 ease-in-out border-r border-white/10 bg-[#050510]/80 backdrop-blur-3xl {sidebarOpen ? 'w-80 lg:w-96 shrink-0' : 'w-0 overflow-hidden border-none opacity-0'}">
    <VaultDocumentSidebar
      tree={vaultTree.tree}
      meta={vaultTree.meta}
      {selectedPath}
      onSelect={async (path) => { 
        selectedPath = path;
        const entry = vaultTree.meta.get(path);
        if (!entry?.docId) return;
        selectedDocId = entry.docId;
        try {
          const http = useHttp();
          detailDoc = await http.get(`/v1/vault/documents/${entry.docId}`);
        } catch (err) {
          console.error("Failed to load document details", err);
        }
      }}
      onLoadMore={vaultTree.loadSubtree}
      loading={vaultTree.loading}
      {docType}
      onDocTypeChange={(t) => docType = t}
      agentId={selectedAgent}
      teamId={selectedTeam}
      treeVersion={vaultTree.treeVersion}
    />
  </div>

  <!-- Main Area -->
  <div class="flex-1 flex flex-col min-w-0 relative">
    
    <!-- Top Header -->
    <div class="flex h-14 items-center gap-3 px-4 border-b border-white/10 bg-black/40 backdrop-blur-xl shrink-0 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      
      <button 
        onclick={() => sidebarOpen = !sidebarOpen}
        class="p-2 -ml-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      >
        <PanelLeftOpen class="h-5 w-5 {sidebarOpen ? '' : 'rotate-180'} transition-transform" />
      </button>
      
      <div class="flex items-center gap-2 mr-auto">
        <div class="p-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg shadow-inner">
          <FileArchive class="h-4 w-4 text-indigo-400" />
        </div>
        <span class="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
          Knowledge Vault
        </span>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-2">
        <select 
          bind:value={selectedAgent} 
          class="h-8 pl-3 pr-8 text-xs font-bold bg-white/5 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-indigo-500/50 hover:bg-white/10 transition-colors"
        >
          <option value="" class="bg-[#050510] text-white">All Agents</option>
          {#each agentsState.agents as a}
            <option value={a.id} class="bg-[#050510] text-white">{a.display_name || a.agent_key}</option>
          {/each}
        </select>
        
        <select 
          bind:value={selectedTeam} 
          class="h-8 pl-3 pr-8 text-xs font-bold bg-white/5 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-indigo-500/50 hover:bg-white/10 transition-colors"
        >
          <option value="" class="bg-[#050510] text-white">All Teams</option>
          {#each teamsState.teams as t}
            <option value={t.id} class="bg-[#050510] text-white">{t.name}</option>
          {/each}
        </select>

        <div class="w-[1px] h-4 bg-white/10 mx-1"></div>

        <button 
          onclick={() => searchOpen = true}
          disabled={!selectedAgent}
          class="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Search Vault"
        >
          <Search class="h-4 w-4" />
        </button>

        <button 
          onclick={enriching ? () => stopStore.stop() : async () => { await rescanStore.rescan(); vaultTree.loadRoot(); }}
          disabled={rescanStore.isPending || stopStore.isPending}
          class="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-50 {enriching ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'}"
          title={enriching ? 'Stop Enrichment' : 'Rescan Workspace'}
        >
          {#if rescanStore.isPending || stopStore.isPending}
            <Loader2 class="h-4 w-4 animate-spin" />
          {:else if enriching}
            <StopCircle class="h-4 w-4" />
          {:else}
            <FolderSync class="h-4 w-4" />
          {/if}
        </button>

        <button 
          onclick={() => createOpen = true}
          class="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/30 transition-colors"
          title="Add Document"
        >
          <Plus class="h-4 w-4" />
          <span class="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Add</span>
        </button>
      </div>
    </div>

    <!-- Progress Bar -->
    {#if enrichment && enrichment.total > 0}
      <div class="px-4 py-2 bg-indigo-500/5 border-b border-indigo-500/10 flex items-center gap-3 shrink-0 z-10 backdrop-blur-sm">
        <div class="flex-1 h-1.5 rounded-full bg-black/40 border border-white/5 overflow-hidden relative">
          <div 
            class="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            style="width: {Math.round((enrichment.done / enrichment.total) * 100)}%"
          ></div>
        </div>
        <span class="text-[10px] font-black uppercase tracking-widest text-indigo-300 whitespace-nowrap">
          {enriching ? `Enriching ${enrichment.done}/${enrichment.total}` : 'Enrichment Complete'}
          {#if (enrichment.error_count ?? 0) > 0}
            <span class="text-red-400 ml-2">({enrichment.error_count} Errors)</span>
          {/if}
        </span>
      </div>
    {/if}

    <!-- Content Container (Split View) -->
    <div class="flex-1 min-h-0 flex bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#131122] via-[#050510] to-[#030014] relative overflow-hidden">
      <!-- Background Grid -->
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] pointer-events-none opacity-50 z-0"></div>
      
      {#if detailDoc}
        <!-- Document Detail View (Full Center Pane) -->
        <div class="flex-1 w-full h-full relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <VaultDetailView 
            doc={detailDoc}
            onClose={() => { detailDoc = null; selectedDocId = null; selectedPath = null; }}
          />
        </div>
      {:else}
        <!-- Full Graph View -->
        <div class="flex-1 w-full h-full relative z-10">
          <VaultGraphView
            agentId={selectedAgent}
            teamId={selectedTeam}
            {selectedDocId}
            onNodeSelect={(docId) => selectedDocId = docId}
            onNodeDoubleClick={async (docId) => { 
              selectedDocId = docId;
              try {
                const http = useHttp();
                detailDoc = await http.get(`/v1/vault/documents/${docId}`);
              } catch (err) {
                console.error("Failed to load document details", err);
              }
            }}
          />
        </div>
      {/if}
    </div>
  </div>

  <VaultCreateDialog
    open={createOpen}
    onOpenChange={(v) => createOpen = v}
    onUploaded={() => vaultTree.loadRoot()}
    defaultAgentId={selectedAgent}
    defaultTeamId={selectedTeam}
  />
</div>
