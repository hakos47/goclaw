<script lang="ts">
  import { Webhook, Mic, ActivitySquare, Save, Loader2, Link2, Plus, Trash2, ExternalLink } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import FormGroup from "../components/FormGroup.svelte";
  import { patchConfig, configStore } from "$lib/state/config.svelte";
  import { fade, slide } from "svelte/transition";

  let saving = $derived(configStore.saving);
  let config = $derived(configStore.config || {});

  // TTS (Read Only)
  let ttsProvider = $derived(config.tts?.provider || "");
  let ttsAuto = $derived(config.tts?.auto || "off");

  // Cron
  let cronMaxRetries = $state(0);
  let cronBaseDelay = $state("");
  let cronMaxDelay = $state("");
  let cronDefaultTimezone = $state("");

  // Telemetry
  let telemetryEnabled = $state(false);
  let telemetryEndpoint = $state("");
  let telemetryProtocol = $state("grpc");
  let telemetryServiceName = $state("");
  let telemetryInsecure = $state(false);
  
  // Headers array instead of object for easier binding
  type HeaderPair = { key: string; value: string };
  let telemetryHeaders = $state<HeaderPair[]>([]);

  // Bindings
  type BindingMatch = { channel?: string; accountId?: string; peer?: { kind?: string; id?: string }; guildId?: string };
  type Binding = { agentId?: string; match?: BindingMatch };
  let bindings = $state<Binding[]>([]);

  $effect(() => {
    if (configStore.config && !saving) {
      const cr = config.cron || {};
      cronMaxRetries = cr.max_retries || 0;
      cronBaseDelay = cr.retry_base_delay || "";
      cronMaxDelay = cr.retry_max_delay || "";
      cronDefaultTimezone = cr.default_timezone || "";

      const tel = config.telemetry || {};
      telemetryEnabled = !!tel.enabled;
      telemetryEndpoint = tel.endpoint || "";
      telemetryProtocol = tel.protocol || "grpc";
      telemetryServiceName = tel.service_name || "";
      telemetryInsecure = !!tel.insecure;
      
      const head = tel.headers || {};
      telemetryHeaders = Object.entries(head).map(([k, v]) => ({ key: k, value: v as string }));

      bindings = Array.isArray(config.bindings) ? JSON.parse(JSON.stringify(config.bindings)) : [];
    }
  });

  function addHeader() {
    telemetryHeaders = [...telemetryHeaders, { key: "", value: "" }];
  }
  function removeHeader(idx: number) {
    telemetryHeaders = telemetryHeaders.filter((_, i) => i !== idx);
  }

  function addBinding() {
    bindings = [...bindings, { agentId: "", match: { channel: "", peer: { kind: "", id: "" } } }];
  }
  function removeBinding(idx: number) {
    bindings = bindings.filter((_, i) => i !== idx);
  }

  async function handleSave() {
    const head: Record<string, string> = {};
    for (const h of telemetryHeaders) {
      if (h.key.trim()) head[h.key.trim()] = h.value.trim();
    }

    await patchConfig({
      cron: {
        max_retries: cronMaxRetries,
        retry_base_delay: cronBaseDelay,
        retry_max_delay: cronMaxDelay,
        default_timezone: cronDefaultTimezone
      },
      telemetry: {
        enabled: telemetryEnabled,
        endpoint: telemetryEndpoint,
        protocol: telemetryProtocol,
        service_name: telemetryServiceName,
        insecure: telemetryInsecure,
        headers: Object.keys(head).length > 0 ? head : undefined
      },
      bindings: bindings.length > 0 ? bindings : undefined
    });
  }
</script>

<div class="space-y-6 animate-in fade-in duration-500">
  
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="text-lg font-black text-white uppercase tracking-widest">{$_("config.integrations.title")}</h2>
      <p class="text-[10px] text-blue-500/70 uppercase tracking-widest mt-1">{$_("config.integrations.description")}</p>
    </div>
    <button onclick={handleSave} disabled={saving} class="group relative h-10 px-6 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all flex items-center gap-2 shadow-[inset_0_1px_5px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[inset_0_1px_5px_rgba(59,130,246,0.2),0_0_30px_rgba(59,130,246,0.4)] disabled:opacity-50 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
      <span class="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
        {#if saving}
          <Loader2 class="h-4 w-4 animate-spin" /> {$_("config.saving")}
        {:else}
          <Save class="h-4 w-4" /> {$_("config.integrations.save")}
        {/if}
      </span>
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="space-y-6">
      <FormGroup title={$_("config.cron.title")} description={$_("config.cron.description")} icon={Webhook}>
        <div class="grid gap-1.5 mb-4">
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.cron.defaultTimezone")}</label>
          <input type="text" bind:value={cronDefaultTimezone} placeholder={$_("config.cron.defaultTimezonePlaceholder")} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.cron.defaultTimezoneTip")}</p>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.cron.maxRetries")}</label>
            <input type="number" bind:value={cronMaxRetries} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-colors" />
            <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.cron.maxRetriesTip")}</p>
          </div>
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.cron.baseDelay")}</label>
            <input type="text" bind:value={cronBaseDelay} placeholder="2s" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.cron.maxDelay")}</label>
            <input type="text" bind:value={cronMaxDelay} placeholder="30s" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-colors" />
          </div>
        </div>
      </FormGroup>

      <FormGroup title={$_("config.tts.title")} description={$_("config.tts.manageLink")} icon={Mic}>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            {#if ttsProvider}
              <div class="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-[10px] uppercase tracking-widest font-bold border border-blue-500/30">{$_("config.tts.configured")}</div>
              <span class="text-xs text-white/70">{$_("config.tts.providerInfo", { values: { provider: ttsProvider, auto: ttsAuto } })}</span>
            {:else}
              <div class="px-2 py-1 rounded bg-white/10 text-white/50 text-[10px] uppercase tracking-widest font-bold border border-white/10">{$_("config.tts.disabled")}</div>
              <span class="text-xs text-white/40">{$_("config.tts.noProvider")}</span>
            {/if}
          </div>
          <a href="/tts" class="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 text-xs">
            {$_("config.tts.manageLink")} <ExternalLink class="h-3.5 w-3.5" />
          </a>
        </div>
      </FormGroup>
    </div>

    <div class="space-y-6">
      <FormGroup title={$_("config.telemetry.title")} description={$_("config.telemetry.description")} icon={ActivitySquare}>
        <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors mb-4">
          <input type="checkbox" bind:checked={telemetryEnabled} class="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0" />
          <span class="text-xs font-bold text-white uppercase tracking-widest">{$_("config.telemetry.enabled")}</span>
        </label>

        {#if telemetryEnabled}
          <div class="space-y-4" in:fade>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.telemetry.endpoint")}</label>
                <input type="text" bind:value={telemetryEndpoint} placeholder="localhost:4317" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-colors" />
                <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.telemetry.endpointTip")}</p>
              </div>
              <div>
                <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.telemetry.protocol")}</label>
                <select bind:value={telemetryProtocol} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-colors appearance-none">
                  <option value="grpc">gRPC</option>
                  <option value="http">HTTP</option>
                </select>
                <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.telemetry.protocolTip")}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 items-start">
              <div>
                <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.telemetry.serviceName")}</label>
                <input type="text" bind:value={telemetryServiceName} placeholder="goclaw-gateway" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-colors" />
                <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.telemetry.serviceNameTip")}</p>
              </div>
              <div class="pt-6">
                <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <input type="checkbox" bind:checked={telemetryInsecure} class="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0" />
                  <span class="text-xs font-bold text-white uppercase tracking-widest">{$_("config.telemetry.insecure")}</span>
                </label>
                <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.telemetry.insecureTip")}</p>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2 ml-1">
                <label class="block text-[9px] text-white/40 uppercase tracking-widest">{$_("config.telemetry.headers")}</label>
                <button onclick={addHeader} class="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus class="h-3 w-3"/> {$_("config.telemetry.addHeader")}</button>
              </div>
              <div class="space-y-2">
                {#each telemetryHeaders as header, idx}
                  <div class="flex items-center gap-2" transition:slide>
                    <input type="text" bind:value={header.key} placeholder={$_("config.telemetry.headerKeyPlaceholder")} class="flex-1 h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-blue-500/50 transition-colors" />
                    <input type="text" bind:value={header.value} placeholder={$_("config.telemetry.headerValuePlaceholder")} class="flex-1 h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-blue-500/50 transition-colors" />
                    <button onclick={() => removeHeader(idx)} class="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"><Trash2 class="h-4 w-4"/></button>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </FormGroup>
    </div>
  </div>

  <FormGroup title={$_("config.bindings.title")} description={$_("config.bindings.description")} icon={Link2}>
    <div class="flex justify-end mb-4">
      <button onclick={addBinding} class="text-[10px] uppercase tracking-widest font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/30">
        <Plus class="h-3.5 w-3.5"/> {$_("config.bindings.add")}
      </button>
    </div>

    {#if bindings.length === 0}
      <p class="text-sm text-white/40 text-center py-8">{$_("config.bindings.noBindings")}</p>
    {:else}
      <div class="space-y-3">
        {#each bindings as binding, idx}
          <div class="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10" transition:slide>
            <div class="grid flex-1 grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.bindings.agentId")}</label>
                <input type="text" bind:value={binding.agentId} placeholder="Default Agent" class="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div>
                <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.bindings.channel")}</label>
                <select bind:value={binding.match!.channel} class="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-blue-500/50 transition-colors appearance-none">
                  <option value="">{$_("config.bindings.any")}</option>
                  <option value="telegram">Telegram</option>
                  <option value="discord">Discord</option>
                  <option value="slack">Slack</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.bindings.peerKind")}</label>
                <select bind:value={binding.match!.peer!.kind} class="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-blue-500/50 transition-colors appearance-none">
                  <option value="">{$_("config.bindings.any")}</option>
                  <option value="direct">Direct</option>
                  <option value="group">Group</option>
                </select>
              </div>
              <div>
                <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-1 ml-1">{$_("config.bindings.peerId")}</label>
                <input type="text" bind:value={binding.match!.peer!.id} placeholder="Optional" class="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-blue-500/50 transition-colors" />
              </div>
            </div>
            <button onclick={() => removeBinding(idx)} class="mt-5 p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"><Trash2 class="h-4 w-4"/></button>
          </div>
        {/each}
      </div>
    {/if}
  </FormGroup>
</div>
