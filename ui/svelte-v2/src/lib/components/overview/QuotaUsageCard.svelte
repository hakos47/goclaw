<script lang="ts">
  import { Database, Users } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import NexusCard from "../shared/NexusCard.svelte";

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

<NexusCard
  title={$_('overview.quotaUsage.title', { default: "Consumption Cores" })}
  subtitle="Quota Utilization"
  icon={Database}
  iconColorClass="text-emerald-400"
  iconBgClass="bg-emerald-500/10 border-emerald-500/20"
>
  {#snippet headerActions()}
    <div class={`px-3 py-1 bg-black/50 border rounded-lg shadow-inner flex items-center gap-2 ${enabled ? 'border-emerald-500/30' : 'border-white/10'}`}>
      <div class={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-white/30'}`}></div>
      <span class={`text-[10px] font-bold uppercase tracking-wider ${enabled ? 'text-emerald-400' : 'text-white/40'}`}>
        {enabled ? $_('common.enabled', { default: "Online" }) : $_('common.disabled', { default: "Offline" })}
      </span>
    </div>
  {/snippet}

  <div class="overflow-x-auto">
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
</NexusCard>