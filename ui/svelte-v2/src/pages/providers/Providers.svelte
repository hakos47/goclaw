<script lang="ts">
  import { onMount } from "svelte";
  import { Cpu, Plus, RefreshCw, Search } from "lucide-svelte";
  import { providersState, useProviders } from "./hooks/use-providers.svelte";
  import ProviderListRow, { type ProviderOAuthPoolSummary } from "./components/ProviderListRow.svelte";
  import { getChatGPTOAuthPoolOwnership, sortProvidersForPoolHierarchy } from "./provider-utils";
  import ProviderFormDialog from "./components/ProviderFormDialog.svelte";
  import ProviderDetail from "./ProviderDetail.svelte";
  // import PoolSetupWizardDialog from "./components/PoolSetupWizardDialog.svelte"; // To be implemented

  let search = $state("");
  let formOpen = $state(false);
  let wizardOpen = $state(false);
  let deleteTarget = $state<any | null>(null);
  let detailId = $state<string | null>(null);

  const { loadProviders, deleteProvider } = useProviders();

  onMount(() => {
    loadProviders();
  });

  const filtered = $derived(
    providersState.providers.filter((p) => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.display_name || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const poolOwnership = $derived(getChatGPTOAuthPoolOwnership(providersState.providers));

  const orderedProviders = $derived(sortProvidersForPoolHierarchy(filtered, poolOwnership));

  // Determine connector line visual positions for members of a pool
  const memberConnectorByName = $derived.by(() => {
    const visibleNames = new Set(orderedProviders.map(p => p.name));
    const map = new Map<string, "none" | "single" | "first" | "middle" | "last">();

    for (const [ownerName] of poolOwnership.membersByOwner) {
      if (!visibleNames.has(ownerName)) continue;

      const visibleMembers = orderedProviders
        .filter(p => poolOwnership.ownerByMember.get(p.name) === ownerName)
        .map(p => p.name);

      if (visibleMembers.length === 1) {
        map.set(visibleMembers[0], "single");
        continue;
      }

      visibleMembers.forEach((name, idx) => {
        if (idx === 0) map.set(name, "first");
        else if (idx === visibleMembers.length - 1) map.set(name, "last");
        else map.set(name, "middle");
      });
    }
    return map;
  });

  const unpooledProviders = $derived(
    providersState.providers.filter(p => 
      p.provider_type === "chatgpt_oauth" && 
      !poolOwnership.membersByOwner.has(p.name) && 
      !poolOwnership.ownerByMember.has(p.name)
    )
  );

  const providerByName = $derived(new Map(providersState.providers.map(p => [p.name, p])));

  function navigateToDetail(id: string) {
    detailId = id;
  }

  async function handleDelete(provider: any) {
    if (confirm(`Are you sure you want to delete ${provider.name}?`)) {
      await deleteProvider(provider.id);
    }
  }

</script>

{#if detailId}
  <ProviderDetail id={detailId} onBack={() => detailId = null} />
{:else}
<div class="relative isolate p-4 sm:p-6 pb-10 min-h-full">
  
  <!-- Global Background Effects -->
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
          <Cpu class="w-8 h-8 text-goclaw-neon-purple drop-shadow-[0_0_10px_rgba(217,70,239,0.8)] animate-pulse-slow" strokeWidth={1.5} />
          <div class="absolute -right-1.5 -top-1.5 w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)] border-[3px] border-[#030014] animate-pulse"></div>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[9px] font-bold text-goclaw-neon-purple uppercase tracking-[0.3em] bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 px-2.5 py-0.5 rounded shadow-[inset_0_0_8px_rgba(217,70,239,0.2)]">Global Resources</span>
            <span class="text-[9px] text-white/40 font-bold tracking-[0.2em] uppercase">Compute Management</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/30 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Providers
          </h1>
        </div>
      </div>

      <!-- Controls & Actions -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button onclick={() => loadProviders(true)} disabled={providersState.loading} class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105 disabled:opacity-50">
          <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          <RefreshCw class={`h-3.5 w-3.5 relative z-10 text-white/30 group-hover:text-white/70 transition-colors duration-500 ${providersState.loading ? 'animate-spin' : ''}`} />
          <span class="relative z-10 drop-shadow-md">Sync</span>
        </button>

        <button onclick={() => formOpen = true} class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105">
          <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
          <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none"></div>
          <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
          
          <Plus class="h-3.5 w-3.5 relative z-10 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] transition-colors duration-500" strokeWidth={3} />
          <span class="relative z-10 drop-shadow-md">New Provider</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Search -->
  <div class="mt-8 flex flex-wrap items-center gap-3 relative z-20">
    <div class="max-w-sm w-full relative group">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Search class="h-4 w-4 text-white/40 group-focus-within:text-goclaw-neon-purple transition-colors" />
      </div>
      <input 
        type="text" 
        bind:value={search} 
        placeholder="Search providers by name..." 
        class="block w-full pl-10 pr-4 h-10 rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md text-xs font-semibold text-white placeholder-white/30 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner"
      />
    </div>
  </div>

  <!-- List -->
  <div class="mt-8 relative z-10">
    {#if providersState.loading && providersState.providers.length === 0}
      <div class="flex-1 flex items-center justify-center">
        <RefreshCw class="h-6 w-6 animate-spin text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
      </div>
    {:else if orderedProviders.length === 0}
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/40 border border-white/5 rounded-3xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)]">
        <div class="h-16 w-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <Cpu class="h-8 w-8 text-purple-400 opacity-50" />
        </div>
        <h3 class="text-xs font-black uppercase tracking-widest text-white/80">No Providers Found</h3>
        <p class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Connect an AI model or API credential.</p>
        <button 
          onclick={() => formOpen = true}
          class="mt-6 h-9 px-4 rounded-xl bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.1] border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
        >
          <Plus class="h-3.5 w-3.5" /> Setup Provider
        </button>
      </div>
    {:else}
      <div class="flex flex-col gap-3 pb-8 pl-6 pr-2">
        {#each orderedProviders as provider (provider.id)}
          {@const isOwner = poolOwnership.membersByOwner.has(provider.name)}
          {@const isMember = poolOwnership.ownerByMember.has(provider.name)}
          {@const role = isOwner ? "owner" : (isMember ? "member" : "standalone")}
          {@const managedBy = isMember ? poolOwnership.ownerByMember.get(provider.name) : undefined}
          {@const managedByLabel = managedBy ? (providerByName.get(managedBy)?.display_name || managedBy) : undefined}
          
          <ProviderListRow 
            {provider}
            oauthPool={provider.provider_type === 'chatgpt_oauth' ? {
              availability: "ready", // simplified for MVP without quota checker
              role: role,
              managedByLabel: managedByLabel,
              memberCount: poolOwnership.membersByOwner.get(provider.name)?.length || 0,
              strategy: poolOwnership.strategyByOwner.get(provider.name) || "primary_first",
              connectorPosition: memberConnectorByName.get(provider.name) || "none"
            } : undefined}
            showPoolHint={provider.provider_type === "chatgpt_oauth" && !isOwner && !isMember && unpooledProviders.length >= 2}
            onClick={() => navigateToDetail(provider.id)}
            onDelete={() => handleDelete(provider)}
            onPoolSetup={() => wizardOpen = true}
          />
        {/each}
      </div>
    {/if}
  </div>

  {#if formOpen}
    <ProviderFormDialog 
      open={formOpen} 
      onOpenChange={(v) => formOpen = v}
      existingProviders={providersState.providers}
    />
  {/if}

</div>
{/if}
