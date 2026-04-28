<script lang="ts">
  import { X, Save, Server, Cpu, Link, Lock, Globe, Terminal, ChevronDown } from "lucide-svelte";
  import type { ProviderData, ProviderInput } from "../../../../../web/src/types/provider";
  import { useProviders } from "../hooks/use-providers.svelte";

  const PROVIDER_TYPES = [
    { value: "openai_compat", label: "OpenAI Compatible", apiBase: "https://api.openai.com/v1" },
    { value: "anthropic", label: "Anthropic", apiBase: "https://api.anthropic.com" },
    { value: "google", label: "Google Gemini", apiBase: "https://generativelanguage.googleapis.com/v1beta/openai/" },
    { value: "ollama", label: "Ollama", apiBase: "http://127.0.0.1:11434/v1" },
    { value: "chatgpt_oauth", label: "ChatGPT OAuth", apiBase: "" },
    { value: "acp", label: "Anthropic MCP", apiBase: "" },
    { value: "claude_cli", label: "Claude Desktop CLI", apiBase: "" }
  ];

  type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingProviders?: ProviderData[];
  };

  let { open, onOpenChange, existingProviders = [] }: Props = $props();

  const { createProvider } = useProviders(false);

  let saving = $state(false);
  let errorMsg = $state("");

  let name = $state("");
  let displayName = $state("");
  let providerType = $state("openai_compat");
  let apiBase = $state("https://api.openai.com/v1");
  let apiKey = $state("");
  let enabled = $state(true);

  // ACP specifics
  let acpBinary = $state("");
  let acpArgs = $state("");
  let acpIdleTTL = $state("10m");
  let acpPermMode = $state("approve-all");
  let acpWorkDir = $state("");

  const isOAuth = $derived(providerType === "chatgpt_oauth");
  const isCLI = $derived(providerType === "claude_cli");
  const isACP = $derived(providerType === "acp");

  function handleProviderTypeChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    providerType = val;
    const preset = PROVIDER_TYPES.find(pt => pt.value === val);
    if (preset && preset.apiBase) {
      apiBase = preset.apiBase;
    } else {
      apiBase = "";
    }
    if (val === "chatgpt_oauth") {
      name = "chatgpt_" + Math.floor(Math.random() * 1000);
    }
  }

  async function handleSubmit() {
    saving = true;
    errorMsg = "";

    try {
      const payload: ProviderInput = {
        name: name.trim(),
        display_name: displayName.trim() || undefined,
        provider_type: providerType,
        enabled: enabled,
      };

      if (isACP) {
        payload.api_base = acpBinary || undefined;
        const settings: Record<string, unknown> = {};
        if (acpArgs.trim()) settings.args = acpArgs.trim().split(/\s+/);
        if (acpIdleTTL.trim()) settings.idle_ttl = acpIdleTTL.trim();
        if (acpPermMode) settings.perm_mode = acpPermMode;
        if (acpWorkDir.trim()) settings.work_dir = acpWorkDir.trim();
        if (Object.keys(settings).length > 0) payload.settings = settings;
      } else {
        payload.api_base = apiBase.trim() || undefined;
      }

      if (apiKey && apiKey !== "***") {
        payload.api_key = apiKey;
      }

      await createProvider(payload);
      onOpenChange(false);
    } catch (e: any) {
      errorMsg = e.message || "An error occurred";
    } finally {
      saving = false;
    }
  }

</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
      onclick={() => !saving && onOpenChange(false)}
    ></div>

    <div class="relative bg-gradient-to-br from-[#030014]/95 to-[#1a0033]/90 border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden">
      
      <!-- Cyber Grid Background -->
      <div class="absolute inset-0 pointer-events-none mix-blend-screen overflow-hidden rounded-3xl">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80"></div>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Cpu class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">Configure Provider</h2>
            <div class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Connect AI Model or Tool Registry</div>
          </div>
        </div>

        <button 
          onclick={() => !saving && onOpenChange(false)} 
          disabled={saving}
          class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroller-no-scrollbar relative z-10">
        
        {#if errorMsg}
          <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-black uppercase tracking-widest text-red-400">
            {errorMsg}
          </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3 md:col-span-2 relative group/select">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Provider Type</label>
            <div class="relative">
              <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
              <select 
                value={providerType} 
                onchange={handleProviderTypeChange}
                class="w-full h-11 px-4 pr-10 bg-[#0a0a0a] focus:bg-black/60 border border-white/5 rounded-xl text-purple-400 font-bold text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer"
              >
                {#each PROVIDER_TYPES as pt}
                  <option value={pt.value} class="bg-black text-white">{pt.label}</option>
                {/each}
              </select>
              <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none z-20">
                <ChevronDown class="h-4 w-4 text-white/30" />
              </div>
            </div>
          </div>

          <div class="space-y-3 relative group/input">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Alias / Internal Name</label>
            <div class="relative">
                <input 
                  type="text" 
                  bind:value={name} 
                  placeholder="e.g. openai_gpt4" 
                  class="w-full h-11 px-4 bg-black/40 border border-white/5 rounded-xl text-white font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] focus:border-purple-500/50" 
                />
            </div>
            <p class="text-[10px] text-white/30 px-1">Must be unique (no spaces).</p>
          </div>
          
          <div class="space-y-3 relative group/input">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Display Name</label>
            <div class="relative">
                <input 
                  type="text" 
                  bind:value={displayName} 
                  placeholder="e.g. OpenAI Global" 
                  class="w-full h-11 px-4 bg-black/40 border border-white/5 rounded-xl text-white font-sans text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] focus:border-purple-500/50" 
                />
            </div>
          </div>
        </div>

        {#if !isOAuth && !isCLI && !isACP}
          <div class="space-y-6 p-6 rounded-2xl bg-black/60 border border-white/10 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)]">
            <h3 class="text-xs font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
              <Globe class="h-4 w-4 text-emerald-400" /> API Configuration
            </h3>
            
            <div class="space-y-3">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">API Base URL</label>
              <input 
                type="text" 
                bind:value={apiBase} 
                placeholder="https://api.openai.com/v1" 
                class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-blue-400 font-mono text-sm outline-none focus:border-emerald-500/50 transition-colors" 
              />
            </div>

            <div class="space-y-3">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">API Key</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock class="h-4 w-4 text-white/30" />
                </div>
                <input 
                  type="password" 
                  bind:value={apiKey} 
                  placeholder="sk-..." 
                  class="w-full h-11 pl-10 pr-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none focus:border-emerald-500/50 transition-colors" 
                />
              </div>
            </div>
          </div>
        {/if}

        {#if isACP}
          <div class="space-y-6 p-6 rounded-2xl bg-black/60 border border-white/10 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)]">
            <h3 class="text-xs font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
              <Terminal class="h-4 w-4 text-orange-400" /> MCP / ACP Configuration
            </h3>
            
            <div class="space-y-3">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Binary Path / Command</label>
              <input 
                type="text" 
                bind:value={acpBinary} 
                placeholder="/usr/bin/node" 
                class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-orange-400 font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" 
              />
            </div>
            
            <div class="space-y-3">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Arguments</label>
              <input 
                type="text" 
                bind:value={acpArgs} 
                placeholder="index.js --port 3000" 
                class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-colors" 
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-3">
                <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Idle TTL</label>
                <input 
                  type="text" 
                  bind:value={acpIdleTTL} 
                  class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none focus:border-orange-500/50" 
                />
              </div>
              <div class="space-y-3">
                <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Permission Mode</label>
                <select 
                  bind:value={acpPermMode} 
                  class="w-full h-11 px-4 pr-10 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none appearance-none focus:border-orange-500/50 relative z-10"
                >
                  <option value="approve-all" class="bg-black text-white">Approve All</option>
                  <option value="prompt" class="bg-black text-white">Prompt User</option>
                </select>
                <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none z-20">
                  <ChevronDown class="h-4 w-4 text-white/30" />
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Execution Constraints -->
        <div class="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5">
          <div>
            <label class="text-xs font-bold text-white/90 uppercase tracking-widest">Provider Status</label>
            <p class="text-[10px] text-white/40 font-mono mt-0.5">Enable or disable routing to this provider</p>
          </div>
          <!-- Toggle Switch -->
          <button 
            onclick={() => enabled = !enabled}
            class={`relative w-12 h-6 rounded-full border transition-all duration-300 ease-in-out ${
              enabled 
                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-black/50 border-white/20'
            }`}
          >
            <div class={`absolute top-[1px] left-[2px] h-5 w-5 rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${
              enabled ? 'translate-x-[22px] bg-emerald-400' : 'translate-x-0 bg-white/30'
            }`}></div>
          </button>
        </div>

      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md flex justify-end gap-4 relative z-10 rounded-b-3xl">
        <button 
          onclick={() => onOpenChange(false)} 
          disabled={saving}
          class="px-6 h-10 rounded-xl border border-transparent text-white/50 hover:text-white hover:border-white/10 hover:bg-white/[0.05] transition-colors font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onclick={handleSubmit} 
          disabled={saving || !name} 
          class="relative group px-8 h-10 flex items-center justify-center gap-2 rounded-xl bg-purple-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-purple-400 transition-all disabled:opacity-50 disabled:hover:bg-purple-500 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] overflow-hidden"
        >
          <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
          {#if saving}
            <Server class="h-4 w-4 animate-spin relative z-10" /> <span class="relative z-10">Saving...</span>
          {:else}
            <Save class="h-4 w-4 relative z-10" /> <span class="relative z-10">Register</span>
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}
