<script lang="ts">
  import { Terminal, Plus, RefreshCw, Pencil, Shield, Users, Trash2, KeyRound } from "lucide-svelte";
  import { cliCredentialsStore, fetchCliCredentials, fetchCliPresets, deleteCliCredential, type SecureCLIBinary } from "$lib/state/cli-credentials.svelte";
  import { wsState } from "$lib/state/ws.svelte";
  import { fade, scale } from "svelte/transition";

  import CliCredentialFormModal from "./components/CliCredentialFormModal.svelte";
  import CliCredentialGrantsModal from "./components/CliCredentialGrantsModal.svelte";
  import CliUserCredentialsModal from "./components/CliUserCredentialsModal.svelte";

  let hasFetched = false;
  $effect(() => {
    if (wsState.connected && !hasFetched) {
      hasFetched = true;
      fetchCliCredentials();
      fetchCliPresets();
    }
  });

  let formOpen = $state(false);
  let editTarget = $state<SecureCLIBinary | null>(null);
  let grantsTarget = $state<SecureCLIBinary | null>(null);
  let usersTarget = $state<SecureCLIBinary | null>(null);
  let deleteTarget = $state<SecureCLIBinary | null>(null);
  let deleting = $state(false);

  function openCreate() {
    editTarget = null;
    formOpen = true;
  }

  function openEdit(item: SecureCLIBinary) {
    editTarget = item;
    formOpen = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await deleteCliCredential(deleteTarget.id);
      deleteTarget = null;
    } catch (e) {
      console.error(e);
    } finally {
      deleting = false;
    }
  }

</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full">

  <!-- Bento Header -->
  <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 shrink-0 z-20">
    <!-- Background Container -->
    <div class="absolute inset-0 bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden pointer-events-none -z-10">
      <div class="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full"></div>
      <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-magenta-500/20 blur-[80px] rounded-full"></div>
    </div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div class="h-14 w-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Terminal class="h-6 w-6 text-white group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
      </div>
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
            CLI Credentials
          </h1>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-inner bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            {cliCredentialsStore.items.length} Binaries
          </span>
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          Secure binaries and script execution environments
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={openCreate}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/20 transition-all shadow-[inset_0_1px_2px_rgba(34,211,238,0.1)]"
      >
        <Plus class="h-4 w-4 text-cyan-400 group-hover:drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
        <span class="text-[10px] font-black uppercase tracking-widest text-cyan-100">Add Binary</span>
      </button>

      <button 
        onclick={fetchCliCredentials} 
        disabled={cliCredentialsStore.loading}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] disabled:opacity-50"
      >
        <RefreshCw class={`h-4 w-4 text-magenta-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)] ${cliCredentialsStore.loading ? 'animate-spin' : ''}`} />
        <span class="text-[10px] font-black uppercase tracking-widest text-magenta-100">Refresh</span>
      </button>
    </div>
  </div>

  <!-- Data Grid Area -->
  {#if cliCredentialsStore.items.length === 0 && !cliCredentialsStore.loading}
    <div class="flex-1 flex flex-col items-center justify-center text-center p-8 relative border border-white/5 rounded-2xl bg-[#030010]/50 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      <div class="absolute inset-0 bg-cyan-500/5 blur-[100px] pointer-events-none"></div>
      <Terminal class="h-16 w-16 text-white/10 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
      <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-1">No Binaries Found</h3>
      <p class="text-[10px] text-white/30 uppercase tracking-widest">Register a secure binary to allow agent execution.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 auto-rows-max">
      {#each cliCredentialsStore.items as item (item.id)}
        <div class="flex flex-col relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#050510]/80 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] group/card p-5">
          
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 blur-[50px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div class="flex items-start justify-between mb-4 relative z-10">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner">
                <KeyRound class="h-4 w-4 text-white/50 group-hover/card:text-cyan-400 transition-colors" />
              </div>
              <div>
                <h3 class="text-base font-bold text-white group-hover/card:text-cyan-400 transition-colors">{item.binary_name}</h3>
                <p class="text-[9px] font-mono text-white/40 max-w-[200px] truncate" title={item.binary_path || 'No specific path'}>{item.binary_path || 'Any path'}</p>
              </div>
            </div>
            
            <div class="flex gap-2">
              <span class={`shrink-0 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${item.is_global ? 'bg-white/10 text-white border-white/20' : 'bg-magenta-500/20 text-magenta-400 border-magenta-500/30'}`}>
                {item.is_global ? 'Global' : 'Restricted'}
              </span>
              <span class={`shrink-0 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${item.enabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {item.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <p class="text-xs text-white/60 mb-6 line-clamp-2 relative z-10 min-h-[2rem]">
            {item.description || "No description provided."}
          </p>

          <div class="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-10">
            <div class="text-[10px] font-mono text-white/30">
              Timeout: <span class="text-white/70">{item.timeout_seconds}s</span>
            </div>
            
            <div class="flex gap-2">
              <button onclick={() => grantsTarget = item} class="p-2 rounded-lg bg-white/5 hover:bg-magenta-500/20 text-white/50 hover:text-magenta-400 border border-transparent hover:border-magenta-500/30 transition-all" title="Manage Agent Grants">
                <Shield class="h-4 w-4" />
              </button>
              <button onclick={() => usersTarget = item} class="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-white/50 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all" title="Manage User Credentials">
                <Users class="h-4 w-4" />
              </button>
              <button onclick={() => openEdit(item)} class="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-white/50 hover:text-emerald-400 border border-transparent hover:border-emerald-500/30 transition-all" title="Edit Binary">
                <Pencil class="h-4 w-4" />
              </button>
              <button onclick={() => deleteTarget = item} class="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all" title="Delete Binary">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if formOpen}
  <CliCredentialFormModal open={formOpen} onOpenChange={(v) => formOpen = v} credential={editTarget} />
{/if}

{#if grantsTarget}
  <CliCredentialGrantsModal open={!!grantsTarget} onOpenChange={(v) => {if (!v) grantsTarget = null}} binary={grantsTarget} />
{/if}

{#if usersTarget}
  <CliUserCredentialsModal open={!!usersTarget} onOpenChange={(v) => {if (!v) usersTarget = null}} binary={usersTarget} />
{/if}

{#if deleteTarget}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-xl" onclick={() => deleteTarget = null}></div>

    <div class="relative bg-[#0a0a16] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden max-w-sm w-full" in:scale={{ start: 0.95, duration: 300 }}>
      <div class="p-6 text-center relative z-10">
        <Trash2 class="h-10 w-10 text-red-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h2 class="text-lg font-black uppercase tracking-widest text-white mb-2">Delete Binary?</h2>
        <p class="text-xs text-white/50">Are you sure you want to delete <span class="font-mono text-white/80">{deleteTarget.binary_name}</span>? All credentials and grants will be lost.</p>
      </div>

      <div class="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-white/[0.02] relative z-10">
        <button onclick={() => deleteTarget = null} class="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase text-white/70">Cancel</button>
        <button onclick={handleDelete} disabled={deleting} class="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase text-red-400 hover:bg-red-500/20 disabled:opacity-50">Delete</button>
      </div>
    </div>
  </div>
{/if}
