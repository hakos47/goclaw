<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { ShieldAlert, ArrowLeft, Bot, Save, Trash2, Cpu, Wrench, Eye, Heart, Settings } from "lucide-svelte";
  import { useAgentDetail } from "../../hooks/use-agent-detail.svelte";
  import type { AgentData } from "../../../../lib/types/agent";
  import AgentOverviewTab from "./AgentOverviewTab.svelte";
  import AgentFilesTab from "./AgentFilesTab.svelte";
  import AgentPermissionsTab from "./AgentPermissionsTab.svelte";
  import AgentEvolutionTab from "./AgentEvolutionTab.svelte";
  import SystemPromptDialog from "./SystemPromptDialog.svelte";
  import AgentAdvancedDialog from "./AgentAdvancedDialog.svelte";
  import HeartbeatConfigDialog from "./HeartbeatConfigDialog.svelte";
  import AgentInstancesTab from "./AgentInstancesTab.svelte";
  import AgentHooksTab from "./AgentHooksTab.svelte";
  import { deleteAgent } from "../../hooks/use-agents.svelte";

  type Props = {
    agentId: string;
    onBack: () => void;
  };

  let { agentId, onBack }: Props = $props();

  let detail = $derived(useAgentDetail(agentId));
  let activeTab = $state("overview");
  
  // Local state for header edits
  let displayName = $state("");
  let isEditing = $state(false);

  // Modal states for right menu actions
  let systemPromptOpen = $state(false);
  let heartbeatOpen = $state(false);
  let advancedOpen = $state(false);

  $effect(() => {
    if (detail.agent && !isEditing) {
      displayName = detail.agent.display_name || detail.agent.agent_key;
    }
  });

  async function handleUpdateName() {
    if (!detail.agent || !displayName) return;
    await detail.updateAgent({ display_name: displayName });
    isEditing = false;
  }

  async function handleDelete() {
    if (confirm("Are you sure you want to delete this agent?")) {
        await deleteAgent(agentId);
        onBack();
    }
  }

  let tabs = $derived([
      { id: "overview", label: $_('agents.detail.tabs.agent', {default: "Overview"}) },
      { id: "files", label: $_('agents.detail.tabs.files', {default: "Files"}) },
      { id: "permissions", label: $_('agents.detail.tabs.permissions', {default: "Permissions"}) },
      { id: "evolution", label: $_('agents.detail.tabs.evolution', {default: "Evolution"}) },
      { id: "hooks", label: "Hooks" },
      { id: "instances", label: "Instances" }
  ]);
</script>

<div class="flex flex-col h-full relative isolate min-h-screen">
  <!-- Global Background Effects for Agent Detail -->
  <div class="absolute inset-0 bg-[#030014] pointer-events-none -z-10"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none -z-10"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.05)_0%,transparent_50%)] pointer-events-none -z-10"></div>
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-10 pointer-events-none -z-10"></div>

  <!-- Header -->
  <header class="flex-none p-6 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-3xl relative overflow-hidden shrink-0 mt-5 md:mt-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
    <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50"></div>
    <div class="absolute top-0 right-0 w-64 h-64 bg-goclaw-neon-purple/5 rounded-full blur-[80px] pointer-events-none"></div>

    <div class="max-w-7xl mx-auto flex items-center justify-between relative z-10 gap-4">
      <div class="flex items-center gap-6 w-full lg:w-auto">
        <button onclick={onBack} class="group h-12 w-12 flex flex-shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-[#030014]/50 hover:bg-white/5 text-white/50 hover:text-white transition-all shadow-inner hover:border-white/20">
          <ArrowLeft class="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        </button>

        {#if detail.loading}
           <div class="h-14 w-64 bg-white/5 rounded-xl animate-pulse"></div>
        {:else if detail.agent}
           <div class="flex items-center gap-4">
             <div class="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#030014] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
               <div class="absolute inset-0 rounded-2xl bg-goclaw-neon-purple/10"></div>
               {#if detail.agent.emoji}
                 <span class="text-3xl relative z-10 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">{detail.agent.emoji}</span>
               {:else}
                 <Bot class="h-8 w-8 text-goclaw-neon-purple relative z-10 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
               {/if}
               <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#030014] shadow-[0_0_10px_rgba(16,185,129,0.8)] {detail.agent.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}"></div>
             </div>
             <div>
                <!-- ID/Name row -->
                <div class="flex items-center gap-3">
                   {#if isEditing}
                     <div class="flex rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                       <input bind:value={displayName} class="h-9 w-40 md:w-64 px-3 rounded-l-lg bg-[#030014] text-sm font-bold text-white border border-white/10 focus:border-goclaw-neon-purple outline-none transition-colors" />
                       <button onclick={handleUpdateName} class="h-9 px-4 rounded-r-lg bg-goclaw-neon-purple border-y border-r border-goclaw-neon-purple text-white hover:bg-goclaw-neon-purple/80 text-xs font-bold transition-all shadow-inner hover:shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                          <Save class="h-4 w-4" />
                       </button>
                     </div>
                   {:else}
                     <h1 class="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 cursor-pointer hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all" onclick={() => isEditing = true} title="Click to edit name">{displayName}</h1>
                   {/if}

                   <!-- Status Badge -->
                   <span class={`hidden sm:inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${detail.agent.status === 'active' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' : 'border-white/10 bg-white/5 text-white/50'}`}>
                      {detail.agent.status}
                   </span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                   <span class="text-[10px] font-mono text-goclaw-neon-cyan uppercase tracking-[0.2em] bg-goclaw-neon-cyan/10 border border-goclaw-neon-cyan/20 px-1.5 py-0.5 rounded shadow-[inset_0_0_5px_rgba(6,182,212,0.2)]">UID</span>
                   <span class="text-xs text-white/40 font-mono tracking-widest uppercase">{detail.agent.id}</span>
                </div>
             </div>
           </div>
        {/if}
      </div>

      {#if detail.agent}
        <div class="flex items-center gap-2 flex-wrap justify-end">
            <button onclick={() => systemPromptOpen = true} class="group h-12 w-12 md:w-auto md:px-5 flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#030014]/50 hover:bg-[#030014] text-white/60 hover:text-white transition-all shadow-inner hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] outline-none" title="System Prompt">
                <Eye class="h-4 w-4 group-hover:text-goclaw-neon-cyan transition-colors" /> <span class="hidden md:inline text-[11px] font-bold uppercase tracking-widest">Prompt</span>
            </button>
            <button onclick={() => heartbeatOpen = true} class="group h-12 w-12 flex flex-shrink-0 items-center justify-center rounded-xl border border-white/5 bg-[#030014]/50 hover:bg-[#030014] text-white/60 hover:text-white transition-all shadow-inner outline-none" title="Heartbeat">
                <Heart class="h-4 w-4 group-hover:text-rose-400 transition-colors" />
            </button>
            <button onclick={() => advancedOpen = true} class="group h-12 w-12 flex flex-shrink-0 items-center justify-center rounded-xl border border-white/5 bg-[#030014]/50 hover:bg-[#030014] text-white/60 hover:text-white transition-all shadow-inner outline-none" title="Advanced Settings">
                <Settings class="h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
            </button>
            <div class="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>
            <button onclick={() => activeTab = "instances"} class="group h-12 px-5 hidden md:flex items-center gap-2 rounded-xl border border-goclaw-neon-cyan/30 bg-goclaw-neon-cyan/10 hover:bg-goclaw-neon-cyan/20 text-[11px] font-bold uppercase tracking-widest text-goclaw-neon-cyan transition-all outline-none shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Cpu class="h-4 w-4" /> Instance
            </button>
            <button onclick={handleDelete} class="group h-12 w-12 flex flex-shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-[#030014]/50 hover:bg-red-500/10 text-red-500 transition-all outline-none" title="Delete Agent">
                <Trash2 class="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
        </div>
      {/if}
    </div>
  </header>

  <div class="flex-1 overflow-x-auto overflow-y-auto">
      {#if detail.loading}
        <div class="p-6 max-w-7xl mx-auto w-full">
            <div class="h-[600px] w-full border border-white/5 bg-white/[0.02] rounded-3xl animate-pulse"></div>
        </div>
      {:else if detail.error}
        <div class="flex flex-col items-center justify-center h-full text-center">
            <ShieldAlert class="h-12 w-12 text-red-500 mb-4" />
            <h3 class="text-lg font-bold text-white">Error loading agent</h3>
            <p class="text-sm text-white/50">{detail.error}</p>
        </div>
      {:else if detail.agent}
        <div class="w-full p-6">
            <!-- Tabs Navigation -->
            <div class="flex items-center justify-center sm:justify-start mb-8">
              <div class="inline-flex p-1.5 rounded-2xl bg-[#030014]/80 backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-x-auto scroller-no-scrollbar">
                  {#each tabs as tab}
                      <button 
                          class={`relative flex flex-shrink-0 items-center justify-center px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group ${activeTab === tab.id ? 'text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]' : 'text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105'}`}
                          onclick={() => activeTab = tab.id}
                      >
                          {#if activeTab === tab.id}
                            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
                            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
                            <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none"></div>
                            <!-- Shimmer effect -->
                            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
                          {:else}
                            <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
                          {/if}
                          <span class="relative z-10 drop-shadow-md">{tab.label}</span>
                      </button>
                  {/each}
              </div>
            </div>

            <!-- Tab Content Area -->
            <div class="py-6 min-w-[700px]">
                {#if activeTab === "overview"}
                    <AgentOverviewTab 
                       agent={detail.agent} 
                       onUpdate={detail.updateAgent} 
                       onViewHooks={() => activeTab = "hooks"}
                       onAddHook={() => activeTab = "hooks"}
                    />
                {:else if activeTab === "files"}
                    <AgentFilesTab 
                        agentId={agentId} 
                        files={detail.files} 
                        refresh={detail.refresh} 
                        onGetFile={(name) => detail.getFile(name)}
                        onSetFile={(name, content) => detail.setFile(name, content)}
                    />
                {:else if activeTab === "permissions"}
                    <AgentPermissionsTab agentId={agentId} />
                {:else if activeTab === "evolution"}
                    <AgentEvolutionTab agentId={agentId} agentOtherConfig={detail.agent.other_config} />
                {:else if activeTab === "hooks"}
                    <AgentHooksTab agentId={agentId} />
                {:else if activeTab === "instances"}
                    <AgentInstancesTab agentId={agentId} />
                {:else}
                    <div class="flex flex-col items-center justify-center py-20 text-center border border-white/5 rounded-3xl bg-white/[0.02]">
                        <Wrench class="h-10 w-10 text-white/20 mb-4" />
                        <h4 class="text-white/50 text-sm font-bold uppercase tracking-widest">Under Construction</h4>
                        <p class="text-white/30 text-xs max-w-md mt-2">This configuration module is scheduled to be migrated to Svelte 5 in Phase 2.</p>
                    </div>
                {/if}
            </div>
        </div>
        {/if}
    </div>

  {#if detail.agent}
    <SystemPromptDialog 
      agentKey={detail.agent.agent_key}
      open={systemPromptOpen} 
      onOpenChange={(v) => systemPromptOpen = v} 
    />
    <HeartbeatConfigDialog 
      agentId={agentId}
      open={heartbeatOpen} 
      onOpenChange={(v) => heartbeatOpen = v} 
    />
    <AgentAdvancedDialog 
      agent={detail.agent}
      open={advancedOpen} 
      onOpenChange={(v) => advancedOpen = v}
      onUpdate={detail.updateAgent}
    />
  {/if}
</div>
