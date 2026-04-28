<script lang="ts">
  import { Loader2 } from "lucide-svelte";
  import type { BuiltinToolData } from "../../hooks/use-builtin-tools.svelte";

  let {
    tool,
    initialSettings,
    onOpenChange,
    onSave
  }: {
    tool: BuiltinToolData | null;
    initialSettings: Record<string, unknown>;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, settings: Record<string, unknown>) => Promise<void>;
  } = $props();

  let json = $state("");
  let error = $state("");
  let saving = $state(false);
  let validJson = $state(true);

  $effect(() => {
    if (tool) {
      json = JSON.stringify(initialSettings, null, 2);
      error = "";
      validJson = true;
    }
  });

  function handleJsonChange(e: Event) {
    const text = (e.target as HTMLTextAreaElement).value;
    json = text;
    try {
      JSON.parse(text);
      validJson = true;
      error = "";
    } catch {
      validJson = false;
    }
  }

  function handleFormat() {
    try {
      const parsed = JSON.parse(json);
      json = JSON.stringify(parsed, null, 2);
      error = "";
      validJson = true;
    } catch {
      error = "Cannot format invalid JSON";
    }
  }

  async function handleSave() {
    if (!tool) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(json);
    } catch {
      error = "Invalid JSON structure";
      return;
    }
    saving = true;
    error = "";
    try {
      await onSave(tool.name, parsed);
      onOpenChange(false);
    } catch (e) {
      error = String(e);
    } finally {
      saving = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">RAW JSON CONFIGURATION</h3>
    <button 
      type="button"
      onclick={handleFormat} 
      class="text-[9px] font-bold uppercase tracking-widest text-goclaw-neon-cyan hover:text-white transition-colors"
    >
      Format Code
    </button>
  </div>

  <div class="relative">
    <textarea
      value={json}
      oninput={handleJsonChange}
      rows="12"
      spellcheck="false"
      class="w-full bg-[#050505]/80 border {validJson ? 'border-white/10 focus:border-goclaw-neon-purple' : 'border-red-500/50'} rounded-xl p-4 text-xs font-mono text-white/80 placeholder-white/20 focus:outline-none focus:ring-1 {validJson ? 'focus:ring-goclaw-neon-purple' : 'focus:ring-red-500'} transition-all shadow-inner custom-scrollbar"
    ></textarea>
  </div>

  {#if !validJson}
    <p class="text-[10px] font-bold text-red-400 uppercase tracking-widest">Invalid JSON syntax</p>
  {/if}
  
  {#if error}
    <p class="text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</p>
  {/if}

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
      disabled={saving || !validJson}
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
