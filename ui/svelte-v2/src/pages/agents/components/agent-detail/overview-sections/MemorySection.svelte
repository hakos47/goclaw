<script lang="ts">
  import { Database, Network } from "lucide-svelte";
  import type { MemoryConfig, DreamingConfig } from "../../../../../lib/types/agent";

  type Props = {
    value: MemoryConfig;
    onChange: (v: MemoryConfig) => void;
  };

  let { value, onChange }: Props = $props();

  let dreaming = $derived(value.dreaming ?? {});

  function setDreaming(patch: Partial<DreamingConfig>) {
    onChange({ ...value, dreaming: { ...dreaming, ...patch } });
  }

  function undefIfNaN(val: number): number | undefined {
    return isNaN(val) ? undefined : val;
  }
</script>

<div class="relative z-20 group p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(168,85,247,0.1),0_0_40px_rgba(168,85,247,0.2)] hover:border-purple-500/30 mt-6">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>

  <div class="relative z-10 flex items-start justify-between border-b border-white/10 pb-6 mb-6">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
        <Database class="h-4 w-4 text-blue-500 animate-[pulse_3s_ease-in-out_infinite]" />
      </div>
      <div>
        <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Archival Memory Engine</h3>
        <p class="text-[10px] text-white/40 mt-1">Configure vector database ingestion and semantic retrieval strategies.</p>
      </div>
    </div>
    
    <!-- Global Memory Toggle -->
    <button 
       onclick={() => onChange({ ...value, enabled: !(value.enabled ?? true) })}
       class={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black ${value.enabled !== false ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-[#030014] border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
     >
       <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value.enabled !== false ? 'translate-x-6' : 'translate-x-1'}`}></span>
     </button>
  </div>

  <div class={`relative z-10 transition-all duration-300 ${value.enabled === false ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
    <!-- Indexing & Search -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div class="space-y-1.5 group/input relative">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Max Chunk Length</label>
        <div class="relative">
          <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-blue-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(59,130,246,0.3),0_0_15px_rgba(59,130,246,0.2)]"></div>
          <input
            type="number"
            value={value.max_chunk_len}
            oninput={(e) => onChange({ ...value, max_chunk_len: undefIfNaN(Number(e.currentTarget.value)) })}
            placeholder="1000"
            class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-blue-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
          />
        </div>
      </div>
      <div class="space-y-1.5 group/input relative">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Chunk Overlap</label>
        <div class="relative">
          <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-blue-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(59,130,246,0.3),0_0_15px_rgba(59,130,246,0.2)]"></div>
          <input
            type="number"
            value={value.chunk_overlap}
            oninput={(e) => onChange({ ...value, chunk_overlap: undefIfNaN(Number(e.currentTarget.value)) })}
            placeholder="200"
            class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-blue-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
          />
        </div>
      </div>
    </div>

    <!-- Retrieval Yield -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
      <div class="space-y-1.5 group/input relative">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Max Results</label>
        <div class="relative">
          <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-blue-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(59,130,246,0.3),0_0_15px_rgba(59,130,246,0.2)]"></div>
          <input
            type="number"
            value={value.max_results}
            oninput={(e) => onChange({ ...value, max_results: undefIfNaN(Number(e.currentTarget.value)) })}
            placeholder="6"
            class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-blue-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
          />
        </div>
      </div>
      <div class="space-y-1.5 group/input relative">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Minimum Score / Quality</label>
        <div class="relative">
          <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-blue-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(59,130,246,0.3),0_0_15px_rgba(59,130,246,0.2)]"></div>
          <input
            type="number"
            step="0.01"
            value={value.min_score}
            oninput={(e) => onChange({ ...value, min_score: undefIfNaN(Number(e.currentTarget.value)) })}
            placeholder="0.35"
            class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-blue-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
          />
        </div>
      </div>
    </div>

    <!-- Hybrid Search Tuning -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
      <div class="space-y-1.5 group/input relative">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Vector Weight (Dense)</label>
        <div class="relative">
          <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-blue-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(59,130,246,0.3),0_0_15px_rgba(59,130,246,0.2)]"></div>
          <input
            type="number"
            step="0.1"
            value={value.vector_weight}
            oninput={(e) => onChange({ ...value, vector_weight: undefIfNaN(Number(e.currentTarget.value)) })}
            placeholder="0.7"
            class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-blue-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
          />
        </div>
      </div>
      <div class="space-y-1.5 group/input relative">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Text Weight (BM25)</label>
        <div class="relative">
          <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-blue-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(59,130,246,0.3),0_0_15px_rgba(59,130,246,0.2)]"></div>
          <input
            type="number"
            step="0.1"
            value={value.text_weight}
            oninput={(e) => onChange({ ...value, text_weight: undefIfNaN(Number(e.currentTarget.value)) })}
            placeholder="0.3"
            class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-blue-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
          />
        </div>
      </div>
    </div>

    <!-- Dreaming Worker config -->
    <div class="mt-8 border border-white/10 rounded-3xl p-6 bg-[#030014]/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] hover:border-purple-500/30 transition-all duration-300">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="h-6 w-6 rounded-lg bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 flex items-center justify-center shadow-[0_0_10px_rgba(217,70,239,0.2)]">
            <Network class="h-3 w-3 text-goclaw-neon-purple" />
          </div>
          <div>
            <h4 class="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Background Consolidation (Dreaming)</h4>
            <p class="text-[10px] text-white/30 truncate mt-0.5">Asynchronous memory distillation and topic clustering.</p>
          </div>
        </div>
        <button 
           onclick={() => setDreaming({ enabled: !(dreaming.enabled ?? true) })}
           class={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:ring-2 focus:ring-goclaw-neon-purple focus:ring-offset-2 focus:ring-offset-black ${dreaming.enabled !== false ? 'bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'bg-[#030014] border border-white/10'}`}
         >
           <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dreaming.enabled !== false ? 'translate-x-6' : 'translate-x-1'}`}></span>
         </button>
      </div>

      <div class={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity ${dreaming.enabled === false ? 'opacity-30 pointer-events-none' : ''}`}>
        <div class="space-y-1.5 group/input relative">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Consolidation Threshold</label>
          <div class="relative">
            <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-goclaw-neon-purple/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(217,70,239,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(217,70,239,0.3),0_0_15px_rgba(217,70,239,0.2)]"></div>
            <input
              type="number"
              value={dreaming.threshold}
              oninput={(e) => setDreaming({ threshold: undefIfNaN(Number(e.currentTarget.value)) })}
              placeholder="5"
              class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-goclaw-neon-purple font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
            />
          </div>
        </div>
        <div class="space-y-1.5 group/input relative">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Debounce Latency (ms)</label>
          <div class="relative">
            <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-goclaw-neon-purple/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(217,70,239,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(217,70,239,0.3),0_0_15px_rgba(217,70,239,0.2)]"></div>
            <input
              type="number"
              value={dreaming.debounce_ms}
              oninput={(e) => setDreaming({ debounce_ms: undefIfNaN(Number(e.currentTarget.value)) })}
              placeholder="600000"
              class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-goclaw-neon-purple font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
            />
          </div>
        </div>
      </div>
      
      <div class="mt-6 flex items-center gap-2 pl-2">
        <label class="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={dreaming.verbose_log ?? false}
            onchange={(e) => setDreaming({ verbose_log: e.currentTarget.checked })}
            class="w-4 h-4 rounded bg-[#030014] border border-white/20 accent-goclaw-neon-purple"
          />
          <span class="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-goclaw-neon-purple transition-colors">Verbose Logging</span>
        </label>
      </div>
    </div>
  </div>
</div>
