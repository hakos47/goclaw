<script lang="ts">
  import { Database, Users } from "lucide-svelte";
  import { _ } from "svelte-i18n";

  type Props = {
    quota: any;
  };

  let { quota }: Props = $props();

  let entries = $derived(quota?.entries || []);
  let enabled = $derived(quota?.enabled || false);

  function getPct(used: number, limit: number) {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  }

  function getColor(pct: number) {
    if (pct > 85) return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
    if (pct > 60) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
  }
</script>

{#snippet quotaCell(usage)}
  <div class="space-y-1">
    <span class="text-sm tabular-nums text-white/80 font-mono">
      {#if usage.limit === 0}
        {usage.used}
      {:else}
        {usage.used} <span class="text-white/30">/ {usage.limit}</span>
      {/if}
    </span>
    {#if usage.limit === 0}
      <span class="text-xs text-white/30 block">{$_('overview.quotaUsage.noLimit', { default: "No limit" })}</span>
    {:else}
      <div class="h-1.5 w-full rounded-full bg-white/5 border border-white/5 overflow-hidden">
        <div
          class={`h-full rounded-full transition-all duration-1000 ease-out ${getColor(getPct(usage.used, usage.limit))}`}
          style={`width: ${getPct(usage.used, usage.limit)}%`}
        ></div>
      </div>
    {/if}
  </div>
{/snippet}

<div class="relative overflow-hidden bg-[#030014]/40 backdrop-blur-3xl border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl group flex flex-col h-full">
  
  <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none opacity-20"></div>

  <div class="relative z-10 flex items-center justify-between p-5 md:p-6 border-b border-white/5">
    <div class="flex items-center gap-3">
      <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <Database class="h-5 w-5 text-emerald-400" />
      </div>
      <div>
        <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-white">{$_('overview.quotaUsage.title', { default: "Consumption Cores" })}</h3>
        <p class="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">Quota Utilization</p>
      </div>
    </div>
    <div class={`px-3 py-1 bg-black/50 border rounded-lg shadow-inner flex items-center gap-2 ${enabled ? 'border-emerald-500/30' : 'border-white/10'}`}>
      <div class={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-white/30'}`}></div>
      <span class={`text-[10px] font-bold uppercase tracking-wider ${enabled ? 'text-emerald-400' : 'text-white/40'}`}>
        {enabled ? $_('common.enabled', { default: "Online" }) : $_('common.disabled', { default: "Offline" })}
      </span>
    </div>
  </div>

  <div class="relative z-10 flex-1 p-5 md:p-6 overflow-x-auto">
    <div class="flex flex-col gap-4 min-w-[600px]">
      
      <!-- Headers -->
      <div class="grid grid-cols-12 gap-6 px-2 text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
        <div class="col-span-3">User / Identity</div>
        <div class="col-span-3">1 Hour Delta</div>
        <div class="col-span-3">24 Hour Cycle</div>
        <div class="col-span-3">7 Day Accumulation</div>
      </div>

      <!-- User Cores -->
      {#each entries as entry}
        <div class="grid grid-cols-12 gap-6 items-center p-4 rounded-xl bg-black/40 border border-white/5 hover:bg-white/[0.02] hover:border-white/10 transition-colors">
          
          <div class="col-span-3 flex items-center gap-3">
            <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 shadow-inner">
              <Users class="w-4 h-4 text-white/40" />
            </div>
            <span class="text-xs font-mono font-bold text-white tracking-wide truncate">
              {entry.userId === "system" ? "SYSTEM" : entry.userId}
            </span>
          </div>

          <div class="col-span-3">{@render quotaCell(entry.hour)}</div>
          <div class="col-span-3">{@render quotaCell(entry.day)}</div>
          <div class="col-span-3">{@render quotaCell(entry.week)}</div>

        </div>
      {/each}
      
    </div>
  </div>
</div>