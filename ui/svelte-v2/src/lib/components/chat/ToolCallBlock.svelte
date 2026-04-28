<script lang="ts">
  import type { ToolStreamEntry } from "../../types/chat";
  import { ChevronDown, Wrench, Zap, AlertTriangle, Loader2, CheckCircle2 } from "lucide-svelte";
  import { cn } from "../../utils";
  
  let { toolCall } = $props<{ toolCall: ToolStreamEntry }>();
  let expanded = $state(false);

  // Distinguish 'skills' from regular tools if needed (based on legacy behavior)
  let isSkill = $derived(toolCall.name === 'use_skill' || toolCall.name.startsWith('skill_'));
  
  // Truncate args for summary
  let summary = $derived.by(() => {
    if (!toolCall.arguments) return null;
    const key = toolCall.arguments.path ?? toolCall.arguments.command ?? toolCall.arguments.query ?? toolCall.arguments.url ?? toolCall.arguments.name;
    if (typeof key === 'string') return key.length > 60 ? key.slice(0, 57) + '...' : key;
    return null;
  });

  let canExpand = $derived(
    (toolCall.arguments && Object.keys(toolCall.arguments).length > 0) || 
    toolCall.result || 
    toolCall.errorContent
  );

  function toggle() {
      if (canExpand) expanded = !expanded;
  }
</script>

<div class="rounded-xl border border-white/10 bg-black/40 shadow-inner overflow-hidden flex flex-col transition-all duration-300 group/tool">
  <button 
    onclick={toggle}
    disabled={!canExpand}
    class={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03] transition-colors relative isolate",
        !canExpand && "opacity-80 cursor-default hover:bg-transparent"
    )}
  >
    <!-- Background glow on hover -->
    {#if canExpand}
        <div class="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover/tool:opacity-100 transition-opacity pointer-events-none"></div>
    {/if}

    <!-- Left border status indicator -->
    <div class={cn(
        "absolute left-0 top-0 bottom-0 w-0.5 transition-colors",
        toolCall.phase === 'error' ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : 
        toolCall.phase === 'completed' ? "bg-emerald-500/50" : 
        isSkill ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" : "bg-goclaw-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.8)]"
    )}></div>

    <!-- Icon -->
    <div class={cn(
        "p-1.5 rounded-lg flex items-center justify-center border transition-all relative z-10",
        toolCall.phase === 'error' ? "bg-red-500/10 border-red-500/30 text-red-400" :
        isSkill ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-goclaw-neon-cyan/10 border-goclaw-neon-cyan/30 text-goclaw-neon-cyan"
    )}>
        {#if toolCall.phase === 'error'}
            <AlertTriangle class="h-3.5 w-3.5" />
        {:else if isSkill}
            <Zap class={cn("h-3.5 w-3.5", toolCall.phase === 'calling' && "animate-pulse")} />
        {:else}
            <Wrench class={cn("h-3.5 w-3.5", toolCall.phase === 'calling' && "animate-pulse")} />
        {/if}
    </div>

    <!-- Title and Summary -->
    <div class="flex-1 min-w-0 flex flex-col justify-center relative z-10">
        <span class={cn(
            "text-xs font-bold uppercase tracking-wider truncate",
            toolCall.phase === 'error' ? "text-red-400" : "text-white/80 group-hover/tool:text-white"
        )}>
            {toolCall.name}
        </span>
        {#if summary}
            <span class="text-[9px] font-mono text-white/40 truncate">{summary}</span>
        {/if}
    </div>

    <!-- Status Badge -->
    <div class="flex items-center gap-2 shrink-0 relative z-10">
        {#if toolCall.phase === 'calling'}
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                <Loader2 class={cn("h-2.5 w-2.5 animate-spin", isSkill ? "text-amber-400" : "text-goclaw-neon-cyan")} />
                <span class={cn("text-[9px] font-bold uppercase tracking-widest", isSkill ? "text-amber-400/80" : "text-goclaw-neon-cyan/80")}>
                    {isSkill ? 'Activating' : 'Running'}
                </span>
            </div>
        {:else if toolCall.phase === 'completed'}
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/80">
                <CheckCircle2 class="h-2.5 w-2.5" />
                <span class="text-[9px] font-bold uppercase tracking-widest">Done</span>
            </div>
        {:else if toolCall.phase === 'error'}
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400/80">
                <span class="text-[9px] font-bold uppercase tracking-widest">Failed</span>
            </div>
        {/if}

        {#if canExpand}
            <ChevronDown class={cn("h-4 w-4 text-white/30 transition-transform duration-300 ml-1", expanded && "rotate-180")} />
        {/if}
    </div>
  </button>

  {#if expanded && canExpand}
    <div class="border-t border-white/5 bg-black/60 p-4 space-y-4 relative isolate">
        <!-- Background grid in expanded state -->
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-10 pointer-events-none"></div>
        
        {#if toolCall.errorContent}
            <div class="relative z-10">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60 mb-1.5 flex items-center gap-2">
                    <span class="w-1 h-1 rounded-full bg-red-500"></span>
                    Error Trace
                </div>
                <pre class="text-[11px] text-red-300 whitespace-pre-wrap font-mono bg-red-950/30 border border-red-500/20 rounded-xl p-3 max-h-60 overflow-y-auto custom-scrollbar shadow-inner">{toolCall.errorContent}</pre>
            </div>
        {/if}

        {#if toolCall.arguments && Object.keys(toolCall.arguments).length > 0}
            <div class="relative z-10">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1.5 flex items-center gap-2">
                    <span class="w-1 h-1 rounded-full bg-goclaw-neon-cyan/50"></span>
                    Payload / Arguments
                </div>
                <pre class="text-[11px] text-white/60 whitespace-pre-wrap font-mono bg-[#030014]/80 border border-white/5 rounded-xl p-3 max-h-60 overflow-y-auto custom-scrollbar shadow-inner">{JSON.stringify(toolCall.arguments, null, 2)}</pre>
            </div>
        {/if}

        {#if toolCall.result}
            <div class="relative z-10">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1.5 flex items-center gap-2">
                    <span class="w-1 h-1 rounded-full bg-emerald-500/50"></span>
                    Execution Result
                </div>
                <pre class="text-[11px] text-white/70 whitespace-pre-wrap font-mono bg-[#030014]/80 border border-emerald-500/10 rounded-xl p-3 max-h-80 overflow-y-auto custom-scrollbar shadow-inner">{toolCall.result}</pre>
            </div>
        {/if}
    </div>
  {/if}
</div>
