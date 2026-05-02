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

<div class="rounded-2xl border border-[#d946ef]/20 bg-black/40 shadow-inner overflow-hidden flex flex-col transition-all duration-300 group/tool">
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
            <div class="flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border-l-2 border-goclaw-neon-cyan relative isolate overflow-hidden">
                <div class="absolute inset-0 bg-goclaw-neon-cyan/10 animate-pulse"></div>
                <div class="w-16 h-[2px] bg-white/10 rounded-full overflow-hidden flex">
                    <div class="h-full bg-goclaw-neon-cyan w-1/2 animate-[progress_1s_ease-in-out_infinite_alternate]"></div>
                </div>
                <span class={cn("text-[9px] font-bold uppercase tracking-widest relative z-10", isSkill ? "text-amber-400/80" : "text-goclaw-neon-cyan/80")}>
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
    <div class="border-t border-[#d946ef]/20 bg-black/80 p-4 space-y-4 relative isolate">
        <!-- Intense Scanline grid -->
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:12px_12px] opacity-20 pointer-events-none"></div>
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_2px] opacity-30 pointer-events-none"></div>
        
        {#if toolCall.errorContent}
            <div class="relative z-10">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 mb-1.5 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-sm bg-red-500 animate-ping"></span>
                    [ FATAL ERROR TRACE ]
                </div>
                <pre class="text-[11px] text-red-400 whitespace-pre-wrap font-mono bg-[#1a0505]/90 border-l-2 border-red-500 rounded-r-xl p-3 max-h-60 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">{toolCall.errorContent}</pre>
            </div>
        {/if}

        {#if toolCall.arguments && Object.keys(toolCall.arguments).length > 0}
            <div class="relative z-10">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-goclaw-neon-cyan/80 mb-1.5 flex items-center gap-2">
                    <span class="w-1 h-2 bg-goclaw-neon-cyan animate-pulse"></span>
                    [ PAYLOAD MATRIX ]
                </div>
                <pre class="text-[11px] text-goclaw-neon-cyan/60 whitespace-pre-wrap font-mono bg-black/90 border border-white/5 rounded-xl p-3 max-h-60 overflow-y-auto custom-scrollbar shadow-inner">{JSON.stringify(toolCall.arguments, null, 2)}</pre>
            </div>
        {/if}

        {#if toolCall.result}
            <div class="relative z-10">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/80 mb-1.5 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-emerald-500 rotate-45"></span>
                    [ EXECUTION OUTPUT ]
                </div>
                <pre class="text-[11px] text-emerald-400/70 whitespace-pre-wrap font-mono bg-[#02120a]/90 border-l-2 border-emerald-500/50 rounded-r-xl p-3 max-h-80 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">{toolCall.result}</pre>
            </div>
        {/if}
    </div>
  {/if}
</div>
