<script lang="ts">
  import { X, Sparkles, Loader2, Database, BrainCircuit } from "lucide-svelte";
  import { fade, scale } from "svelte/transition";
  import ProviderModelSelect from "../../../lib/components/shared/ProviderModelSelect.svelte";
  import { loadProviders } from "../../../lib/state/providers.svelte";
  import { onMount } from "svelte";

  let {
    open = $bindable(),
    onExtract
  } = $props<{
    open: boolean;
    onExtract: (text: string, provider: string, model: string) => Promise<any>;
  }>();

  let text = $state("");
  let provider = $state("openai");
  let model = $state("gpt-4o");
  let isExtracting = $state(false);

  onMount(() => {
    loadProviders();
  });

  $effect(() => {
    if (open) {
      text = "";
      isExtracting = false;
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!text.trim() || isExtracting) return;

    isExtracting = true;
    try {
      await onExtract(text, provider, model);
      open = false;
    } catch (e) {
      // Error handled by hook toast
    } finally {
      isExtracting = false;
    }
  };

</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 bg-[#030014]/90 backdrop-blur-xl z-[100] transition-all duration-300 flex items-center justify-center p-4"
    transition:fade={{ duration: 300 }}
    onclick={() => !isExtracting && (open = false)}
  >
    <div 
      class="bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative"
      onclick={(e) => e.stopPropagation()}
      transition:scale={{ duration: 400, start: 0.95 }}
    >
      <!-- Atmospheric Glows -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <!-- Header -->
      <div class="shrink-0 p-6 border-b border-white/10 flex items-center justify-between relative z-10">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <BrainCircuit class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl font-black text-white tracking-tight uppercase">Extract Knowledge</h2>
            <p class="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">NLP Entity Recognition</p>
          </div>
        </div>
        <button 
          type="button"
          onclick={() => !isExtracting && (open = false)}
          class="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <form id="extract-form" onsubmit={handleSubmit} class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 space-y-6 relative z-10 pb-32">
        
        <!-- Text Input -->
        <div class="space-y-2">
          <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 flex justify-between">
            <span>Raw Text Content *</span>
            <span>{text.length} chars</span>
          </label>
          <textarea 
            bind:value={text}
            rows="5"
            placeholder="Paste article, report, or unstructured text here to extract entities and relations..."
            class="w-full bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-emerald-400 outline-none transition-all resize-none custom-scrollbar text-white"
            disabled={isExtracting}
            required
          ></textarea>
        </div>

        <!-- LLM Settings -->
        <ProviderModelSelect
          provider={provider}
          model={model}
          onProviderChange={(v) => provider = v}
          onModelChange={(v) => model = v}
          allowEmpty={false}
        />

      </form>

      <!-- Footer -->
      <div class="shrink-0 p-6 border-t border-white/10 bg-[#030014]/80 flex justify-end gap-4 relative z-20">
        <button 
          type="button"
          onclick={() => !isExtracting && (open = false)}
          disabled={isExtracting}
          class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
        >
          Cancel
        </button>
        <button 
          type="submit"
          form="extract-form"
          disabled={!text.trim() || isExtracting}
          class="relative flex items-center justify-center gap-2 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all text-emerald-400 hover:text-white disabled:opacity-50 group"
        >
          <div class="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 rounded-xl group-hover:bg-emerald-500/30 transition-all"></div>
          {#if isExtracting}
            <Loader2 class="h-4 w-4 animate-spin relative z-10" />
            <span class="relative z-10">Extracting...</span>
          {:else}
            <Sparkles class="h-4 w-4 relative z-10" />
            <span class="relative z-10">Run Extraction</span>
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}
