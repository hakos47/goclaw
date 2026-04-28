<script lang="ts">
  import { BrainCircuit, Clock, Type, Settings } from "lucide-svelte";
  import type { TtsConfig } from "../hooks/use-tts.svelte";

  let {
    draft,
    onUpdate
  }: {
    draft: TtsConfig;
    onUpdate: (patch: Partial<TtsConfig>) => void;
  } = $props();

</script>

<div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden group">
  <div class="flex items-center gap-2 mb-6 relative z-10">
    <BrainCircuit class="w-4 h-4 text-emerald-400" />
    <h3 class="text-sm font-bold text-white/90">Agent Behavior & Limits</h3>
  </div>

  <div class="grid sm:grid-cols-2 gap-6 relative z-10">
    <!-- Auto TTS -->
    <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
      <div>
         <h4 class="text-xs font-bold text-white flex items-center gap-2">
           <Settings class="w-3.5 h-3.5 text-white/40" />
           Automatic TTS
         </h4>
         <p class="text-[10px] text-white/40 mt-2 leading-relaxed uppercase tracking-widest">
           Control when agents automatically synthesize audio for their responses.
         </p>
      </div>
      <select 
        value={draft.auto || "off"} 
        onchange={(e) => onUpdate({ auto: e.currentTarget.value })}
        class="w-full mt-4 bg-[#030014] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-emerald-500 transition-all outline-none"
      >
        <option value="off">Disabled (Manual only)</option>
        <option value="on">Always Auto-Play</option>
        <option value="mobile_only">Mobile Only</option>
      </select>
    </div>

    <!-- Reply Mode -->
    <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
      <div>
         <h4 class="text-xs font-bold text-white flex items-center gap-2">
           <BrainCircuit class="w-3.5 h-3.5 text-white/40" />
           Response Mode
         </h4>
         <p class="text-[10px] text-white/40 mt-2 leading-relaxed uppercase tracking-widest">
           Stream chunks instantly or wait for the full response before playing.
         </p>
      </div>
      <select 
        value={draft.mode || "final"} 
        onchange={(e) => onUpdate({ mode: e.currentTarget.value })}
        class="w-full mt-4 bg-[#030014] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-emerald-500 transition-all outline-none"
      >
        <option value="final">Final Response Only (Stable)</option>
        <option value="streaming">Streaming Sentences (Low latency)</option>
      </select>
    </div>

    <!-- Max Length -->
    <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
      <h4 class="text-xs font-bold text-white flex items-center gap-2 mb-2">
        <Type class="w-3.5 h-3.5 text-white/40" />
        Max Length
      </h4>
      <div class="flex items-center gap-4">
        <input 
          type="range" 
          min="100" max="5000" step="100" 
          value={draft.max_length}
          oninput={(e) => onUpdate({ max_length: Number(e.currentTarget.value) })}
          class="flex-1 accent-emerald-500 cursor-pointer"
        />
        <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">{draft.max_length}</span>
      </div>
      <p class="text-[9px] text-white/30 uppercase tracking-widest mt-3">Truncate agent messages longer than this.</p>
    </div>

    <!-- Timeout -->
    <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
      <h4 class="text-xs font-bold text-white flex items-center gap-2 mb-2">
        <Clock class="w-3.5 h-3.5 text-white/40" />
        Timeout
      </h4>
      <div class="flex items-center gap-4">
        <input 
          type="range" 
          min="5000" max="120000" step="5000" 
          value={draft.timeout_ms}
          oninput={(e) => onUpdate({ timeout_ms: Number(e.currentTarget.value) })}
          class="flex-1 accent-emerald-500 cursor-pointer"
        />
        <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">{draft.timeout_ms / 1000}s</span>
      </div>
      <p class="text-[9px] text-white/30 uppercase tracking-widest mt-3">Maximum wait time for API response.</p>
    </div>
  </div>
</div>
