<script lang="ts">
  import { Loader2, AlertTriangle, ShieldAlert } from "lucide-svelte";
  import type { BuiltinToolData } from "../../../hooks/use-builtin-tools.svelte";

  let {
    tool,
    initialSettings,
    onOpenChange,
    onSave
  }: {
    tool: BuiltinToolData;
    initialSettings: Record<string, unknown>;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, settings: Record<string, unknown>) => Promise<void>;
  } = $props();

  type SttProviderName = "elevenlabs" | "proxy";
  const ALL_STT_PROVIDERS: SttProviderName[] = ["elevenlabs", "proxy"];

  const el = (initialSettings.elevenlabs as Record<string, unknown>) ?? {};
  const px = (initialSettings.proxy as Record<string, unknown>) ?? {};

  let providers = $state<SttProviderName[]>((initialSettings.providers as SttProviderName[]) ?? ["elevenlabs", "proxy"]);
  let elApiKey = $state((el.api_key as string) ?? "");
  let elLang = $state((el.default_language as string) ?? "en");
  let proxyUrl = $state((px.url as string) ?? "");
  let proxyApiKey = $state((px.api_key as string) ?? "");
  let proxyTenantId = $state((px.tenant_id as string) ?? "");
  let whatsappEnabled = $state((initialSettings.whatsapp_enabled as boolean) ?? false);
  
  let saving = $state(false);
  let error = $state("");

  function toggleProvider(name: SttProviderName) {
    if (providers.includes(name)) {
      providers = providers.filter((p) => p !== name);
    } else {
      providers = [...providers, name];
    }
  }

  async function handleSave() {
    if (providers.length === 0) {
      error = "At least one provider must be selected.";
      return;
    }
    error = "";
    saving = true;
    try {
      await onSave(tool.name, {
        providers,
        elevenlabs: { api_key: elApiKey, default_language: elLang },
        proxy: { url: proxyUrl, api_key: proxyApiKey, tenant_id: proxyTenantId },
        whatsapp_enabled: whatsappEnabled
      });
      onOpenChange(false);
    } finally {
      saving = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="mb-4">
    <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">SPEECH TO TEXT CONFIGURATION</h3>
    <p class="text-[10px] font-bold text-white/30 mt-1 uppercase tracking-widest leading-relaxed">
      Configure providers for transcribing voice messages from external channels.
    </p>
  </div>

  <!-- Providers -->
  <div class="space-y-3">
    <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Active Providers</label>
    <div class="flex flex-wrap gap-3">
      {#each ALL_STT_PROVIDERS as p}
        <button 
          type="button"
          onclick={() => toggleProvider(p)}
          class="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all {providers.includes(p) ? 'bg-goclaw-neon-purple/10 border-goclaw-neon-purple/50 shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'bg-black/40 border-white/10 hover:border-white/20'}"
        >
          <div class="relative flex h-4 w-4 shrink-0 items-center justify-center rounded border {providers.includes(p) ? 'border-goclaw-neon-purple bg-goclaw-neon-purple' : 'border-white/20 bg-transparent'} transition-colors">
            {#if providers.includes(p)}
              <svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            {/if}
          </div>
          <span class="text-xs font-bold uppercase tracking-widest {providers.includes(p) ? 'text-goclaw-neon-purple' : 'text-white/50'}">{p}</span>
        </button>
      {/each}
    </div>
    {#if error}
      <p class="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-2">{error}</p>
    {/if}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- ElevenLabs -->
    <div class="space-y-4 p-5 rounded-2xl bg-[#0a0a0a]/50 border border-white/5 backdrop-blur-md relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-white/10 transition-colors"></div>
      
      <div class="flex items-center gap-2 mb-2">
        <div class="h-1.5 w-1.5 rounded-full bg-white/30"></div>
        <h4 class="text-[11px] font-black uppercase tracking-widest text-white/60">ElevenLabs Engine</h4>
      </div>

      <div class="space-y-2">
        <label class="text-[9px] font-bold uppercase tracking-widest text-white/30">API Key</label>
        <input 
          type="password" 
          placeholder="xi-..." 
          bind:value={elApiKey} 
          class="w-full h-9 bg-black/50 border border-white/10 rounded-lg text-xs font-mono px-3 text-white placeholder-white/20 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
        />
      </div>
      
      <div class="space-y-2">
        <label class="text-[9px] font-bold uppercase tracking-widest text-white/30">Default Language</label>
        <input 
          type="text" 
          placeholder="en" 
          bind:value={elLang} 
          class="w-full h-9 bg-black/50 border border-white/10 rounded-lg text-xs font-mono px-3 text-white placeholder-white/20 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
        />
      </div>
    </div>

    <!-- Proxy -->
    <div class="space-y-4 p-5 rounded-2xl bg-[#0a0a0a]/50 border border-white/5 backdrop-blur-md relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-white/10 transition-colors"></div>
      
      <div class="flex items-center gap-2 mb-2">
        <div class="h-1.5 w-1.5 rounded-full bg-white/30"></div>
        <h4 class="text-[11px] font-black uppercase tracking-widest text-white/60">Proxy Engine</h4>
      </div>

      <div class="space-y-2">
        <label class="text-[9px] font-bold uppercase tracking-widest text-white/30">Proxy URL</label>
        <input 
          type="url" 
          placeholder="https://..." 
          bind:value={proxyUrl} 
          class="w-full h-9 bg-black/50 border border-white/10 rounded-lg text-xs font-mono px-3 text-white placeholder-white/20 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
        />
      </div>
      
      <div class="space-y-2">
        <label class="text-[9px] font-bold uppercase tracking-widest text-white/30">API Key</label>
        <input 
          type="password" 
          bind:value={proxyApiKey} 
          class="w-full h-9 bg-black/50 border border-white/10 rounded-lg text-xs font-mono px-3 text-white focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
        />
      </div>

      <div class="space-y-2">
        <label class="text-[9px] font-bold uppercase tracking-widest text-white/30">Tenant ID</label>
        <input 
          type="text" 
          bind:value={proxyTenantId} 
          class="w-full h-9 bg-black/50 border border-white/10 rounded-lg text-xs font-mono px-3 text-white focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none"
        />
      </div>
    </div>
  </div>

  <!-- WhatsApp Integration -->
  <div class="mt-6 pt-6 border-t border-white/5">
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden">
        <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div>
        <ShieldAlert class="h-5 w-5 text-amber-500 shrink-0 mt-0.5 relative z-10" />
        <div class="relative z-10">
          <h5 class="text-[11px] font-black uppercase tracking-widest text-amber-500">End-to-End Encryption Warning</h5>
          <p class="text-[10px] font-bold text-amber-500/70 mt-1 uppercase tracking-widest leading-relaxed">
            Enabling STT for WhatsApp breaks end-to-end encryption for voice messages sent to this agent, as the audio payload must be extracted and sent to the STT provider.
          </p>
        </div>
      </div>

      <button 
        type="button"
        onclick={() => whatsappEnabled = !whatsappEnabled}
        class="flex items-center justify-between p-4 rounded-xl border transition-all {whatsappEnabled ? 'bg-[#0a0a0a]/80 border-white/20' : 'bg-black/40 border-white/5 hover:bg-black/60'}"
      >
        <div class="flex flex-col items-start text-left">
          <span class="text-xs font-bold uppercase tracking-widest text-white/90">Enable WhatsApp STT</span>
          <span class="text-[10px] font-bold text-white/30 uppercase tracking-widest">Process incoming voice notes</span>
        </div>
        
        <div class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 {whatsappEnabled ? 'bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'bg-[#1a1a1a]'}">
          <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {whatsappEnabled ? 'translate-x-4' : 'translate-x-0'}"></span>
        </div>
      </button>
    </div>
  </div>

  <div class="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-white/5">
    <button 
      type="button"
      onclick={() => onOpenChange(false)}
      disabled={saving}
      class="px-6 py-3 rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:bg-white/5 hover:text-white transition-all disabled:opacity-10 bg-[#030014]/50 shadow-inner"
    >
      Cancel
    </button>
    <button 
      type="button"
      onclick={handleSave} 
      disabled={saving}
      class="relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl transition-all duration-500 overflow-hidden group text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 disabled:opacity-30 disabled:pointer-events-none"
    >
      <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
      
      {#if saving}
        <Loader2 class="h-3.5 w-3.5 relative z-10 text-goclaw-neon-purple animate-spin" />
        <span class="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md">Saving</span>
      {:else}
        <span class="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md">Save Settings</span>
      {/if}
    </button>
  </div>
</div>
