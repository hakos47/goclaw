<script lang="ts">
  import { Sparkles, BarChart2, GitCommit } from "lucide-svelte";
  import { useV3Flags } from "../../hooks/use-v3-flags.svelte";
  import { useEvolutionMetrics } from "../../hooks/use-evolution-metrics.svelte";
  import { useEvolutionSuggestions } from "../../hooks/use-evolution-suggestions.svelte";
  import EvolutionMetricsCharts from "./evolution-tab/EvolutionMetricsCharts.svelte";
  import EvolutionSuggestionsTable from "./evolution-tab/EvolutionSuggestionsTable.svelte";
  import EvolutionGuardrailsCard from "./evolution-tab/EvolutionGuardrailsCard.svelte";
  import type { AdaptationGuardrails } from "../../../../lib/types/evolution";

  type Props = {
    agentId: string;
    agentOtherConfig?: Record<string, unknown>;
  };

  let { agentId, agentOtherConfig }: Props = $props();

  const TIME_RANGES = ["7d", "30d", "90d"] as const;
  type TimeRange = typeof TIME_RANGES[number];

  let timeRange = $state<TimeRange>("7d");
  
  // Create reactive getters for the hooks
  const _timeRangeGetter = () => timeRange;
  
  let flagsState = $derived(useV3Flags(agentId));
  let metricsState = $derived(useEvolutionMetrics(agentId, _timeRangeGetter));
  let suggestionsState = $derived(useEvolutionSuggestions(agentId));

  const DEFAULT_GUARDRAILS: AdaptationGuardrails = {
    max_delta_per_cycle: 0.1,
    min_data_points: 100,
    rollback_on_drop_pct: 20,
    locked_params: [],
  };

  let guardrails = $derived({
    ...DEFAULT_GUARDRAILS,
    ...((agentOtherConfig?.evolution_guardrails ?? {}) as Partial<AdaptationGuardrails>),
  });
</script>

<div class="relative z-20 group p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-8 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(168,85,247,0.1),0_0_40px_rgba(168,85,247,0.2)] hover:border-purple-500/30 mt-6">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>

  <div class="relative z-10">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-white/10 pb-6 mb-6">
      <div class="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
        <Sparkles class="h-4 w-4 text-purple-400 animate-[pulse_3s_ease-in-out_infinite]" />
      </div>
      <div>
        <h2 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Evolution Metrics & Suggestions</h2>
        <p class="text-[10px] text-white/40 mt-1 max-w-[500px]">Review performance telemetry and apply data-driven structural modifications.</p>
      </div>
    </div>

    {#if !flagsState.loading && flagsState.flags && !flagsState.flags.self_evolution_metrics}
      <div class="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 bg-white/[0.01] rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        <Sparkles class="h-12 w-12 text-white/20 mb-4" />
        <h3 class="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Evolution Offline</h3>
        <p class="text-[10px] text-white/30 max-w-sm mt-2 leading-relaxed">
          Autonomous evolution and metrics gathering are currently disabled for this agent. Enable them in the Advanced Config to begin capturing suggestions.
        </p>
      </div>
    {:else}
      <!-- Time Range Selector -->
      <div class="flex items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
        <span class="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
          Aggregation Window
        </span>
        <div class="flex rounded-xl bg-white/[0.02] border border-white/10 p-1 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          {#each TIME_RANGES as r}
            <button
              onclick={() => timeRange = r}
              class={`px-6 py-2 text-[10px] uppercase tracking-widest font-black transition-all rounded-lg ${timeRange === r ? 'bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.3)] border-transparent' : 'text-white/40 hover:text-white/80 border border-transparent hover:bg-white/[0.05]'}`}
            >
              {r}
            </button>
          {/each}
        </div>
      </div>

      <!-- Charts -->
      <div class="mb-8">
        <EvolutionMetricsCharts 
          toolAggs={metricsState.toolAggs} 
          retrievalAggs={metricsState.retrievalAggs} 
          loading={metricsState.loading} 
        />
      </div>

      <!-- Suggestions Table -->
      <div class="mb-8 p-6 rounded-3xl bg-black/40 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        <h4 class="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
          <GitCommit class="h-4 w-4 text-cyan-500" /> Trajectory Suggestions
        </h4>
        <EvolutionSuggestionsTable 
          suggestions={suggestionsState.suggestions} 
          loading={suggestionsState.loading}
          onUpdateStatus={suggestionsState.updateStatus}
        />
      </div>

      <!-- Guardrails -->
      <div class="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
         <EvolutionGuardrailsCard guardrails={guardrails} />
      </div>
    {/if}
  </div>
</div>
