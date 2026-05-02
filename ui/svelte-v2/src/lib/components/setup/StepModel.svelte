<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { ChevronLeft, ChevronRight, Check, Loader2, CheckCircle2, ShieldAlert } from "lucide-svelte";
  import { authState } from "$lib/state/auth.svelte";
  import Combobox from "$lib/components/ui/Combobox.svelte";
  import { _ } from "svelte-i18n";

  let { provider, onComplete, onBack } = $props<{ 
    provider: any, 
    onComplete: (model: string) => void,
    onBack: () => void 
  }>();

  let selectedModel = $state<string>("");
  let availableModels = $state<any[]>([]);
  let comboboxOptions = $derived(availableModels.map(m => ({ 
    value: m.id, 
    label: m.name && m.name !== m.id ? `${m.id} — ${m.name}` : (m.name || m.id) 
  })));
  let loadingModels = $state(true);
  let errorMsg = $state("");

  let verifying = $state(false);
  let isVerified = $state(false);
  let verifySuccess = $state(false);

  onMount(async () => {
    loadingModels = true;
    errorMsg = "";
    try {
      const res = await fetch(`/v1/providers/${provider.id}/models`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      availableModels = data.models || [];
      if (availableModels.length > 0) {
        selectedModel = availableModels[0].id;
      }
    } catch (e: any) {
      errorMsg = e.message || "Failed to load models.";
    } finally {
      loadingModels = false;
    }
  });

  async function handleVerify() {
    if (!selectedModel) return;
    verifying = true;
    errorMsg = "";
    isVerified = false;
    verifySuccess = false;

    try {
      const res = await fetch(`/v1/providers/${provider.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({ model: selectedModel })
      });
      
      const data = await res.json();
      if (!res.ok || !data.valid) {
         throw new Error(data.error || "Verification failed");
      }
      isVerified = true;
      verifySuccess = true;
    } catch (e: any) {
      errorMsg = e.message || "Verification failed";
    } finally {
      verifying = false;
    }
  }

  function handleNext() {
    if (selectedModel) {
      onComplete(selectedModel);
    }
  }
</script>

<div class="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl mx-auto w-full">
  <div class="text-center space-y-2 mb-8">
    <h2 class="text-2xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Select Default Model</h2>
    <p class="text-white/40 text-xs font-mono uppercase tracking-widest">Choose the primary language model for <span class="text-goclaw-neon-purple font-mono">{provider.display_name || provider.name}</span>.</p>
  </div>

  <div class="space-y-4 bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] relative z-20">
    {#if errorMsg}
      <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
        <ShieldAlert class="h-4 w-4" />
        {errorMsg}
      </div>
    {/if}

    <div class="space-y-3 relative group/select z-30">
      <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Available Models</label>
      
      {#if loadingModels}
        <div class="h-12 w-full flex items-center justify-center border border-white/5 rounded-xl bg-black/50 text-white/50 font-mono text-xs uppercase tracking-widest">
          <Loader2 class="h-4 w-4 mr-2 animate-spin" /> Fetching Registry...
        </div>
      {:else if availableModels.length === 0}
         <input 
          type="text" 
          bind:value={selectedModel} 
          placeholder="e.g. gpt-4o" 
          class="w-full h-12 px-4 rounded-xl bg-black/60 border border-[#d946ef]/20 text-white font-mono text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-white/20" 
        />
        <p class="text-[10px] text-white/30 px-1">Provider did not return a model list. Enter model ID manually.</p>
      {:else}
        <div class="relative z-10">
          <Combobox 
            value={selectedModel} 
            onChange={(val) => { selectedModel = val; isVerified = false; verifySuccess = false; }}
            options={comboboxOptions}
            placeholder="Search or select model..."
            allowCustom={true}
            className="h-12 bg-black/60 border border-[#d946ef]/20 rounded-xl"
          />
        </div>
      {/if}
    </div>

    {#if verifySuccess}
      <div class="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
        <div class="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
          <CheckCircle2 class="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-emerald-400">Connection Verified</p>
          <p class="text-[10px] text-emerald-400/60 font-mono mt-0.5">Model {selectedModel} is responding correctly.</p>
        </div>
      </div>
    {:else}
      <div class="flex justify-start">
        <Button 
          variant="outline" 
          onclick={handleVerify}
          disabled={!selectedModel || verifying}
          class="h-10 px-6 rounded-xl border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest transition-all text-white/70 hover:text-white"
        >
          {#if verifying}
            <Loader2 class="h-3 w-3 mr-2 animate-spin" /> Establishing Uplink...
          {:else}
            Verify Connection
          {/if}
        </Button>
      </div>
    {/if}

  </div>

  <div class="flex justify-between items-center pt-8">
    <Button 
      variant="ghost" 
      onclick={onBack}
      class="text-white/50 hover:text-white hover:bg-white/5 uppercase tracking-[0.2em] font-bold text-[10px] rounded-none px-6"
    >
      <ChevronLeft class="w-4 h-4 mr-2" />
      Back
    </Button>

    <button 
      disabled={!selectedModel || !isVerified}
      onclick={handleNext} 
      class="h-14 relative flex items-center justify-center gap-2 px-10 py-3.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 overflow-hidden group text-white hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 disabled:opacity-50 disabled:hover:scale-100 disabled:grayscale min-w-[200px]"
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
