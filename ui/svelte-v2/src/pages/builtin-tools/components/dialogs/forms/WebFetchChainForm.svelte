<script lang="ts">
  import { GripVertical, Loader2, Globe, Clock, Box } from "lucide-svelte";
  import { flip } from "svelte/animate";
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

  interface ExtractorEntry {
    id: string;
    name: string;
    enabled: boolean;
    timeout: number;
    base_url: string;
  }

  const FIXED_EXTRACTORS = ["defuddle", "html-to-markdown"] as const;

  function parseInitialEntries(): ExtractorEntry[] {
    const raw = Array.isArray(initialSettings.extractors)
      ? (initialSettings.extractors as Record<string, unknown>[])
      : [];

    const byName = new Map(raw.map((e) => [String(e.name ?? ""), e]));

    return FIXED_EXTRACTORS.map((name) => {
      const e = byName.get(name) ?? {};
      return {
        id: `extractor-${name}`,
        name,
        enabled: Boolean(e.enabled ?? true),
        timeout: Number(e.timeout ?? 0),
        base_url: String(e.base_url ?? ""),
      };
    });
  }

  let entries = $state<ExtractorEntry[]>(parseInitialEntries());
  let saving = $state(false);

  // Drag and drop state
  let dragDraggedIndex: number | null = $state(null);
  let dragHoveredIndex: number | null = $state(null);

  function dragStart(e: DragEvent, index: number) {
    if (!e.dataTransfer) return;
    dragDraggedIndex = index;
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.classList.add('opacity-50');
      }
    }, 0);
  }

  function dragEnter(e: DragEvent, index: number) {
    if (dragDraggedIndex === null || dragDraggedIndex === index) return;
    e.preventDefault();
    dragHoveredIndex = index;
    
    const items = [...entries];
    const draggedItem = items[dragDraggedIndex];
    items.splice(dragDraggedIndex, 1);
    items.splice(index, 0, draggedItem);
    entries = items;
    dragDraggedIndex = index;
  }

  function dragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  }

  function dragEnd(e: DragEvent) {
    dragDraggedIndex = null;
    dragHoveredIndex = null;
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('opacity-50');
    }
  }

  async function handleSave() {
    saving = true;
    try {
      const serialized = entries.map(({ id: _id, ...rest }) => rest);
      await onSave(tool.name, { extractors: serialized });
      onOpenChange(false);
    } finally {
      saving = false;
    }
  }

  const DESCRIPTIONS: Record<string, string> = {
    defuddle: "Extracts clean markdown via fetch.goclaw.sh using the Defuddle library.",
    "html-to-markdown": "Built-in HTML to Markdown converter with hidden element detection."
  };
</script>

<div class="space-y-4">
  <div class="mb-4">
    <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">EXTRACTOR CHAIN CONFIGURATION</h3>
    <p class="text-[10px] font-bold text-white/30 mt-1 uppercase tracking-widest leading-relaxed">
      Ordered list of content extractors. Each URL is tried top-to-bottom until one returns quality content.
    </p>
  </div>

  <div class="space-y-3">
    {#each entries as entry, index (entry.id)}
      <div 
        animate:flip={{ duration: 300 }}
        draggable="true"
        ondragstart={(e) => dragStart(e, index)}
        ondragenter={(e) => dragEnter(e, index)}
        ondragover={dragOver}
        ondragend={dragEnd}
        class="relative border border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md rounded-xl overflow-hidden transition-all {!entry.enabled ? 'opacity-50 grayscale' : ''} {dragHoveredIndex === index && dragDraggedIndex !== index ? 'border-t-goclaw-neon-purple/50 pt-1' : ''}"
      >
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-goclaw-neon-cyan/50"></div>
        <div class="p-3 pl-4">
          <div class="flex items-start gap-3">
            <button class="cursor-grab text-white/20 hover:text-white transition-colors p-1 mt-0.5" aria-label="Drag to reorder">
              <GripVertical class="h-4 w-4" />
            </button>
            <span class="text-[10px] font-mono text-white/20 mt-1.5">#{index + 1}</span>
            
            <button 
              onclick={() => entry.enabled = !entry.enabled}
              class="relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 mt-1 {entry.enabled ? 'bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'bg-[#1a1a1a]'}"
            >
              <span class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {entry.enabled ? 'translate-x-3' : 'translate-x-0'}"></span>
            </button>
            
            <div class="flex-1 min-w-0">
              <span class="text-sm font-bold tracking-widest text-white/90 uppercase">{entry.name}</span>
              <p class="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed mt-1">
                {DESCRIPTIONS[entry.name] ?? ""}
              </p>
            </div>
          </div>

          {#if entry.timeout > 0 || entry.name === "defuddle"}
            <div class="mt-4 pl-9 space-y-3">
              {#if entry.timeout > 0 || entry.name === "defuddle"}
                <div class="flex items-center gap-4">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-white/40 w-24 shrink-0 flex items-center gap-1">
                    <Clock class="h-3 w-3" /> Timeout (s)
                  </span>
                  <input 
                    type="number" 
                    min="0" max="600" 
                    bind:value={entry.timeout} 
                    class="w-20 h-7 bg-black/50 border border-white/10 rounded-md text-xs font-mono px-3 text-white focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
                  />
                </div>
              {/if}
              
              {#if entry.name === "defuddle"}
                <div class="flex items-center gap-4">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-white/40 w-24 shrink-0 flex items-center gap-1">
                    <Globe class="h-3 w-3" /> Base URL
                  </span>
                  <input 
                    type="url" 
                    placeholder="https://fetch.goclaw.sh/"
                    bind:value={entry.base_url} 
                    class="flex-1 h-7 bg-black/50 border border-white/10 rounded-md text-xs font-mono px-3 text-white placeholder-white/20 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
                  />
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/each}
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
