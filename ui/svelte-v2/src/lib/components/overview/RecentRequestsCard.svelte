<script lang="ts">
  import { ArrowRight } from "lucide-svelte";
  import { Activity, Terminal } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { formatDate } from "$lib/format";
  import NexusCard from "../shared/NexusCard.svelte";

  type Props = {
    traces: any[];
  };

  let { traces = [] }: Props = $props();

  function getStatusColor(status: string) {
    if (status === "completed") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_5px_rgba(16,185,129,0.3)]";
    if (status === "error") return "bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_5px_rgba(239,68,68,0.3)]";
    if (status === "running") return "bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-[0_0_5px_rgba(14,165,233,0.3)]";
    return "border-white/10 text-white/50";
  }
</script>

<NexusCard
  title={$_('overview.recentRequests.title', { default: "Intercept Matrix" })}
  subtitle="Live Trace Logs"
  icon={Activity}
  iconColorClass="text-purple-400"
  iconBgClass="bg-purple-500/10 border-purple-500/20"
>
  {#snippet headerActions()}
    {#if traces.length > 0}
      <a href="/traces" class="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all flex items-center gap-2 group/btn">
        <span class="font-bold uppercase tracking-wider">View Log</span>
        <ArrowRight class="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
      </a>
    {/if}
  {/snippet}

  <div class="overflow-x-auto">
    {#if traces.length === 0}
      <div class="flex flex-col items-center justify-center h-full py-8 opacity-50">
        <Terminal class="h-8 w-8 text-white/20 mb-3" />
        <span class="text-xs font-mono uppercase tracking-widest text-white/40">{$_('overview.recentRequests.noRequests', { default: "No intercepts detected" })}</span>
      </div>
    {:else}
      <div class="flex flex-col gap-2 min-w-[700px]">
        <!-- Tactical Header Row -->
        <div class="grid grid-cols-12 gap-4 px-4 py-2 border-b border-white/5 text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
          <div class="col-span-1">Time</div>
          <div class="col-span-3">Signal Name</div>
          <div class="col-span-2">Source User</div>
          <div class="col-span-2">Channel</div>
          <div class="col-span-2 text-right">Payload (Tokens)</div>
          <div class="col-span-1 text-right">Lat</div>
          <div class="col-span-1 text-right">Status</div>
        </div>

        <!-- Log Rows -->
        {#each traces as t}
          {@const isError = t.status === "error"}
          <div class={`grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-lg border transition-all hover:-translate-y-0.5 ${isError ? 'bg-red-500/5 border-red-500/20 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/15'}`}>
            
            <div class="col-span-1 text-[10px] font-mono text-white/40">
              {formatDate(t.created_at, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            
            <div class="col-span-3 flex items-center gap-2 truncate">
              <div class={`w-1 h-3 rounded-full ${isError ? 'bg-red-500' : 'bg-goclaw-neon-purple shadow-[0_0_5px_rgba(217,70,239,0.5)]'}`}></div>
              <span class="text-[11px] font-bold text-white/90 truncate">{t.name || "UNKNOWN_REQ"}</span>
            </div>
            
            <div class="col-span-2 text-[10px] font-mono text-white/50 truncate">
              {t.user_id ? (t.user_id === 'system' ? 'SYSTEM' : t.user_id) : "ANON"}
            </div>
            
            <div class="col-span-2">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-bold uppercase tracking-wider text-white/60 truncate max-w-full">
                {t.channel || "direct"}
              </span>
            </div>
            
            <div class="col-span-2 text-right text-[11px] font-mono font-bold text-goclaw-neon-cyan">
              {((t.total_input_tokens + t.total_output_tokens) / 1000).toFixed(1)}K
            </div>
            
            <div class="col-span-1 text-right text-[10px] font-mono text-white/40">
              {t.duration_ms ? `${(t.duration_ms / 1000).toFixed(2)}s` : "--"}
            </div>
            
            <div class="col-span-1 flex justify-end">
              <div class={`w-2 h-2 rounded-full ${isError ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : t.status === 'running' ? 'bg-sky-400 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} title={t.status}></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</NexusCard>