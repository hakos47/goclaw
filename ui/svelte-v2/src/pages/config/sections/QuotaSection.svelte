<script lang="ts">
  import { ShieldAlert, Save, Loader2, Plus, Trash2, SlidersHorizontal } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import FormGroup from "../components/FormGroup.svelte";
  import { patchConfig, configStore } from "$lib/state/config.svelte";
  import { slide } from "svelte/transition";

  let saving = $derived(configStore.saving);
  let config = $derived(configStore.config?.quota || {});

  let enabled = $state(true);
  
  // Default quotas
  let defaultHour = $state(40);
  let defaultDay = $state(200);
  let defaultWeek = $state(1000);

  type QuotaEntry = { key: string; hour: number; day: number; week: number };
  
  let providers = $state<QuotaEntry[]>([]);
  let channels = $state<QuotaEntry[]>([]);
  let groups = $state<QuotaEntry[]>([]);

  $effect(() => {
    if (configStore.config && !saving) {
      enabled = config.enabled !== false; // defaults to true if undefined
      const def = config.default || { hour: 40, day: 200, week: 1000 };
      defaultHour = def.hour || 0;
      defaultDay = def.day || 0;
      defaultWeek = def.week || 0;

      const mapToEntries = (obj: Record<string, any> = {}) => 
        Object.entries(obj).map(([k, v]) => ({ key: k, hour: v.hour || 0, day: v.day || 0, week: v.week || 0 }));

      providers = mapToEntries(config.providers);
      channels = mapToEntries(config.channels);
      groups = mapToEntries(config.groups);
    }
  });

  function addProvider() { providers = [...providers, { key: "", hour: 0, day: 0, week: 0 }]; }
  function removeProvider(idx: number) { providers = providers.filter((_, i) => i !== idx); }

  function addChannel() { channels = [...channels, { key: "", hour: 0, day: 0, week: 0 }]; }
  function removeChannel(idx: number) { channels = channels.filter((_, i) => i !== idx); }

  function addGroup() { groups = [...groups, { key: "", hour: 0, day: 0, week: 0 }]; }
  function removeGroup(idx: number) { groups = groups.filter((_, i) => i !== idx); }

  async function handleSave() {
    const toMap = (arr: QuotaEntry[]) => {
      const res: Record<string, any> = {};
      arr.forEach(e => {
        if (e.key.trim()) res[e.key.trim()] = { hour: e.hour, day: e.day, week: e.week };
      });
      return Object.keys(res).length > 0 ? res : undefined;
    };

    await patchConfig({
      quota: {
        enabled,
        default: { hour: defaultHour, day: defaultDay, week: defaultWeek },
        providers: toMap(providers),
        channels: toMap(channels),
        groups: toMap(groups)
      }
    });
  }
</script>

<div class="space-y-6 animate-in fade-in duration-500">
  
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="text-lg font-black text-white uppercase tracking-widest">{$_("config.quota.title")}</h2>
      <p class="text-[10px] text-emerald-500/70 uppercase tracking-widest mt-1">{$_("config.quota.description")}</p>
    </div>
    <button onclick={handleSave} disabled={saving} class="group relative h-10 px-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all flex items-center gap-2 shadow-[inset_0_1px_5px_rgba(16,185,129,0.1),0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[inset_0_1px_5px_rgba(16,185,129,0.2),0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
      <span class="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
        {#if saving}
          <Loader2 class="h-4 w-4 animate-spin" /> {$_("config.saving")}
        {:else}
          <Save class="h-4 w-4" /> {$_("config.saveConfig")}
        {/if}
      </span>
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <FormGroup title={$_("config.quota.enabled")} description="Tenant usage limitations" icon={ShieldAlert}>
      <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors mb-4">
        <input type="checkbox" bind:checked={enabled} class="w-4 h-4 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0" />
        <span class="text-xs font-bold text-white uppercase tracking-widest">{$_("config.quota.enabled")}</span>
      </label>

      {#if enabled}
        <div class="space-y-4" transition:slide>
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.quota.defaultLimits")}</label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <input type="number" bind:value={defaultHour} min="0" class="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors" />
                <p class="text-[9px] text-white/30 uppercase mt-1">{$_("config.quota.hour")}</p>
              </div>
              <div>
                <input type="number" bind:value={defaultDay} min="0" class="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors" />
                <p class="text-[9px] text-white/30 uppercase mt-1">{$_("config.quota.day")}</p>
              </div>
              <div>
                <input type="number" bind:value={defaultWeek} min="0" class="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors" />
                <p class="text-[9px] text-white/30 uppercase mt-1">{$_("config.quota.week")}</p>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </FormGroup>

    {#if enabled}
      <div class="space-y-6" transition:slide>
        
        <!-- Providers -->
        <FormGroup title={$_("config.quota.providerOverrides")} description={$_("config.quota.providerOverridesTip")} icon={SlidersHorizontal}>
          <div class="flex justify-end mb-2">
            <button onclick={addProvider} class="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-widest font-bold"><Plus class="h-3 w-3"/> {$_("config.quota.addOverride")}</button>
          </div>
          <div class="space-y-2">
            {#each providers as prov, idx}
              <div class="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10" transition:slide>
                <div class="flex-1">
                  <input type="text" bind:value={prov.key} placeholder={$_("config.quota.selectProvider")} class="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors" />
                </div>
                <input type="number" bind:value={prov.hour} min="0" class="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors text-center" title={$_("config.quota.hour")} />
                <input type="number" bind:value={prov.day} min="0" class="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors text-center" title={$_("config.quota.day")} />
                <input type="number" bind:value={prov.week} min="0" class="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors text-center" title={$_("config.quota.week")} />
                <button onclick={() => removeProvider(idx)} class="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"><Trash2 class="h-3.5 w-3.5"/></button>
              </div>
            {/each}
          </div>
        </FormGroup>

        <!-- Channels -->
        <FormGroup title={$_("config.quota.channelOverrides")} description={$_("config.quota.channelOverridesTip")} icon={SlidersHorizontal}>
          <div class="flex justify-end mb-2">
            <button onclick={addChannel} class="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-widest font-bold"><Plus class="h-3 w-3"/> {$_("config.quota.addOverride")}</button>
          </div>
          <div class="space-y-2">
            {#each channels as chan, idx}
              <div class="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10" transition:slide>
                <div class="flex-1">
                  <input type="text" bind:value={chan.key} placeholder={$_("config.quota.selectChannel")} class="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors" />
                </div>
                <input type="number" bind:value={chan.hour} min="0" class="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors text-center" title={$_("config.quota.hour")} />
                <input type="number" bind:value={chan.day} min="0" class="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors text-center" title={$_("config.quota.day")} />
                <input type="number" bind:value={chan.week} min="0" class="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors text-center" title={$_("config.quota.week")} />
                <button onclick={() => removeChannel(idx)} class="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"><Trash2 class="h-3.5 w-3.5"/></button>
              </div>
            {/each}
          </div>
        </FormGroup>

        <!-- Groups -->
        <FormGroup title={$_("config.quota.groupOverrides")} description={$_("config.quota.groupOverridesTip")} icon={SlidersHorizontal}>
          <div class="flex justify-end mb-2">
            <button onclick={addGroup} class="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-widest font-bold"><Plus class="h-3 w-3"/> {$_("config.quota.addOverride")}</button>
          </div>
          <div class="space-y-2">
            {#each groups as grp, idx}
              <div class="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10" transition:slide>
                <div class="flex-1">
                  <input type="text" bind:value={grp.key} placeholder={$_("config.quota.selectGroup")} class="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors" />
                </div>
                <input type="number" bind:value={grp.hour} min="0" class="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors text-center" title={$_("config.quota.hour")} />
                <input type="number" bind:value={grp.day} min="0" class="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors text-center" title={$_("config.quota.day")} />
                <input type="number" bind:value={grp.week} min="0" class="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/10 rounded-md text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-colors text-center" title={$_("config.quota.week")} />
                <button onclick={() => removeGroup(idx)} class="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"><Trash2 class="h-3.5 w-3.5"/></button>
              </div>
            {/each}
          </div>
        </FormGroup>

      </div>
    {/if}
  </div>
</div>
