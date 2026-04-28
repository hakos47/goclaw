<script lang="ts">
  import { 
    X, RefreshCw, Square, GitFork, 
    CheckCircle2, XCircle, Loader2, CircleDot, 
    Activity, Zap, History, Database, Cpu, Search
  } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { Badge } from "$lib/components/ui/badge";
  import { formatDate, formatDuration, formatTokens } from "$lib/format";
  import { buildSpanTree } from "$lib/adapters/trace";
  import type { TraceData, SpanData } from "$lib/types/trace";
  import TraceSpanTreeNode from "./TraceSpanTreeNode.svelte";
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";

  type Props = {
    traceId: string;
    open: boolean;
    onClose: () => void;
    getTrace: (id: string) => Promise<{ trace: TraceData; spans: SpanData[] } | null>;
    onAbortRun: (trace: TraceData) => Promise<void>;
  };

  let { traceId, open, onClose, getTrace, onAbortRun }: Props = $props();

  let trace = $state<TraceData | null>(null);
  let spans = $state<SpanData[]>([]);
  let loading = $state(true);
  let aborting = $state(false);

  async function load() {
    loading = true;
    const res = await getTrace(traceId);
    if (res) {
      trace = res.trace;
      spans = res.spans;
    }
    loading = false;
  }

  $effect(() => {
    if (open && traceId) {
      load();
    }
  });

  const spanTree = $derived(buildSpanTree(spans));

  function getStatusColor(status: string) {
    if (status === "ok" || status === "success" || status === "completed") return "text-emerald-400";
    if (status === "error" || status === "failed") return "text-red-400";
    if (status === "running") return "text-blue-400";
    return "text-white/40";
  }

  function getStatusIcon(status: string) {
    if (status === "ok" || status === "success" || status === "completed") return CheckCircle2;
    if (status === "error" || status === "failed") return XCircle;
    if (status === "running") return Loader2;
    return CircleDot;
  }
</script>

{#if open}
  <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
    <button 
      onclick={onClose}
      class="absolute inset-0 bg-[#030014]/90 backdrop-blur-2xl transition-all duration-500 pointer-events-auto"
      aria-label="Close dialog"
    ></button>

    <div class="relative w-full max-w-5xl bg-[#030014]/95 border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
      <!-- Glow Effects -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <!-- Header -->
      <div class="relative px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Activity class="w-6 h-6 text-goclaw-neon-purple" />
          </div>
          <div>
            {#if trace}
              <div class="flex items-center gap-3">
                 <h2 class="text-xl font-bold tracking-tight text-white uppercase tracking-tighter">Trace Analysis</h2>
                 <Badge variant="outline" class="text-[9px] py-0">{trace.id.slice(0, 8)}</Badge>
              </div>
              <p class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Deep inspection of logic execution flow</p>
            {:else}
              <h2 class="text-xl font-bold tracking-tight text-white uppercase tracking-tighter">Loading Trace...</h2>
            {/if}
          </div>
        </div>
        <div class="flex items-center gap-3">
           {#if trace?.status === "running"}
             <button 
               onclick={async () => {
                 aborting = true;
                 await onAbortRun(trace!);
                 aborting = false;
               }}
               disabled={aborting}
               class="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
             >
                {#if aborting}
                  <Loader2 class="w-3.5 h-3.5 animate-spin" />
                {:else}
                  <Square class="w-3.5 h-3.5" />
                {/if}
                Abort Execution
             </button>
           {/if}
           <button 
             onclick={onClose}
             class="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all"
           >
             <X class="w-5 h-5" />
           </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
         {#if loading}
           <div class="flex-1 flex items-center justify-center">
              <RefreshCw class="w-8 h-8 animate-spin text-goclaw-neon-purple/40" />
           </div>
         {:else if trace}
           <!-- Sidebar Meta -->
           <div class="w-full md:w-80 border-r border-white/5 p-6 space-y-8 overflow-y-auto custom-scrollbar bg-white/[0.01]">
              <div class="space-y-6">
                 <div class="space-y-1">
                    <span class="text-[9px] font-black uppercase tracking-widest text-white/20">Source Intent</span>
                    <p class="text-sm font-bold text-white/90 truncate">{trace.name || 'unnamed_intent'}</p>
                 </div>
                 
                 <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                       <span class="text-[9px] font-black uppercase tracking-widest text-white/20">Status</span>
                       <div class="flex items-center gap-1.5 {getStatusColor(trace.status)}">
                          {#if true}
                             {@const Icon = getStatusIcon(trace.status)}
                             <Icon class="w-3 h-3 {trace.status === 'running' ? 'animate-spin' : ''}" />
                          {/if}
                          <span class="text-[10px] font-bold uppercase">{trace.status}</span>
                       </div>
                    </div>
                    <div class="space-y-1">
                       <span class="text-[9px] font-black uppercase tracking-widest text-white/20">Duration</span>
                       <p class="text-[10px] font-mono text-white/80">{formatDuration(trace.duration_ms)}</p>
                    </div>
                 </div>

                 <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    <div class="flex items-center justify-between">
                       <span class="text-[9px] font-black uppercase tracking-widest text-white/20">Resource Usage</span>
                       <Database class="w-3 h-3 text-white/20" />
                    </div>
                    <div class="space-y-3">
                       <div class="flex justify-between items-center">
                          <span class="text-[10px] text-white/40">Total Tokens</span>
                          <span class="text-[10px] font-mono text-white/80">{formatTokens(trace.total_input_tokens + trace.total_output_tokens)}</span>
                       </div>
                       <div class="flex justify-between items-center">
                          <span class="text-[10px] text-white/40">In / Out</span>
                          <span class="text-[10px] font-mono text-white/60">{formatTokens(trace.total_input_tokens)} / {formatTokens(trace.total_output_tokens)}</span>
                       </div>
                       <div class="flex justify-between items-center">
                          <span class="text-[10px] text-white/40">Execution Units</span>
                          <span class="text-[10px] font-mono text-white/80">{trace.span_count} spans</span>
                       </div>
                    </div>
                 </div>

                 <div class="space-y-1">
                    <span class="text-[9px] font-black uppercase tracking-widest text-white/20">Creation Timeline</span>
                    <p class="text-[10px] font-mono text-white/40">{formatDate(trace.created_at)}</p>
                 </div>
              </div>
           </div>

           <!-- Main Span Tree -->
           <div class="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
              <div class="flex items-center justify-between mb-2">
                 <div class="flex items-center gap-2">
                    <GitFork class="w-4 h-4 text-goclaw-neon-purple" />
                    <h3 class="text-xs font-bold text-white uppercase tracking-widest">Logic Tree</h3>
                 </div>
                 <span class="text-[9px] font-mono text-white/20">{spans.length} active nodes recorded</span>
              </div>

              <div class="space-y-1.5">
                 {#each spanTree as node (node.span.id)}
                    <TraceSpanTreeNode {node} depth={0} />
                 {/each}
              </div>
           </div>
         {/if}
      </div>

      <!-- Footer -->
      <div class="px-8 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
        <p class="text-[9px] font-mono text-white/20 uppercase tracking-widest">
          GoClaw Trace Inspector • Distributed Logic Telemetry
        </p>
        <button 
          onclick={load}
          class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
        >
          <RefreshCw class="w-3 h-3" />
          Refresh Trace
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
</style>
