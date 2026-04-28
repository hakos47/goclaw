<script lang="ts">
  import { Clock, Plus, Search, RefreshCw, CalendarDays, TerminalSquare } from "lucide-svelte";
  import { onMount } from "svelte";
  import { useCron } from "./hooks/use-cron.svelte";
  import { wsState } from "../../lib/state/ws.svelte";
  import CronListRow from "./components/CronListRow.svelte";
  import CronFormDialog from "./components/CronFormDialog.svelte";
  import CronDetail from "./CronDetail.svelte";

  const cron = useCron();
  let search = $state("");
  let showCreate = $state(false);

  // Parsing ID from the URL path: /cron/:id
  let detailId = $derived.by(() => {
    if (!wsState.currentPath.startsWith('/cron/')) return null;
    const parts = wsState.currentPath.split('/');
    if (parts.length >= 3 && parts[2]) {
      return parts[2];
    }
    return null;
  });

  let filteredJobs = $derived.by(() => {
    let list = cron.jobs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j => 
        j.name.toLowerCase().includes(q) || 
        j.payload.message?.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q)
      );
    }
    // Sort by created at descending
    return list.slice().sort((a, b) => b.createdAtMs - a.createdAtMs);
  });

  onMount(() => {
    cron.refresh();
  });
</script>

{#if detailId}
  <CronDetail {detailId} />
{:else}
  <div class="p-4 sm:p-6 pb-10 flex-1 flex flex-col max-w-7xl mx-auto w-full min-h-0 overflow-y-auto custom-scrollbar">
    <!-- Global Background Effects -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none"></div>

    <!-- HUD Header -->
    <div class="shrink-0 relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
      <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-goclaw-neon-cyan/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 bg-goclaw-neon-purple/20 rounded-xl border border-goclaw-neon-purple/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
              <Clock class="h-6 w-6 text-goclaw-neon-purple" />
            </div>
            <h1 class="text-2xl font-black text-white tracking-tight drop-shadow-md">Scheduled Jobs</h1>
          </div>
          <p class="text-sm font-medium text-white/50 max-w-xl">
            Configure recurrent or delayed tasks to run automatically at specific times.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button 
            type="button"
            onclick={() => cron.refresh()} 
            disabled={cron.loading}
            class="relative flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105"
          >
            <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
            <RefreshCw class="h-3.5 w-3.5 relative z-10 text-white/30 group-hover:text-white/70 transition-colors duration-500 {cron.loading ? 'animate-spin' : ''}" />
            <span class="relative z-10 drop-shadow-md hidden sm:inline">Refresh</span>
          </button>

          <button 
            type="button"
            onclick={() => showCreate = true} 
            class="relative flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-goclaw-neon-purple hover:text-white shadow-[0_0_20px_rgba(217,70,239,0.15)] hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:scale-105"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-goclaw-neon-purple/20 to-goclaw-neon-purple/5 border border-goclaw-neon-purple/50 rounded-xl transition-all group-hover:opacity-80"></div>
            <Plus class="h-3.5 w-3.5 relative z-10 transition-colors duration-500" />
            <span class="relative z-10 drop-shadow-md">New Job</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
      <div class="relative w-full sm:w-96 group">
        <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search class="h-4 w-4 text-white/30 group-focus-within:text-goclaw-neon-purple transition-colors duration-300" />
        </div>
        <input
          type="text"
          bind:value={search}
          placeholder="Search jobs by name or payload..."
          class="w-full bg-[#030014]/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-white/90 placeholder:text-white/30 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/30 transition-all outline-none shadow-inner"
        />
        {#if search}
          <button 
            type="button"
            onclick={() => search = ""}
            class="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/70 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Job List -->
    <div class="mt-6 flex-1 relative z-10">
      {#if !cron.initialized && cron.loading}
        <div class="flex flex-col gap-4">
          {#each Array(3) as _}
             <div class="h-24 bg-white/5 border border-white/10 rounded-[1.5rem] animate-pulse"></div>
          {/each}
        </div>
      {:else if filteredJobs.length === 0}
        <div class="flex flex-col items-center justify-center h-64 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]">
          <CalendarDays class="h-12 w-12 text-white/20 mb-4" />
          <h3 class="text-lg font-bold text-white/80 mb-2">{search ? "No jobs match your search" : "No scheduled jobs"}</h3>
          <p class="text-sm font-medium text-white/40 max-w-md">
            {search ? "Try adjusting your search terms." : "Create your first scheduled job to automate recurring or delayed tasks."}
          </p>
          {#if !search}
            <button 
              type="button"
              onclick={() => showCreate = true}
              class="mt-6 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-goclaw-neon-purple transition-all hover:scale-105"
            >
              Create Job
            </button>
          {/if}
        </div>
      {:else}
        <div class="flex flex-col gap-3">
          {#each filteredJobs as job}
            <CronListRow {job} {cron} />
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <CronFormDialog open={showCreate} onClose={() => showCreate = false} />
{/if}
