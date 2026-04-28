<script lang="ts">
  import { Timer, ArrowRight, Clock } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import NexusCard from "../shared/NexusCard.svelte";

  type Props = {
    jobs: any[];
  };

  let { jobs = [] }: Props = $props();
</script>

<NexusCard
  title={$_('overview.cronJobs.title', { default: "Sequence Queue" })}
  subtitle="Automated Routines"
  icon={Clock}
  iconColorClass="text-orange-400"
  iconBgClass="bg-orange-500/10 border-orange-500/20"
  pattern="diagonal"
>
  {#snippet headerActions()}
    {#if jobs.length > 0}
      <a href="/cron" class="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all flex items-center gap-2 group/btn">
        <span class="font-bold uppercase tracking-wider">Manage</span>
        <ArrowRight class="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
      </a>
    {/if}
  {/snippet}
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
</NexusCard>