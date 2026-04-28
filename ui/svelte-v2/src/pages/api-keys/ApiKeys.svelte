<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { 
    KeyRound, 
    Plus, 
    RefreshCw, 
    Trash2, 
    Clock, 
    Shield, 
    CheckCircle2, 
    XCircle,
    Building2,
    Code2
  } from "lucide-svelte";
  import { apiKeysStore, fetchApiKeys, revokeApiKey, type ApiKeyData, type ApiKeyCreateResponse } from "$lib/state/api-keys.svelte.ts";
  import { wsState } from "$lib/state/ws.svelte.ts";
  import { authState } from "$lib/state/auth.svelte.ts";
  import { fade, scale } from "svelte/transition";

  import ApiKeyCreateModal from "./components/ApiKeyCreateModal.svelte";
  import ApiKeyRevealModal from "./components/ApiKeyRevealModal.svelte";

  let hasFetched = false;
  $effect(() => {
    if (wsState.connected && !hasFetched) {
      hasFetched = true;
      fetchApiKeys();
    }
  });

  let createOpen = $state(false);
  let revealData = $state<ApiKeyCreateResponse | null>(null);
  let revokeTarget = $state<ApiKeyData | null>(null);
  let revoking = $state(false);

  function handleCreated(res: ApiKeyCreateResponse) {
    revealData = res;
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    revoking = true;
    try {
      await revokeApiKey(revokeTarget.id);
      revokeTarget = null;
    } catch (e) {
      console.error(e);
    } finally {
      revoking = false;
    }
  }

  function formatTimeAgo(dateStr: string | null) {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  }

  function formatExpiration(dateStr: string | null) {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    const now = new Date();
    if (d < now) return "Expired";
    
    const seconds = Math.floor((d.getTime() - now.getTime()) / 1000);
    const days = Math.floor(seconds / (24 * 60 * 60));
    if (days > 0) return `in ${days} days`;
    const hours = Math.floor(seconds / (60 * 60));
    return `in ${hours} hours`;
  }

  function getTenantName(tid?: string) {
    if (!tid) return "System (Global)";
    const t = authState.availableTenants.find(x => x.id === tid);
    return t ? `${t.name} (${t.slug})` : tid.slice(0, 8);
  }

</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full">

  <!-- Bento Header -->
  <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 shrink-0 z-20">
    <div class="absolute inset-0 bg-[#0a0500]/80 backdrop-blur-3xl border border-amber-500/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(251,191,36,0.05)] overflow-hidden pointer-events-none -z-10">
      <div class="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/20 blur-[80px] rounded-full"></div>
      <div class="absolute -bottom-32 -right-32 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full"></div>
    </div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div class="h-14 w-14 rounded-2xl bg-black/60 border border-amber-500/20 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <KeyRound class="h-6 w-6 text-amber-500 transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
      </div>
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
            API Keys
          </h1>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-inner bg-amber-500/20 text-amber-500 border-amber-500/30">
            {apiKeysStore.items.filter(k => !k.revoked).length} Active
          </span>
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          Cryptographic access tokens for third-party integrations
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={() => createOpen = true}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/20 transition-all shadow-[inset_0_1px_2px_rgba(245,158,11,0.2)]"
      >
        <Plus class="h-4 w-4 text-amber-500 group-hover:drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
        <span class="text-[10px] font-black uppercase tracking-widest text-amber-100">Generate Key</span>
      </button>

      <button 
        onclick={fetchApiKeys} 
        disabled={apiKeysStore.loading}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] disabled:opacity-50"
      >
        <RefreshCw class={`h-4 w-4 text-white/50 group-hover:text-white ${apiKeysStore.loading ? 'animate-spin' : ''}`} />
        <span class="text-[10px] font-black uppercase tracking-widest text-white/70">Refresh</span>
      </button>
    </div>
  </div>

  <!-- Data Grid Area -->
  <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-10">
    {#if apiKeysStore.items.length === 0 && !apiKeysStore.loading}
      <div class="h-64 flex flex-col items-center justify-center text-center p-8 relative border border-white/5 rounded-2xl bg-[#050200]/50 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <div class="absolute inset-0 bg-amber-500/5 blur-[100px] pointer-events-none"></div>
        <KeyRound class="h-16 w-16 text-white/10 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
        <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-1">No API Keys Generated</h3>
        <p class="text-[10px] text-white/30 uppercase tracking-widest">Generate a key to grant external access to this tenant.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
        {#each apiKeysStore.items as item (item.id)}
          {@const isExpired = item.expires_at ? new Date(item.expires_at) < new Date() : false}
          {@const isActive = !item.revoked && !isExpired}
          
          <div class={`flex flex-col relative overflow-hidden rounded-[1.5rem] border backdrop-blur-md transition-all duration-300 p-5 group/card ${isActive ? 'bg-[#0a0500]/80 border-amber-500/20 hover:bg-white/[0.04] hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'bg-black/60 border-white/5 opacity-70 grayscale-[0.5]'}`}>
            
            {#if isActive}
              <div class="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 blur-[50px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            {/if}

            <div class="flex items-start justify-between mb-4 relative z-10">
              <div>
                <h3 class={`text-base font-bold ${isActive ? 'text-amber-400' : 'text-white/50'}`}>{item.name}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="font-mono text-xs text-white/60 bg-black/40 px-2 py-0.5 rounded border border-white/10 select-all">{item.prefix}****************</span>
                </div>
              </div>
              
              <div class="flex flex-col items-end gap-2">
                {#if item.revoked}
                  <span class="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border-red-500/30">
                    <XCircle class="h-3 w-3" /> Revoked
                  </span>
                {:else if isExpired}
                  <span class="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest bg-white/10 text-white/50 border-white/20">
                    <Clock class="h-3 w-3" /> Expired
                  </span>
                {:else}
                  <span class="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/30">
                    <CheckCircle2 class="h-3 w-3" /> Active
                  </span>
                {/if}
              </div>
            </div>

            <!-- Metadata -->
            <div class="space-y-3 mb-6 relative z-10 mt-2 flex-1">
              <div class="flex items-start gap-2">
                <Shield class="h-4 w-4 text-white/30 mt-0.5 shrink-0" />
                <div class="flex flex-wrap gap-1">
                  {#if item.scopes && item.scopes.length > 0}
                    {#each item.scopes as scope}
                      <span class="text-[9px] font-mono uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/60">{scope}</span>
                    {/each}
                  {:else}
                    <span class="text-[9px] font-mono uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/40">Full Access (No scopes limited)</span>
                  {/if}
                </div>
              </div>

              {#if authState.isOwner}
                <div class="flex items-center gap-2 pt-1">
                  <Building2 class="h-3.5 w-3.5 text-white/20" />
                  <span class="text-[10px] font-black uppercase tracking-widest text-white/40">{getTenantName(item.tenant_id)}</span>
                </div>
              {/if}

              <div class="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/40 border-t border-white/5 pt-3">
                <div>
                  <span class="block text-white/20 uppercase text-[8px] font-sans tracking-widest mb-0.5">Expires</span>
                  <span class={isExpired ? 'text-red-400' : 'text-white/60'}>{formatExpiration(item.expires_at)}</span>
                </div>
                <div>
                  <span class="block text-white/20 uppercase text-[8px] font-sans tracking-widest mb-0.5">Last Used</span>
                  <span class="text-white/60">{formatTimeAgo(item.last_used_at)}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-10">
              <div class="text-[9px] font-mono text-white/30 truncate max-w-[150px]">
                By: {item.created_by}
              </div>
              
              {#if isActive}
                <button onclick={() => revokeTarget = item} class="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-1.5">
                  <Trash2 class="h-3 w-3" /> Revoke
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<ApiKeyCreateModal open={createOpen} onOpenChange={(v) => createOpen = v} onCreated={handleCreated} />
<ApiKeyRevealModal open={!!revealData} onOpenChange={(v) => {if(!v) revealData = null}} response={revealData} />

{#if revokeTarget}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-xl" onclick={() => revokeTarget = null}></div>

    <div class="relative bg-[#0a0505] border border-red-500/20 rounded-[2rem] shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden max-w-sm w-full" in:scale={{ start: 0.95, duration: 300 }}>
      <div class="p-6 text-center relative z-10">
        <Trash2 class="h-10 w-10 text-red-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h2 class="text-lg font-black uppercase tracking-widest text-white mb-2">Revoke Key?</h2>
        <p class="text-xs text-white/50">Are you sure you want to revoke <span class="font-mono text-amber-400">{revokeTarget.name}</span>? Any integration using this key will immediately lose access.</p>
      </div>

      <div class="px-6 py-4 border-t border-red-500/10 flex justify-end gap-3 bg-red-500/5 relative z-10">
        <button onclick={() => revokeTarget = null} class="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase text-white/70">Cancel</button>
        <button onclick={handleRevoke} disabled={revoking} class="px-5 py-2 rounded-xl bg-red-500 text-black text-[10px] font-black uppercase shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-400 disabled:opacity-50">Confirm Revoke</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(245, 158, 11, 0.2);
  }
</style>
