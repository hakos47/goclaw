<script lang="ts">
  import { providersState, useProviderModels } from "../../state/providers.svelte";
  import { ChevronDown, Loader2, Info } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import Combobox from "../ui/Combobox.svelte";

  type ModelItem = { id: string; name: string };

  type Props = {
    provider: string;
    onProviderChange: (v: string) => void;
    model: string;
    onModelChange: (v: string) => void;
    label?: string;
    allowEmpty?: boolean;
    filterEmbedding?: boolean;
    filterTts?: boolean;
    modelFilter?: string;
    extraModels?: ModelItem[];
  };

  let { 
    provider, onProviderChange, 
    model, onModelChange, 
    label, allowEmpty = true, 
    filterEmbedding = false, 
    filterTts = false,
    modelFilter,
    extraModels = []
  }: Props = $props();

  let enabledProviders = $derived(providersState.providers.filter(p => {
    if (!p.enabled) return false;
    if (filterEmbedding) {
        if (p.settings?.embedding?.enabled !== true) return false;
    }
    // We intentionally do NOT filter enabledProviders by filterTts here.
    // Any provider can theoretically serve TTS models. The model combobox 
    // itself will be filtered to only show TTS models.
    return true;
  }));

  // Pass a getter to ensure the hook is reactive to prop changes
  const modelQuery = useProviderModels(() => provider);

  let comboboxOptions = $derived.by(() => {
    let list = modelQuery.models;
    
    // Filter out non-TTS models if requested
    if (filterTts) {
        list = list.filter(m => {
            if (m.capabilities && m.capabilities.length > 0) {
                return m.capabilities.includes("tts") || m.capabilities.includes("text-to-speech") || m.capabilities.includes("audio");
            }
            const id = m.id.toLowerCase();
            const pId = (provider || "").toLowerCase();
            if (pId === 'elevenlabs' || pId === 'edge') return true;
            if (pId === 'openai') return id.includes('tts');
            if (pId === 'minimax') return id.includes('speech');
            if (pId.includes('gemini.tts')) return true;
            return id.includes('tts') || id.includes('voice') || id.includes('speech') || id.includes('audio');
        });
    }
    
    if (modelFilter) {
        const f = modelFilter.toLowerCase();
        list = list.filter(m => 
            m.id.toLowerCase().includes(f) || 
            (m.name || "").toLowerCase().includes(f)
        );
    }
    
    // Prepend extra models, avoid duplicates
    if (extraModels.length > 0) {
        const apiIds = new Set(list.map(m => m.id));
        const uniqueExtras = extraModels.filter(m => !apiIds.has(m.id));
        list = [...uniqueExtras, ...list];
    }
    
    return list.map(m => ({ value: m.id, label: m.name || m.id }));
  });

  let providerOptions = $derived.by(() => {
    const opts = enabledProviders.map(p => ({ value: p.name, label: p.display_name || p.name }));
    if (allowEmpty) {
       return [{ value: "__empty__", label: $_('common.selectProvider', { default: '(Auto / Default)' }) }, ...opts];
    }
    return opts;
  });

  function handleProviderChange(v: string) {
    const newVal = v === "__empty__" ? "" : v;
    onProviderChange(newVal);
    // In React, it only clears model if NOT allowEmpty.
    // In allowEmpty (Embedding), we might want to keep the model if the user is just checking providers.
    if (!allowEmpty) onModelChange("");
  }
</script>

<div class="grid gap-6 sm:grid-cols-2">
  <!-- Provider Select -->
  <div class="space-y-1.5 group/select relative">
    <div class="flex items-center gap-1.5 pl-1">
      <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label || 'Provider'}</label>
      <Info class="h-3 w-3 text-white/20" />
    </div>
    <div class="relative z-10">
      <Combobox
          value={provider || (allowEmpty ? "__empty__" : "")}
          onChange={handleProviderChange}
          options={providerOptions}
          placeholder={label || 'Select Provider...'}
          allowCustom={false}
      />
    </div>
  </div>

  <!-- Model Select (Combobox) -->
  <div class="space-y-1.5 relative group/combo">
    <div class="flex items-center gap-1.5 pl-1">
      <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest">Model</label>
      {#if modelQuery.loading}
        <Loader2 class="h-3 w-3 text-goclaw-neon-purple animate-spin" />
      {/if}
      <Info class="h-3 w-3 text-white/20" />
    </div>
    <div class="absolute inset-x-0 bottom-0 top-[22px] border-2 border-transparent group-focus-within/combo:border-goclaw-neon-purple/30 rounded-xl pointer-events-none transition-colors z-20"></div>
    <div class="relative z-10">
      <Combobox
          value={model}
          onChange={onModelChange}
          options={comboboxOptions}
          placeholder={modelQuery.loading ? $_('common.loading', { default: 'Loading...' }) : 'Enter or select model...'}
          allowCustom={true}
          customLabel={$_('common.useCustomModel', { default: 'Use custom:' })}
      />
    </div>
  </div>
</div>
