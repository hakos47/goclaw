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
<div class="mb-4 rounded-xl bg-black/40 border border-white/5 border-l-2 border-l-goclaw-neon-purple/50 shadow-inner overflow-hidden relative group/thinking">
  <!-- Interactive header -->
  <button 
    onclick={toggle}
    class="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors relative isolate cursor-pointer"
  >
    <div class="absolute inset-0 bg-goclaw-neon-purple/5 opacity-50 group-hover/thinking:opacity-80 transition-opacity pointer-events-none"></div>
    
    <div class="flex items-center gap-2 relative z-10">
        <div class="p-1.5 rounded-lg bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 text-goclaw-neon-purple/80 shadow-[0_0_15px_rgba(217,70,239,0.1)]">
            <Brain class={cn("h-3.5 w-3.5", isStreaming && "animate-pulse")} />
        </div>
        <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover/thinking:text-white/70 transition-colors">
            {isStreaming ? 'Thinking...' : 'Internal Monologue'}
        </span>
        {#if isStreaming}
            <span class="flex gap-0.5 ml-2">
                <span class="w-1 h-1 rounded-full bg-goclaw-neon-purple animate-[bounce_1s_infinite_0ms]"></span>
                <span class="w-1 h-1 rounded-full bg-goclaw-neon-purple animate-[bounce_1s_infinite_200ms]"></span>
                <span class="w-1 h-1 rounded-full bg-goclaw-neon-purple animate-[bounce_1s_infinite_400ms]"></span>
            </span>
        {/if}
    </div>

    <div class="relative z-10 flex items-center gap-2 text-white/30">
        <ChevronDown class={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")} />
    </div>
  </button>

  {#if expanded && text}
    <div class="border-t border-white/5 bg-black/60 p-4 relative isolate">
        <!-- Scanlines in expanded content -->
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-10 pointer-events-none"></div>
        
        <pre class="text-[11px] text-white/40 italic whitespace-pre-wrap font-serif leading-relaxed max-h-80 overflow-y-auto custom-scrollbar relative z-10">{text}{#if isStreaming}<span class="inline-block w-1.5 h-3.5 bg-goclaw-neon-purple/50 animate-pulse rounded-sm ml-1 align-text-bottom"></span>{/if}</pre>
    </div>
  {/if}
</div>
{/if}
