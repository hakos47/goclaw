<script lang="ts">
  import { Brain, ChevronDown } from "lucide-svelte";
  import { cn } from "../../utils";

  let { text, isStreaming = false } = $props<{ text: string, isStreaming?: boolean }>();
  let expanded = $state(false);

  // Auto-expand when streaming starts
  $effect(() => {
    if (isStreaming) {
      expanded = true;
    }
  });

  function toggle() {
    expanded = !expanded;
  }
</script>

{#if text || isStreaming}
<div class="mb-4 rounded-2xl bg-black/40 border border-[#d946ef]/20 border-l-2 border-l-goclaw-neon-purple/80 shadow-[0_0_20px_rgba(217,70,239,0.05),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden relative group/thinking">
  <!-- Interactive header -->
  <button 
    onclick={toggle}
    class="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors relative isolate cursor-pointer"
  >
    <div class="absolute inset-0 bg-goclaw-neon-purple/5 opacity-50 group-hover/thinking:opacity-80 transition-opacity pointer-events-none"></div>
    
    <div class="flex items-center gap-2 relative z-10">
        <div class="p-1.5 rounded-lg bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 text-goclaw-neon-purple/80 shadow-[0_0_15px_rgba(217,70,239,0.1)] relative isolate">
            <div class={cn("absolute inset-0 bg-goclaw-neon-purple/20 blur-md rounded-lg", isStreaming && "animate-pulse")}></div>
            <Brain class={cn("h-3.5 w-3.5 relative z-10", isStreaming && "animate-pulse")} />
        </div>
        <span class={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors", isStreaming ? "text-goclaw-neon-purple drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" : "text-white/40 group-hover/thinking:text-white/70")}>
            {isStreaming ? '[ NEURAL SYNC ACTIVE ]' : 'INTERNAL MONOLOGUE'}
        </span>
        {#if isStreaming}
            <span class="flex gap-0.5 ml-2">
                <span class="w-1 h-2 bg-goclaw-neon-purple animate-[progress_1s_ease-in-out_infinite_alternate]"></span>
                <span class="w-1 h-2 bg-goclaw-neon-purple animate-[progress_1s_ease-in-out_infinite_alternate_200ms]"></span>
                <span class="w-1 h-2 bg-goclaw-neon-purple animate-[progress_1s_ease-in-out_infinite_alternate_400ms]"></span>
            </span>
        {/if}
    </div>

    <div class="relative z-10 flex items-center gap-2 text-white/30">
        <ChevronDown class={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")} />
    </div>
  </button>

  {#if expanded && text}
    <div class="border-t border-[#d946ef]/20 bg-black/80 p-4 relative isolate">
        <!-- Diagnostic grid in expanded content -->
        <div class="absolute inset-0 bg-[linear-gradient(45deg,rgba(217,70,239,0.03)_25%,transparent_25%,transparent_50%,rgba(217,70,239,0.03)_50%,rgba(217,70,239,0.03)_75%,transparent_75%,transparent)] bg-[length:20px_20px] pointer-events-none opacity-50"></div>
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
        
        <pre class="text-[11px] text-[#d946ef]/60 italic whitespace-pre-wrap font-serif leading-relaxed max-h-80 overflow-y-auto custom-scrollbar relative z-10 border-l border-[#d946ef]/30 pl-3 shadow-[inset_10px_0_20px_-10px_rgba(217,70,239,0.1)]">{text}{#if isStreaming}<span class="inline-block w-1.5 h-3.5 bg-goclaw-neon-purple/80 animate-pulse ml-1 align-text-bottom"></span>{/if}</pre>
    </div>
  {/if}
</div>
{/if}
