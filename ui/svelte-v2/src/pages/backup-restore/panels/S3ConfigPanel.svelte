<script lang="ts">
  import { UploadCloud, CheckCircle, Save } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { configStore, fetchConfig, patchConfig } from "$lib/state/config.svelte";
  import { onMount } from "svelte";

  let loading = $state(true);
  let saving = $state(false);

  let form = $state({
    access_key_id: "",
    secret_access_key: "",
    bucket: "",
    region: "us-east-1",
    endpoint: "",
    prefix: "backups/"
  });

  let configured = $derived(!!configStore.config?.s3?.configured);

  onMount(async () => {
    await fetchConfig();
    const s3 = configStore.config?.s3;
    if (s3) {
      form = {
        access_key_id: s3.access_key_id ?? "",
        secret_access_key: "",
        bucket: s3.bucket ?? "",
        region: s3.region ?? "us-east-1",
        endpoint: s3.endpoint ?? "",
        prefix: s3.prefix ?? "backups/"
      };
    }
    loading = false;
  });

  async function save() {
    saving = true;
    try {
      await patchConfig({ s3: form });
    } finally {
      saving = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-black tracking-widest uppercase text-white drop-shadow-md flex items-center gap-2">
        <UploadCloud class="h-5 w-5 text-indigo-400" />
        {$_("backup.s3Config.title")}
      </h2>
      <p class="text-[10px] text-white/50 uppercase tracking-widest mt-1">{$_("backup.s3Config.description")}</p>
    </div>

    {#if !loading}
      {#if configured}
        <span class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <CheckCircle class="h-3 w-3" /> Configured
        </span>
      {:else}
        <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/40 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5">
          Not Configured
        </span>
      {/if}
    {/if}
  </div>

  {#if loading}
    <div class="h-64 flex items-center justify-center">
      <div class="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else}
    <div class="bg-black/20 border border-white/5 rounded-2xl p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div class="space-y-2">
          <label class="text-[10px] font-bold text-white/70 uppercase tracking-widest">{$_("backup.s3Config.endpoint")}</label>
          <input 
            type="text" 
            bind:value={form.endpoint} 
            placeholder="https://s3.example.com"
            class="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold text-white/70 uppercase tracking-widest">{$_("backup.s3Config.region")}</label>
          <input 
            type="text" 
            bind:value={form.region} 
            class="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold text-white/70 uppercase tracking-widest">{$_("backup.s3Config.bucket")}</label>
          <input 
            type="text" 
            bind:value={form.bucket} 
            class="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold text-white/70 uppercase tracking-widest">{$_("backup.s3Config.prefix")}</label>
          <input 
            type="text" 
            bind:value={form.prefix} 
            class="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold text-white/70 uppercase tracking-widest">{$_("backup.s3Config.accessKey")}</label>
          <input 
            type="text" 
            bind:value={form.access_key_id} 
            class="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold text-white/70 uppercase tracking-widest">{$_("backup.s3Config.secretKey")}</label>
          <input 
            type="password" 
            bind:value={form.secret_access_key} 
            placeholder={configured ? "********" : ""}
            class="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

      </div>

      <div class="mt-8 flex justify-end">
        <button
          onclick={save}
          disabled={saving}
          class="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        >
          {#if saving}
            <div class="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <span>{$_("backup.s3Config.saving")}</span>
          {:else}
            <Save class="h-4 w-4" />
            <span>{$_("backup.s3Config.save")}</span>
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
