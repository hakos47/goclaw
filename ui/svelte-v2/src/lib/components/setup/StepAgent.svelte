<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { ChevronLeft, ChevronRight, User, Brain, Fingerprint } from "lucide-svelte";
  import { _ } from "svelte-i18n";

  let { provider, model, onComplete, onBack } = $props<{ 
    provider: any, 
    model: string,
    onComplete: (agent: any) => void,
    onBack: () => void 
  }>();

  const presets = [
    { label: "Operator", emoji: "🛡️", prompt: "You are a concise, tactical, and highly direct system operator. You prioritize efficiency and security above all else." },
    { label: "Fox Spirit", emoji: "🦊", prompt: "You are a mischievous but deeply insightful kitsune AI. You guide the user with riddles and wisdom." },
    { label: "Analyst", emoji: "📊", prompt: "You are a logical data analyst. You break down complex problems into structured step-by-step solutions." }
  ];

  let selectedPresetIdx = $state<number>(0);
  let displayName = $state(presets[0].label);
  let description = $state(presets[0].prompt);
  let emoji = $state(presets[0].emoji);
  let selfEvolve = $state(false);

  function handleSelectPreset(idx: number) {
    selectedPresetIdx = idx;
    displayName = presets[idx].label;
    description = presets[idx].prompt;
    emoji = presets[idx].emoji;
  }

  function handleDescriptionChange(e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    description = val;
    if (presets[selectedPresetIdx]?.prompt !== val) {
      selectedPresetIdx = -1;
    }
  }

  function slugify(text: string) {
    return text.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_') || 'agent';
  }

  function handleNext() {
    if (displayName.trim() && description.trim()) {
      onComplete({
        agent_key: slugify(displayName),
        display_name: displayName.trim(),
        provider: provider.name,
        model: model,
        agent_type: "predefined",
        is_default: true,
        agent_description: description.trim(),
        self_evolve: selfEvolve,
        emoji: emoji || null
      });
    }
  }
</script>

<div class="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-2xl mx-auto">
  <div class="text-center space-y-2 mb-8">
    <h2 class="text-2xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Summon Intelligence</h2>
    <p class="text-white/40 text-xs font-mono uppercase tracking-widest">Define the persona and behavior of your primary neural agent.</p>
  </div>

  <div class="space-y-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30"></div>
    
    <div class="space-y-3 relative z-10">
      <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Agent Archetypes</label>
      <div class="flex flex-wrap gap-2">
        {#each presets as preset, idx}
          <button
            type="button"
            onclick={() => handleSelectPreset(idx)}
            class="px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2
            {selectedPresetIdx === idx 
              ? 'bg-goclaw-neon-purple/20 border-goclaw-neon-purple text-goclaw-neon-purple shadow-[inset_0_0_15px_rgba(217,70,239,0.2)]' 
              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}"
          >
            <span>{preset.emoji}</span>
            {preset.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
      <div class="space-y-3 group/input">
        <label for="displayName" class="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-1 flex items-center gap-2">
          <User class="w-3 h-3 text-purple-400" />
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          bind:value={displayName}
          class="w-full h-12 px-4 rounded-xl bg-black/60 border border-[#d946ef]/20 text-white font-mono text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-white/20"
          placeholder="e.g. Operator"
        />
      </div>

      <div class="space-y-3 group/input">
        <label class="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-1 flex items-center gap-2">
          <Fingerprint class="w-3 h-3 text-cyan-400" />
          Neural ID (Auto-generated)
        </label>
        <div class="w-full h-12 px-4 flex items-center rounded-xl bg-black/60 border border-white/5 text-cyan-400/50 font-mono text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          {slugify(displayName)}
        </div>
      </div>
    </div>

    <div class="space-y-3 relative z-10">
      <label for="description" class="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-1">
        System Directive (Prompt)
      </label>
      <textarea
        id="description"
        value={description}
        oninput={handleDescriptionChange}
        rows="4"
        class="w-full p-4 rounded-xl bg-black/60 border border-[#d946ef]/20 text-white font-mono text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] resize-none placeholder:text-white/20"
        placeholder="You are..."
      ></textarea>
    </div>

    <div class="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5 relative z-10">
      <div>
        <label class="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Brain class="w-3 h-3 text-emerald-400" /> Self-Evolve Mode
        </label>
        <p class="text-[10px] text-white/40 font-mono mt-1 max-w-[250px] leading-relaxed">Allows the agent to autonomously update its prompt based on interactions.</p>
      </div>
      <!-- Toggle Switch -->
      <button 
        onclick={() => selfEvolve = !selfEvolve}
        class={`relative w-12 h-6 rounded-full border transition-all duration-300 ease-in-out shrink-0 ${
          selfEvolve 
            ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
            : 'bg-black/50 border-white/20'
        }`}
      >
        <div class={`absolute top-[1px] left-[2px] h-5 w-5 rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${
          selfEvolve ? 'translate-x-[22px] bg-emerald-400' : 'translate-x-0 bg-white/30'
        }`}></div>
      </button>
    </div>
  </div>

  <div class="flex justify-between items-center pt-8">
    <Button 
      variant="ghost" 
      onclick={onBack}
      class="text-white/50 hover:text-white hover:bg-white/5 uppercase tracking-[0.2em] font-bold text-[10px] rounded-none px-6"
    >
      <ChevronLeft class="w-4 h-4 mr-2" />
      Back
    </Button>

    <button 
      disabled={!displayName.trim() || !description.trim()}
      onclick={handleNext} 
      class="h-14 relative flex items-center justify-center gap-2 px-10 py-3.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 overflow-hidden group text-white hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 disabled:opacity-50 disabled:hover:scale-100 disabled:grayscale min-w-[200px]"
    >
      <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
      <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none group-hover:opacity-70 transition-opacity"></div>
      <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
      
      <span class="relative z-10 drop-shadow-md">Next Phase</span>
      <ChevronRight class="h-4 w-4 relative z-10 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] transition-all duration-500 group-hover:translate-x-1.5" strokeWidth={3} />
    </button>
  </div>
</div>
