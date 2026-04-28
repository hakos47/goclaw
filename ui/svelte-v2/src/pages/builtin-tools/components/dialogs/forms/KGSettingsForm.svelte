<script lang="ts">
  import { Loader2, BrainCircuit, Fingerprint, Activity } from "lucide-svelte";
  import type { BuiltinToolData } from "../../../hooks/use-builtin-tools.svelte";

  let {
    tool,
    initialSettings,
    onOpenChange,
    onSave
  }: {
    tool: BuiltinToolData;
    initialSettings: Record<string, unknown>;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, settings: Record<string, unknown>) => Promise<void>;
  } = $props();

  let extract_on_memory_write = $state(Boolean(initialSettings.extract_on_memory_write ?? false));
  let extraction_provider = $state(String(initialSettings.extraction_provider ?? ""));
  let extraction_model = $state(String(initialSettings.extraction_model ?? ""));
  let min_confidence = $state(Number(initialSettings.min_confidence ?? 0.75));

  let saving = $state(false);

  async function handleSave() {
    saving = true;
    try {
      await onSave(tool.name, {
        extract_on_memory_write,
        extraction_provider,
        extraction_model,
        min_confidence
      });
      onOpenChange(false);
    } finally {
      saving = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="mb-4">
    <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">KNOWLEDGE GRAPH CONFIGURATION</h3>
    <p class="text-[10px] font-bold text-white/30 mt-1 uppercase tracking-widest leading-relaxed">
      Configure entity extraction from memory writes. Requires an LLM provider and model capable of structured JSON output.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Provider & Model Configuration -->
    <div class="space-y-4 p-5 rounded-2xl bg-[#0a0a0a]/50 border border-white/5 backdrop-blur-md relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-32 h-32 bg-goclaw-neon-purple/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-goclaw-neon-purple/10 transition-colors"></div>
      
      <div class="flex items-center gap-2 mb-2">
        <BrainCircuit class="h-4 w-4 text-goclaw-neon-purple" />
        <h4 class="text-[11px] font-black uppercase tracking-widest text-white/60">Extraction Engine</h4>
      </div>

      <div class="space-y-2">
        <label class="text-[9px] font-bold uppercase tracking-widest text-white/30">Extraction Provider</label>
        <input 
          type="text" 
          placeholder="e.g. openai" 
          bind:value={extraction_provider} 
          class="w-full h-9 bg-black/50 border border-white/10 rounded-lg text-xs font-mono px-3 text-white placeholder-white/20 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
        />
        <p class="text-[9px] text-white/20 uppercase tracking-widest leading-relaxed">
          LLM provider used to extract entities and relations from text.
        </p>
      </div>
      
      <div class="space-y-2">
        <label class="text-[9px] font-bold uppercase tracking-widest text-white/30">Extraction Model</label>
        <input 
          type="text" 
          placeholder="e.g. gpt-4o-mini" 
          bind:value={extraction_model} 
          class="w-full h-9 bg-black/50 border border-white/10 rounded-lg text-xs font-mono px-3 text-white placeholder-white/20 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
        />
        <p class="text-[9px] text-white/20 uppercase tracking-widest leading-relaxed">
          Model ID for extraction. Should support structured JSON output.
        </p>
      </div>
    </div>

    <!-- Thresholds & Toggles -->
    <div class="space-y-6">
      <div class="space-y-4 p-5 rounded-2xl bg-[#0a0a0a]/50 border border-white/5 backdrop-blur-md relative overflow-hidden group">
        <div class="flex items-center gap-2 mb-2">
          <Fingerprint class="h-4 w-4 text-white/40" />
          <h4 class="text-[11px] font-black uppercase tracking-widest text-white/60">Confidence Threshold</h4>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-[9px] font-bold uppercase tracking-widest text-white/30">Min Confidence (0.0 - 1.0)</label>
            <span class="text-xs font-mono text-goclaw-neon-purple bg-goclaw-neon-purple/10 px-2 rounded">{min_confidence.toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            bind:value={min_confidence} 
            class="w-full accent-goclaw-neon-purple cursor-pointer"
          />
          <p class="text-[9px] text-white/20 uppercase tracking-widest leading-relaxed">
            Entities below this confidence score are discarded.
          </p>
        </div>
      </div>

      <button 
        type="button"
        onclick={() => extract_on_memory_write = !extract_on_memory_write}
        class="w-full flex items-center justify-between p-5 rounded-2xl border transition-all {extract_on_memory_write ? 'bg-goclaw-neon-cyan/5 border-goclaw-neon-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-[#0a0a0a]/50 border-white/5 hover:border-white/10'} backdrop-blur-md"
      >
        <div class="flex items-start gap-3 text-left">
          <Activity class="h-4 w-4 shrink-0 mt-0.5 {extract_on_memory_write ? 'text-goclaw-neon-cyan' : 'text-white/40'}" />
          <div>
            <span class="text-[11px] font-black uppercase tracking-widest text-white/80 block">Auto-extract on write</span>
            <span class="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-relaxed mt-1 block">
              Automatically extract entities when agents write to memory files.
            </span>
          </div>
        </div>
        
        <div class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 {extract_on_memory_write ? 'bg-goclaw-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-[#1a1a1a]'}">
          <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {extract_on_memory_write ? 'translate-x-4' : 'translate-x-0'}"></span>
        </div>
      </button>
    </div>
  </div>

  <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
    <button 
      type="button"
      onclick={() => onOpenChange(false)}
      disabled={saving}
      class="px-6 py-3 rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:bg-white/5 hover:text-white transition-all disabled:opacity-10 bg-[#030014]/50 shadow-inner"
    >
      Cancel
    </button>
    <button 
      type="button"
      onclick={handleSave} 
      disabled={saving}
      class="relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl transition-all duration-500 overflow-hidden group text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 disabled:opacity-30 disabled:pointer-events-none"
    >
      <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
      
      {#if saving}
        <Loader2 class="h-3.5 w-3.5 relative z-10 text-goclaw-neon-purple animate-spin" />
        <span class="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md">Saving</span>
      {:else}
        <span class="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md">Save Settings</span>
      {/if}
    </button>
  </div>
</div>
