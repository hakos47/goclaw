<script lang="ts">
  import { onMount } from "svelte";
  import { Building2, Plus, RefreshCw, Hash, Calendar, Shield } from "lucide-svelte";
  import { tenantsStore, fetchTenants, createTenant } from "$lib/state/tenants.svelte";
  import { fade, scale } from "svelte/transition";
  import { wsState } from "$lib/state/ws.svelte";

  let hasFetched = false;
  $effect(() => {
    if (wsState.connected && !hasFetched) {
      hasFetched = true;
      fetchTenants();
    }
  });

  let createOpen = $state(false);
  let newName = $state("");
  let newSlug = $state("");
  let creating = $state(false);

  function handleNameChange(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    newName = v;
    newSlug = v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleCreate() {
    if (!newName.trim() || !newSlug.trim()) return;
    creating = true;
    try {
      await createTenant(newName.trim(), newSlug.trim());
      createOpen = false;
      newName = "";
      newSlug = "";
    } catch (e) {
      console.error(e);
    } finally {
      creating = false;
    }
  }

  function formatTime(ts: string) {
    if (!ts) return "N/A";
    return new Date(ts).toLocaleDateString();
  }

  function getStatusBadge(status: string) {
    if (status === "active") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (status === "suspended") return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-white/10 text-white/50 border-white/20";
  }

  function navigateToTenant(id: string) {
    window.history.pushState({}, '', `/tenants/${id}`);
    wsState.currentPath = `/tenants/${id}`;
  }
</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full">
  
  <!-- Bento Header -->
  <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 shrink-0 z-20">
    <!-- Background Container -->
    <div class="absolute inset-0 bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden pointer-events-none -z-10">
      <div class="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full"></div>
      <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full"></div>
    </div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div class="h-14 w-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Building2 class="h-6 w-6 text-white group-hover:text-emerald-400 transition-colors drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      </div>
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
            Tenants
          </h1>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-inner bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            {tenantsStore.tenants.length} Organizations
          </span>
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          Manage isolated workspaces and access controls
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      {#if tenantsStore.isOwner}
        <button 
          onclick={() => createOpen = true}
          class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/20 transition-all shadow-[inset_0_1px_2px_rgba(16,185,129,0.1)]"
        >
          <Plus class="h-4 w-4 text-emerald-400 group-hover:drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
          <span class="text-[10px] font-black uppercase tracking-widest text-emerald-100">Create Tenant</span>
        </button>
      {/if}

      <button 
        onclick={fetchTenants} 
        disabled={tenantsStore.loading}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] disabled:opacity-50"
      >
        <RefreshCw class={`h-4 w-4 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)] ${tenantsStore.loading ? 'animate-spin' : ''}`} />
        <span class="text-[10px] font-black uppercase tracking-widest text-blue-100">Refresh</span>
      </button>
    </div>
  </div>

  <!-- Data Grid Area -->
  {#if tenantsStore.tenants.length === 0 && !tenantsStore.loading}
    <div class="flex-1 flex flex-col items-center justify-center text-center p-8 relative border border-white/5 rounded-2xl bg-[#030010]/50 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      <div class="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none"></div>
      <Building2 class="h-16 w-16 text-white/10 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
      <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-1">No Tenants Found</h3>
      <p class="text-[10px] text-white/30 uppercase tracking-widest">You are not a member of any organization.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
      {#each tenantsStore.tenants as tenant (tenant.id)}
        <button
          type="button"
          onclick={() => navigateToTenant(tenant.id)}
          class="flex flex-col text-left relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#050510]/80 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] group/card p-5"
        >
          <!-- Background Glow on Hover -->
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-[50px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div class="flex items-center justify-between mb-4 relative z-10">
            <h3 class="text-lg font-bold text-white group-hover/card:text-emerald-400 transition-colors truncate pr-2">{tenant.name}</h3>
            <span class={`shrink-0 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${getStatusBadge(tenant.status)}`}>
              {tenant.status}
            </span>
          </div>

          <div class="flex items-center gap-2 mb-2 text-white/40 group-hover/card:text-white/60 transition-colors relative z-10">
            <Hash class="h-3.5 w-3.5" />
            <span class="font-mono text-xs">{tenant.slug}</span>
          </div>

          <div class="flex items-center gap-2 text-white/30 group-hover/card:text-white/50 transition-colors mt-auto pt-4 relative z-10">
            <Calendar class="h-3.5 w-3.5" />
            <span class="text-[10px] font-black uppercase tracking-widest">Created: {formatTime(tenant.created_at)}</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Create Tenant Modal -->
  {#if createOpen}
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      in:fade={{ duration: 300 }} 
      out:fade={{ duration: 200 }}
    >
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div 
        class="absolute inset-0 bg-[#020106]/80 backdrop-blur-md"
        onclick={() => createOpen = false}
      ></div>

      <div 
        class="relative w-full max-w-md flex flex-col bg-[#0a0a16] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden"
        in:scale={{ start: 0.95, duration: 300 }} 
        out:scale={{ start: 0.95, duration: 200 }}
      >
        <div class="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/20 blur-[100px] pointer-events-none rounded-full"></div>

        <div class="px-6 py-5 border-b border-white/5 relative z-10">
          <h2 class="text-lg font-black uppercase tracking-widest text-white drop-shadow-md">Create Tenant</h2>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">Initialize a new isolated organization</p>
        </div>

        <div class="p-6 relative z-10 space-y-4">
          <div class="space-y-1.5">
            <label for="tenant-name" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Organization Name</label>
            <input
              id="tenant-name"
              type="text"
              bind:value={newName}
              oninput={handleNameChange}
              placeholder="My Company"
              class="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white/90 placeholder-white/30 font-bold text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
            />
          </div>

          <div class="space-y-1.5">
            <label for="tenant-slug" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">URL Slug</label>
            <input
              id="tenant-slug"
              type="text"
              bind:value={newSlug}
              placeholder="my-company"
              class="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white/90 placeholder-white/30 font-mono text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
            />
            <p class="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1 mt-1">Unique identifier, a-z, 0-9, and hyphens only.</p>
          </div>
        </div>

        <div class="px-6 py-5 border-t border-white/5 flex items-center justify-end gap-3 bg-white/[0.02] relative z-10">
          <button 
            onclick={() => createOpen = false} 
            disabled={creating}
            class="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            onclick={handleCreate} 
            disabled={creating || !newName.trim() || !newSlug.trim()}
            class="group flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/20 transition-all shadow-[inset_0_1px_2px_rgba(16,185,129,0.1)] disabled:opacity-50 disabled:grayscale"
          >
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-100">{creating ? 'Creating...' : 'Create Tenant'}</span>
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>
