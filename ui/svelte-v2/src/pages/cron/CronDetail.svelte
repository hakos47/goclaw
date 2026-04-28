<script lang="ts">
  import { ArrowLeft, Play, Trash2, Clock, CalendarDays, TerminalSquare } from "lucide-svelte";
  import { useCron } from "./hooks/use-cron.svelte";
  import CronRunLogDialog from "./components/CronRunLogDialog.svelte";
  import { formatDistanceToNow } from "date-fns";

  let { detailId }: { detailId: string } = $props();
  
  const cron = useCron();
  
  let job = $derived(cron.jobs.find(j => j.id === detailId));
  
  let showLogs = $state(false);
  let isRunning = $state(false);
  let isDeleting = $state(false);

  function goBack() {
    window.history.pushState({}, '', '/cron');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  async function handleToggle() {
    if (!job) return;
    await cron.toggleJob(job.id, !job.enabled);
  }

  async function handleRun() {
    if (!job) return;
    isRunning = true;
    try {
      await cron.runJob(job.id);
    } finally {
      isRunning = false;
    }
  }

  async function handleDelete() {
    if (!job) return;
    if (!confirm(`Are you sure you want to delete ${job.name}?`)) return;
    isDeleting = true;
    try {
      await cron.deleteJob(job.id);
      goBack();
    } finally {
      isDeleting = false;
    }
  }

  function formatSchedule(schedule: any) {
    if (!schedule) return "Unknown";
    switch (schedule.kind) {
      case "at": return `At ${new Date(schedule.atMs || 0).toLocaleString()}`;
      case "every": return `Every ${Math.round((schedule.everyMs || 0) / 1000)} seconds`;
      case "cron": return `Cron Expression: ${schedule.expr} ${schedule.tz ? '('+schedule.tz+')' : ''}`;
      default: return "Unknown";
    }
  }
</script>

{#if !job && cron.loading}
  <div class="flex items-center justify-center p-12 text-goclaw-neon-cyan">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-goclaw-neon-cyan"></div>
  </div>
{:else if !job}
  <div class="p-8 text-center text-white/40">
    <h2 class="text-xl font-bold mb-4">Job Not Found</h2>
    <button onclick={goBack} class="text-goclaw-neon-purple hover:underline">Return to list</button>
  </div>
{:else}
  <div class="p-4 sm:p-6 flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0 overflow-y-auto custom-scrollbar relative">
    <!-- Background Effects -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)] pointer-events-none"></div>

    <!-- Header Actions -->
    <div class="flex items-center justify-between mb-6 relative z-10">
      <button 
        type="button"
        onclick={goBack}
        class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white/90 bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:-translate-x-1"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        Back
      </button>

      <div class="flex items-center gap-2">
        <button 
          type="button"
          onclick={() => showLogs = true}
          class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
        >
          <TerminalSquare class="w-3.5 h-3.5" />
          Logs
        </button>
        <button 
          type="button"
          onclick={handleRun}
          disabled={isRunning}
          class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-goclaw-neon-cyan bg-goclaw-neon-cyan/10 border border-goclaw-neon-cyan/30 rounded-xl transition-all hover:bg-goclaw-neon-cyan/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
        >
          <Play class="w-3.5 h-3.5 {isRunning ? 'animate-pulse' : ''}" />
          Run Now
        </button>
        <button 
          type="button"
          onclick={handleDelete}
          disabled={isDeleting}
          class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl transition-all hover:bg-rose-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:opacity-50"
        >
          <Trash2 class="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>

    <!-- Main Card -->
    <div class="bg-[#030014]/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative z-10">
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 pb-8 border-b border-white/10">
        <div>
          <h1 class="text-3xl font-black text-white tracking-tight mb-2">{job.name}</h1>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white/50">
              ID: {job.id}
            </span>
            <button 
              type="button"
              onclick={handleToggle}
              class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none {job.enabled ? 'bg-goclaw-neon-cyan/40 border border-goclaw-neon-cyan/50' : 'bg-white/10 border border-white/20'}"
            >
              <div class="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 {job.enabled ? 'translate-x-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'opacity-50'}"></div>
            </button>
            <span class="text-xs font-bold uppercase tracking-widest {job.enabled ? 'text-goclaw-neon-cyan' : 'text-white/30'}">
              {job.enabled ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>

        <div class="flex flex-col items-end text-right">
          <div class="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">Schedule</div>
          <div class="text-sm font-mono text-white/80 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            {formatSchedule(job.schedule)}
          </div>
          {#if job.state?.nextRunAtMs && job.enabled}
            <div class="text-xs text-goclaw-neon-cyan mt-2 flex items-center gap-1.5">
              <CalendarDays class="w-3.5 h-3.5" />
              Next run: {formatDistanceToNow(job.state.nextRunAtMs, { addSuffix: true })}
            </div>
          {/if}
        </div>
      </div>

      <!-- Payload details -->
      <div class="space-y-6">
        <div>
          <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Clock class="w-3.5 h-3.5" /> Payload Configuration
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <div class="text-[10px] text-white/40 uppercase tracking-wider mb-1">Kind</div>
              <div class="text-sm font-bold text-white/90">{job.payload.kind}</div>
            </div>
            {#if job.agentId}
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <div class="text-[10px] text-white/40 uppercase tracking-wider mb-1">Target Agent ID</div>
                <div class="text-sm font-mono text-emerald-400">{job.agentId}</div>
              </div>
            {/if}
            <div class="bg-white/5 border border-white/10 rounded-xl p-4 col-span-1 md:col-span-2">
              <div class="text-[10px] text-white/40 uppercase tracking-wider mb-2">Message Content</div>
              <div class="text-sm font-mono text-white/80 whitespace-pre-wrap">{job.payload.message || '(Empty)'}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Delivery Options</h3>
          <div class="flex flex-wrap gap-3">
            {#if job.deliver}
              <span class="px-3 py-1.5 bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 text-goclaw-neon-purple text-xs font-bold rounded-lg flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-goclaw-neon-purple shadow-[0_0_5px_currentColor]"></div>
                Deliver Response
              </span>
              {#if job.deliverChannel}
                <span class="px-3 py-1.5 bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg">
                  Channel: <span class="font-bold">{job.deliverChannel}</span>
                </span>
              {/if}
            {:else}
              <span class="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 text-xs rounded-lg">
                No Delivery (Background)
              </span>
            {/if}
            
            {#if job.wakeHeartbeat}
              <span class="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg">
                Wake Heartbeat
              </span>
            {/if}
            
            {#if job.stateless}
              <span class="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg">
                Stateless
              </span>
            {/if}
            
            {#if job.deleteAfterRun}
              <span class="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-lg">
                Delete After Run
              </span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <CronRunLogDialog 
    jobId={job.id}
    open={showLogs}
    onClose={() => showLogs = false}
  />
{/if}
