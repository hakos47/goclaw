<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent } from "$lib/components/ui/card";
  import { ChevronRight, Lock, Globe, Sparkles, Brain, Cpu, Terminal, KeySquare, Layers, Fingerprint } from "lucide-svelte";
  import { _ } from "svelte-i18n";

  let { onComplete } = $props<{ onComplete: (provider: any) => void }>();

  const PROVIDER_TYPES = [
    { value: "openai_compat", label: "OpenAI Compatible", apiBase: "https://api.openai.com/v1", icon: Sparkles, color: "text-emerald-400" },
    { value: "anthropic", label: "Anthropic", apiBase: "https://api.anthropic.com", icon: Brain, color: "text-amber-400" },
    { value: "google", label: "Google Gemini", apiBase: "https://generativelanguage.googleapis.com/v1beta/openai/", icon: Globe, color: "text-blue-400" },
    { value: "deepseek", label: "DeepSeek", apiBase: "https://api.deepseek.com/v1", icon: Brain, color: "text-blue-500" },
    { value: "groq", label: "Groq", apiBase: "https://api.groq.com/openai/v1", icon: Cpu, color: "text-red-500" },
    { value: "openrouter", label: "OpenRouter", apiBase: "https://openrouter.ai/api/v1", icon: Globe, color: "text-indigo-400" },
    { value: "mistral", label: "Mistral AI", apiBase: "https://api.mistral.ai/v1", icon: Sparkles, color: "text-orange-500" },
    { value: "perplexity", label: "Perplexity", apiBase: "https://api.perplexity.ai", icon: Globe, color: "text-cyan-500" },
    { value: "minimax_native", label: "MiniMax", apiBase: "https://api.minimax.io/v1", icon: Brain, color: "text-pink-500" },
    { value: "ollama", label: "Ollama (Local)", apiBase: "http://127.0.0.1:11434/v1", icon: Cpu, color: "text-orange-400" },
    { value: "ollama_cloud", label: "Ollama Cloud", apiBase: "https://ollama.com/v1", icon: Globe, color: "text-sky-400" },
    { value: "chatgpt_oauth", label: "ChatGPT OAuth", apiBase: "", icon: Fingerprint, color: "text-purple-400" },
    { value: "acp", label: "Anthropic MCP", apiBase: "", icon: Layers, color: "text-teal-400" },
    { value: "claude_cli", label: "Claude Desktop CLI", apiBase: "", icon: Terminal, color: "text-red-400" }
  ];

  let providerType = $state("openai_compat");
  let name = $state("");
  let displayName = $state("");
  let apiBase = $state("https://api.openai.com/v1");
  let apiKey = $state("");

  const isOAuth = $derived(providerType === "chatgpt_oauth");
  const isCLI = $derived(providerType === "claude_cli");
  const isACP = $derived(providerType === "acp");
  const isLocal = $derived(providerType === "ollama");
  const requiresKey = $derived(!isOAuth && !isCLI && !isACP && !isLocal);

  function handleProviderTypeChange(val: string) {
    providerType = val;
    const preset = PROVIDER_TYPES.find(pt => pt.value === val);
    if (preset && preset.apiBase) {
      apiBase = preset.apiBase;
    } else {
      apiBase = "";
    }
    if (val === "chatgpt_oauth") {
      name = "chatgpt_" + Math.floor(Math.random() * 1000);
    } else {
      name = val;
    }
    apiKey = "";
  }

  function handleNext() {
    if (!name.trim()) return;
    if (requiresKey && !apiKey.trim()) return;

    const payload: any = {
      name: name.trim(),
      display_name: displayName.trim() || undefined,
      provider_type: providerType,
      enabled: true
    };

    if (!isCLI && !isACP && !isOAuth) {
      payload.api_base = apiBase.trim() || undefined;
    }

    if (requiresKey && apiKey) {
      payload.api_key = apiKey;
    }

    onComplete(payload);
  }
</script>

<div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-2xl mx-auto">
  <div class="text-center space-y-2 mb-8">
    <h2 class="text-2xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Setup Provider</h2>
    <p class="text-white/40 text-xs font-mono uppercase tracking-widest">Configure your core intelligence engine</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="space-y-3 md:col-span-2 relative z-10">
      <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Provider Protocol</label>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        {#each PROVIDER_TYPES as pt}
          {@const isActive = providerType === pt.value}
          <button 
            type="button"
            onclick={() => handleProviderTypeChange(pt.value)}
            class={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 group ${isActive ? 'bg-goclaw-neon-purple/10 border-goclaw-neon-purple shadow-[inset_0_0_15px_rgba(217,70,239,0.2)]' : 'bg-black/60 border-white/5 hover:border-white/20 hover:bg-black/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
          >
            <pt.icon class={`w-6 h-6 ${isActive ? pt.color : 'text-white/30 group-hover:text-white/50'}`} />
            <span class={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white drop-shadow-md' : 'text-white/40'}`}>{pt.label}</span>
            {#if isActive}
              <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/10 to-transparent rounded-2xl pointer-events-none"></div>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <div class="space-y-3 relative group/input">
      <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Alias / Internal Name</label>
      <input 
        type="text" 
        bind:value={name} 
        placeholder="e.g. openai_main" 
        class="w-full h-12 px-4 rounded-xl bg-black/60 border border-[#d946ef]/20 text-white font-mono text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-white/20" 
      />
    </div>
    
    <div class="space-y-3 relative group/input">
      <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Display Name (Optional)</label>
      <input 
        type="text" 
        bind:value={displayName} 
        placeholder="e.g. Primary OpenAI" 
        class="w-full h-12 px-4 rounded-xl bg-black/60 border border-[#d946ef]/20 text-white font-sans text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-white/20" 
      />
    </div>
  </div>

  {#if !isOAuth && !isCLI && !isACP}
    <div class="space-y-6 p-6 mt-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] relative overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30"></div>
      
      <h3 class="text-xs font-black uppercase tracking-widest text-white/80 flex items-center gap-2 relative z-10">
        <Globe class="h-4 w-4 text-emerald-400" /> Connection Details
      </h3>
      
      <div class="space-y-3 relative z-10">
        <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">API Base URL</label>
        <input 
          type="text" 
          bind:value={apiBase} 
          placeholder="https://api.example.com/v1" 
          class="w-full h-12 px-4 bg-[#0a0a0a]/80 border border-white/5 rounded-xl text-blue-400 font-mono text-sm outline-none focus:border-emerald-500/50 transition-colors" 
        />
      </div>

      {#if requiresKey}
        <div class="space-y-3 relative z-10">
          <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">API Key</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock class="h-4 w-4 text-white/30" />
            </div>
            <input 
              type="password" 
              bind:value={apiKey} 
              placeholder="sk-..." 
              class="w-full h-12 pl-10 pr-4 bg-[#0a0a0a]/80 border border-white/5 rounded-xl text-white font-mono text-sm outline-none focus:border-emerald-500/50 transition-colors" 
            />
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <div class="flex justify-end pt-8">
    <button 
      disabled={!name.trim() || (requiresKey && !apiKey.trim())}
      onclick={handleNext} 
      class="h-14 relative flex items-center justify-center gap-2 px-10 py-3.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 overflow-hidden group text-white hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 disabled:opacity-50 disabled:hover:scale-100 disabled:grayscale min-w-[250px]"
    >
      <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
      <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none group-hover:opacity-70 transition-opacity"></div>
      <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
      
      <span class="relative z-10 drop-shadow-md">Next Phase</span>
      <ChevronRight class="h-4 w-4 relative z-10 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] transition-all duration-500 group-hover:translate-x-1.5" strokeWidth={3} />
    </button>
  </div>
</div>
