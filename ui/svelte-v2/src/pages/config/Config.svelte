<script lang="ts">
  import { Settings, Server, Activity, BrainCircuit, ShieldAlert, Hammer, Webhook, RefreshCw } from "lucide-svelte";
  import { configStore, fetchConfig } from "$lib/state/config.svelte";
  import { wsState } from "$lib/state/ws.svelte";
  import { _ } from "svelte-i18n";
  
  import ServerSection from "./sections/ServerSection.svelte";
  import BehaviorSection from "./sections/BehaviorSection.svelte";
  import AiDefaultsSection from "./sections/AiDefaultsSection.svelte";
  import QuotaSection from "./sections/QuotaSection.svelte";
  import ToolsSection from "./sections/ToolsSection.svelte";
  import IntegrationsSection from "./sections/IntegrationsSection.svelte";

  let hasFetched = false;
  $effect(() => {
    if (wsState.connected && !hasFetched) {
      hasFetched = true;
      fetchConfig();
    }
  });

  let TABS = $derived([
    { id: "server", label: $_("config.tabs.server"), icon: Server, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { id: "behavior", label: $_("config.tabs.behavior"), icon: Activity, color: "text-magenta-500", bg: "bg-magenta-500/10", border: "border-magenta-500/20" },
    { id: "aiDefaults", label: $_("config.tabs.aiDefaults"), icon: BrainCircuit, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
    { id: "quota", label: $_("config.tabs.quota"), icon: ShieldAlert, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "tools", label: $_("config.tabs.tools"), icon: Hammer, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { id: "integrations", label: $_("config.tabs.integrations"), icon: Webhook, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" }
  ]);

  let activeTab = $state("server");

  function handleRefresh() {
    fetchConfig();
  }
</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full overflow-y-auto scroller-no-scrollbar">

  <!-- Bento Header -->
  <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 shrink-0 z-20">
    <div class="absolute inset-0 bg-[#050010]/80 backdrop-blur-3xl border border-indigo-500/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(99,102,241,0.05)] overflow-hidden pointer-events-none -z-10">
      <div class="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full"></div>
      <div class="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full"></div>
    </div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div class="h-14 w-14 rounded-2xl bg-black/60 border border-indigo-500/20 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Settings class="h-6 w-6 text-indigo-400 transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
      </div>
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
            {$_("config.title")}
          </h1>
          {#if configStore.hash}
            <span class="px-2 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px] text-white/40 uppercase tracking-widest">
              HASH: {configStore.hash.substring(0, 8)}
            </span>
          {/if}
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          {$_("config.description")}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={handleRefresh} 
        disabled={configStore.loading}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] disabled:opacity-50"
      >
        <RefreshCw class={`h-4 w-4 text-white/50 group-hover:text-white ${configStore.loading ? 'animate-spin' : ''}`} />
        <span class="text-[10px] font-black uppercase tracking-widest text-white/70">{$_("config.retry")}</span>
      </button>
    </div>
  </div>

  {#if configStore.loading && !configStore.config}
    <div class="flex-1 flex items-center justify-center">
      <RefreshCw class="h-8 w-8 text-indigo-500/50 animate-spin" />
    </div>
  {:else if configStore.config}
    <div class="flex flex-col lg:flex-row gap-8">
      
      <!-- Brutalist Sidebar Menu -->
      <div class="w-full lg:w-48 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scroller-no-scrollbar">
        {#each TABS as tab}
          <button 
            onclick={() => activeTab = tab.id}
            class={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all text-left min-w-[140px] lg:min-w-0 ${
              activeTab === tab.id 
              ? `${tab.bg} ${tab.border} shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)]` 
              : 'bg-black/20 border-transparent hover:bg-white/5'
            }`}
          >
            {#if activeTab === tab.id}
              <div class={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${tab.color.replace('text-', 'bg-')}`}></div>
            {/if}
            <tab.icon class={`h-4 w-4 shrink-0 ${activeTab === tab.id ? tab.color : 'text-white/30'}`} />
            <span class={`text-[10px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-white' : 'text-white/40'}`}>
              {tab.label}
            </span>
          </button>
        {/each}
      </div>

      <!-- Content Area -->
      <div class="flex-1 min-w-0">
        {#if activeTab === 'server'}
          <ServerSection />
        {:else if activeTab === 'behavior'}
          <BehaviorSection />
        {:else if activeTab === 'aiDefaults'}
          <AiDefaultsSection />
        {:else if activeTab === 'quota'}
          <QuotaSection />
        {:else if activeTab === 'tools'}
          <ToolsSection />
        {:else if activeTab === 'integrations'}
          <IntegrationsSection />
        {/if}
      </div>

    </div>
  {/if}

</div>
