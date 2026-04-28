<script lang="ts">
  import { BrainCircuit, Settings2, Shield, Search, Database, Layers, Save, Loader2 } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import FormGroup from "../components/FormGroup.svelte";
  import { patchConfig, configStore } from "$lib/state/config.svelte";

  let saving = $derived(configStore.saving);
  let config = $derived(configStore.config || {});

  // Core Defaults
  let provider = $state("");
  let model = $state("");
  let maxTokens = $state(0);
  let temperature = $state(0.0);
  let maxToolIterations = $state(0);
  let contextWindow = $state(0);
  let workspace = $state("");

  // Subagents
  let subagentsMaxConcurrent = $state(0);
  let subagentsMaxSpawnDepth = $state(0);
  let subagentsMaxChildren = $state(0);
  let subagentsArchiveMins = $state(0);
  let subagentsModel = $state("");

  // Memory
  let memoryEnabled = $state(true);
  let memoryProvider = $state("");
  let memoryModel = $state("");
  let memoryMaxResults = $state(0);
  let memoryMinScore = $state(0.0);
  let memoryMaxChunkLen = $state(0);
  let memoryChunkOverlap = $state(0);

  // Compaction
  let reserveTokensFloor = $state(0);
  let maxHistoryShare = $state(0.0);

  // Pruning
  let pruningMode = $state("auto");
  let keepLastAssistants = $state(0);

  // Sandbox
  let sandboxMode = $state("off");
  let sandboxImage = $state("");
  let sandboxMemoryMb = $state(0);
  let sandboxCpus = $state(0.0);
  let sandboxTimeoutSec = $state(0);
  let sandboxNetworkEnabled = $state(false);

  $effect(() => {
    if (configStore.config && !saving) {
      const def = config.agents?.defaults || {};
      
      provider = def.provider || "";
      model = def.model || "";
      maxTokens = def.max_tokens || 8192;
      temperature = def.temperature || 0.7;
      maxToolIterations = def.max_tool_iterations || 20;
      contextWindow = def.context_window || 200000;
      workspace = def.workspace || "~/.goclaw/workspace";

      const sub = def.subagents || {};
      subagentsMaxConcurrent = sub.maxConcurrent || 20;
      subagentsMaxSpawnDepth = sub.maxSpawnDepth || 1;
      subagentsMaxChildren = sub.maxChildrenPerAgent || 5;
      subagentsArchiveMins = sub.archiveAfterMinutes || 60;
      subagentsModel = sub.model || "";

      const mem = def.memory || {};
      memoryEnabled = mem.enabled !== false;
      memoryProvider = mem.embedding_provider || "";
      memoryModel = mem.embedding_model || "";
      memoryMaxResults = mem.max_results || 6;
      memoryMinScore = mem.min_score || 0.35;
      memoryMaxChunkLen = mem.max_chunk_len || 1000;
      memoryChunkOverlap = mem.chunk_overlap || 200;

      const comp = def.compaction || {};
      reserveTokensFloor = comp.reserveTokensFloor || 20000;
      maxHistoryShare = comp.maxHistoryShare || 0.75;

      const prune = def.contextPruning || {};
      pruningMode = prune.mode || "auto";
      keepLastAssistants = prune.keepLastAssistants || 3;

      const sbox = def.sandbox || {};
      sandboxMode = sbox.mode || "off";
      sandboxImage = sbox.image || "goclaw-sandbox:bookworm-slim";
      sandboxMemoryMb = sbox.memory_mb || 512;
      sandboxCpus = sbox.cpus || 1.0;
      sandboxTimeoutSec = sbox.timeout_sec || 300;
      sandboxNetworkEnabled = sbox.network_enabled || false;
    }
  });

  async function handleSave() {
    const ag = config.agents || {};
    await patchConfig({
      agents: {
        ...ag,
        defaults: {
          ...(ag.defaults || {}),
          provider,
          model,
          max_tokens: maxTokens,
          temperature,
          max_tool_iterations: maxToolIterations,
          context_window: contextWindow,
          workspace,
          subagents: {
            maxConcurrent: subagentsMaxConcurrent,
            maxSpawnDepth: subagentsMaxSpawnDepth,
            maxChildrenPerAgent: subagentsMaxChildren,
            archiveAfterMinutes: subagentsArchiveMins,
            model: subagentsModel || undefined
          },
          memory: {
            enabled: memoryEnabled,
            embedding_provider: memoryProvider || undefined,
            embedding_model: memoryModel || undefined,
            max_results: memoryMaxResults,
            min_score: memoryMinScore,
            max_chunk_len: memoryMaxChunkLen,
            chunk_overlap: memoryChunkOverlap
          },
          compaction: {
            reserveTokensFloor,
            maxHistoryShare
          },
          contextPruning: {
            mode: pruningMode,
            keepLastAssistants
          },
          sandbox: {
            mode: sandboxMode,
            image: sandboxImage,
            memory_mb: sandboxMemoryMb,
            cpus: sandboxCpus,
            timeout_sec: sandboxTimeoutSec,
            network_enabled: sandboxNetworkEnabled
          }
        }
      }
    });
  }
</script>

<div class="space-y-6 animate-in fade-in duration-500">
  
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="text-lg font-black text-white uppercase tracking-widest">{$_("config.agents.title")}</h2>
      <p class="text-[10px] text-orange-500/70 uppercase tracking-widest mt-1">{$_("config.agents.description")}</p>
    </div>
    <button onclick={handleSave} disabled={saving} class="group relative h-10 px-6 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all flex items-center gap-2 shadow-[inset_0_1px_5px_rgba(249,115,22,0.1),0_0_20px_rgba(249,115,22,0.15)] hover:shadow-[inset_0_1px_5px_rgba(249,115,22,0.2),0_0_30px_rgba(249,115,22,0.4)] disabled:opacity-50 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
      <span class="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-400">
        {#if saving}
          <Loader2 class="h-4 w-4 animate-spin" /> {$_("config.saving")}
        {:else}
          <Save class="h-4 w-4" /> {$_("config.saveConfig")}
        {/if}
      </span>
    </button>
  </div>

  <div class="grid grid-cols-1 gap-6">
    <FormGroup title="Core AI Defaults" description="Global model and runtime limits" icon={BrainCircuit}>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">Provider</label>
          <input type="text" bind:value={provider} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.providerTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">Model</label>
          <input type="text" bind:value={model} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.modelTip")}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.maxTokens")}</label>
          <input type="number" bind:value={maxTokens} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.maxTokensTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.temperature")}</label>
          <input type="number" step="0.1" bind:value={temperature} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.temperatureTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.maxToolIterations")}</label>
          <input type="number" bind:value={maxToolIterations} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.maxToolIterationsTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.contextWindow")}</label>
          <input type="number" bind:value={contextWindow} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.contextWindowTip")}</p>
        </div>
      </div>

      <div>
        <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.workspace")}</label>
        <input type="text" bind:value={workspace} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
        <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.workspaceTip")}</p>
      </div>
    </FormGroup>

    <FormGroup title={$_("config.agents.subagents.title")} description={$_("config.agents.subagents.desc")} icon={Layers}>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.subagents.maxConcurrent")}</label>
          <input type="number" bind:value={subagentsMaxConcurrent} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.subagents.maxConcurrentTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.subagents.maxSpawnDepth")}</label>
          <input type="number" bind:value={subagentsMaxSpawnDepth} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.subagents.maxSpawnDepthTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.subagents.maxChildrenPerAgent")}</label>
          <input type="number" bind:value={subagentsMaxChildren} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.subagents.maxChildrenPerAgentTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.subagents.archiveAfterMin")}</label>
          <input type="number" bind:value={subagentsArchiveMins} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.subagents.archiveAfterMinTip")}</p>
        </div>
      </div>
      <div>
        <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.subagents.modelOverride")}</label>
        <input type="text" bind:value={subagentsModel} placeholder={$_("config.agents.subagents.modelOverridePlaceholder")} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
        <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.subagents.modelOverrideTip")}</p>
      </div>
    </FormGroup>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FormGroup title={$_("config.agents.memory.title")} description={$_("config.agents.memory.desc")} icon={Database}>
        <div class="space-y-4">
          <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" bind:checked={memoryEnabled} class="w-4 h-4 rounded border-white/20 bg-black/50 text-orange-500 focus:ring-orange-500/50 focus:ring-offset-0" />
            <span class="text-xs font-bold text-white uppercase tracking-widest">{$_("config.agents.memory.enabled")}</span>
          </label>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.memory.embeddingProvider")}</label>
              <input type="text" bind:value={memoryProvider} placeholder="(auto)" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.memory.embeddingProviderTip")}</p>
            </div>
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.memory.embeddingModel")}</label>
              <input type="text" bind:value={memoryModel} placeholder="text-embedding-3-small" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.memory.embeddingModelTip")}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.memory.maxResults")}</label>
              <input type="number" bind:value={memoryMaxResults} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.memory.maxResultsTip")}</p>
            </div>
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.memory.minScore")}</label>
              <input type="number" step="0.01" bind:value={memoryMinScore} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.memory.minScoreTip")}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.memory.maxChunkLen")}</label>
              <input type="number" bind:value={memoryMaxChunkLen} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.memory.maxChunkLenTip")}</p>
            </div>
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.memory.chunkOverlap")}</label>
              <input type="number" bind:value={memoryChunkOverlap} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.memory.chunkOverlapTip")}</p>
            </div>
          </div>
        </div>
      </FormGroup>

      <div class="space-y-6">
        <FormGroup title={$_("config.agents.compaction.title")} description={$_("config.agents.compaction.desc")} icon={Search}>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.compaction.reserveTokensFloor")}</label>
              <input type="number" bind:value={reserveTokensFloor} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.compaction.reserveTokensFloorTip")}</p>
            </div>
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.compaction.maxHistoryShare")}</label>
              <input type="number" step="0.05" bind:value={maxHistoryShare} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.compaction.maxHistoryShareTip")}</p>
            </div>
          </div>
        </FormGroup>

        <FormGroup title={$_("config.agents.pruning.title")} description={$_("config.agents.pruning.desc")} icon={Settings2}>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.pruning.mode")}</label>
              <select bind:value={pruningMode} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors appearance-none">
                <option value="auto">Auto</option>
                <option value="off">Off</option>
                <option value="cache-ttl">Cache TTL</option>
              </select>
            </div>
            <div>
              <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.pruning.keepLastAssistants")}</label>
              <input type="number" bind:value={keepLastAssistants} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.pruning.keepLastAssistantsTip")}</p>
            </div>
          </div>
        </FormGroup>
      </div>
    </div>

    <FormGroup title={$_("config.agents.sandbox.title")} description={$_("config.agents.sandbox.desc")} icon={Shield}>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.sandbox.mode")}</label>
          <select bind:value={sandboxMode} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors appearance-none">
            <option value="off">Off</option>
            <option value="non-main">Non-Main Only</option>
            <option value="all">All</option>
          </select>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.sandbox.image")}</label>
          <input type="text" bind:value={sandboxImage} placeholder="goclaw-sandbox:bookworm-slim" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.sandbox.imageTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.sandbox.memoryMb")}</label>
          <input type="number" bind:value={sandboxMemoryMb} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.sandbox.memoryMbTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.agents.sandbox.timeoutSec")}</label>
          <input type="number" bind:value={sandboxTimeoutSec} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.agents.sandbox.timeoutSecTip")}</p>
        </div>
      </div>
      <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors w-fit">
        <input type="checkbox" bind:checked={sandboxNetworkEnabled} class="w-4 h-4 rounded border-white/20 bg-black/50 text-orange-500 focus:ring-orange-500/50 focus:ring-offset-0" />
        <span class="text-xs font-bold text-white uppercase tracking-widest">{$_("config.agents.sandbox.networkEnabled")}</span>
      </label>
    </FormGroup>
    
  </div>
</div>
