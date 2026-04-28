<script lang="ts">
  import { Sparkles } from "lucide-svelte";

  import type { V3Flags } from "../../../hooks/use-v3-flags.svelte";

  type Props = {
    selfEvolve: boolean;
    skillEvolve: boolean;
    skillNudgeInterval: number;
    flags: V3Flags | null;
    onSelfEvolveChange: (v: boolean) => void;
    onSkillEvolveChange: (v: boolean) => void;
    onSkillNudgeIntervalChange: (v: number) => void;
    onToggleFlag: (key: keyof V3Flags, value: boolean) => void;
  };

  let {
    selfEvolve, skillEvolve, skillNudgeInterval, flags,
    onSelfEvolveChange, onSkillEvolveChange, onSkillNudgeIntervalChange,
    onToggleFlag
  }: Props = $props();

  function undefIfNaN(val: number): number | undefined {
    return isNaN(val) ? undefined : val;
  }
</script>

<div class="relative z-20 group p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(168,85,247,0.1),0_0_40px_rgba(168,85,247,0.2)] hover:border-purple-500/30 mt-6">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>
  
  <div class="relative z-10 flex items-center justify-between border-b border-white/10 pb-6 mb-6">
    <div>
      <h3 class="text-xs font-bold text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
        <Sparkles class="h-4 w-4 text-purple-400" /> Autonomous Self-Evolution
      </h3>
      <p class="text-[10px] text-white/40 mt-1">Configure mutation and learning rates for predefined agents.</p>
    </div>
    
    <button 
       onclick={() => onSelfEvolveChange(!selfEvolve)}
       class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black ${selfEvolve ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
     >
       <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selfEvolve ? 'translate-x-6' : 'translate-x-1'}`}></span>
     </button>
  </div>

  <div class={`relative z-10 transition-all duration-300 ${!selfEvolve ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Skill Evolution -->
      <div class="flex items-center justify-between bg-white/[0.05] hover:bg-white/[0.08] transition-colors border border-white/10 p-4 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        <div>
          <h4 class="text-[10px] font-bold text-white uppercase tracking-widest">Skill Evolution</h4>
          <p class="text-[9px] text-white/40">Learn and write new tool functions</p>
        </div>
        <button 
           onclick={() => onSkillEvolveChange(!skillEvolve)}
           class={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${skillEvolve ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
         >
           <span class={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${skillEvolve ? 'translate-x-5' : 'translate-x-1'}`}></span>
         </button>
      </div>

      <!-- Skill Nudge Interval -->
      <div class="space-y-1.5 flex flex-col justify-end group/input relative">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Skill Nudge Interval (Minutes)</label>
        <div class="relative">
          <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(168,85,247,0.3),0_0_15px_rgba(168,85,247,0.2)]"></div>
          <input
            type="number"
            value={skillNudgeInterval}
            oninput={(e) => onSkillNudgeIntervalChange(Number(e.currentTarget.value) || 15)}
            placeholder="15"
            class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-purple-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
          />
        </div>
      </div>
    </div>
    
    <!-- V3 Evolution Flags -->
    {#if flags}
      <div class="pt-6 mt-6 border-t border-white/5 space-y-4">
        <!-- Metrics -->
        <div class="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-colors hover:bg-white/[0.05]">
          <div class="flex items-start gap-3">
            <div class="mt-0.5"><Sparkles class="h-4 w-4 text-cyan-400" /></div>
            <div>
              <h4 class="text-[10px] font-bold text-white uppercase tracking-widest leading-tight">Evolution Metrics</h4>
              <p class="text-[9px] text-white/40 mt-0.5 max-w-[280px]">Record tool effectiveness, retrieval quality, and response feedback</p>
            </div>
          </div>
          <button 
             onclick={() => onToggleFlag('self_evolution_metrics', !flags.self_evolution_metrics)}
             class={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${flags.self_evolution_metrics ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
           >
             <span class={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${flags.self_evolution_metrics ? 'translate-x-5' : 'translate-x-1'}`}></span>
           </button>
        </div>

        <!-- Suggestions -->
        <div class="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-colors hover:bg-white/[0.05]">
          <div class="flex items-start gap-3">
            <div class="mt-0.5"><Sparkles class="h-4 w-4 text-yellow-400" /></div>
            <div>
              <h4 class="text-[10px] font-bold text-white uppercase tracking-widest leading-tight">Evolution Suggestions</h4>
              <p class="text-[9px] text-white/40 mt-0.5 max-w-[280px]">Generate data-driven improvement suggestions from recorded metrics</p>
            </div>
          </div>
          <button 
             onclick={() => onToggleFlag('self_evolution_suggestions', !flags.self_evolution_suggestions)}
             class={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${flags.self_evolution_suggestions ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
           >
             <span class={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${flags.self_evolution_suggestions ? 'translate-x-5' : 'translate-x-1'}`}></span>
           </button>
        </div>
      </div>
    {/if}
  </div>
</div>
