<script lang="ts">
  import { ShieldCheck, Activity, KeyRound, Link } from "lucide-svelte";
  import type { TtsConfig, TtsProviderConfig } from "../hooks/use-tts.svelte";

  let {
    provider,
    draft,
    onUpdate,
    onTest,
    testing = false,
  }: {
    provider: string;
    draft: TtsConfig;
    onUpdate: (provider: string, patch: Partial<TtsProviderConfig>) => void;
    onTest: () => Promise<void>;
    testing?: boolean;
  } = $props();

  let subConfig = $derived(draft[provider as keyof TtsConfig] as TtsProviderConfig || {});
  let hasKey = $derived(
    provider === "minimax" 
      ? !!subConfig.api_key && !!subConfig.group_id 
      : !!subConfig.api_key
  );
  let showKey = $state(false);

  // Edge TTS does not require an API key
  let needsCredentials = $derived(provider !== "edge");

</script>

{#if needsCredentials}
  <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden group">
    <div class="absolute top-0 right-0 w-32 h-32 bg-goclaw-neon-purple/5 rounded-full blur-3xl group-hover:bg-goclaw-neon-purple/10 transition-all duration-700"></div>
    
    <div class="flex items-center justify-between mb-6 relative z-10">
      <h3 class="text-sm font-bold text-white/90 flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 text-goclaw-neon-purple" />
        Authentication
      </h3>
      
      <button 
        onclick={onTest}
        disabled={testing || !hasKey}
        class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border transition-all disabled:opacity-50
          {testing ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 
           hasKey ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 
           'border-white/10 text-white/30 bg-black/40'}"
      >
        <Activity class={`w-3.5 h-3.5 ${testing ? 'animate-pulse' : ''}`} />
        {testing ? 'Testing...' : 'Test Connection'}
      </button>
    </div>

    <div class="grid gap-6 relative z-10">
      <!-- API Key Field -->
      <div class="space-y-2">
        <div class="flex justify-between items-end">
          <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <KeyRound class="w-3 h-3" />
            API Key
          </label>
        </div>
        <div class="relative">
          <input 
            type={showKey ? "text" : "password"} 
            value={subConfig.api_key || ""}
            oninput={(e) => onUpdate(provider, { api_key: e.currentTarget.value })}
            placeholder="Enter API Key for {provider}"
            class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/30 transition-all outline-none"
          />
          <button 
            type="button" 
            onclick={() => showKey = !showKey}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <!-- Base URL Field (Optional) -->
      <div class="space-y-2">
        <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
          <Link class="w-3 h-3" />
          {provider === 'elevenlabs' ? 'Base URL (Optional)' : 'API Base URL (Optional)'}
        </label>
        <input 
          type="text" 
          value={provider === 'elevenlabs' ? (subConfig.base_url || "") : (subConfig.api_base || subConfig.base_url || "")}
          oninput={(e) => {
             if (provider === 'elevenlabs') {
               onUpdate(provider, { base_url: e.currentTarget.value });
             } else {
               onUpdate(provider, { api_base: e.currentTarget.value });
             }
          }}
          placeholder={provider === 'elevenlabs' ? "https://api.elevenlabs.io" : "https://api.openai.com/v1"}
          class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/30 transition-all outline-none"
        />
      </div>

      <!-- Group ID Field (Minimax) -->
      {#if provider === "minimax"}
        <div class="space-y-2">
          <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <Link class="w-3 h-3" />
            Group ID (Minimax)
          </label>
          <input 
            type="text" 
            value={subConfig.group_id || ""}
            oninput={(e) => onUpdate(provider, { group_id: e.currentTarget.value })}
            placeholder="Enter Group ID"
            class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/30 transition-all outline-none"
          />
        </div>
      {/if}
    </div>
  </div>
{/if}
