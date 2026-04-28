<script lang="ts">
  import { Cpu, ArrowLeft, Save, Server, Copy, Check, Lock, Info } from "lucide-svelte";
  import { useProviders } from "./hooks/use-providers.svelte";
  import { PROVIDER_TYPE_BADGE } from "./provider-utils";
  import type { ProviderInput } from "../../../../web/src/types/provider";
  import { getChatGPTOAuthProviderRouting, getProviderReasoningDefaults, getEmbeddingSettings, deriveLegacyThinkingLevel } from "../../../../web/src/types/provider";
  import { getChatGPTOAuthPoolOwnership } from "./provider-utils";
  import { useProviderModels } from "./hooks/use-provider-models.svelte";
  import { useProviderVerify } from "./hooks/use-provider-verify.svelte";
  import ProviderReasoningSection from "./components/provider-detail/ProviderReasoningSection.svelte";
  import ProviderEmbeddingSection from "./components/provider-detail/ProviderEmbeddingSection.svelte";
  import ProviderOAuthSection from "./components/provider-detail/ProviderOAuthSection.svelte";

  type Props = {
    id: string;
    onBack: () => void;
  };

  let { id, onBack }: Props = $props();
  const { providers, updateProvider } = useProviders(false);

  const provider = $derived(providers.find(p => p.id === id));
  const typeBadge = $derived(provider ? (PROVIDER_TYPE_BADGE[provider.provider_type] ?? { label: provider.provider_type, variant: "outline" }) : null);
  const isOAuth = $derived(provider?.provider_type === "chatgpt_oauth");

  // Local state for editing
  let displayName = $state("");
  let apiKey = $state("");
  let enabled = $state(false);
  let initialized = $state(false);

  const modelsHook = useProviderModels(id);
  const verifyHook = useProviderVerify();

  const poolOwnership = $derived(getChatGPTOAuthPoolOwnership(providers));
  const managedByOwnerName = $derived(isOAuth && provider ? poolOwnership.ownerByMember.get(provider.name) : undefined);
  const managedByProviderDisplayName = $derived(managedByOwnerName ? providers.find(p => p.name === managedByOwnerName)?.display_name : undefined);
  const managedMemberCount = $derived(isOAuth && provider ? (poolOwnership.membersByOwner.get(provider.name)?.length ?? 0) : 0);
  const canEditPoolRouting = $derived(isOAuth && !managedByOwnerName);

  let reasoningThinkingLevel = $state("off");
  let reasoningEffort = $state("off");
  let reasoningFallback = $state("downgrade");
  let reasoningExpert = $state(false);
  let reasoningPreviewModel = $state("");

  let embEnabled = $state(false);
  let embModel = $state("");
  let embApiBase = $state("");

  let poolRouting = $state<any>({ strategy: "primary_first", extra_provider_names: [] });
  
  // Keep original baseline settings JSON string to compute isDirty
  let originalSettingsJson = $state("{}");

  // Sync state from provider when it loads
  $effect(() => {
    if (provider && !initialized) {
      displayName = provider.display_name || "";
      apiKey = provider.api_key || "";
      enabled = provider.enabled;

      const routing = getChatGPTOAuthProviderRouting(provider.settings);
      poolRouting = { strategy: routing?.strategy ?? "primary_first", extra_provider_names: routing?.extraProviderNames ?? [] };

      const es = getEmbeddingSettings(provider.settings);
      embEnabled = es?.enabled ?? false;
      embModel = es?.model ?? "";
      embApiBase = es?.api_base ?? "";

      const initialReasoning = getProviderReasoningDefaults(provider.settings); // Note: react logic falls back to modelsHook.reasoningDefaults, but let's keep it simple
      const rEffort = initialReasoning?.effort ?? "off";
      const rFallback = initialReasoning?.fallback ?? "downgrade";
      reasoningEffort = rEffort;
      reasoningFallback = rFallback;
      reasoningThinkingLevel = deriveLegacyThinkingLevel(rEffort);
      
      const SIMPLE_REASONING_LEVELS = new Set(["off", "low", "medium", "high"]);
      reasoningExpert = Boolean(initialReasoning) && (!SIMPLE_REASONING_LEVELS.has(rEffort) || rFallback !== "downgrade");

      originalSettingsJson = JSON.stringify(provider.settings || {});
      initialized = true;
    }
  });

  $effect(() => {
    if (modelsHook.models.length > 0 && !reasoningPreviewModel) {
      const capable = modelsHook.models.filter(m => (m.reasoning?.levels?.length ?? 0) > 0);
      if (capable.length > 0) reasoningPreviewModel = capable[0].id;
    }
  });

  function buildCurrentSettings() {
    if (!provider) return {};
    const settings = JSON.parse(JSON.stringify(provider.settings || {}));

    // OAuth
    if (isOAuth) {
      if (poolRouting.strategy !== "primary_first") {
        settings.chatgpt_oauth = settings.chatgpt_oauth || {};
        settings.chatgpt_oauth.routing_strategy = poolRouting.strategy;
      } else if (settings.chatgpt_oauth) {
        delete settings.chatgpt_oauth.routing_strategy;
        if (Object.keys(settings.chatgpt_oauth).length === 0) delete settings.chatgpt_oauth;
      }
    }

    // Embeddings
    if (embEnabled) {
      settings.embeddings = { enabled: true, model: embModel };
      if (embApiBase) settings.embeddings.api_base = embApiBase;
    } else {
      delete settings.embeddings;
    }

    // Reasoning
    const currentEffort = reasoningExpert ? reasoningEffort : reasoningThinkingLevel;
    const currentFallback = reasoningExpert ? reasoningFallback : "downgrade";
    if (currentEffort !== "off" || currentFallback !== "downgrade") {
      settings.reasoning_defaults = { effort: currentEffort, fallback: currentFallback };
    } else {
      delete settings.reasoning_defaults;
    }

    return settings;
  }

  const isDirty = $derived(
    provider && (
      displayName !== (provider.display_name || "") ||
      enabled !== provider.enabled ||
      (apiKey !== provider.api_key && apiKey !== "***") ||
      JSON.stringify(buildCurrentSettings()) !== originalSettingsJson
    )
  );

  let saving = $state(false);
  let errorMsg = $state("");
  let copyCopied = $state(false);

  async function handleSave() {
    if (!provider) return;
    saving = true;
    errorMsg = "";
    
    try {
      const data: Partial<ProviderInput> = {
        display_name: displayName || undefined,
        enabled: enabled,
      };
      
      // Only send API key if they changed it
      if (apiKey && apiKey !== "***" && apiKey !== provider.api_key) {
        data.api_key = apiKey;
      }

      data.settings = buildCurrentSettings();

      await updateProvider(provider.id, data);
      
      // Update local baseline to reset isDirty
      apiKey = "***"; 
    } catch (e: any) {
      errorMsg = e.message || "Failed to update provider";
    } finally {
      saving = false;
    }
  }

  function handleCopy() {
    if (provider) {
      navigator.clipboard.writeText(provider.name).catch(() => {});
      copyCopied = true;
      setTimeout(() => copyCopied = false, 2000);
    }
  }

</script>

<div class="relative isolate h-full flex flex-col">
  <!-- Global Background Effects -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.05)_0%,transparent_50%)] pointer-events-none"></div>

  <div class="flex-1 overflow-y-auto p-6 space-y-6 scroller-no-scrollbar relative z-10 pb-24">
    
    <!-- Top Nav -->
    <div class="flex items-center gap-4 mb-8">
      <button 
        onclick={onBack}
        class="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]"
      >
        <ArrowLeft class="h-4 w-4 text-white/70" />
      </button>
      
      <div>
        <h1 class="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Cpu class="h-5 w-5 text-purple-400" />
          {provider?.display_name || provider?.name || 'Loading...'}
        </h1>
        <div class="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-mono">
          ID: {id}
        </div>
      </div>
    </div>

    {#if !provider}
      <div class="flex items-center justify-center h-48">
        <div class="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else}
      <div class="max-w-4xl mx-auto space-y-6">
        
        {#if errorMsg}
          <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <Info class="h-4 w-4" /> {errorMsg}
          </div>
        {/if}

        <!-- Identity Section -->
        <section class="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
          
          <h3 class="text-xs font-black uppercase tracking-widest text-white/80 mb-6 flex items-center gap-2">
            <Cpu class="h-4 w-4 text-purple-400" /> Identity
          </h3>

          <div class="grid gap-6">
            <div class="space-y-3 relative group/input">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Display Name</label>
              <div class="relative">
                  <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                  <input 
                    type="text" 
                    bind:value={displayName} 
                    placeholder={isOAuth ? "OAuth Display Name" : "Display Name"} 
                    class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-sans text-sm outline-none transition-colors relative z-10 focus:bg-black/60" 
                  />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-3">
                <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Provider Type</label>
                <div class="h-11 flex items-center px-4 bg-black/60 border border-white/5 rounded-xl">
                  <span class="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    {typeBadge?.label || provider.provider_type}
                  </span>
                </div>
              </div>

              <div class="space-y-3">
                <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Alias / Internal Name</label>
                <div class="h-11 flex items-center justify-between pl-4 pr-1.5 bg-black/60 border border-white/5 rounded-xl group/alias">
                  <code class="text-sm font-mono text-purple-300/80 truncate pr-4">{provider.name}</code>
                  <button 
                    onclick={handleCopy}
                    class="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors"
                  >
                    {#if copyCopied}
                      <Check class="h-3.5 w-3.5 text-emerald-400" />
                    {:else}
                      <Copy class="h-3.5 w-3.5" />
                    {/if}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- API Key Section (If applicable) -->
        {#if !["acp", "claude_cli", "chatgpt_oauth", "ollama"].includes(provider.provider_type)}
          <section class="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <h3 class="text-xs font-black uppercase tracking-widest text-white/80 mb-6 flex items-center gap-2">
              <Lock class="h-4 w-4 text-emerald-400" /> Security Credentials
            </h3>

            <div class="space-y-3 relative group/input">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">API Key / Bearer Token</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                  <Lock class="h-4 w-4 text-white/30" />
                </div>
                <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-emerald-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]"></div>
                <input 
                  type="password" 
                  bind:value={apiKey} 
                  placeholder="Set new API key..." 
                  class="w-full h-11 pl-10 pr-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none transition-colors relative z-10 focus:bg-black/60" 
                />
              </div>
              <p class="text-[10px] text-white/30 px-1">Leave as *** to keep current key. Editing this will overwrite the stored credential.</p>
            </div>
          </section>
        {/if}

        <!-- Advanced Sections -->
        {#if isOAuth}
          <ProviderOAuthSection 
            providerName={provider.name}
            {managedByOwnerName}
            {managedByProviderDisplayName}
            {managedMemberCount}
            {canEditPoolRouting}
            {poolRouting}
            onPoolRoutingChange={(v) => poolRouting = v}
          />
        {/if}

        <ProviderReasoningSection 
          {reasoningThinkingLevel}
          {reasoningEffort}
          {reasoningFallback}
          {reasoningExpert}
          {reasoningPreviewModel}
          reasoningCapableModels={modelsHook.models.filter(m => (m.reasoning?.levels?.length ?? 0) > 0)}
          reasoningPreviewEntry={modelsHook.models.find(m => m.id === reasoningPreviewModel) || null}
          reasoningPreviewCapability={modelsHook.models.find(m => m.id === reasoningPreviewModel)?.reasoning || null}
          onReasoningThinkingLevelChange={(v) => reasoningThinkingLevel = v}
          onReasoningEffortChange={(v) => reasoningEffort = v}
          onReasoningFallbackChange={(v) => reasoningFallback = v}
          onReasoningExpertChange={(v) => reasoningExpert = v}
          onReasoningPreviewModelChange={(v) => reasoningPreviewModel = v}
        />

        {#if !["chatgpt_oauth", "claude_cli"].includes(provider.provider_type)}
          <ProviderEmbeddingSection 
            {embEnabled}
            {embModel}
            {embApiBase}
            verifyingEmb={verifyHook.verifyingEmb}
            resultEmb={verifyHook.resultEmb}
            errorEmb={verifyHook.errorEmb}
            onEmbEnabledChange={(v) => embEnabled = v}
            onEmbModelChange={(v) => embModel = v}
            onEmbApiBaseChange={(v) => embApiBase = v}
            onVerify={() => {
               verifyHook.verifyEmbeddings(provider.id, {
                  model: embModel,
                  api_base: embApiBase || undefined,
                  api_key: apiKey !== "***" ? apiKey : undefined
               });
            }}
          />
        {/if}

        <!-- Status Section -->
        <section class="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] flex items-center justify-between">
          <div>
            <h3 class="text-xs font-black uppercase tracking-widest text-white/80">Provider Status</h3>
            <p class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Enable or disable routing to this provider across the system.</p>
          </div>
          
          <button 
            onclick={() => enabled = !enabled}
            class={`relative w-14 h-7 rounded-full border transition-all duration-300 ease-in-out ${
              enabled 
                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-black/50 border-white/20'
            }`}
          >
            <div class={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${
              enabled ? 'translate-x-[26px] bg-emerald-400' : 'translate-x-0 bg-white/30'
            }`}></div>
          </button>
        </section>

      </div>
    {/if}
  </div>

  <!-- Sticky Save Bar -->
  <div class={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#030014] via-[#030014]/90 to-transparent flex justify-center transition-all duration-500 z-50 ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
    <div class="bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-3 px-6 shadow-[0_0_30px_rgba(168,85,247,0.2)] flex items-center gap-6">
      <div class="text-[10px] uppercase tracking-widest text-purple-300 font-bold flex items-center gap-2">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
        </span>
        Unsaved Changes
      </div>
      <button 
        onclick={handleSave} 
        disabled={saving} 
        class="relative group px-8 h-10 flex items-center justify-center gap-2 rounded-xl bg-purple-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-purple-400 transition-all disabled:opacity-50 disabled:hover:bg-purple-500 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] overflow-hidden"
      >
        <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
        {#if saving}
          <Server class="h-4 w-4 animate-spin relative z-10" /> <span class="relative z-10">Saving...</span>
        {:else}
          <Save class="h-4 w-4 relative z-10" /> <span class="relative z-10">Deploy Config</span>
        {/if}
      </button>
    </div>
  </div>

</div>
