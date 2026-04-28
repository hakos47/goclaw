<script lang="ts">
  import { ShieldAlert } from "lucide-svelte";
  import type { AdaptationGuardrails } from "../../../../../lib/types/evolution";

  type Props = {
    guardrails: AdaptationGuardrails;
  };

  let { guardrails }: Props = $props();
</script>

<div class="glass-panel p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 shadow-sm mt-4 relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
  
  <div class="relative z-10 flex items-center gap-3">
    <div class="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
      <ShieldAlert class="h-4 w-4" />
    </div>
    <div>
      <h4 class="text-xs font-bold text-white uppercase tracking-widest">Adaptation Guardrails</h4>
      <p class="text-[10px] text-white/40">Safety parameters injected during evolutionary mutations.</p>
    </div>
  </div>

  <div class="relative z-10 grid grid-cols-3 gap-4 pt-2">
    <div class="space-y-1">
      <p class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Max Delta / Cycle</p>
      <div class="h-10 px-4 flex items-center rounded-xl bg-black/40 border border-white/5 text-emerald-400 font-mono text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {guardrails.max_delta_per_cycle}
      </div>
    </div>
    
    <div class="space-y-1">
      <p class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Min Data Points</p>
      <div class="h-10 px-4 flex items-center rounded-xl bg-black/40 border border-white/5 text-emerald-400 font-mono text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {guardrails.min_data_points}
      </div>
    </div>

    <div class="space-y-1">
      <p class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Rollback Drop</p>
      <div class="h-10 px-4 flex items-center rounded-xl bg-black/40 border border-white/5 text-emerald-400 font-mono text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {guardrails.rollback_on_drop_pct}%
      </div>
    </div>
  </div>

  {#if guardrails.locked_params && guardrails.locked_params.length > 0}
    <div class="relative z-10 space-y-2 pt-2 border-t border-white/5">
      <p class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Locked Parameters (Immutable)</p>
      <div class="flex flex-wrap gap-2 pl-1">
        {#each guardrails.locked_params as p}
          <span class="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono leading-none">
            {p}
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>
