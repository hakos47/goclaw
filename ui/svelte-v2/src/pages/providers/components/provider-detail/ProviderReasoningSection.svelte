<script lang="ts">
  import { Brain, ChevronDown, Wand2, Info } from "lucide-svelte";
  import type { ModelItem } from "../../../../../../web/src/types/models";
  import type { ReasoningCapability } from "../../../../../../web/src/types/provider";

  const ADVANCED_REASONING_LEVELS = ["off", "low", "medium", "high"];
  const REASONING_FALLBACKS = ["downgrade", "error", "drop"];

  type Props = {
    reasoningThinkingLevel: string;
    reasoningEffort: string;
    reasoningFallback: string;
    reasoningExpert: boolean;
    reasoningPreviewModel: string;
    reasoningCapableModels: ModelItem[];
    reasoningPreviewEntry: ModelItem | null;
    reasoningPreviewCapability: ReasoningCapability | null;
    onReasoningThinkingLevelChange: (v: string) => void;
    onReasoningEffortChange: (v: string) => void;
    onReasoningFallbackChange: (v: string) => void;
    onReasoningExpertChange: (v: boolean) => void;
    onReasoningPreviewModelChange: (v: string) => void;
  };

  let {
    reasoningThinkingLevel,
    reasoningEffort,
    reasoningFallback,
    reasoningExpert,
    reasoningPreviewModel,
    reasoningCapableModels,
    reasoningPreviewEntry,
    reasoningPreviewCapability,
    onReasoningThinkingLevelChange,
    onReasoningEffortChange,
    onReasoningFallbackChange,
    onReasoningExpertChange,
    onReasoningPreviewModelChange
  }: Props = $props();

  function deriveLegacyThinkingLevel(effort: string) {
    if (effort === "off" || effort === "low" || effort === "medium" || effort === "high") return effort;
    return "high";
  }

  function handleExpertToggle() {
    const newValue = !reasoningExpert;
    onReasoningExpertChange(newValue);
    if (!newValue) {
      const legacy = deriveLegacyThinkingLevel(reasoningEffort);
      onReasoningThinkingLevelChange(legacy);
      onReasoningFallbackChange("downgrade");
    } else if (reasoningEffort === "off" && reasoningThinkingLevel !== "off") {
      onReasoningEffortChange(reasoningThinkingLevel);
    }
  }

  function formatLevelDesc(level: string) {
    switch(level) {
      case "off": return "Standard completion";
      case "low": return "Minimal reasoning tokens";
      case "medium": return "Balanced speed and depth";
      case "high": return "Maximum reasoning capacity";
      case "downgrade": return "Drop to standard completion if unsupported";
      case "error": return "Fail immediately if unsupported";
      case "drop": return "Drop to medium/low if high is unsupported";
      default: return "";
    }
  }

</script>

<section class="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] relative overflow-hidden">
  <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
  
  <h3 class="text-xs font-black uppercase tracking-widest text-white/80 mb-6 flex items-center gap-2">
    <Brain class="h-4 w-4 text-blue-400" /> Reasoning Defaults
  </h3>

  <div class="space-y-6">
    <div class="space-y-3 relative group/select">
      <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Reasoning Preset</label>
      <div class="relative">
        <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-blue-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]"></div>
        <select 
          value={reasoningThinkingLevel}
          onchange={(e) => {
             const val = e.currentTarget.value;
             onReasoningThinkingLevelChange(val);
             onReasoningEffortChange(val);
          }}
          class="w-full h-11 px-4 pr-10 bg-[#0a0a0a] border border-white/5 rounded-xl text-blue-400 font-bold text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer focus:bg-black/60 focus:text-white"
        >
          {#each ["off", "low", "medium", "high"] as level}
            <option value={level} class="bg-black text-white">{level.toUpperCase()} - {formatLevelDesc(level)}</option>
          {/each}
        </select>
        <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none z-20">
          <ChevronDown class="h-4 w-4 text-white/30" />
        </div>
      </div>
    </div>

    <!-- Expert Mode Panel -->
    <div class="rounded-2xl border border-white/10 bg-black/60 p-5 space-y-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h4 class="text-[10px] font-black uppercase tracking-widest text-white/80">Expert Mode</h4>
          <p class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Override specific effort tags and fallback behaviors.</p>
        </div>
        
        <button 
          onclick={handleExpertToggle}
          class={`relative w-12 h-6 rounded-full border transition-all duration-300 ease-in-out flex-shrink-0 ${
            reasoningExpert 
              ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
              : 'bg-black/50 border-white/20'
          }`}
        >
          <div class={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${
            reasoningExpert ? 'translate-x-[22px] bg-blue-400' : 'translate-x-0 bg-white/30'
          }`}></div>
        </button>
      </div>

      <div class="space-y-4">
        {#if reasoningPreviewEntry}
          <div class="bg-[#030014] border border-white/5 rounded-xl p-4">
            <h5 class="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-1.5">
               <Wand2 class="h-3 w-3" /> Capability Preview
            </h5>
            
            <div class="space-y-3 relative group/select mb-4">
              <div class="relative">
                <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-blue-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]"></div>
                <select 
                  value={reasoningPreviewModel}
                  onchange={(e) => onReasoningPreviewModelChange(e.currentTarget.value)}
                  class="w-full h-11 px-4 pr-10 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer focus:bg-black/60 focus:text-white"
                >
                  {#each reasoningCapableModels as model}
                    <option value={model.id} class="bg-black text-white">{model.name || model.id}</option>
                  {/each}
                </select>
                <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none z-20">
                  <ChevronDown class="h-4 w-4 text-white/30" />
                </div>
              </div>
            </div>

            {#if reasoningPreviewCapability?.levels?.length}
              <div class="flex flex-wrap gap-2 mt-3">
                {#each reasoningPreviewCapability.levels as level}
                  <span class="px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-[9px] font-bold text-blue-400 uppercase tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                    {level}
                  </span>
                {/each}
              </div>
            {/if}
            {#if reasoningPreviewCapability?.default_effort}
               <p class="text-[10px] text-white/40 mt-3 flex items-center gap-1.5">
                  <Info class="h-3 w-3" /> Default: {reasoningPreviewCapability.default_effort.toUpperCase()}
               </p>
            {/if}
          </div>
        {:else}
          <div class="bg-[#030014] border border-white/5 rounded-xl p-4 text-center">
            <p class="text-[10px] uppercase tracking-widest text-white/30">No reasoning capable models detected.</p>
          </div>
        {/if}
      </div>

      {#if reasoningExpert}
        <div class="space-y-5 border-t border-white/10 pt-5">
          <div class="space-y-3 relative group/select">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Requested Effort</label>
            <div class="relative">
              <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-blue-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]"></div>
              <select 
                value={reasoningEffort}
                onchange={(e) => onReasoningEffortChange(e.currentTarget.value)}
                class="w-full h-11 px-4 pr-10 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer focus:bg-black/60 focus:text-white"
              >
                {#each ADVANCED_REASONING_LEVELS as effort}
                  <option value={effort} class="bg-black text-white">{effort.toUpperCase()} - {formatLevelDesc(effort)}</option>
                {/each}
              </select>
              <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none z-20">
                <ChevronDown class="h-4 w-4 text-white/30" />
              </div>
            </div>
          </div>

          <div class="space-y-3 relative group/select">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Fallback Behavior</label>
            <div class="relative">
              <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-red-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]"></div>
              <select 
                value={reasoningFallback}
                onchange={(e) => onReasoningFallbackChange(e.currentTarget.value)}
                class="w-full h-11 px-4 pr-10 bg-[#0a0a0a] border border-white/5 rounded-xl text-red-400 font-mono text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer focus:bg-black/60 focus:text-white"
              >
                {#each REASONING_FALLBACKS as fallback}
                  <option value={fallback} class="bg-black text-white">{fallback.toUpperCase()} - {formatLevelDesc(fallback)}</option>
                {/each}
              </select>
              <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none z-20">
                <ChevronDown class="h-4 w-4 text-white/30" />
              </div>
            </div>
          </div>
        </div>
      {/if}

    </div>

  </div>
</section>
