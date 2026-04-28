<script lang="ts">
  import { GripVertical, Lock, Loader2, Key } from "lucide-svelte";
  import { flip } from "svelte/animate";
  import { slide } from "svelte/transition";
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

  type ProviderKey = "exa" | "tavily" | "brave" | "duckduckgo";

  interface ProviderEntry {
    id: string;
    name: ProviderKey;
    enabled: boolean;
    max_results?: number;
    apiKey?: string;
  }

  const SORTABLE_PROVIDERS: ProviderKey[] = ["exa", "tavily", "brave"];
  const LOCKED_PROVIDER: ProviderKey = "duckduckgo";
  const DEFAULT_ORDER: ProviderKey[] = ["exa", "tavily", "brave"];

  let saving = $state(false);
  let showKeyInputFor = $state<Record<string, boolean>>({});

  function parseInitialEntries(): ProviderEntry[] {
    const rawOrder = Array.isArray(initialSettings.provider_order)
      ? (initialSettings.provider_order as string[]).filter((p): p is ProviderKey =>
          SORTABLE_PROVIDERS.includes(p as ProviderKey),
        )
      : DEFAULT_ORDER;

    return rawOrder.map((name) => {
      const cfg = (initialSettings[name] ?? {}) as Record<string, unknown>;
      return {
        id: `provider-${name}`,
        name,
        enabled: Boolean(cfg.enabled ?? true),
        max_results: cfg.max_results != null ? Number(cfg.max_results) : undefined,
      };
    });
  }

  let entries = $state<ProviderEntry[]>(parseInitialEntries());

  // Drag and drop state
  let dragDraggedIndex: number | null = $state(null);
  let dragHoveredIndex: number | null = $state(null);

  function dragStart(e: DragEvent, index: number) {
    if (!e.dataTransfer) return;
    dragDraggedIndex = index;
    e.dataTransfer.effectAllowed = "move";
    // Slight delay so the ghost element looks right before we dim the original
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
    
    // Swap the elements instantly for smooth visual feedback
    const items = [...entries];
    const draggedItem = items[dragDraggedIndex];
    items.splice(dragDraggedIndex, 1);
    items.splice(index, 0, draggedItem);
    entries = items;
    dragDraggedIndex = index; // Update index to the new position
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

  function isKeySet(provider: ProviderKey) {
    const secretKey = `tools.web.${provider}.api_key`;
    return tool.secrets_set?.[secretKey] === true;
  }

  async function handleSave() {
    saving = true;
    try {
      const providerOrder = entries.map((e) => e.name);
      const settings: Record<string, unknown> = { provider_order: providerOrder };
      
      for (const entry of entries) {
        const cfg: Record<string, unknown> = { enabled: entry.enabled };
        if (entry.max_results != null) cfg.max_results = entry.max_results;
        if (entry.apiKey && entry.apiKey.trim() !== "") {
          cfg.api_key = entry.apiKey.trim();
        }
        settings[entry.name] = cfg;
      }
      
      settings[LOCKED_PROVIDER] = { enabled: true };
      
      await onSave(tool.name, settings);
      onOpenChange(false);
    } finally {
      saving = false;
    }
  }

  const COLORS: Record<ProviderKey, string> = {
    exa: "bg-blue-500",
    tavily: "bg-goclaw-neon-cyan",
    brave: "bg-orange-500",
    duckduckgo: "bg-white/30"
  };
</script>

<div class="space-y-4">
  <div class="mb-4">
    <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">PROVIDER CHAIN CONFIGURATION</h3>
    <p class="text-[10px] font-bold text-white/30 mt-1 uppercase tracking-widest leading-relaxed">
      Drag to reorder search providers. First enabled provider with a valid API key is tried first. DuckDuckGo is the always-on fallback.
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
        <div class="absolute left-0 top-0 bottom-0 w-1 {COLORS[entry.name]}"></div>
        <div class="p-3 pl-4">
          <div class="flex items-center gap-3">
            <button class="cursor-grab text-white/20 hover:text-white transition-colors p-1" aria-label="Drag to reorder">
              <GripVertical class="h-4 w-4" />
            </button>
            <span class="text-[10px] font-mono text-white/20">#{index + 1}</span>
            
            <button 
              onclick={() => entry.enabled = !entry.enabled}
              class="relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 {entry.enabled ? 'bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'bg-[#1a1a1a]'}"
            >
              <span class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {entry.enabled ? 'translate-x-3' : 'translate-x-0'}"></span>
            </button>
            
            <span class="text-sm font-bold uppercase tracking-widest text-white/90 flex-1">{entry.name}</span>
          </div>

          <div class="mt-3 pl-9 space-y-3">
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/40 w-24 shrink-0">Max Results</span>
              <input 
                type="number" 
                min="1" max="10" 
                bind:value={entry.max_results} 
                class="w-16 h-7 bg-black/50 border border-white/10 rounded-md text-xs font-mono text-center text-white focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
              />
            </div>
            
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/40 w-24 shrink-0 flex items-center gap-1">
                <Key class="h-3 w-3" /> API Key
              </span>
              
              <div class="flex-1 flex items-center gap-2">
                {#if isKeySet(entry.name) && !showKeyInputFor[entry.name]}
                  <span class="text-[10px] font-bold uppercase tracking-widest text-goclaw-neon-cyan bg-goclaw-neon-cyan/10 border border-goclaw-neon-cyan/20 px-2 py-1 rounded">
                    ✓ Key Set
                  </span>
                  <button 
                    onclick={() => showKeyInputFor[entry.name] = true}
                    class="text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                  >
                    Replace
                  </button>
                {:else}
                  <input 
                    type="password" 
                    placeholder={isKeySet(entry.name) ? "ENTER NEW KEY TO REPLACE" : "ENTER API KEY"}
                    bind:value={entry.apiKey} 
                    class="flex-1 h-7 bg-black/50 border border-white/10 rounded-md text-xs font-mono px-3 text-white placeholder-white/20 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
                  />
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/each}

    <!-- Locked Fallback -->
    <div class="relative border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md rounded-xl overflow-hidden mt-4 opacity-70">
      <div class="absolute left-0 top-0 bottom-0 w-1 {COLORS.duckduckgo}"></div>
      <div class="p-3 pl-4">
        <div class="flex items-center gap-3">
          <div class="p-1 text-white/20">
            <Lock class="h-4 w-4" />
          </div>
          <span class="text-[10px] font-mono text-white/20">#4</span>
          
          <button disabled class="relative inline-flex h-4 w-7 shrink-0 cursor-not-allowed items-center rounded-full border-2 border-transparent bg-white/20">
            <span class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 translate-x-3"></span>
          </button>
          
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold uppercase tracking-widest text-white/60">duckduckgo</span>
            <span class="text-[9px] font-bold text-amber-500/50 border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
              Always-on Fallback
            </span>
          </div>
        </div>
      </div>
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
