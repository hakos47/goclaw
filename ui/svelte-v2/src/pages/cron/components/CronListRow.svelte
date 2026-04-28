<script lang="ts">
  import { Clock, Trash2, Play, AlertCircle, CheckCircle2, ChevronRight, MessageSquare, Bot } from "lucide-svelte";
  import type { CronJob } from "../hooks/use-cron.svelte";
  import { formatDistanceToNow } from "date-fns";

  let { job, cron }: { job: CronJob, cron: any } = $props();

  let isRunning = $state(false);
  let isDeleting = $state(false);

  function formatSchedule(schedule: CronJob['schedule']) {
    switch (schedule.kind) {
      case "at": return `At ${new Date(schedule.atMs || 0).toLocaleString()}`;
      case "every": return `Every ${Math.round((schedule.everyMs || 0) / 1000)}s`;
      case "cron": return `Cron: ${schedule.expr}`;
      default: return "Unknown";
    }
  }

  function handleToggle(e: Event) {
    e.stopPropagation();
    cron.toggleJob(job.id, !job.enabled);
  }

  async function handleRun(e: Event) {
    e.stopPropagation();
    isRunning = true;
    try {
      await cron.runJob(job.id);
    } finally {
      isRunning = false;
    }
  }

  async function handleDelete(e: Event) {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${job.name}?`)) return;
    isDeleting = true;
    try {
      await cron.deleteJob(job.id);
    } finally {
      isDeleting = false;
    }
  }
</script>

<div class="group relative bg-[#030014]/40 border border-white/5 rounded-2xl p-5 hover:border-goclaw-neon-purple/50 hover:shadow-[0_0_30px_rgba(217,70,239,0.1)] transition-all duration-300 overflow-hidden cursor-pointer">
  <div class="absolute inset-0 bg-gradient-to-r from-goclaw-neon-purple/0 to-goclaw-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
  
  <a href={`/cron/${job.id}`} class="absolute inset-0 z-0"></a>

  <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <!-- Left: Info -->
    <div class="flex items-start gap-4">
      <div class="mt-1">
        <div class="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center {job.enabled ? 'text-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-white/20'}">
          <Clock class="w-5 h-5" />
        </div>
      </div>
      
      <div>
        <h3 class="text-base font-bold text-white/90 group-hover:text-goclaw-neon-purple transition-colors">{job.name}</h3>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-medium">
          <span class="text-goclaw-neon-cyan font-mono bg-goclaw-neon-cyan/10 px-2 py-0.5 rounded border border-goclaw-neon-cyan/20">
            {formatSchedule(job.schedule)}
          </span>
          {#if job.agentId}
            <span class="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Bot class="w-3 h-3" /> Agent
            </span>
          {:else}
            <span class="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              <MessageSquare class="w-3 h-3" /> System
            </span>
          {/if}
          {#if job.state?.nextRunAtMs}
            <span class="text-white/40 border border-white/10 px-2 py-0.5 rounded">
              Next: {formatDistanceToNow(job.state.nextRunAtMs, { addSuffix: true })}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center justify-end gap-4 shrink-0">
      
      <!-- Last Status -->
      {#if job.state?.lastStatus}
        <div class="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md border {job.state.lastStatus === 'success' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-rose-400 border-rose-500/20 bg-rose-500/10'}">
          {#if job.state.lastStatus === 'success'}
            <CheckCircle2 class="w-3.5 h-3.5" /> OK
          {:else}
            <AlertCircle class="w-3.5 h-3.5" /> ERR
          {/if}
        </div>
      {/if}

      <!-- Toggle -->
      <button 
        type="button"
        onclick={handleToggle}
        class="relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-goclaw-neon-purple/50 {job.enabled ? 'bg-goclaw-neon-purple/40 border border-goclaw-neon-purple/50' : 'bg-white/10 border border-white/20'}"
      >
        <div class="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 {job.enabled ? 'translate-x-5 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'opacity-50'}"></div>
      </button>

      <div class="w-px h-6 bg-white/10"></div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-1">
        <button 
          type="button"
          onclick={handleRun}
          disabled={isRunning}
          class="p-2 text-white/40 hover:text-goclaw-neon-cyan hover:bg-goclaw-neon-cyan/10 rounded-lg transition-all z-10 relative"
          title="Run Now"
        >
          <Play class="w-4 h-4 {isRunning ? 'animate-pulse' : ''}" />
        </button>
        <button 
          type="button"
          onclick={handleDelete}
          disabled={isDeleting}
          class="p-2 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all z-10 relative"
          title="Delete Job"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>

      <ChevronRight class="w-5 h-5 text-white/20 group-hover:text-goclaw-neon-purple transition-colors" />
    </div>
  </div>
</div>
