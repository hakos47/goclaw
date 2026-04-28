<script lang="ts">
  import { Cpu, DollarSign } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import ProviderModelSelect from "../../../../../lib/components/shared/ProviderModelSelect.svelte";
  import { loadProviders, providersState } from "../../../../../lib/state/providers.svelte";

  type Props = {
    provider: string;
    model: string;
    contextWindow: number;
    maxToolIterations: number;
    budgetDollars: string;
    onProviderChange: (v: string) => void;
    onModelChange: (v: string) => void;
    onContextWindowChange: (v: number) => void;
    onMaxToolIterationsChange: (v: number) => void;
    onBudgetDollarsChange: (v: string) => void;
  };

  let {
    provider, model, contextWindow, maxToolIterations, budgetDollars,
    onProviderChange, onModelChange, onContextWindowChange,
    onMaxToolIterationsChange, onBudgetDollarsChange
  }: Props = $props();

  $effect(() => {
    if (providersState.providers.length === 0 && !providersState.loading) {
      loadProviders();
    }
  });
</script>

<div class="relative z-30 group p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(168,85,247,0.1),0_0_40px_rgba(168,85,247,0.2)] hover:border-purple-500/30 mt-6">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>

  <div class="relative z-10 flex items-center gap-3 mb-8">
    <div class="h-8 w-8 rounded-xl bg-goclaw-neon-cyan/10 border border-goclaw-neon-cyan/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
      <Cpu class="h-4 w-4 text-goclaw-neon-cyan animate-pulse" />
    </div>
    <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Engine & Resource Budget</h3>
  </div>

  <div class="relative z-50">
    <ProviderModelSelect
      provider={provider}
      model={model}
      onProviderChange={onProviderChange}
      onModelChange={onModelChange}
      allowEmpty={false}
      label="Inference Provider"
    />
  </div>

  <div class="grid grid-cols-1 gap-6 sm:grid-cols-3 pt-4 relative z-10">
    <!-- Context Window -->
    <div class="space-y-1.5 group/input relative">
      <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Context Window</label>
      <div class="relative">
        <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-goclaw-neon-cyan/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(6,182,212,0.3),0_0_15px_rgba(6,182,212,0.2)]"></div>
        <input
          type="number"
          value={contextWindow}
          oninput={(e) => onContextWindowChange(Number(e.currentTarget.value) || 0)}
          placeholder="200000"
          class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-white/90 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
        />
      </div>
      <p class="text-[10px] text-white/30 px-1 pt-1 leading-tight mt-1">Max tokens retained simultaneously.</p>
    </div>

    <!-- Iterations -->
    <div class="space-y-1.5 group/input relative">
      <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Tool Iterations</label>
      <div class="relative">
        <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-goclaw-neon-cyan/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(6,182,212,0.3),0_0_15px_rgba(6,182,212,0.2)]"></div>
        <input
          type="number"
          value={maxToolIterations}
          oninput={(e) => onMaxToolIterationsChange(Number(e.currentTarget.value) || 0)}
          placeholder="20"
          class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-white/90 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
        />
      </div>
      <p class="text-[10px] text-white/30 px-1 pt-1 leading-tight mt-1">Limit chained autonomous executions.</p>
    </div>

    <!-- Budget -->
    <div class="space-y-1.5 group/input relative">
      <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 flex items-center gap-1">
         Monthly Budget Cap
      </label>
      <div class="flex items-center gap-2">
        <div class="h-11 w-11 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shadow-[inset_0_2px_15px_rgba(16,185,129,0.2)]">
           <DollarSign class="h-5 w-5" />
        </div>
        <div class="flex-1 relative">
           <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-emerald-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(16,185,129,0.3),0_0_15px_rgba(16,185,129,0.2)]"></div>
           <input
             type="number"
             min="0"
             step="0.01"
             placeholder="0.00 (Unlimited)"
             value={budgetDollars}
             oninput={(e) => onBudgetDollarsChange(e.currentTarget.value)}
             class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-emerald-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
           />
        </div>
      </div>
      <p class="text-[10px] text-white/30 px-1 pt-1 leading-tight mt-1">Zero implies unlimited usage cap.</p>
    </div>
  </div>
</div>
