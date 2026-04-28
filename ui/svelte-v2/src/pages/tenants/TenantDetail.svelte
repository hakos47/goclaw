<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowLeft, Plus, RefreshCw, Users, Shield, Hash, Calendar, Trash2 } from "lucide-svelte";
  import { fetchTenantDetail, fetchTenantUsers, addTenantUser, removeTenantUser, type TenantData, type TenantUser } from "$lib/state/tenants.svelte";
  import { fade, scale } from "svelte/transition";
  import { wsState } from "$lib/state/ws.svelte";

  let { tenantId } = $props<{ tenantId: string }>();

  let tenant = $state<TenantData | null>(null);
  let users = $state<TenantUser[]>([]);
  let loading = $state(true);
  
  let addOpen = $state(false);
  let removeTarget = $state<string | null>(null);
  let newUserId = $state("");
  let newRole = $state("member");
  let actionLoading = $state(false);

  const ROLES = ["owner", "admin", "operator", "member", "viewer"];

  let hasLoaded = false;
  $effect(() => {
    if (wsState.connected && !hasLoaded) {
      hasLoaded = true;
      loadData();
    }
  });

  async function loadData() {
    loading = true;
    try {
      const [tData, tUsers] = await Promise.all([
        fetchTenantDetail(tenantId),
        fetchTenantUsers(tenantId)
      ]);
      tenant = tData;
      users = tUsers;
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleAdd() {
    if (!newUserId.trim()) return;
    actionLoading = true;
    try {
      await addTenantUser(tenantId, newUserId.trim(), newRole);
      addOpen = false;
      newUserId = "";
      newRole = "member";
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      actionLoading = false;
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    actionLoading = true;
    try {
      await removeTenantUser(tenantId, removeTarget);
      removeTarget = null;
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      actionLoading = false;
    }
  }

  function goBack() {
    window.history.pushState({}, '', '/tenants');
    wsState.currentPath = '/tenants';
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

  function getRoleBadge(role: string) {
    if (role === "owner") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (role === "admin") return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (role === "operator") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-white/10 text-white/50 border-white/20";
  }

  function getDisplayName(userId: string, displayName?: string) {
    if (displayName) return displayName;
    return userId; // Fallback since contacts are not yet migrated to Svelte V2
  }
</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full">
  
  <!-- Header -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] relative overflow-hidden shrink-0 z-20">
    <div class="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full"></div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
            {tenant ? tenant.name : 'Loading...'}
          </h1>
          {#if tenant}
            <span class={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-inner ${getStatusBadge(tenant.status)}`}>
              {tenant.status}
            </span>
          {/if}
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          Tenant Dashboard
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={goBack}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
      >
        <ArrowLeft class="h-4 w-4 text-white/70 group-hover:text-white" />
        <span class="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Back</span>
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if tenant}
    <div class="flex-1 overflow-y-auto custom-scrollbar space-y-6">
      
      <!-- Info Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-2xl border border-white/5 bg-[#030010]/50 backdrop-blur-sm p-4 flex items-center gap-4 shadow-inner">
          <div class="h-10 w-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
            <Hash class="h-4 w-4 text-white/50" />
          </div>
          <div>
            <p class="text-[9px] font-black uppercase tracking-widest text-white/30">Slug</p>
            <p class="text-xs font-mono font-bold text-white/80">{tenant.slug}</p>
          </div>
        </div>

        <div class="rounded-2xl border border-white/5 bg-[#030010]/50 backdrop-blur-sm p-4 flex items-center gap-4 shadow-inner">
          <div class="h-10 w-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
            <Shield class="h-4 w-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          </div>
          <div>
            <p class="text-[9px] font-black uppercase tracking-widest text-white/30">Status</p>
            <span class={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${getStatusBadge(tenant.status)}`}>
              {tenant.status}
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-white/5 bg-[#030010]/50 backdrop-blur-sm p-4 flex items-center gap-4 shadow-inner">
          <div class="h-10 w-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
            <Calendar class="h-4 w-4 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" />
          </div>
          <div>
            <p class="text-[9px] font-black uppercase tracking-widest text-white/30">Created</p>
            <p class="text-xs font-bold text-white/80">{formatTime(tenant.created_at)}</p>
          </div>
        </div>
      </div>

      <!-- Users Section -->
      <div class="rounded-2xl border border-white/5 bg-[#030010]/50 backdrop-blur-sm p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div class="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full"></div>
        
        <div class="flex items-center justify-between mb-6 relative z-10">
          <div class="flex items-center gap-3">
            <Users class="h-5 w-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <h2 class="text-sm font-black uppercase tracking-widest text-white">User Management <span class="text-white/30 ml-2">({users.length})</span></h2>
          </div>
          <div class="flex gap-2">
            <button 
              onclick={() => addOpen = true}
              class="group flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/20 transition-all"
            >
              <Plus class="h-3.5 w-3.5 text-emerald-400" />
              <span class="text-[9px] font-black uppercase tracking-widest text-emerald-100">Add User</span>
            </button>
            <button 
              onclick={loadData}
              disabled={loading}
              class="p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw class="h-3.5 w-3.5 text-blue-400" />
            </button>
          </div>
        </div>

        <div class="space-y-2 relative z-10">
          {#if users.length === 0}
            <div class="text-center py-10">
              <p class="text-[10px] font-black uppercase tracking-widest text-white/30">No users found in this tenant</p>
            </div>
          {:else}
            {#each users as u}
              <div class="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-3 hover:bg-white/[0.02] transition-colors">
                <div class="flex items-center gap-4">
                  <div class="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 font-bold uppercase shadow-inner">
                    {getDisplayName(u.user_id, u.display_name).charAt(0)}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-white/90">{getDisplayName(u.user_id, u.display_name)}</p>
                    <p class="text-[9px] font-mono uppercase tracking-widest text-white/30 mt-0.5">{u.user_id}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <span class={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${getRoleBadge(u.role)}`}>
                    {u.role}
                  </span>
                  <button
                    onclick={() => removeTarget = u.user_id}
                    class="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <!-- Modals -->
    {#if addOpen}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="absolute inset-0 bg-[#020106]/80 backdrop-blur-md" onclick={() => addOpen = false}></div>

        <div class="relative w-full max-w-md flex flex-col bg-[#0a0a16] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden" in:scale={{ start: 0.95, duration: 300 }}>
          <div class="px-6 py-5 border-b border-white/5">
            <h2 class="text-lg font-black uppercase tracking-widest text-white drop-shadow-md">Add User</h2>
          </div>

          <div class="p-6 space-y-4">
            <div class="space-y-1.5">
              <label for="new-user-id" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">User ID / Username</label>
              <input id="new-user-id" type="text" bind:value={newUserId} placeholder="e.g. user_123" class="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white/90 text-sm focus:outline-none focus:border-emerald-500/50" />
            </div>

            <div class="space-y-1.5">
              <label for="new-user-role" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Role</label>
              <select id="new-user-role" bind:value={newRole} class="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white/90 text-sm focus:outline-none focus:border-emerald-500/50 appearance-none">
                {#each ROLES as r}
                  <option value={r}>{r.toUpperCase()}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="px-6 py-5 border-t border-white/5 flex justify-end gap-3 bg-white/[0.02]">
            <button onclick={() => addOpen = false} class="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase text-white/70">Cancel</button>
            <button onclick={handleAdd} disabled={actionLoading || !newUserId.trim()} class="px-5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50">Add User</button>
          </div>
        </div>
      </div>
    {/if}

    {#if removeTarget}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="absolute inset-0 bg-[#020106]/80 backdrop-blur-md" onclick={() => removeTarget = null}></div>

        <div class="relative w-full max-w-sm flex flex-col bg-[#0a0a16] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden" in:scale={{ start: 0.95, duration: 300 }}>
          <div class="p-6 text-center">
            <Trash2 class="h-10 w-10 text-red-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            <h2 class="text-lg font-black uppercase tracking-widest text-white mb-2">Remove User?</h2>
            <p class="text-xs text-white/50">Are you sure you want to remove <span class="font-mono text-white/80">{removeTarget}</span> from this organization? This action cannot be undone.</p>
          </div>

          <div class="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-white/[0.02]">
            <button onclick={() => removeTarget = null} class="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase text-white/70">Cancel</button>
            <button onclick={handleRemove} disabled={actionLoading} class="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase text-red-400 hover:bg-red-500/20 disabled:opacity-50">Remove</button>
          </div>
        </div>
      </div>
    {/if}

  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar { width: 8px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.15); }
</style>
