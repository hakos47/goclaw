<script lang="ts">
  import { onMount } from "svelte";
  import { Volume2, RefreshCw, Save } from "lucide-svelte";
  import { useTTS, type TtsConfig, type TtsProviderConfig } from "./hooks/use-tts.svelte";
  import { ttsCapabilitiesState, useTtsCapabilities } from "./hooks/use-tts-capabilities.svelte";
  import ProviderSetup from "./components/ProviderSetup.svelte";
  import CredentialsSection from "./components/CredentialsSection.svelte";
  import VoiceConfigSection from "./components/VoiceConfigSection.svelte";
  import TestPlayground from "./components/TestPlayground.svelte";
  import BehaviorSection from "./components/BehaviorSection.svelte";
  
  const { loadConfig, saveConfig, synthesize, testConnection } = useTTS();
  const { loadCapabilities } = useTtsCapabilities();
  import { ttsState } from "./hooks/use-tts.svelte";

  let draft = $state<TtsConfig>(JSON.parse(JSON.stringify(ttsState.config)));
  let paramsState = $state<Record<string, any>>({});
  let dirty = $state(false);
  let testing = $state(false);

  // Sync draft when state loads
  $effect(() => {
    if (!ttsState.loading && ttsState.config) {
      if (!dirty) {
        const newDraft = JSON.parse(JSON.stringify(ttsState.config));
        draft = newDraft;
        const providerKey = newDraft.provider as keyof TtsConfig;
        if (providerKey && newDraft[providerKey]) {
          paramsState = (newDraft[providerKey] as TtsProviderConfig).params || {};
        }
      }
    }
  });

  onMount(() => {
    loadConfig();
    loadCapabilities();
  });

  function updateDraft(patch: Partial<TtsConfig>) {
    draft = { ...draft, ...patch };
    dirty = true;
  }

  function updateProvider(providerKey: string, patch: Partial<TtsProviderConfig>) {
    draft = {
      ...draft,
      [providerKey]: {
        ...(draft[providerKey as keyof TtsConfig] as TtsProviderConfig || {}),
        ...patch
      }
    };
    dirty = true;
  }

  function updateParam(key: string, val: any) {
    paramsState = { ...paramsState, [key]: val };
    dirty = true;
  }

  async function handleSave() {
    const providerKey = draft.provider as keyof TtsConfig;
    let enriched = { ...draft };
    
    if (providerKey && enriched[providerKey]) {
      (enriched[providerKey] as TtsProviderConfig).params = paramsState;
    }

    try {
      await saveConfig(enriched);
      dirty = false;
    } catch (e) {
      console.error(e);
    }
  }

  async function handleTestConnection() {
    if (!draft.provider) return;
    testing = true;
    try {
       const subConfig = draft[draft.provider as keyof TtsConfig] as TtsProviderConfig;
       await testConnection({
         provider: draft.provider,
         api_key: subConfig.api_key,
         api_base: subConfig.api_base,
         voice_id: subConfig.voice_id || subConfig.voice,
         model_id: subConfig.model_id || subConfig.model,
         group_id: subConfig.group_id
       });
       alert("Test Connection Successful!");
    } catch (e: any) {
       alert(e.message || "Test failed");
    } finally {
       testing = false;
    }
  }

  function getVoiceId(config: TtsConfig): string {
    switch (config.provider) {
      case "openai": return config.openai?.voice ?? "";
      case "elevenlabs": return config.elevenlabs?.voice_id ?? "";
      case "edge": return config.edge?.voice ?? "";
      case "minimax": return config.minimax?.voice_id ?? "";
      case "gemini": return config.gemini?.voice ?? "";
      default: return "";
    }
  }

  function getModelId(config: TtsConfig): string {
    switch (config.provider) {
      case "openai": return config.openai?.model ?? "";
      case "elevenlabs": return config.elevenlabs?.model_id ?? "";
      case "minimax": return config.minimax?.model ?? "";
      case "gemini": return config.gemini?.model ?? "";
      default: return "";
    }
  }

  let providerCaps = $derived(ttsCapabilitiesState.capabilities.find(c => c.provider === draft.provider));
  let isCredentialsSaved = $derived(
    draft.provider === 'edge' || 
    (providerCaps && providerCaps.requires_api_key === false) ||
    !!(draft[draft.provider as keyof TtsConfig] as TtsProviderConfig)?.api_key
  );

  let showCredentialsSection = $derived(
    draft.provider && draft.provider !== 'edge' && providerCaps?.requires_api_key !== false
  );

</script>

<div class="p-4 sm:p-6 pb-10 flex-1 flex flex-col max-w-7xl mx-auto w-full min-h-0 overflow-y-auto custom-scrollbar">
  
  <!-- Global Background Effects -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none"></div>

  <!-- HUD Header -->
  <div class="shrink-0 relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-goclaw-neon-cyan/10 rounded-full blur-[80px] pointer-events-none"></div>
    
    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 bg-goclaw-neon-purple/20 rounded-xl border border-goclaw-neon-purple/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
            <Volume2 class="h-6 w-6 text-goclaw-neon-purple" />
          </div>
          <h1 class="text-2xl font-black uppercase tracking-[0.2em] text-white drop-shadow-md">
            Text to Speech
          </h1>
        </div>
        <p class="text-sm font-bold text-white/40 uppercase tracking-widest max-w-2xl leading-relaxed">
          Configure the audio synthesis engine for your agents. Select a provider, authenticate, and customize the voice and behavior.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button 
          type="button"
          onclick={loadConfig} 
          disabled={ttsState.loading}
          class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105"
        >
          <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          <RefreshCw class="h-3.5 w-3.5 relative z-10 text-white/30 group-hover:text-white/70 transition-colors duration-500 {ttsState.loading ? 'animate-spin' : ''}" />
          <span class="relative z-10 drop-shadow-md">Refresh</span>
        </button>

        <button 
          type="button"
          onclick={handleSave} 
          disabled={!dirty || ttsState.saving}
          class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group {dirty ? 'text-goclaw-neon-purple hover:text-white shadow-[0_0_20px_rgba(217,70,239,0.15)] hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:scale-105' : 'text-white/30 bg-white/5 border border-white/10'}"
        >
          {#if dirty}
            <div class="absolute inset-0 bg-gradient-to-r from-goclaw-neon-purple/20 to-goclaw-neon-purple/5 border border-goclaw-neon-purple/50 rounded-xl transition-all group-hover:opacity-80"></div>
          {/if}
          <Save class="h-3.5 w-3.5 relative z-10 transition-colors duration-500" />
          <span class="relative z-10 drop-shadow-md">{ttsState.saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  </div>

  <div class="mt-6 flex flex-col gap-6">
    <ProviderSetup 
      provider={draft.provider} 
      onChange={(v) => updateDraft({ provider: v })} 
    />

    {#if showCredentialsSection}
      <CredentialsSection 
        provider={draft.provider}
        {draft}
        onUpdate={updateProvider}
        onTest={handleTestConnection}
        {testing}
      />
    {/if}

    {#if draft.provider && isCredentialsSaved}
      <VoiceConfigSection 
        provider={draft.provider}
        {draft}
        capabilities={providerCaps}
        {paramsState}
        onUpdateProvider={updateProvider}
        onParamChange={updateParam}
      />

      <TestPlayground 
        {synthesize}
        provider={draft.provider}
        voiceId={getVoiceId(draft)}
        modelId={getModelId(draft)}
        showAudioTags={!!providerCaps?.custom_features?.audio_tags}
      />
    {/if}

    <BehaviorSection 
      {draft}
      onUpdate={updateDraft}
    />
  </div>
</div>
