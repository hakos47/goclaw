<script lang="ts">
  import { Server, Lock, Globe, Save, Loader2, Key } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import FormGroup from "../components/FormGroup.svelte";
  import { patchConfig, configStore } from "$lib/state/config.svelte";
  import { fade } from "svelte/transition";

  let saving = $derived(configStore.saving);
  let config = $derived(configStore.config?.gateway || {});

  // Local state for two-way binding
  let host = $state("");
  let port = $state(0);
  let token = $state("");
  let ownerIds = $state("");
  let allowedOrigins = $state("");

  // Sync down
  $effect(() => {
    if (configStore.config && !saving) {
      host = config.host || "";
      port = config.port || 18790;
      token = config.token || "";
      ownerIds = (config.owner_ids || []).join(", ");
      allowedOrigins = (config.allowed_origins || []).join(", ");
    }
  });

  function isSecret(val: string): boolean {
    return val.includes("***");
  }

  async function handleSave() {
    const toSave: any = {
      host,
      port,
      owner_ids: ownerIds.split(",").map(s => s.trim()).filter(Boolean),
      allowed_origins: allowedOrigins.split(",").map(s => s.trim()).filter(Boolean)
    };
    
    if (!isSecret(token)) {
      toSave.token = token;
    }

    await patchConfig({
      gateway: toSave
    });
  }
</script>

<div class="space-y-6 animate-in fade-in duration-500">
  
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="text-lg font-black text-white uppercase tracking-widest">{$_("config.server.title")}</h2>
      <p class="text-[10px] text-cyan-500/70 uppercase tracking-widest mt-1">{$_("config.server.description")}</p>
    </div>
    <button onclick={handleSave} disabled={saving} class="group relative h-10 px-6 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all flex items-center gap-2 shadow-[inset_0_1px_5px_rgba(6,182,212,0.1),0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[inset_0_1px_5px_rgba(6,182,212,0.2),0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
      <span class="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400">
        {#if saving}
          <Loader2 class="h-4 w-4 animate-spin" /> Saving...
        {:else}
          <Save class="h-4 w-4" /> {$_("config.server.save")}
        {/if}
      </span>
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <FormGroup title={$_("config.server.httpListener")} description={$_("config.server.httpListenerDesc")} icon={Server}>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.server.hostBind")}</label>
          <input type="text" bind:value={host} placeholder="0.0.0.0" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.server.apiPort")}</label>
          <input type="number" bind:value={port} placeholder="18790" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
        </div>
      </div>
    </FormGroup>

    <FormGroup title={$_("config.server.auth")} description={$_("config.server.authDesc")} icon={Key}>
      <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.server.masterToken")}</label>
      <input type="password" bind:value={token} disabled={isSecret(token)} readonly={isSecret(token)} placeholder="********" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50" />
      {#if isSecret(token)}
        <p class="text-[9px] text-white/30 uppercase mt-2">{$_("config.server.tokenRedacted")}</p>
      {/if}
    </FormGroup>

    <div class="lg:col-span-2">
      <FormGroup title={$_("config.server.security")} description={$_("config.server.securityDesc")} icon={Lock}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.server.ownerDiscordIds")}</label>
            <input type="text" bind:value={ownerIds} placeholder="123456789, 987654321" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
          </div>
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.gateway.allowedOrigins")}</label>
            <input type="text" bind:value={allowedOrigins} placeholder="https://app.example.com" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
          </div>
        </div>
      </FormGroup>
    </div>

  </div>
</div>
