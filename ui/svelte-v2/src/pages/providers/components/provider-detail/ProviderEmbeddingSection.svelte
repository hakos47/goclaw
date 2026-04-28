<script lang="ts">
  import { Database, Zap, Info, ShieldCheck, XCircle } from "lucide-svelte";
  import type { ProviderVerifyResponse } from "../../../../../../web/src/types/provider";

  type Props = {
    embEnabled: boolean;
    embModel: string;
    embApiBase: string;
    verifyingEmb: boolean;
    resultEmb: ProviderVerifyResponse | null;
    errorEmb: string | null;
    onEmbEnabledChange: (v: boolean) => void;
    onEmbModelChange: (v: string) => void;
    onEmbApiBaseChange: (v: string) => void;
    onVerify: () => void;
  };

  let {
    embEnabled,
    embModel,
    embApiBase,
    verifyingEmb,
    resultEmb,
    errorEmb,
    onEmbEnabledChange,
    onEmbModelChange,
    onEmbApiBaseChange,
    onVerify
  }: Props = $props();

</script>

<section class="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] relative overflow-hidden">
  <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
  
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-xs font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
      <Database class="h-4 w-4 text-cyan-400" /> Vector Embeddings
    </h3>
    
    <button 
      onclick={() => onEmbEnabledChange(!embEnabled)}
      class={`relative w-12 h-6 rounded-full border transition-all duration-300 ease-in-out flex-shrink-0 ${
        embEnabled 
          ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
          : 'bg-black/50 border-white/20'
      }`}
    >
      <div class={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${
        embEnabled ? 'translate-x-[22px] bg-cyan-400' : 'translate-x-0 bg-white/30'
      }`}></div>
    </button>
  </div>

  {#if embEnabled}
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3 relative group/input">
          <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Embedding Model</label>
          <div class="relative">
              <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-cyan-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]"></div>
              <input 
                type="text" 
                value={embModel}
                oninput={(e) => onEmbModelChange(e.currentTarget.value)}
                placeholder="text-embedding-3-small" 
                class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none transition-colors relative z-10 focus:bg-black/60" 
              />
          </div>
          <p class="text-[10px] text-white/30 px-1">The explicit model name to use for vectors.</p>
        </div>

        <div class="space-y-3 relative group/input">
          <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Custom Base URL (Optional)</label>
          <div class="relative">
              <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-cyan-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]"></div>
              <input 
                type="text" 
                value={embApiBase}
                oninput={(e) => onEmbApiBaseChange(e.currentTarget.value)}
                placeholder="https://api.openai.com/v1" 
                class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none transition-colors relative z-10 focus:bg-black/60" 
              />
          </div>
          <p class="text-[10px] text-white/30 px-1">If the embedding API is hosted elsewhere.</p>
        </div>
      </div>

      <div class="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4">
        <button 
          onclick={onVerify} 
          disabled={verifyingEmb || !embModel}
          class="h-10 px-6 w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[10px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          <Zap class={`h-3.5 w-3.5 ${verifyingEmb ? 'animate-pulse text-yellow-400' : ''}`} />
          {verifyingEmb ? 'Verifying...' : 'Test Embeddings'}
        </button>

        {#if errorEmb}
          <div class="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30 flex-1">
            <XCircle class="h-4 w-4" /> {errorEmb}
          </div>
        {:else if resultEmb}
          <div class={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border flex-1 ${
             resultEmb.success 
               ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
               : 'text-red-400 bg-red-500/10 border-red-500/30'
          }`}>
             {#if resultEmb.success}
               <ShieldCheck class="h-4 w-4" /> Connection established. Vector dimension: {resultEmb.details?.vector_dimension || '?'}
             {:else}
               <XCircle class="h-4 w-4" /> {resultEmb.error}
             {/if}
          </div>
        {/if}
      </div>

    </div>
  {:else}
    <p class="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
      Enable to explicitly configure this provider as an embedding generation source for RAG or memory processing.
    </p>
  {/if}
</section>
