<script lang="ts">
  import { 
    ChevronRight, ChevronDown, CheckCircle2, XCircle, 
    Loader2, CircleDot, GitFork, Clock, Cpu, Terminal
  } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { Badge } from "$lib/components/ui/badge";
  import { formatDate, formatDuration, formatTokens, computeDurationMs } from "$lib/format";
  import type { SpanData } from "$lib/types/trace";
  import type { SpanNode } from "$lib/adapters/trace";
  import TracePreviewBlock from "./TracePreviewBlock.svelte";
  import { cn } from "$lib/utils";

  type Props = {
    node: SpanNode;
    depth: number;
  };

  let { node, depth }: Props = $props();
  let expanded = $state(depth === 0);
  let detailOpen = $state(false);

  const { span, children } = node;
  const hasChildren = children.length > 0;

  function getStatusColor(status: string) {
    if (status === "ok" || status === "success" || status === "completed") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (status === "error" || status === "failed") return "text-red-400 bg-red-500/10 border-red-500/20";
    if (status === "running" || status === "pending") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return "text-white/40 bg-white/5 border-white/10";
  }

  function getStatusIcon(status: string) {
    if (status === "ok" || status === "success" || status === "completed") return CheckCircle2;
    if (status === "error" || status === "failed") return XCircle;
    if (status === "running" || status === "pending") return Loader2;
    return CircleDot;
  }
</script>

<div class="space-y-1.5">
  <div 
    class="relative group rounded-2xl border border-white/5 bg-[#030014]/40 backdrop-blur-xl transition-all duration-300 hover:border-white/10"
    style="margin-left: {depth * 16}px"
  >
    <div class="flex items-center gap-2 p-2">
      {#if hasChildren}
        <button 
          onclick={() => expanded = !expanded}
          class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 transition-all"
        >
          {#if expanded}
            <ChevronDown class="w-3.5 h-3.5" />
          {:else}
            <ChevronRight class="w-3.5 h-3.5" />
          {/if}
        </button>
      {:else}
        <div class="w-6 h-6 flex items-center justify-center">
           <div class="w-1 h-1 rounded-full bg-white/10"></div>
        </div>
      {/if}

      <button 
        onclick={() => detailOpen = !detailOpen}
        class="flex-1 flex flex-wrap items-center gap-3 text-left focus:outline-none py-1"
      >
        <span class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/40">
          {span.span_type}
        </span>
        
        <span class="flex-1 text-xs font-bold text-white/80 truncate">
          {span.name || span.tool_name || "logic_block"}
        </span>

        <div class="flex items-center gap-3 shrink-0">
          {#if span.input_tokens > 0 || span.output_tokens > 0}
            <div class="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-white/30">
               <span>{formatTokens(span.input_tokens)}</span>
               <span class="text-white/10">/</span>
               <span>{formatTokens(span.output_tokens)}</span>
            </div>
          {/if}

          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono text-white/20 whitespace-nowrap">
              {formatDuration(span.duration_ms || computeDurationMs(span.start_time, span.end_time))}
            </span>
            
            {#if true}
              {@const Icon = getStatusIcon(span.status)}
              <div class={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5", getStatusColor(span.status))}>
                 <Icon class="w-2.5 h-2.5 {span.status === 'running' ? 'animate-spin' : ''}" />
                 <span class="hidden md:inline">{span.status}</span>
              </div>
            {/if}
          </div>
        </div>
      </button>
    </div>

    {#if detailOpen}
      <div class="px-4 pb-4 pt-2 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div class="space-y-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/20">Start Time</span>
              <p class="text-[10px] font-mono text-white/60">{formatDate(span.start_time)}</p>
           </div>
           {#if span.end_time}
             <div class="space-y-1">
                <span class="text-[8px] font-black uppercase tracking-widest text-white/20">End Time</span>
                <p class="text-[10px] font-mono text-white/60">{formatDate(span.end_time)}</p>
             </div>
           {/if}
           {#if span.model}
             <div class="space-y-1 col-span-2">
                <span class="text-[8px] font-black uppercase tracking-widest text-white/20">Model Identity</span>
                <div class="flex items-center gap-2">
                   <Badge variant="secondary" class="text-[9px] py-0">{span.provider}</Badge>
                   <span class="text-[10px] font-mono text-white/80 truncate">{span.model}</span>
                </div>
             </div>
           {/if}
        </div>

        {#if span.metadata?.reasoning}
           {@const r = span.metadata.reasoning}
           <div class="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-2">
              <div class="flex items-center gap-2 text-amber-400">
                 <Terminal class="w-3 h-3" />
                 <span class="text-[9px] font-black uppercase tracking-widest">Reasoning Context</span>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-white/40">
                 {#if r.requested_effort}<span>Requested: <span class="text-white/60">{r.requested_effort}</span></span>{/if}
                 {#if r.effective_effort}<span>Effective: <span class="text-white/60">{r.effective_effort}</span></span>{/if}
                 {#if r.source}<span>Source: <span class="text-white/60">{r.source}</span></span>{/if}
              </div>
              {#if r.reason}
                <p class="text-[10px] text-white/50 leading-relaxed italic">{r.reason}</p>
              {/if}
           </div>
        {/if}

        <div class="grid gap-4">
           {#if span.input_preview}
             <TracePreviewBlock label="Input Metadata" content={span.input_preview} />
           {/if}
           {#if span.output_preview}
             <TracePreviewBlock label="Output Data" content={span.output_preview} />
           {/if}
           {#if span.error}
             <div class="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] font-mono text-red-400 break-all">
                {span.error}
             </div>
           {/if}
        </div>
      </div>
    {/if}
  </div>

  {#if expanded && hasChildren}
    {#each children as child (child.span.id)}
      <svelte:self node={child} depth={depth + 1} />
    {/each}
  {/if}
</div>
