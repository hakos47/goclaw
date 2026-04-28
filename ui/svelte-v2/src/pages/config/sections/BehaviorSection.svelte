<script lang="ts">
  import { Activity, ShieldAlert, Zap, Clock, Save, Loader2, KeyRound } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import FormGroup from "../components/FormGroup.svelte";
  import { patchConfig, configStore } from "$lib/state/config.svelte";

  let saving = $derived(configStore.saving);
  let config = $derived(configStore.config || {});

  // UX Toggles
  let toolStatus = $state(true);
  let blockReply = $state(false);
  let intentClassify = $state(true);

  // Rate Limiting
  let maxMessageChars = $state(0);
  let rateLimitRpm = $state(0);
  let inboundDebounceMs = $state(0);

  // Sessions
  let sessionScope = $state("global");
  let sessionDmScope = $state("global");

  // Security
  let injectionAction = $state("block");
  let scrubCredentials = $state(true);

  // Compaction
  let compactionLimit = $state(0);
  let compactionAction = $state("");

  $effect(() => {
    if (configStore.config && !saving) {
      const gw = config.gateway || {};
      const ag = config.agents?.defaults || {};
      const tl = config.tools || {};
      const ss = config.sessions || {};
      const ch = config.channels || {};

      toolStatus = gw.tool_status !== false;
      blockReply = gw.block_reply || false;
      intentClassify = ag.intent_classify !== false;

      maxMessageChars = gw.max_message_chars || 4000;
      rateLimitRpm = gw.rate_limit_rpm || 60;
      inboundDebounceMs = gw.inbound_debounce_ms || 1000;

      sessionScope = ss.scope || "global";
      sessionDmScope = ss.dm_scope || "global";

      injectionAction = gw.injection_action || "block";
      scrubCredentials = tl.scrub_credentials !== false;

      const comp = ch.pending_compaction || {};
      compactionLimit = comp.limit || 50;
      compactionAction = comp.action || "summarize";
    }
  });

  async function handleSave() {
    // Preserve existing nested structures
    const ag = config.agents || {};
    const agDefaults = ag.defaults || {};
    const tl = config.tools || {};
    const ss = config.sessions || {};
    const ch = config.channels || {};

    await patchConfig({
      gateway: {
        tool_status: toolStatus,
        block_reply: blockReply,
        max_message_chars: maxMessageChars,
        rate_limit_rpm: rateLimitRpm,
        inbound_debounce_ms: inboundDebounceMs,
        injection_action: injectionAction
      },
      agents: {
        ...ag,
        defaults: {
          ...agDefaults,
          intent_classify: intentClassify
        }
      },
      tools: {
        ...tl,
        scrub_credentials: scrubCredentials
      },
      sessions: {
        ...ss,
        scope: sessionScope,
        dm_scope: sessionDmScope
      },
      channels: {
        ...ch,
        pending_compaction: {
          limit: compactionLimit,
          action: compactionAction
        }
      }
    });
  }
</script>

<div class="space-y-6 animate-in fade-in duration-500">
  
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="text-lg font-black text-white uppercase tracking-widest">{$_("config.behavior.title")}</h2>
      <p class="text-[10px] text-magenta-500/70 uppercase tracking-widest mt-1">{$_("config.behavior.description")}</p>
    </div>
    <button onclick={handleSave} disabled={saving} class="group relative h-10 px-6 rounded-xl bg-magenta-500/10 border border-magenta-500/30 hover:bg-magenta-500/20 hover:border-magenta-500/50 transition-all flex items-center gap-2 shadow-[inset_0_1px_5px_rgba(217,70,239,0.1),0_0_20px_rgba(217,70,239,0.15)] hover:shadow-[inset_0_1px_5px_rgba(217,70,239,0.2),0_0_30px_rgba(217,70,239,0.4)] disabled:opacity-50 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-magenta-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
      <span class="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-magenta-400">
        {#if saving}
          <Loader2 class="h-4 w-4 animate-spin" /> Saving...
        {:else}
          <Save class="h-4 w-4" /> {$_("config.behavior.save")}
        {/if}
      </span>
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <FormGroup title={$_("config.behavior.uxTitle")} description={$_("config.behavior.uxDescription")} icon={Zap}>
      <div class="flex flex-col gap-4">
        <div>
          <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" bind:checked={toolStatus} class="w-4 h-4 rounded border-white/20 bg-black/50 text-magenta-500 focus:ring-magenta-500/50 focus:ring-offset-0" />
            <span class="text-xs font-bold text-white uppercase tracking-widest">{$_("config.gateway.toolStatus")}</span>
          </label>
          <p class="text-[9px] text-white/40 mt-2 px-1">{$_("config.behavior.toolStatusHint")} {$_("config.behavior.toolStatusInfo")}</p>
        </div>
        
        <div>
          <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" bind:checked={blockReply} class="w-4 h-4 rounded border-white/20 bg-black/50 text-magenta-500 focus:ring-magenta-500/50 focus:ring-offset-0" />
            <span class="text-xs font-bold text-white uppercase tracking-widest">{$_("config.gateway.blockReply")}</span>
          </label>
          <p class="text-[9px] text-white/40 mt-2 px-1">{$_("config.behavior.blockReplyHint")} {$_("config.behavior.blockReplyInfo")}</p>
        </div>

        <div>
          <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" bind:checked={intentClassify} class="w-4 h-4 rounded border-white/20 bg-black/50 text-magenta-500 focus:ring-magenta-500/50 focus:ring-offset-0" />
            <span class="text-xs font-bold text-white uppercase tracking-widest">{$_("config.agents.intentClassify")}</span>
          </label>
          <p class="text-[9px] text-white/40 mt-2 px-1">{$_("config.behavior.intentClassifyHint")} {$_("config.behavior.intentClassifyInfo")}</p>
        </div>
      </div>
    </FormGroup>

    <FormGroup title={$_("config.behavior.rateLimitTitle")} description={$_("config.behavior.rateLimitDescription")} icon={Activity}>
      <div class="space-y-4">
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.gateway.maxMessageChars")}</label>
          <input type="number" bind:value={maxMessageChars} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-magenta-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.gateway.maxMessageCharsTip")}</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.gateway.rateLimitRpm")}</label>
            <input type="number" bind:value={rateLimitRpm} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-magenta-500/50 transition-colors" />
            <p class="text-[9px] text-white/30 mt-1 ml-1">{$_("config.gateway.rateLimitRpmTip")}</p>
          </div>
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.gateway.inboundDebounceMs")}</label>
            <input type="number" bind:value={inboundDebounceMs} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-magenta-500/50 transition-colors" />
            <p class="text-[9px] text-white/30 mt-1 ml-1">{$_("config.gateway.inboundDebounceMsTip")}</p>
          </div>
        </div>
      </div>
    </FormGroup>

    <FormGroup title={$_("config.behavior.sessionsTitle")} description={$_("config.behavior.sessionsDescription")} icon={Clock}>
      <div class="grid grid-cols-1 gap-6">
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.sessions.scope")}</label>
          <select bind:value={sessionScope} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-magenta-500/50 transition-colors appearance-none">
            <option value="global">{$_("config.behavior.scopeGlobal")}</option>
            <option value="user">{$_("config.behavior.scopeUser")}</option>
            <option value="channel">{$_("config.behavior.scopeChannel")}</option>
          </select>
          <p class="text-[9px] text-white/30 mt-2 ml-1 leading-relaxed">{$_("config.sessions.scopeTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.sessions.dmScope")}</label>
          <select bind:value={sessionDmScope} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-magenta-500/50 transition-colors appearance-none">
            <option value="global">{$_("config.behavior.scopeGlobal")}</option>
            <option value="user">{$_("config.behavior.scopeUser")}</option>
          </select>
          <p class="text-[9px] text-white/30 mt-2 ml-1 leading-relaxed">{$_("config.sessions.dmScopeTip")}</p>
        </div>
      </div>
    </FormGroup>

    <FormGroup title={$_("config.behavior.securityTitle")} description={$_("config.behavior.securityDescription")} icon={ShieldAlert}>
      <div class="mb-6">
        <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.gateway.injectionAction")}</label>
        <select bind:value={injectionAction} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-magenta-500/50 transition-colors appearance-none">
          <option value="block">{$_("config.behavior.injBlock")}</option>
          <option value="log">{$_("config.behavior.injLog")}</option>
          <option value="warn">{$_("config.behavior.injWarn")}</option>
        </select>
        <p class="text-[9px] text-white/30 mt-2 ml-1 leading-relaxed">{$_("config.behavior.injectionActionHint")}</p>
      </div>
      <div>
        <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
          <input type="checkbox" bind:checked={scrubCredentials} class="w-4 h-4 rounded border-white/20 bg-black/50 text-magenta-500 focus:ring-magenta-500/50 focus:ring-offset-0" />
          <span class="text-xs font-bold text-white uppercase tracking-widest">{$_("config.tools.scrubCredentials")}</span>
        </label>
        <p class="text-[9px] text-white/30 mt-2 ml-1 leading-relaxed">{$_("config.behavior.scrubCredentialsHint")} {$_("config.behavior.scrubCredentialsInfo")}</p>
      </div>
    </FormGroup>

    <div class="lg:col-span-2">
      <FormGroup title={$_("config.behavior.pendingCompactionTitle")} description={$_("config.behavior.pendingCompactionDescription")} icon={KeyRound}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.behavior.pendingCompactionThreshold")}</label>
            <input type="number" bind:value={compactionLimit} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-magenta-500/50 transition-colors" />
            <p class="text-[9px] text-white/30 mt-2 ml-1 leading-relaxed">{$_("config.behavior.pendingCompactionThresholdTip")}</p>
          </div>
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.behavior.compactionAction")}</label>
            <select bind:value={compactionAction} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-magenta-500/50 transition-colors appearance-none">
              <option value="summarize">{$_("config.behavior.compSumm")}</option>
              <option value="truncate">{$_("config.behavior.compTrunc")}</option>
              <option value="drop">{$_("config.behavior.compDrop")}</option>
            </select>
            <p class="text-[9px] text-white/30 mt-2 ml-1 leading-relaxed">{$_("config.behavior.pendingCompactionInfo")}</p>
          </div>
        </div>
      </FormGroup>
    </div>

  </div>
</div>
