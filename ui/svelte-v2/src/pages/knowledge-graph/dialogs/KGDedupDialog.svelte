<script lang="ts">
  import { X, Merge, Search, Loader2, Check } from "lucide-svelte";
  import { fade, scale } from "svelte/transition";
  import { useKGDedup } from "../hooks/use-knowledge-graph.svelte";

  let {
    open = $bindable(),
    agentId,
    userId
  } = $props<{
    open: boolean;
    agentId: string;
    userId: string;
  }>();

  const dedupStore = useKGDedup(() => agentId, () => userId);

  $effect(() => {
    if (open) {
      dedupStore.refresh();
    }
  });

  let isScanning = $state(false);
  let isActioning = $state(false);

  const handleScan = async () => {
    isScanning = true;
    try {
      await dedupStore.scan();
    } finally {
      isScanning = false;
    }
  };

  const handleMerge = async (targetId: string, sourceId: string) => {
    isActioning = true;
    try {
      await dedupStore.merge(targetId, sourceId);
    } finally {
      isActioning = false;
    }
  };

  const handleDismiss = async (candidateId: string) => {
    isActioning = true;
    try {
      await dedupStore.dismiss(candidateId);
    } finally {
      isActioning = false;
    }
  };

</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 bg-[#030014]/90 backdrop-blur-xl z-[100] transition-all duration-300 flex items-center justify-center p-4"
    transition:fade={{ duration: 300 }}
    onclick={() => !isScanning && !isActioning && (open = false)}
  >
    <div 
      class="bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative"
      onclick={(e) => e.stopPropagation()}
      transition:scale={{ duration: 400, start: 0.95 }}
    >
      <!-- Header -->
      <div class="shrink-0 p-6 border-b border-white/10 flex items-center justify-between relative z-10">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/30">
            <Merge class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl font-black text-white tracking-tight uppercase">Deduplication Engine</h2>
            <p class="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">Resolve Overlapping Graph Entities</p>
          </div>
        </div>
        <button 
          type="button"
          onclick={() => !isScanning && !isActioning && (open = false)}
          class="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Toolbar -->
      <div class="shrink-0 p-4 border-b border-white/10 bg-black/40 flex justify-between items-center z-10">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
          {dedupStore.candidates.length} Candidates Found
        </p>
        <button 
          onclick={handleScan}
          disabled={isScanning}
          class="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-xl text-xs font-black uppercase tracking-widest text-yellow-400 hover:text-yellow-300 transition-all disabled:opacity-50"
        >
          {#if isScanning}
            <Loader2 class="h-4 w-4 animate-spin" /> Scanning...
          {:else}
            <Search class="h-4 w-4" /> Run Deep Scan
          {/if}
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 relative z-10">
        {#if dedupStore.loading && dedupStore.candidates.length === 0}
          <div class="flex flex-col items-center justify-center p-12 text-white/30">
            <Loader2 class="h-8 w-8 animate-spin mb-4" />
            <p class="text-xs font-black uppercase tracking-widest">Loading Candidates...</p>
          </div>
        {:else if dedupStore.candidates.length === 0}
          <div class="flex flex-col items-center justify-center p-12 text-white/30">
            <Check class="h-12 w-12 mb-4 opacity-50" />
            <p class="text-xs font-black uppercase tracking-widest">Graph is Clean</p>
            <p class="text-[10px] font-mono mt-2">No overlapping entities detected.</p>
          </div>
        {:else}
          {#each dedupStore.candidates as c}
            <div class="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-widest text-yellow-400/70">Confidence: {Math.round(c.similarity_score * 100)}%</span>
                <div class="flex gap-2">
                  <button 
                    disabled={isActioning}
                    onclick={() => handleDismiss(c.id)}
                    class="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all"
                  >
                    Dismiss
                  </button>
                  <button 
                    disabled={isActioning}
                    onclick={() => handleMerge(c.entity_b.id, c.entity_a.id)}
                    class="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-[10px] font-black uppercase tracking-widest text-yellow-400 hover:text-yellow-300 transition-all flex items-center gap-1"
                  >
                    <Merge class="h-3 w-3" /> Merge A into B
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <!-- Entity A -->
                <div class="bg-white/5 rounded-xl p-3 border border-white/5 border-l-2 border-l-red-500/50">
                  <div class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Entity A (Source)</div>
                  <div class="font-bold text-sm text-white/90">{c.entity_a.name}</div>
                  <div class="text-xs text-white/50 mt-1 line-clamp-2">{c.entity_a.description || "-"}</div>
                </div>
                
                <!-- Entity B -->
                <div class="bg-white/5 rounded-xl p-3 border border-white/5 border-l-2 border-l-emerald-500/50">
                  <div class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Entity B (Target)</div>
                  <div class="font-bold text-sm text-white/90">{c.entity_b.name}</div>
                  <div class="text-xs text-white/50 mt-1 line-clamp-2">{c.entity_b.description || "-"}</div>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

    </div>
  </div>
{/if}
