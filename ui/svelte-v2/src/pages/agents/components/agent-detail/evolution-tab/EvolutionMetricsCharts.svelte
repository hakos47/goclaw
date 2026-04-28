<script lang="ts">
  import { _ } from "svelte-i18n";
  import type { ToolAggregate, RetrievalAggregate } from "../../../../../lib/types/evolution";

  type Props = {
    toolAggs: ToolAggregate[];
    retrievalAggs: RetrievalAggregate[];
    loading: boolean;
  };

  let { toolAggs, retrievalAggs, loading }: Props = $props();

  let toolData = $derived(toolAggs.map(a => ({ ...a, success_rate: a.success_rate * 100 })));
  let retrievalData = $derived(retrievalAggs.map(a => ({ ...a, usage_rate: a.usage_rate * 100 })));
</script>

{#if loading}
  <div class="h-48 w-full bg-white/5 animate-pulse rounded-2xl border border-white/10"></div>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
    <!-- Tool Success Chart -->
    <div class="bg-black/40 border border-white/10 p-5 rounded-2xl shadow-sm">
      <h4 class="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Tool Success Rate
      </h4>
      {#if toolData.length === 0}
        <div class="h-32 flex items-center justify-center text-xs text-white/30 font-bold uppercase tracking-widest">
          No metrics available
        </div>
      {:else}
        <div class="h-40 flex items-end gap-3 w-full border-b border-white/10 pb-0 overflow-x-auto relative">
          <!-- Baseline markers -->
          <div class="absolute inset-x-0 bottom-[50%] border-t border-white/5 border-dashed pointer-events-none"></div>
          
          {#each toolData as item}
            <div class="flex flex-col items-center gap-2 group relative w-12 flex-shrink-0">
              <!-- Tooltip -->
              <div class="absolute bottom-full mb-2 bg-black text-white text-[10px] px-2 py-1 rounded border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                {item.call_count} calls ~ {item.avg_duration_ms.toFixed(0)}ms
              </div>
              
              <!-- Bar -->
              <div class="w-6 bg-emerald-500/80 hover:bg-emerald-400 border-x border-t border-emerald-400 rounded-t transition-all" style="height: {item.success_rate}%"></div>
              
              <!-- Label -->
              <div class="text-[9px] text-white/40 font-mono truncate w-14 text-center mt-2 group-hover:text-emerald-400 transition-colors" title={item.tool_name}>
                {item.tool_name.split('_').join('\n')}
              </div>
              <div class="text-[10px] font-bold text-emerald-500 mb-[-12px]">
                {item.success_rate.toFixed(0)}%
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Retrieval Quality Chart -->
    <div class="bg-black/40 border border-white/10 p-5 rounded-2xl shadow-sm">
      <h4 class="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-blue-500"></span> Retrieval Usage Rate
      </h4>
      {#if retrievalData.length === 0}
        <div class="h-32 flex items-center justify-center text-xs text-white/30 font-bold uppercase tracking-widest">
          No metrics available
        </div>
      {:else}
        <div class="h-40 flex items-end gap-3 w-full border-b border-white/10 pb-0 overflow-x-auto relative">
          <!-- Baseline markers -->
          <div class="absolute inset-x-0 bottom-[50%] border-t border-white/5 border-dashed pointer-events-none"></div>

          {#each retrievalData as item}
            <div class="flex flex-col items-center gap-2 group relative w-12 flex-shrink-0">
              <!-- Tooltip -->
              <div class="absolute bottom-full mb-2 bg-black text-white text-[10px] px-2 py-1 rounded border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                {item.query_count} queries ~ Score: {item.avg_score.toFixed(2)}
              </div>
              
              <!-- Bar -->
              <div class="w-6 bg-blue-500/80 hover:bg-blue-400 border-x border-t border-blue-400 rounded-t transition-all" style="height: {item.usage_rate}%"></div>
              
              <!-- Label -->
              <div class="text-[9px] text-white/40 font-mono truncate w-14 text-center mt-2 group-hover:text-blue-400 transition-colors" title={item.source}>
                {item.source}
              </div>
              <div class="text-[10px] font-bold text-blue-500 mb-[-12px]">
                {item.usage_rate.toFixed(0)}%
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
