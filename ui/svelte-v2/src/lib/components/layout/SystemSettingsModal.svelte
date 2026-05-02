<script lang="ts">
  import { onMount } from "svelte";
  import { Settings2, Loader2, Save, AlertTriangle, Info, ExternalLink, Network, Cog, Eye, MessageSquareText, Brain, X, CheckCircle2, Layers, RefreshCw, XCircle } from "lucide-svelte";
  import { useHttp } from "../../state/ws.svelte";
  import { loadProviders, providersState } from "../../state/providers.svelte";
  import { Button } from "../ui/button";
  import { _ } from "svelte-i18n";
  import { parseBool, DEFAULTS, EMBEDDING_MODELS, DEFAULT_EMBEDDING_MODELS, type InitState } from "./system-settings-constants";
  import ProviderModelSelect from "../shared/ProviderModelSelect.svelte";
  import Combobox from "../ui/Combobox.svelte";

  type Props = {
    open: boolean;
    onClose: () => void;
  };

  let { open, onClose }: Props = $props();

  let loading = $state(false);
  let saving = $state(false);
  let init = $state<InitState>(DEFAULTS);

  // Form state
  let embProvider = $state("");
  let embModel = $state("");
  let embMaxChunkLen = $state("");
  let embChunkOverlap = $state("");
  
  let embVerifying = $state(false);
  let embResult = $state<any>(null);
  let showReindexWarning = $state(false);

  let toolStatus = $state(true);
  let blockReply = $state(false);
  let intentClassify = $state(true);

  let compProvider = $state("");
  let compModel = $state("");
  let compThreshold = $state("");
  let compKeepRecent = $state("");
  let compMaxTokens = $state("");

  let kgProvider = $state("");
  let kgModel = $state("");
  let kgMinConfidence = $state("0.75");

  let bgProvider = $state("");
  let bgModel = $state("");

  async function loadSettings() {
    loading = true;
    try {
      const http = useHttp();
      await loadProviders();

      const [configs, kgRes] = await Promise.all([
        http.get<Record<string, string>>("/v1/system-configs"),
        http.get<{ settings?: any }>("/v1/tools/builtin/knowledge_graph_search").catch(() => ({ settings: {} }))
      ]);

      const kgSettings = kgRes.settings || {};

      init = {
        embProvider: configs["embedding.provider"] ?? "", 
        embModel: configs["embedding.model"] ?? "",
        embMaxChunkLen: configs["embedding.max_chunk_len"] ?? DEFAULTS.embMaxChunkLen, 
        embChunkOverlap: configs["embedding.chunk_overlap"] ?? DEFAULTS.embChunkOverlap,
        toolStatus: parseBool(configs["gateway.tool_status"], DEFAULTS.toolStatus), 
        blockReply: parseBool(configs["gateway.block_reply"], DEFAULTS.blockReply),
        intentClassify: parseBool(configs["gateway.intent_classify"], DEFAULTS.intentClassify),
        compProvider: configs["compaction.provider"] ?? "", 
        compModel: configs["compaction.model"] ?? "",
        compThreshold: configs["compaction.threshold"] ?? DEFAULTS.compThreshold, 
        compKeepRecent: configs["compaction.keep_recent"] ?? DEFAULTS.compKeepRecent,
        compMaxTokens: configs["compaction.max_tokens"] ?? DEFAULTS.compMaxTokens,
        kgProvider: kgSettings?.extraction_provider ?? "", 
        kgModel: kgSettings?.extraction_model ?? "",
        kgMinConfidence: String(kgSettings?.min_confidence ?? DEFAULTS.kgMinConfidence),
        bgProvider: configs["background.provider"] ?? "", 
        bgModel: configs["background.model"] ?? "",
      };

      embProvider = init.embProvider; embModel = init.embModel;
      embMaxChunkLen = init.embMaxChunkLen; embChunkOverlap = init.embChunkOverlap;
      toolStatus = init.toolStatus; blockReply = init.blockReply; intentClassify = init.intentClassify;
      compProvider = init.compProvider; compModel = init.compModel;
      compThreshold = init.compThreshold; compKeepRecent = init.compKeepRecent; compMaxTokens = init.compMaxTokens;
      kgProvider = init.kgProvider; kgModel = init.kgModel; kgMinConfidence = init.kgMinConfidence;
      bgProvider = init.bgProvider; bgModel = init.bgModel;
      embResult = null;

    } catch (e) {
      console.error("Failed to load system settings", e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (open) loadSettings();
  });

  $effect(() => {
    if (open) loadSettings();
  });

  async function handleVerifyEmbedding() {
    const provider = providersState.providers.find(p => p.name === embProvider);
    if (!provider) return;
    
    embVerifying = true;
    embResult = null;
    try {
        const http = useHttp();
        const res = await http.post<any>(`/v1/providers/${provider.id}/verify-embedding`, {
            model: embModel
        });
        embResult = res;
    } catch (e: any) {
        embResult = { valid: false, error: e.message || "Verification failed" };
    } finally {
        embVerifying = false;
    }
  }

  async function handleSave() {
    if (!showReindexWarning) {
      if (embModel !== init.embModel || embMaxChunkLen !== init.embMaxChunkLen) {
        showReindexWarning = true;
        return;
      }
    }
    await executeSave();
  }

  async function executeSave() {
    showReindexWarning = false;
    saving = true;
    try {
      const http = useHttp();
      const updates: Record<string, string> = {};
      
      // Ensure numeric values are sent as STRINGS to match backend expectation
      const s = (v: any) => String(v);

      if (embProvider !== init.embProvider) updates["embedding.provider"] = s(embProvider);
      if (embModel !== init.embModel) updates["embedding.model"] = s(embModel);
      if (embMaxChunkLen !== init.embMaxChunkLen) updates["embedding.max_chunk_len"] = s(embMaxChunkLen);
      if (embChunkOverlap !== init.embChunkOverlap) updates["embedding.chunk_overlap"] = s(embChunkOverlap);
      if (toolStatus !== init.toolStatus) updates["gateway.tool_status"] = s(toolStatus);
      if (blockReply !== init.blockReply) updates["gateway.block_reply"] = s(blockReply);
      if (intentClassify !== init.intentClassify) updates["gateway.intent_classify"] = s(intentClassify);
      if (compProvider !== init.compProvider) updates["compaction.provider"] = s(compProvider);
      if (compModel !== init.compModel) updates["compaction.model"] = s(compModel);
      if (compThreshold !== init.compThreshold) updates["compaction.threshold"] = s(compThreshold);
      if (compKeepRecent !== init.compKeepRecent) updates["compaction.keep_recent"] = s(compKeepRecent);
      if (compMaxTokens !== init.compMaxTokens) updates["compaction.max_tokens"] = s(compMaxTokens);
      if (bgProvider !== init.bgProvider) updates["background.provider"] = s(bgProvider);
      if (bgModel !== init.bgModel) updates["background.model"] = s(bgModel);

      for (const [key, value] of Object.entries(updates)) {
        await http.put(`/v1/system-configs/${key}`, { value });
      }

      if (kgProvider !== init.kgProvider || kgModel !== init.kgModel || kgMinConfidence !== init.kgMinConfidence) {
        await http.put("/v1/tools/builtin/knowledge_graph_search", {
          settings: { 
            extraction_provider: kgProvider, 
            extraction_model: kgModel, 
            min_confidence: Number(kgMinConfidence) || 0.75, 
            extract_on_memory_write: !!(kgProvider && kgModel) 
          },
        });
      }

      onClose();
    } catch (e) {
      console.error("Failed to save settings", e);
    } finally {
      saving = false;
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  let embExtraModels = $derived.by(() => {
    // Return exactly the catalog the user requested
    return DEFAULT_EMBEDDING_MODELS;
  });

  let canVerify = $derived(!!embProvider && !!embModel && !embVerifying);
</script>

{#if open}
  <div 
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-3xl p-4 animate-in fade-in duration-500"
    onclick={handleBackdropClick}
  >
    <div class="glass-panel w-full max-w-4xl max-h-[95vh] flex flex-col shadow-[0_0_100px_rgba(217,70,239,0.3)] border-[#d946ef]/20 overflow-hidden animate-in zoom-in-95 duration-300">
      
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
        <div class="flex items-center gap-4">
           <div class="h-12 w-12 rounded-2xl bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/20 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2)]">
             <Settings2 class="h-6 w-6 text-goclaw-neon-purple" />
           </div>
           <div>
             <h2 class="text-2xl font-extrabold tracking-tighter text-white uppercase italic">{$_('topbar.systemSettings', { default: 'System Settings' })}</h2>
             <p class="text-[10px] text-white/30 font-bold uppercase tracking-[0.4em] mt-0.5 ml-0.5">{$_('overview.systemSettings.subtitle', { default: 'NIX-0 Core Infrastructure Control' })}</p>
           </div>
        </div>
        <button onclick={onClose} class="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all duration-300">
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-12 custom-scrollbar bg-black/40">
        {#if loading}
          <div class="py-32 flex flex-col items-center justify-center space-y-6">
             <div class="relative">
                <div class="absolute inset-0 bg-goclaw-neon-purple/20 blur-xl rounded-full"></div>
                <Loader2 class="h-12 w-12 animate-spin text-goclaw-neon-purple relative z-10" />
             </div>
             <span class="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em] animate-pulse">{$_('common.loading', { default: 'Syncing Neural Core...' })}</span>
          </div>
        {:else}
          
          <!-- EMBEDDING SECTION -->
          <section class="space-y-6 p-8 rounded-[2.5rem] border border-blue-500/10 bg-blue-500/[0.02] relative overflow-hidden group hover:border-blue-500/30 transition-all duration-700 shadow-2xl">
             <div class="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000">
                <Brain class="h-48 w-48 text-blue-500" />
             </div>

             <div class="space-y-1">
                <div class="flex items-center gap-3">
                   <div class="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <Brain class="h-5 w-5" />
                   </div>
                   <h3 class="text-lg font-extrabold uppercase tracking-widest text-blue-400 italic">{$_('overview.embedding.title', { default: 'Embedding' })}</h3>
                </div>
                <p class="text-xs text-white/40 ml-10">{$_('overview.embedding.description', { default: 'Neural vector mapping and semantic search core engine.' })}</p>
             </div>
             
             <div class="flex items-start gap-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-6 py-5 text-xs text-blue-300 shadow-inner ml-10">
                <Info class="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                <div class="space-y-2">
                  <p class="font-bold text-blue-200 uppercase tracking-wider text-[10px]">Strategic Impact Notice</p>
                  <p class="opacity-80 leading-relaxed font-medium">{$_('overview.embedding.noticeDesc', { default: 'Embedding is critical for memory recall, skill search, and knowledge graph accuracy. Changes affect the entire system footprint.' })}</p>
                  <p class="opacity-40 leading-relaxed font-mono text-[9px] uppercase tracking-tighter pt-1 border-t border-blue-500/10">{$_('overview.embedding.verifiedModels', { default: 'Verified 1536d: OpenAI (text-v3), Gemini (embedding-001), Mistral, Cohere (v4). Standard: 1536.' })}</p>
                </div>
             </div>

             <div class="ml-10 space-y-6">
                <ProviderModelSelect 
                    provider={embProvider} 
                    onProviderChange={(v) => { embProvider = v; embModel = ""; embResult = null; }}
                    model={embModel}
                    onModelChange={(v) => { embModel = v; embResult = null; }}
                    label={$_('common.provider', { default: 'Embedding Provider' })}
                    extraModels={embExtraModels}
                    modelFilter="embed"
                />

                <div class="flex items-center gap-4">
                    <button 
                        onclick={handleVerifyEmbedding}
                        disabled={!canVerify}
                        class="h-14 relative flex items-center justify-center gap-2 px-8 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 overflow-hidden group text-white hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 bg-black/80 disabled:opacity-50 disabled:hover:scale-100 disabled:grayscale"
                    >
                        <div class="absolute inset-0 bg-gradient-to-t from-blue-500/30 to-transparent border border-blue-500/50 rounded-xl"></div>
                        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] rounded-t-full"></div>
                        <div class="absolute inset-0 opacity-40 blur-xl bg-blue-500 pointer-events-none group-hover:opacity-70 transition-opacity"></div>
                        <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
                        
                        <span class="relative z-10 flex items-center drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                            {#if embVerifying}
                                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                                {$_('overview.embedding.verifying', { default: 'Verifying Enlace...' })}
                            {:else}
                                {$_('overview.embedding.verifyLink', { default: 'Verify Neural Link' })}
                            {/if}
                        </span>
                    </button>

                    {#if embResult}
                        <div class="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                            {#if embResult.valid && embResult.dimensions > 0}
                                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    <CheckCircle2 class="h-4 w-4 text-emerald-500" />
                                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                                        {$_('overview.embedding.activeDim', { values: { count: embResult.dimensions }, default: `Active: ${embResult.dimensions} DIM` })}
                                    </span>
                                </div>
                                {#if embResult.dimension_mismatch}
                                    <span class="text-[9px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">{$_('overview.embedding.mismatch', { default: '(Mismatch: standard 1536)' })}</span>
                                {/if}
                            {:else}
                                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                    <XCircle class="h-4 w-4 text-red-500" />
                                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
                                        {embResult.error || $_('common.verificationFailed', { default: 'Connection Failed' })}
                                    </span>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>

                <div class="grid gap-6 sm:grid-cols-2 p-6 rounded-3xl bg-black/40 border border-white/5 shadow-2xl">
                    <div class="space-y-2">
                       <div class="flex items-center gap-2 ml-1">
                          <label class="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{$_('overview.embedding.maxChunkLength', { default: 'Max Chunk Length' })}</label>
                          <Info class="h-3 w-3 text-white/10" />
                       </div>
                       <div class="relative z-10">
                         <Combobox
                             value={String(embMaxChunkLen)}
                             onChange={(v) => embMaxChunkLen = v}
                             options={[
                               { value: "512", label: "512 (Small / Precise)" },
                               { value: "1000", label: "1000 (Medium / Balanced)" },
                               { value: "2048", label: "2048 (Large / Contextual)" }
                             ]}
                             placeholder="Select Chunk Size..."
                             allowCustom={false}
                         />
                       </div>
                       <p class="text-[9px] text-white/20 ml-2 italic mt-2">{$_('overview.embedding.maxChunkLengthDesc', { default: 'Límite de caracteres por fragmento de memoria.' })}</p>
                    </div>
                    <div class="space-y-2">
                       <div class="flex items-center gap-2 ml-1">
                          <label class="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{$_('overview.embedding.chunkOverlap', { default: 'Chunk Overlap' })}</label>
                          <Info class="h-3 w-3 text-white/10" />
                       </div>
                       <input type="number" bind:value={embChunkOverlap} class="w-full h-12 px-5 rounded-2xl bg-white/[0.02] border border-white/10 text-white font-mono text-sm focus:border-blue-500 outline-none transition-all shadow-inner" placeholder={DEFAULTS.embChunkOverlap} />
                       <p class="text-[9px] text-white/20 ml-2 italic">{$_('overview.embedding.chunkOverlapDesc', { default: 'Solapamiento para preservación de contexto.' })}</p>
                    </div>
                </div>
             </div>
          </section>

          <!-- KNOWLEDGE GRAPH SECTION -->
          <section class="space-y-6 p-8 rounded-[2.5rem] border border-goclaw-neon-magenta/10 bg-goclaw-neon-magenta/[0.02] relative group hover:border-goclaw-neon-magenta/30 transition-all duration-700 shadow-2xl">
             <div class="space-y-1">
                <div class="flex items-center gap-3">
                   <div class="p-2 rounded-xl bg-goclaw-neon-magenta/10 text-goclaw-neon-magenta">
                      <Network class="h-5 w-5" />
                   </div>
                   <h3 class="text-lg font-extrabold uppercase tracking-widest text-goclaw-neon-magenta italic">{$_('overview.knowledgeGraph.title', { default: 'Knowledge Graph' })}</h3>
                </div>
                <p class="text-xs text-white/40 ml-10">{$_('overview.knowledgeGraph.description', { default: 'Entity extraction and relationship mapping protocols.' })}</p>
             </div>

             <div class="flex items-start gap-4 rounded-2xl border border-goclaw-neon-magenta/20 bg-goclaw-neon-magenta/5 px-6 py-5 text-xs text-goclaw-neon-magenta shadow-inner ml-10">
                <Info class="mt-0.5 h-5 w-5 shrink-0 text-goclaw-neon-magenta" />
                <div class="space-y-2">
                  <p class="font-bold text-goclaw-neon-magenta uppercase tracking-wider text-[10px]">Knowledge Extraction Protocol</p>
                  <p class="opacity-80 leading-relaxed font-medium">{$_('overview.knowledgeGraph.info', { default: 'Automatically extracts entities and relationships when agents write to memory. Leave provider empty to disable.' })}</p>
                </div>
             </div>

             <div class="ml-10 space-y-6">
                <ProviderModelSelect 
                    provider={kgProvider} 
                    onProviderChange={(v) => { kgProvider = v; kgModel = ""; }}
                    model={kgModel}
                    onModelChange={(v) => kgModel = v}
                    label={$_('common.provider', { default: 'Extraction Provider' })}
                />
                <div class="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-2xl">
                    <div class="space-y-2">
                       <label class="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">{$_('overview.knowledgeGraph.confidence', { default: 'Confidence Threshold' })}</label>
                       <div class="flex items-center gap-4">
                          <input type="range" min="0" max="1" step="0.05" bind:value={kgMinConfidence} class="flex-1 accent-goclaw-neon-magenta" />
                          <span class="text-lg font-mono font-bold text-goclaw-neon-magenta min-w-[3rem] text-right">{Number(kgMinConfidence).toFixed(2)}</span>
                       </div>
                       <p class="text-[9px] text-white/20 ml-1 italic leading-tight">{$_('overview.knowledgeGraph.confidenceDesc', { default: 'Nivel de certeza requerido para extraer una entidad al grafo.' })}</p>
                    </div>
                </div>
             </div>
          </section>

          <!-- COMPACTION SECTION -->
          <section class="space-y-6 p-8 rounded-[2.5rem] border border-emerald-500/10 bg-emerald-500/[0.02] relative group hover:border-emerald-500/30 transition-all duration-700 shadow-2xl">
            <div class="space-y-1">
               <div class="flex items-center gap-3">
                  <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                     <RefreshCw class="h-5 w-5" />
                  </div>
                  <h3 class="text-lg font-extrabold uppercase tracking-widest text-emerald-400 italic">{$_('overview.compaction.title', { default: 'Compaction' })}</h3>
               </div>
               <p class="text-xs text-white/40 ml-10">{$_('overview.compaction.description', { default: 'Context summarization and token pressure management.' })}</p>
            </div>

            <div class="flex items-start gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-5 text-xs text-emerald-400 shadow-inner ml-10">
                <Info class="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div class="space-y-2">
                  <p class="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Token Pressure Management</p>
                  <p class="opacity-80 leading-relaxed font-medium">{$_('overview.compaction.info', { default: 'When a group chat exceeds the threshold, the LLM automatically summarizes older messages into a single compact entry.' })}</p>
                </div>
             </div>

            <div class="ml-10 space-y-6">
                <ProviderModelSelect 
                    provider={compProvider} 
                    onProviderChange={(v) => { compProvider = v; compModel = ""; }}
                    model={compModel}
                    onModelChange={(v) => compModel = v}
                    label={$_('common.provider', { default: 'Compaction Provider' })}
                />
                <div class="grid gap-6 sm:grid-cols-2 p-6 rounded-3xl bg-black/40 border border-white/5 shadow-2xl">
                   <div class="space-y-2">
                      <label class="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">{$_('overview.compaction.threshold', { default: 'Trigger Threshold' })}</label>
                      <input type="number" bind:value={compThreshold} class="w-full h-12 px-5 rounded-2xl bg-white/[0.02] border border-white/10 text-white font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner" placeholder={DEFAULTS.compThreshold} />
                      <p class="text-[9px] text-white/20 ml-2 italic">{$_('overview.compaction.thresholdDesc', { default: 'Tokens antes de iniciar la compactación.' })}</p>
                   </div>
                   <div class="space-y-2">
                      <label class="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">{$_('overview.compaction.maxTokens', { default: 'Max Context Tokens' })}</label>
                      <input type="number" bind:value={compMaxTokens} class="w-full h-12 px-5 rounded-2xl bg-white/[0.02] border border-white/10 text-white font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner" placeholder={DEFAULTS.compMaxTokens} />
                      <p class="text-[9px] text-white/20 ml-2 italic">{$_('overview.compaction.maxTokensDesc', { default: 'Límite absoluto de la ventana de contexto.' })}</p>
                   </div>
                </div>
            </div>
          </section>

          <!-- BEHAVIOR SECTION -->
          <section class="space-y-6 p-8 rounded-[2.5rem] border border-amber-500/10 bg-amber-500/[0.02] relative group hover:border-amber-500/30 transition-all duration-700 shadow-2xl">
             <div class="space-y-1">
                <div class="flex items-center gap-3">
                   <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <Brain class="h-5 w-5" />
                   </div>
                   <h3 class="text-lg font-extrabold uppercase tracking-widest text-amber-400 italic">{$_('overview.behavior.title', { default: 'Behavior' })}</h3>
                </div>
                <p class="text-xs text-white/40 ml-10">{$_('overview.behavior.description', { default: 'User experience and autonomous agent protocols.' })}</p>
             </div>

             <div class="ml-10 space-y-4">
                <button 
                  onclick={() => toolStatus = !toolStatus}
                  class="w-full flex items-center justify-between p-5 rounded-3xl bg-black/40 border border-white/5 hover:bg-white/[0.04] transition-all text-left group/item"
                >
                   <div class="flex items-center gap-4">
                      <div class="p-3 rounded-2xl bg-blue-500/10 text-blue-400 group-hover/item:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                        <Eye class="h-5 w-5" />
                      </div>
                      <div>
                        <p class="text-sm font-black text-white uppercase tracking-wider">{$_('overview.behavior.toolStatus', { default: 'Live Tool Status' })}</p>
                        <p class="text-[10px] text-white/30 font-mono tracking-tighter uppercase mt-1">{$_('overview.behavior.toolStatusDesc', { default: 'Real-time telemetry for autonomous tool calls' })}</p>
                      </div>
                   </div>
                   <div class={`w-12 h-6 rounded-full relative transition-all duration-500 shadow-inner ${toolStatus ? 'bg-blue-600/30 border-blue-500/50' : 'bg-black border-white/10'} border-2`}>
                      <div class={`w-4 h-4 bg-white rounded-full absolute top-[2px] transition-transform duration-500 ${toolStatus ? 'translate-x-[24px] shadow-[0_0_12px_white]' : 'translate-x-1 opacity-20'}`}></div>
                   </div>
                </button>

                <button 
                  onclick={() => blockReply = !blockReply}
                  class="w-full flex items-center justify-between p-5 rounded-3xl bg-black/40 border border-white/5 hover:bg-white/[0.04] transition-all text-left group/item"
                >
                   <div class="flex items-center gap-4">
                      <div class="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover/item:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                        <MessageSquareText class="h-5 w-5" />
                      </div>
                      <div>
                        <p class="text-sm font-black text-white uppercase tracking-wider">{$_('overview.behavior.safetyBlock', { default: 'Safety Block on Error' })}</p>
                        <p class="text-[10px] text-white/30 font-mono tracking-tighter uppercase mt-1">{$_('overview.behavior.safetyBlockDesc', { default: 'Prevent chain corruption on failed tool execution' })}</p>
                      </div>
                   </div>
                   <div class={`w-12 h-6 rounded-full relative transition-all duration-500 shadow-inner ${blockReply ? 'bg-emerald-600/30 border-emerald-500/50' : 'bg-black border-white/10'} border-2`}>
                      <div class={`w-4 h-4 bg-white rounded-full absolute top-[2px] transition-transform duration-500 ${blockReply ? 'translate-x-[24px] shadow-[0_0_12px_white]' : 'translate-x-1 opacity-20'}`}></div>
                   </div>
                </button>

                <button 
                  onclick={() => intentClassify = !intentClassify}
                  class="w-full flex items-center justify-between p-5 rounded-3xl bg-black/40 border border-white/5 hover:bg-white/[0.04] transition-all text-left group/item"
                >
                   <div class="flex items-center gap-4">
                      <div class="p-3 rounded-2xl bg-orange-500/10 text-orange-400 group-hover/item:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all">
                        <Brain class="h-5 w-5" />
                      </div>
                      <div>
                        <p class="text-sm font-black text-white uppercase tracking-wider">{$_('overview.behavior.intentEngine', { default: 'Intent Engine' })}</p>
                        <p class="text-[10px] text-white/30 font-mono tracking-tighter uppercase mt-1">{$_('overview.behavior.intentEngineDesc', { default: 'Advanced user intent parsing and dynamic routing' })}</p>
                      </div>
                   </div>
                   <div class={`w-12 h-6 rounded-full relative transition-all duration-500 shadow-inner ${intentClassify ? 'bg-orange-600/30 border-orange-500/50' : 'bg-black border-white/10'} border-2`}>
                      <div class={`w-4 h-4 bg-white rounded-full absolute top-[2px] transition-transform duration-500 ${intentClassify ? 'translate-x-[24px] shadow-[0_0_12px_white]' : 'translate-x-1 opacity-20'}`}></div>
                   </div>
                </button>
             </div>
          </section>

          <!-- WORKERS SECTION -->
          <section class="space-y-6 p-8 rounded-[2.5rem] border border-goclaw-neon-purple/10 bg-goclaw-neon-purple/[0.02] relative group hover:border-goclaw-neon-purple/30 transition-all duration-700 shadow-2xl">
             <div class="space-y-1">
                <div class="flex items-center gap-3">
                   <div class="p-2 rounded-xl bg-goclaw-neon-purple/10 text-goclaw-neon-purple">
                      <Cog class="h-5 w-5" />
                   </div>
                   <h3 class="text-lg font-extrabold uppercase tracking-widest text-goclaw-neon-purple italic">{$_('overview.workers.title', { default: 'Workers' })}</h3>
                </div>
                <p class="text-xs text-white/40 ml-10">{$_('overview.workers.description', { default: 'Background synchronization and autonomous tasks.' })}</p>
             </div>

             <div class="flex items-start gap-4 rounded-2xl border border-goclaw-neon-purple/20 bg-goclaw-neon-purple/5 px-6 py-5 text-xs text-goclaw-neon-purple shadow-inner ml-10">
                <Info class="mt-0.5 h-5 w-5 shrink-0 text-goclaw-neon-purple" />
                <div class="space-y-2">
                  <p class="font-bold text-goclaw-neon-purple uppercase tracking-wider text-[10px]">Background Processing Unit</p>
                  <p class="opacity-80 leading-relaxed font-medium">{$_('overview.workers.info', { default: 'Used for vault enrichment, consolidation, and dreaming. Fallback to agent default if empty.' })}</p>
                </div>
             </div>

             <div class="ml-10">
                <ProviderModelSelect 
                    provider={bgProvider} 
                    onProviderChange={(v) => { bgProvider = v; bgModel = ""; }}
                    model={bgModel}
                    onModelChange={(v) => bgModel = v}
                    label={$_('common.provider', { default: 'Background Provider' })}
                />
             </div>
          </section>

        {/if}
      </div>

      <!-- Footer -->
      <div class="p-8 border-t border-white/5 bg-white/[0.03] flex items-center justify-between">
        <button 
          onclick={() => { window.location.href = '/config'; onClose(); }}
          class="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-goclaw-neon-cyan transition-all duration-500"
        >
          <ExternalLink class="h-4 w-4" /> {$_('overview.systemSettings.advancedConfig', { default: 'Advanced Deployment Config' })}
        </button>
        <div class="flex items-center gap-4">
          <button 
            onclick={onClose} 
            disabled={saving} 
            class="h-14 relative flex items-center justify-center gap-2 px-10 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 overflow-hidden group text-white/50 hover:text-white hover:scale-[1.02] border border-white/10 bg-black/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:hover:scale-100 min-w-[150px]"
          >
            <div class="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_3s_infinite]"></div>
            <span class="relative z-10 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{$_('common.cancel', { default: 'Cancel' })}</span>
          </button>

          <button 
            onclick={handleSave} 
            disabled={saving} 
            class="h-14 relative flex items-center justify-center gap-2 px-10 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 overflow-hidden group text-white hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 bg-black/80 disabled:opacity-50 disabled:hover:scale-100 disabled:grayscale min-w-[300px]"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
            <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none group-hover:opacity-70 transition-opacity"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
            
            <span class="relative z-10 flex items-center drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              {#if saving}
                <Loader2 class="h-4 w-4 animate-spin mr-3" />
                {$_('common.saving', { default: 'SYNCHRONIZING...' })}
              {:else}
                <Save class="h-4 w-4 mr-3" />
                {$_('overview.systemSettings.neuralCoreChanges', { default: 'APPLY NEURAL CORE CHANGES' })}
              {/if}
            </span>
          </button>
        </div>
      </div>

    </div>
  </div>

  <!-- Re-index Warning Modal -->
  {#if showReindexWarning}
    <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div class="bg-[#0a0000] border border-red-500/50 rounded-2xl w-full max-w-lg p-6 shadow-[0_0_50px_rgba(239,68,68,0.15),inset_0_0_20px_rgba(239,68,68,0.1)] relative overflow-hidden">
        <!-- Neon accent -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
        
        <div class="flex items-center gap-3 text-red-500 mb-4 mt-2">
          <AlertTriangle class="h-6 w-6 animate-pulse" />
          <h3 class="text-lg font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Critical Warning</h3>
        </div>
        
        <p class="text-white/80 text-sm leading-relaxed mb-6 font-mono bg-red-950/30 p-4 rounded-xl border border-red-500/20">
          Changing the embedding model or max chunk length requires re-calculating all memory and knowledge graph vectors. This action will temporarily degrade semantic search performance while the background workers rebuild the dimensions. Do you wish to proceed?
        </p>
        
        <div class="flex justify-end gap-3 mt-8">
          <button 
            onclick={(e) => { e.stopPropagation(); showReindexWarning = false; }}
            class="px-5 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            onclick={(e) => { e.stopPropagation(); executeSave(); }}
            disabled={saving}
            class="px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300 hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            {#if saving}
              <Loader2 class="h-4 w-4 animate-spin" /> Proceeding...
            {:else}
              <AlertTriangle class="h-4 w-4" /> Proceed
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.08);
  }
</style>