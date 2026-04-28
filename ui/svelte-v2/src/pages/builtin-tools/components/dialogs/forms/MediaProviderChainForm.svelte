<script lang="ts">
  import { GripVertical, Loader2, Plus, Trash2, Cpu, Zap, Activity } from "lucide-svelte";
  import { flip } from "svelte/animate";
  import { onMount } from "svelte";
  import type { BuiltinToolData } from "../../../hooks/use-builtin-tools.svelte";
  import { useProviders, providersState } from "../../../../providers/hooks/use-providers.svelte";
  import type { ProviderData } from "../../../../../../web/src/types/provider";

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

  const { loadProviders } = useProviders();

  onMount(() => {
    loadProviders();
  });

  let enabledProviders = $derived(providersState.providers.filter(p => p.enabled));

  interface ProviderEntry {
    id: string;
    provider_id: string;
    provider: string;
    model: string;
    enabled: boolean;
    timeout: number;
    max_retries: number;
    params?: Record<string, unknown>;
  }

  function parseInitialEntries(): ProviderEntry[] {
    const raw = Array.isArray(initialSettings.providers)
      ? (initialSettings.providers as Record<string, unknown>[])
      : [];

    return raw.map((e) => ({
      id: `entry-${Math.random().toString(36).substring(2, 9)}`,
      provider_id: String(e.provider_id || ""),
      provider: String(e.provider || ""),
      model: String(e.model || ""),
      enabled: Boolean(e.enabled ?? true),
      timeout: Number(e.timeout ?? 120),
      max_retries: Number(e.max_retries ?? 2),
      params: (e.params as Record<string, unknown>) || {},
    }));
  }

  let entries = $state<ProviderEntry[]>(parseInitialEntries());
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

  function handleAdd() {
    entries = [
      ...entries,
      {
        id: `entry-${Math.random().toString(36).substring(2, 9)}`,
        provider_id: "",
        provider: "",
        model: "",
        enabled: true,
        timeout: 120,
        max_retries: 2,
        params: {},
      }
    ];
  }

  function handleRemove(id: string) {
    entries = entries.filter((e) => e.id !== id);
  }

  function getProviderModels(providerId: string): string[] {
    const p = enabledProviders.find(p => p.id === providerId);
    if (!p) return [];
    
    // Attempt to parse known models if standard OpenAI/Anthropic/etc schema is used
    // Otherwise fallback to empty, user can type it in if we switch to an input
    const models = p.settings?.models;
    if (Array.isArray(models)) {
      return models.map(m => typeof m === 'string' ? m : m.id);
    }
    return [];
  }

  function updateEntryProvider(entry: ProviderEntry, providerId: string) {
    entry.provider_id = providerId;
    const p = enabledProviders.find(p => p.id === providerId);
    if (p) {
      entry.provider = p.provider;
      const models = getProviderModels(providerId);
      entry.model = models.length > 0 ? models[0] : "";
    }
  }

  async function handleSave() {
    saving = true;
    try {
      const serialized = entries.map(({ id: _id, ...rest }) => rest);
      await onSave(tool.name, { providers: serialized });
      onOpenChange(false);
    } finally {
      saving = false;
    }
  }

  function formatToolName(name: string): string {
    return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
</script>

<div class="space-y-4">
  <div class="mb-4">
    <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">{formatToolName(tool.name)} — Provider Chain</h3>
    <p class="text-[10px] font-bold text-white/30 mt-1 uppercase tracking-widest leading-relaxed">
      Configure and order provider fallbacks. Drag to reorder — the first enabled provider is tried first.
    </p>
  </div>

  <div class="space-y-3">
    {#if entries.length === 0}
      <div class="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-black/20 backdrop-blur-md">
        <p class="text-[10px] font-bold text-white/40 uppercase tracking-widest">No providers configured. Add one below.</p>
      </div>
    {/if}

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
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-goclaw-neon-purple/50"></div>
        <div class="p-3 pl-4">
          <div class="flex items-center justify-between gap-3">
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
              
              <span class="text-sm font-bold tracking-widest text-white/90 uppercase">
                {enabledProviders.find(p => p.id === entry.provider_id)?.name || "New Provider"}
              </span>
            </div>

            <button 
              onclick={() => handleRemove(entry.id)}
              class="text-white/20 hover:text-red-400 transition-colors p-1 mr-2"
              aria-label="Remove Provider"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>

          <div class="mt-4 pl-9 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1">
                  <Activity class="h-3 w-3" /> Provider
                </label>
                <select 
                  bind:value={entry.provider_id}
                  onchange={() => updateEntryProvider(entry, entry.provider_id)}
                  class="w-full h-8 bg-black/50 border border-white/10 rounded-lg text-xs font-mono px-3 text-white focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none appearance-none"
                >
                  <option value="" disabled>Select provider</option>
                  {#each enabledProviders as p}
                    <option value={p.id}>{p.name} ({p.provider})</option>
                  {/each}
                </select>
              </div>
              
              <div class="space-y-2">
                <label class="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1">
                  <Cpu class="h-3 w-3" /> Model
                </label>
                <!-- Use input to allow custom models, but if provider has predefined list, we could use datalist -->
                <input 
                  type="text" 
                  placeholder="Select or enter model"
                  bind:value={entry.model}
                  list={`models-${entry.id}`}
                  class="w-full h-8 bg-black/50 border border-white/10 rounded-lg text-xs font-mono px-3 text-white placeholder-white/20 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
                />
                <datalist id={`models-${entry.id}`}>
                  {#each getProviderModels(entry.provider_id) as m}
                    <option value={m}></option>
                  {/each}
                </datalist>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <div class="flex items-center gap-3">
                <label class="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                  Timeout
                </label>
                <div class="flex items-center">
                  <input 
                    type="number" 
                    min="1" 
                    bind:value={entry.timeout} 
                    class="w-16 h-7 bg-black/50 border border-white/10 rounded-l-md text-xs font-mono px-2 text-center text-white focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none border-r-0"
                  />
                  <span class="h-7 px-2 flex items-center bg-white/5 border border-white/10 border-l-0 rounded-r-md text-[10px] text-white/30 uppercase tracking-widest font-bold">s</span>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <label class="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                  Retries
                </label>
                <input 
                  type="number" 
                  min="0" max="10" 
                  bind:value={entry.max_retries} 
                  class="w-12 h-7 bg-black/50 border border-white/10 rounded-md text-xs font-mono px-2 text-center text-white focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <button 
    type="button" 
    onclick={handleAdd}
    class="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 hover:border-goclaw-neon-purple/50 text-white/60 hover:text-goclaw-neon-purple transition-all group backdrop-blur-md"
  >
    <Plus class="h-4 w-4 group-hover:scale-110 transition-transform" />
    <span class="text-[10px] font-bold uppercase tracking-widest">Add Provider</span>
  </button>

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
