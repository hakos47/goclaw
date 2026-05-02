<script lang="ts">
  import { onMount } from "svelte";
  import { Radio, Plus, RefreshCw, Search, LayoutGrid, Globe, MessageSquare } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { wsState } from "$lib/state/ws.svelte";
  import EmptyState from "$lib/components/shared/EmptyState.svelte";
  import SearchInput from "$lib/components/shared/SearchInput.svelte";
  import Pagination from "$lib/components/shared/Pagination.svelte";
  import TableSkeleton from "$lib/components/shared/TableSkeleton.svelte";
  import ChannelListRow from "./channels/components/ChannelListRow.svelte";
  import ChannelDetail from "./channels/ChannelDetail.svelte";
  import ChannelFormDialog from "./channels/ChannelFormDialog.svelte";
  import WhatsAppReauthDialog from "./channels/whatsapp/WhatsAppReauthDialog.svelte";
  import ZaloReauthDialog from "./channels/zalo/ZaloReauthDialog.svelte";
  import { useChannels } from "./channels/hooks/use-channels.svelte";
  import { agentsState, loadAgents } from "./agents/hooks/use-agents.svelte";
  import type { ChannelInstanceData } from "$lib/types/channel";

  type Props = { path?: string };
  let { path = window.location.pathname }: Props = $props();

  const channels = useChannels();
  
  let search = $state("");
  let typeFilter = $state<string | undefined>(undefined);
  let page = $state(1);
  let pageSize = $state(20);
  let showAddDialog = $state(false);
  let qrTarget = $state<ChannelInstanceData | null>(null);

  // Derive selected channel ID from path
  let selectedId = $derived.by(() => {
    const match = path.match(/^\/channels\/([^\/]+)$/);
    return match ? match[1] : null;
  });

  onMount(() => {
    loadAgents();
    if (!selectedId) {
      channels.loadInstances({
        search: search || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
    }
  });

  $effect(() => {
    if (!selectedId && wsState.connected) {
      channels.loadStatus();
      
      const interval = setInterval(() => {
        channels.loadStatus();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  });

  $effect(() => {
    if (!selectedId) {
      channels.loadInstances({
        search: search || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
    }
  });

  let totalPages = $derived(Math.max(1, Math.ceil(channels.total / pageSize)));

  function getAgentName(agentId: string) {
    const agent = agentsState.agents.find((a) => a.id === agentId);
    return agent?.display_name || agent?.agent_key || agentId.slice(0, 8);
  }

  async function handleRefresh() {
    await channels.loadInstances({
      search: search || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
    if (wsState.connected) {
      await channels.loadStatus();
    }
  }

  async function handleDelete(instance: ChannelInstanceData) {
    if (confirm(`Are you sure you want to delete ${instance.display_name || instance.name}?`)) {
      try {
        await channels.deleteInstance(instance.id);
        await handleRefresh();
      } catch (e) {
        console.error("Failed to delete instance", e);
      }
    }
  }

  function handleNavigate(id: string) {
    window.history.pushState({}, '', `/channels/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    path = window.location.pathname;
  }

  function handleBack() {
    window.history.pushState({}, '', '/channels');
    window.dispatchEvent(new PopStateEvent('popstate'));
    path = window.location.pathname;
  }

  // Snippet for Refresh Button with Animation
  let spinning = $state(false);
</script>

{#if selectedId}
  <ChannelDetail id={selectedId} onBack={handleBack} />
{:else}
<div class="flex h-full flex-col p-4 sm:p-6 overflow-hidden max-w-[1600px] mx-auto w-full">
  
  <!-- Header -->
  <div class="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tight uppercase flex items-center gap-3">
        <Radio class="h-6 w-6 text-goclaw-neon-purple" />
        Channel Instances
      </h1>
      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">
        Manage active connections and protocols
      </p>
    </div>
    <div class="flex items-center gap-3">
      {@render refreshButton()}
      <button 
        onclick={() => showAddDialog = true}
        class="relative flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl overflow-hidden group shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all hover:scale-105"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/40 to-goclaw-neon-purple/10 border border-goclaw-neon-purple/50 rounded-xl transition-all group-hover:from-goclaw-neon-purple/60 group-hover:to-goclaw-neon-purple/20"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none z-0"></div>
        <Plus class="h-4 w-4 relative z-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" /> 
        <span class="relative z-10 text-white drop-shadow-md">Create Channel</span>
      </button>
    </div>
  </div>

  <!-- Main Toolbar -->
  <div class="shrink-0 flex flex-wrap items-center gap-3 mb-6 bg-[#030014]/60 border border-white/10 p-3 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
    <!-- Subtle inset glow for toolbar -->
    <div class="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

    <div class="flex-1 min-w-[200px] max-w-[300px] relative z-10">
      <SearchInput bind:value={search} placeholder="Search channels..." />
    </div>
    
    <div class="relative group/select z-10">
      <div class="absolute inset-0 border border-transparent group-focus-within/select:border-goclaw-neon-purple/50 rounded-xl pointer-events-none transition-colors z-20"></div>
      <select 
        bind:value={typeFilter} 
        class="appearance-none h-10 px-4 bg-black/80 hover:bg-white/[0.05] border border-white/10 rounded-xl text-white/80 text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer pr-8 focus:border-goclaw-neon-purple/50 focus:ring-1 focus:ring-goclaw-neon-purple/50 shadow-inner min-w-[150px]"
      >
        <option value={undefined} class="bg-black text-white/50">ALL PROTOCOLS</option>
        <option value="telegram" class="bg-black text-white">TELEGRAM</option>
        <option value="whatsapp" class="bg-black text-white">WHATSAPP</option>
        <option value="discord" class="bg-black text-white">DISCORD</option>
        <option value="slack" class="bg-black text-white">SLACK</option>
      </select>
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <LayoutGrid class="w-3.5 h-3.5 text-white/30" />
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="flex-1 min-h-0 relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col overflow-hidden">
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-goclaw-neon-purple/5 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-goclaw-neon-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
      {#if channels.loading && channels.instances.length === 0}
        <TableSkeleton />
      {:else if channels.instances.length === 0}
        <div class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
          <div class="absolute inset-0 bg-goclaw-neon-purple/5 blur-[100px] pointer-events-none"></div>
          
          <div class="relative w-32 h-32 mb-8 flex items-center justify-center">
            <div class="absolute inset-0 border-2 border-goclaw-neon-purple/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div class="absolute inset-2 border border-goclaw-neon-purple/10 border-dashed rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
            <div class="absolute inset-0 bg-goclaw-neon-purple/10 blur-xl rounded-full animate-pulse"></div>
            <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(217,70,239,0.3)] backdrop-blur-xl">
              <Radio class="h-8 w-8 text-goclaw-neon-purple drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]" />
            </div>
          </div>
          
          <h3 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 uppercase tracking-widest mb-3">
            {search ? $_('channels.noMatchTitle', {default: "No channels found"}) : $_('channels.emptyTitle', {default: "Awaiting Transmission"})}
          </h3>
          <p class="text-[11px] font-mono text-white/40 max-w-md uppercase tracking-wider leading-relaxed">
            {search ? $_('channels.noMatchDescription', {default: "Try adjusting search query or clearing filters."}) : $_('channels.emptyDescription', {default: "Initialize your first communication gateway to start connecting agents to the external environment."})}
          </p>
        </div>
      {:else}
        <div class="flex flex-col gap-3">
          {#each channels.instances as inst}
            <ChannelListRow
              instance={inst}
              status={channels.channelsStatus[inst.name]}
              agentName={getAgentName(inst.agent_id)}
              onClick={() => handleNavigate(inst.id)}
              onDelete={() => handleDelete(inst)}
              onAuth={['whatsapp', 'zalo_personal'].includes(inst.channel_type) ? () => qrTarget = inst : undefined}
            />
          {/each}
        </div>
      {/if}
    </div>

    <!-- Pagination Footer -->
    {#if !channels.loading && channels.instances.length > 0}
      <div class="shrink-0 p-4 border-t border-white/5 bg-white/[0.01] relative z-10 backdrop-blur-xl">
        <Pagination
          {page}
          {pageSize}
          total={channels.total}
          {totalPages}
          onPageChange={(p) => page = p}
          onPageSizeChange={(s) => { pageSize = s; page = 1; }}
        />
      </div>
    {/if}
  </div>

  <ChannelFormDialog 
    open={showAddDialog} 
    onClose={() => showAddDialog = false} 
    onSuccess={handleRefresh}
  />

  {#if qrTarget}
    {#if qrTarget.channel_type === 'whatsapp'}
      <WhatsAppReauthDialog 
        open={!!qrTarget} 
        instanceId={qrTarget.id} 
        instanceName={qrTarget.display_name || qrTarget.name}
        onOpenChange={(v) => { if(!v) qrTarget = null; }}
        onSuccess={() => {
          qrTarget = null;
          setTimeout(() => handleRefresh(), 3000);
        }}
      />
    {:else if qrTarget.channel_type === 'zalo_personal'}
      <ZaloReauthDialog 
        open={!!qrTarget} 
        instanceId={qrTarget.id} 
        instanceName={qrTarget.display_name || qrTarget.name}
        onOpenChange={(v) => { if(!v) qrTarget = null; }}
        onSuccess={() => {
          qrTarget = null;
          setTimeout(() => handleRefresh(), 3000);
        }}
      />
    {/if}
  {/if}
</div>
{/if}

{#snippet refreshButton()}
  <button 
    onclick={async () => {
      spinning = true;
      await handleRefresh();
      setTimeout(() => spinning = false, 1000);
    }} 
    disabled={channels.loading || spinning}
    class="group relative flex items-center justify-center gap-2 h-10 px-5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl bg-black/80 border border-white/10 hover:border-white/30 hover:bg-white/5 text-white/50 hover:text-white transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_0_15px_rgba(0,0,0,0.5)] overflow-hidden"
  >
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none z-0"></div>
    <div class="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
    <RefreshCw class="h-3.5 w-3.5 relative z-10 transition-transform duration-500 group-hover:rotate-180 {spinning ? 'animate-spin' : ''}" />
    <span class="relative z-10">{$_('channels.refresh', {default: "Refresh"})}</span>
  </button>
{/snippet}
