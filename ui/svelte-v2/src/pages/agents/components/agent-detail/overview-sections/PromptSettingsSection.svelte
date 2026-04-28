<script lang="ts">
  import { Layers } from "lucide-svelte";
  import PromptModeCards from "../../PromptModeCards.svelte";
  import type { PromptMode } from "../../PromptModeCards.svelte";
  import ProviderModelSelect from "../../../../../lib/components/shared/ProviderModelSelect.svelte";
  
  type Props = {
    promptMode: PromptMode;
    ttsProvider: string;
    ttsVoiceId: string;
    ttsModelId: string;
    hasTtsOverride: boolean;
    onPromptModeChange: (mode: PromptMode) => void;
    onTtsProviderChange: (v: string) => void;
    onTtsVoiceIdChange: (v: string) => void;
    onTtsModelIdChange: (v: string) => void;
    onHasTtsOverrideChange: (v: boolean) => void;
  };
  
  let { 
    promptMode,
    ttsProvider,
    ttsVoiceId, 
    ttsModelId, 
    hasTtsOverride,
    onPromptModeChange,
    onTtsProviderChange,
    onTtsVoiceIdChange,
    onTtsModelIdChange,
    onHasTtsOverrideChange
  }: Props = $props();
</script>

<div class="relative z-50 group p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(168,85,247,0.1),0_0_40px_rgba(168,85,247,0.2)] hover:border-purple-500/30">
  
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>
  
  <div class="relative z-10 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded-xl bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.2)]">
         <Layers class="h-4 w-4 text-goclaw-neon-purple animate-pulse" />
      </div>
      <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Context Architecture</h3>
    </div>
    {#if promptMode === "full"}
      <span class="px-3 py-1.5 rounded-xl text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3),inset_0_0_10px_rgba(239,68,68,0.2)] tracking-[0.2em] relative overflow-hidden flex items-center gap-2">
        <div class="h-1.5 w-1.5 rounded-full bg-red-500 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <span class="relative z-10 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">HEAVY LOAD</span>
        <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div>
      </span>
    {/if}
  </div>
  <div class="relative z-10">
    <PromptModeCards value={promptMode} onChange={onPromptModeChange} compact={true} />
  </div>

  <!-- TTS Config Block -->
  <div class="mt-8 relative z-10">
    <div class="flex items-center justify-between p-5 rounded-3xl bg-[#030014]/60 backdrop-blur-md border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] mb-4 group/tts hover:border-purple-500/30 transition-all duration-300">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <div class="h-6 w-6 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.2)]">
             <span class="text-[10px] font-black text-purple-400">T</span>
          </div>
          <h3 class="text-[11px] font-black text-white/80 uppercase tracking-[0.2em] group-hover/tts:text-white transition-colors">Voice Synthesis (TTS)</h3>
        </div>
        <p class="text-[10px] text-white/40 pl-8">Override voice settings exclusively for this agent.</p>
      </div>
      <button 
         onclick={() => onHasTtsOverrideChange(!hasTtsOverride)}
         class={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black ${hasTtsOverride ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]' : 'bg-[#030014] border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] hover:border-white/20'}`}
       >
         <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-md ${hasTtsOverride ? 'translate-x-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'translate-x-1'}`}></span>
       </button>
    </div>

    {#if hasTtsOverride}
      <div class="space-y-6 animate-in fade-in slide-in-from-top-1 border border-white/10 rounded-3xl p-6 bg-[#030014]/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        <div class="relative z-50">
          <ProviderModelSelect
            provider={ttsProvider}
            model={ttsModelId}
            onProviderChange={onTtsProviderChange}
            onModelChange={onTtsModelIdChange}
            allowEmpty={false}
            label="TTS Provider"
            filterTts={true}
          />
        </div>
        
        <!-- Voice ID -->
        <div class="space-y-1.5 relative group/input z-10">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Target Voice ID</label>
          <div class="absolute inset-x-0 bottom-[18px] top-[22px] border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(168,85,247,0.3),0_0_15px_rgba(168,85,247,0.2)]"></div>
          <input
            type="text"
            value={ttsVoiceId}
            oninput={(e) => onTtsVoiceIdChange(e.currentTarget.value)}
            placeholder="e.g. onyx, alloy, aria"
            class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white/90 placeholder-white/30 font-bold text-sm focus:outline-none focus:bg-white/[0.05] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10 transition-all"
          />
          <p class="text-[10px] text-white/30 px-1 pt-1">Specifies the exact voice identity for this provider endpoint.</p>
        </div>
      </div>
    {/if}
  </div>
</div>
