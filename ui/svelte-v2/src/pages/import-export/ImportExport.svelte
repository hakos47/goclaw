<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { AlertTriangle } from "lucide-svelte";
  import AgentExportPanel from "./AgentExportPanel.svelte";
  import AgentImportPanel from "./AgentImportPanel.svelte";
  import TeamExportPanel from "./TeamExportPanel.svelte";
  import TeamImportPanel from "./TeamImportPanel.svelte";
  import CapabilitiesExportPanel from "./CapabilitiesExportPanel.svelte";
  import CapabilitiesImportPanel from "./CapabilitiesImportPanel.svelte";

  let scopeTab = $state("agents");
  let innerTab = $state("export");

  onMount(() => {
    // Parse URL params to set initial tabs if provided (e.g., ?tab=agents)
    const params = new URLSearchParams(window.location.search);
    if (params.has("tab")) scopeTab = params.get("tab")!;
    if (params.has("inner")) innerTab = params.get("inner")!;
  });

  function setScopeTab(tab: string) {
    scopeTab = tab;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, '', url);
  }

  function setInnerTab(tab: string) {
    innerTab = tab;
    const url = new URL(window.location.href);
    url.searchParams.set("inner", tab);
    window.history.replaceState({}, '', url);
  }
</script>

<div class="relative isolate p-4 sm:p-6 pb-10 min-h-full h-full overflow-y-auto scroller-no-scrollbar">
  <!-- Global Background Effects for Dashboard -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none -z-10"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.05)_0%,transparent_50%)] pointer-events-none -z-10"></div>

  <!-- Header Section -->
  <div class="relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden mb-8">
    <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50"></div>
    
    <div class="relative z-10 flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl sm:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/30 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
          {$_('import-export.title', {default: "Import & Export"})}
        </h1>
        <span class="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]">BETA</span>
      </div>
      <p class="text-white/50 text-sm max-w-2xl">{$_('import-export.description', {default: "Transfer agents, teams, and skills between GoClaw instances."})}</p>
    </div>
  </div>

  <!-- Beta Warning -->
  <div class="mx-auto max-w-4xl flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 mb-8 shadow-[0_0_20px_rgba(245,158,11,0.05),inset_0_1px_1px_rgba(255,255,255,0.05)]">
    <AlertTriangle class="h-5 w-5 shrink-0 text-amber-500 mt-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
    <span class="text-sm text-amber-200/80">{$_('import-export.betaWarning', {default: "The import/export feature is in beta. Some complex knowledge graphs or massive memories may require longer processing times."})}</span>
  </div>

  <!-- Scope Tabs -->
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center justify-center mb-8">
      <div class="inline-flex p-1.5 rounded-2xl bg-[#030014]/80 backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-x-auto scroller-no-scrollbar">
        {#each [
          { id: 'teams', label: $_('import-export.tabs.teams', {default: "Teams"}) },
          { id: 'agents', label: $_('import-export.tabs.agents', {default: "Agents"}) },
          { id: 'skills-mcp', label: $_('import-export.tabs.skillsMcp', {default: "Skills & MCP"}) }
        ] as tab}
          <button 
            class={`relative flex flex-shrink-0 items-center justify-center px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group ${scopeTab === tab.id ? 'text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]' : 'text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105'}`}
            onclick={() => setScopeTab(tab.id)}
          >
            {#if scopeTab === tab.id}
              <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
              <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none"></div>
              <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
            {:else}
              <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
            {/if}
            <span class="relative z-10 drop-shadow-md">{tab.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Inner Tab Navigation -->
    <div class="flex items-center justify-center mb-6">
      <div class="inline-flex p-1 rounded-xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 shadow-inner">
        <button 
          class={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${innerTab === 'export' ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          onclick={() => setInnerTab('export')}
        >
          {$_('import-export.tabs.export', {default: "Export"})}
        </button>
        <button 
          class={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${innerTab === 'import' ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          onclick={() => setInnerTab('import')}
        >
          {$_('import-export.tabs.import', {default: "Import"})}
        </button>
      </div>
    </div>

    <!-- Content Areas -->
    <div class="bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      {#if scopeTab === 'agents'}
         {#if innerTab === 'export'}
            <AgentExportPanel />
         {:else}
            <AgentImportPanel />
         {/if}
      {:else if scopeTab === 'teams'}
         {#if innerTab === 'export'}
            <TeamExportPanel />
         {:else}
            <TeamImportPanel />
         {/if}
      {:else if scopeTab === 'skills-mcp'}
         {#if innerTab === 'export'}
            <CapabilitiesExportPanel />
         {:else}
            <CapabilitiesImportPanel />
         {/if}
      {/if}
    </div>
  </div>
</div>
