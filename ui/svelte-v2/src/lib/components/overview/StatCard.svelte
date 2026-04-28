<script lang="ts">
  import type { ComponentType } from "svelte";
  import type { Icon } from "lucide-svelte";
  import { TrendingUp, TrendingDown } from "lucide-svelte";
  import Sparkline from "../shared/Sparkline.svelte";

  type Props = {
    icon: ComponentType<Icon>;
    label: string;
    value: string | number;
    sub?: string;
    sparkline?: number[];
    trend?: number | null;
  };

  let { icon: IconIcon, label, value, sub, sparkline, trend }: Props = $props();

  let hasTrend = $derived(trend != null && trend !== 0);
  let isPositive = $derived(trend && trend > 0);
</script>

<div class="relative p-6 group transition-all duration-700 hover:-translate-y-1.5 isolate overflow-hidden bg-[#030014]/60 backdrop-blur-2xl border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl h-full flex flex-col justify-between min-h-[160px]">
  
  <!-- Cybernetic Corner Accents -->
  <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/20 rounded-tl-xl opacity-50 group-hover:border-goclaw-neon-purple group-hover:opacity-100 transition-colors duration-500"></div>
  <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-xl opacity-50 group-hover:border-goclaw-neon-purple group-hover:opacity-100 transition-colors duration-500"></div>
  <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-xl opacity-50 group-hover:border-goclaw-neon-purple group-hover:opacity-100 transition-colors duration-500"></div>
  <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-xl opacity-50 group-hover:border-goclaw-neon-purple group-hover:opacity-100 transition-colors duration-500"></div>

  <!-- Ambient Glow & Scanline Background -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
  <div class="absolute -right-8 -top-8 w-32 h-32 bg-goclaw-neon-purple/20 rounded-full blur-[40px] group-hover:bg-goclaw-neon-purple/40 group-hover:scale-150 transition-all duration-1000 ease-out"></div>
  <div class="absolute -left-8 -bottom-8 w-32 h-32 bg-goclaw-neon-cyan/10 rounded-full blur-[40px] group-hover:bg-goclaw-neon-cyan/30 group-hover:scale-150 transition-all duration-1000 ease-out"></div>

  <div class="relative z-10 flex flex-col h-full justify-between">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="relative flex items-center justify-center w-10 h-10 rounded-xl bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:border-goclaw-neon-purple/50 transition-colors duration-500">
          <IconIcon class="h-4 w-4 text-white/70 group-hover:text-goclaw-neon-purple transition-colors duration-500" />
          <div class="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
        </div>
        <div class="flex flex-col">
          <span class="text-[9px] font-mono text-goclaw-neon-cyan/70 uppercase tracking-[0.3em]">Telemetry</span>
          <p class="text-xs font-bold text-white/60 tracking-wider group-hover:text-white transition-colors duration-300">{label}</p>
        </div>
      </div>
      
      {#if hasTrend}
        <div class={`flex flex-col items-end`}>
          <span class={`flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-inner ${isPositive ? "bg-goclaw-neon-cyan/10 text-goclaw-neon-cyan border-goclaw-neon-cyan/30" : "bg-goclaw-neon-magenta/10 text-goclaw-neon-magenta border-goclaw-neon-magenta/30"}`}>
            {#if isPositive}
              <TrendingUp class="h-3 w-3" />+{trend}%
            {:else}
              <TrendingDown class="h-3 w-3" />{trend}%
            {/if}
          </span>
        </div>
      {/if}
    </div>

    <div class="relative z-10 mt-auto">
      <h2 class="text-4xl font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        {value}
      </h2>
      {#if sub}
        <div class="flex items-center gap-2 mt-1">
          <div class="w-1 h-1 rounded-full bg-white/40"></div>
          <p class="text-[10px] text-white/40 font-mono tracking-widest uppercase truncate">{sub}</p>
        </div>
      {/if}
    </div>
  </div>

  {#if sparkline && sparkline.length > 1}
    <div class="absolute bottom-0 left-0 right-0 h-20 opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
      <Sparkline 
        data={sparkline} 
        color={isPositive ? "#06b6d4" : "#d946ef"} 
      />
      <div class="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#030014]/80 via-[#030014]/20 to-transparent"></div>
    </div>
  {/if}
</div>