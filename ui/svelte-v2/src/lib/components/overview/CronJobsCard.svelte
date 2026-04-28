<script lang="ts">
  import { Timer, ArrowRight, Clock } from "lucide-svelte";
  import { _ } from "svelte-i18n";

  type Props = {
    jobs: any[];
  };

  let { jobs = [] }: Props = $props();
</script>

<div class="relative overflow-hidden bg-[#030014]/40 backdrop-blur-3xl border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl group flex flex-col h-full">
  
  <div class="absolute inset-0 bg-[linear-gradient(-45deg,rgba(6,182,212,0.02)_25%,transparent_25%,transparent_50%,rgba(6,182,212,0.02)_50%,rgba(6,182,212,0.02)_75%,transparent_75%,transparent)] bg-[length:20px_20px] pointer-events-none opacity-30"></div>

  <div class="relative z-10 flex items-center justify-between p-5 md:p-6 border-b border-white/5">
    <div class="flex items-center gap-3">
      <div class="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <Clock class="h-5 w-5 text-orange-400 animate-pulse-slow" />
      </div>
      <div>
        <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-white">{$_('overview.cronJobs.title', { default: "Sequence Queue" })}</h3>
        <p class="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">Automated Routines</p>
      </div>
    </div>
    {#if jobs.length > 0}
      <a href="/cron" class="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all flex items-center gap-2 group/btn">
        <span class="font-bold uppercase tracking-wider">Manage</span>
        <ArrowRight class="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
      </a>
    {/if}
  </div>

  <div class="relative z-10 flex-1 p-5 md:p-6 overflow-y-auto">
    {#if jobs.length === 0}
      <div class="flex flex-col items-center justify-center h-full py-8 opacity-50">
        <Clock class="h-8 w-8 text-white/20 mb-3" />
        <span class="text-xs font-mono uppercase tracking-widest text-white/40">{$_('overview.cronJobs.noJobs', { default: "Queue Empty" })}</span>
      </div>
    {:else}
      <div class="space-y-3">
        {#each jobs.slice(0, 5) as job}
          <div class={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${job.enabled ? 'bg-black/40 border-white/5 hover:border-orange-500/30' : 'bg-white/5 border-transparent opacity-50'}`}>
            
            <div class="flex items-center gap-4">
              <div class="relative flex items-center justify-center w-8 h-8 rounded-lg bg-black/60 border border-white/5">
                <div class={`w-2 h-2 rounded-full ${job.enabled ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "bg-white/20"}`}></div>
              </div>
              <div class="flex flex-col">
                <a href={`/cron/${job.id}`} class={`text-[13px] font-bold tracking-wide transition-colors ${job.enabled ? "text-white hover:text-orange-400" : "text-white/60"}`}>
                  {job.name}
                </a>
                <span class="text-[9px] font-mono uppercase tracking-widest text-white/40">{job.id.substring(0, 8)}...</span>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1">
              <span class="text-[9px] font-bold uppercase tracking-widest text-white/30">Next Execution</span>
              <div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/50 border border-white/5 shadow-inner">
                {#if job.enabled && job.state?.nextRunAtMs}
                  <Timer class="h-3 w-3 text-orange-400" />
                  <span class="text-[10px] font-mono text-orange-400">{new Date(job.state.nextRunAtMs).toLocaleTimeString()}</span>
                {:else if !job.enabled}
                  <span class="text-[10px] font-mono text-white/40">{$_('overview.cronJobs.disabled', { default: "Disabled" })}</span>
                {:else}
                  <span class="text-[10px] font-mono text-white/40">--</span>
                {/if}
              </div>
            </div>
            
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>