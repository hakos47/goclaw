<script lang="ts">
  import { Settings2, Mic2, Cpu } from "lucide-svelte";
  import type { TtsConfig, TtsProviderConfig } from "../hooks/use-tts.svelte";
  import type { TtsCapabilities } from "../hooks/use-tts-capabilities.svelte";
  
  let {
    provider,
    draft,
    capabilities,
    paramsState,
    onUpdateProvider,
    onParamChange,
  }: {
    provider: string;
    draft: TtsConfig;
    capabilities: TtsCapabilities | undefined;
    paramsState: Record<string, any>;
    onUpdateProvider: (provider: string, patch: Partial<TtsProviderConfig>) => void;
    onParamChange: (key: string, val: any) => void;
  } = $props();

  let subConfig = $derived(draft[provider as keyof TtsConfig] as TtsProviderConfig || {});
  
  // Extract specific properties for current provider schema
  let voiceId = $derived.by(() => {
    switch (provider) {
      case "openai": return subConfig.voice || "";
      case "elevenlabs": return subConfig.voice_id || "";
      case "edge": return subConfig.voice || "";
      case "minimax": return subConfig.voice_id || "";
      case "gemini": return subConfig.voice || "";
      default: return "";
    }
  });

  let modelId = $derived.by(() => {
    switch (provider) {
      case "openai": return subConfig.model || "";
      case "elevenlabs": return subConfig.model_id || "";
      case "minimax": return subConfig.model || "";
      case "gemini": return subConfig.model || "";
      default: return "";
    }
  });

  function handleVoiceChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    switch (provider) {
      case "openai": onUpdateProvider("openai", { voice: val }); break;
      case "elevenlabs": onUpdateProvider("elevenlabs", { voice_id: val }); break;
      case "edge": onUpdateProvider("edge", { voice: val }); break;
      case "minimax": onUpdateProvider("minimax", { voice_id: val }); break;
      case "gemini": onUpdateProvider("gemini", { voice: val }); break;
    }
  }

  function handleModelChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    switch (provider) {
      case "openai": onUpdateProvider("openai", { model: val }); break;
      case "elevenlabs": onUpdateProvider("elevenlabs", { model_id: val }); break;
      case "minimax": onUpdateProvider("minimax", { model: val }); break;
      case "gemini": onUpdateProvider("gemini", { model: val }); break;
    }
  }

  import { useHttp } from "../../../lib/state/ws.svelte";
  const http = useHttp();

  let dynamicVoices = $state<any[]>([]);
  let isLoadingVoices = $state(false);

  $effect(() => {
    // If capabilities has no voices, try fetching the dynamic global voices list (used by Edge/Minimax)
    if (provider && capabilities && (!capabilities.voices || capabilities.voices.length === 0)) {
      isLoadingVoices = true;
      http.get<{ voices: any[] }>("/v1/voices")
        .then(res => {
          dynamicVoices = res?.voices || [];
        })
        .catch(console.error)
        .finally(() => isLoadingVoices = false);
    } else {
      dynamicVoices = [];
    }
  });

  let voices = $derived(capabilities?.voices?.length ? capabilities.voices : dynamicVoices);
  let models = $derived(capabilities?.models || []);
  let paramSchemas = $derived(capabilities?.params || []);
  
</script>

<div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden group">
  <div class="flex items-center gap-2 mb-6 relative z-10">
    <Settings2 class="w-4 h-4 text-goclaw-neon-cyan" />
    <h3 class="text-sm font-bold text-white/90">Voice & Settings</h3>
  </div>

  <div class="grid gap-6 relative z-10">
    <!-- Voice Picker -->
    <div class="space-y-2">
      <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
        <Mic2 class="w-3 h-3" />
        Voice
      </label>
      <div class="relative">
        <select 
          value={voiceId} 
          onchange={handleVoiceChange}
          disabled={isLoadingVoices}
          class="w-full bg-[#030014] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm font-bold focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan/30 transition-all outline-none appearance-none disabled:opacity-50"
        >
          <option value="" disabled>{isLoadingVoices ? "Loading voices..." : "Select a voice..."}</option>
          {#each voices as v}
            <option value={v.voice_id}>{v.name} ({v.voice_id})</option>
          {/each}
        </select>
        <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>

    <!-- Model Picker -->
    {#if models.length > 0}
      <div class="space-y-2">
        <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
          <Cpu class="w-3 h-3" />
          Model
        </label>
        <div class="relative">
          <select 
            value={modelId} 
            onchange={handleModelChange}
            class="w-full bg-[#030014] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm font-bold focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan/30 transition-all outline-none appearance-none"
          >
            <option value="" disabled>Select a model...</option>
            {#each models as m}
              <option value={m}>{m}</option>
            {/each}
          </select>
          <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
    {/if}

    <!-- Dynamic Params -->
    {#if paramSchemas.length > 0}
      <div class="pt-4 border-t border-white/5 space-y-5">
        <h4 class="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Advanced Provider Parameters</h4>
        {#each paramSchemas as schema}
          {@const val = paramsState[schema.key] !== undefined ? paramsState[schema.key] : schema.default}
          <div class="space-y-2">
            <div class="flex justify-between items-end">
              <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">{schema.label || schema.key}</label>
              {#if schema.type === 'slider' || schema.type === 'number'}
                <span class="text-[10px] font-mono text-goclaw-neon-cyan">{val}</span>
              {/if}
            </div>
            
            {#if schema.type === 'slider' || schema.type === 'number'}
               <input 
                 type="range" 
                 min={schema.min || 0} 
                 max={schema.max || 100} 
                 step={schema.step || 1} 
                 value={val}
                 oninput={(e) => onParamChange(schema.key, Number(e.currentTarget.value))}
                 class="w-full accent-goclaw-neon-cyan cursor-pointer"
               />
            {:else if schema.type === 'boolean' || schema.type === 'switch'}
               <button 
                  onclick={() => onParamChange(schema.key, !val)}
                  class={`relative w-12 h-6 rounded-full transition-all duration-500 border ${val ? 'bg-goclaw-neon-cyan/20 border-goclaw-neon-cyan/40' : 'bg-white/5 border-white/10'}`}
                >
                  <div class={`absolute top-1 w-4 h-4 rounded-full transition-all duration-500 ${val ? 'left-7 bg-goclaw-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'left-1 bg-white/20'}`}></div>
                </button>
            {:else if schema.type === 'select'}
               <select 
                  value={val}
                  onchange={(e) => onParamChange(schema.key, e.currentTarget.value)}
                  class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:border-goclaw-neon-cyan transition-all outline-none"
               >
                 {#each schema.options || [] as opt}
                    <option value={opt.value || opt}>{opt.label || opt}</option>
                 {/each}
               </select>
            {:else}
              <input 
                 type="text" 
                 value={val || ''}
                 oninput={(e) => onParamChange(schema.key, e.currentTarget.value)}
                 class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-goclaw-neon-cyan transition-all outline-none"
               />
            {/if}
            {#if schema.description}
               <p class="text-[9px] text-white/30 uppercase tracking-widest mt-1 ml-1">{schema.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
