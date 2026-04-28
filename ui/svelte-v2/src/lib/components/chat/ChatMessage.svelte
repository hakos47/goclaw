<script lang="ts">
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import type { ChatMessage } from "../../state/chat.svelte";
  import { Brain, Wrench, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-svelte";

  let { message } = $props<{ message: ChatMessage }>();
  
  let toolExpanded = $state<Record<string, boolean>>({});

  let parsedContent = $derived.by(() => {
    if (!message.content) return "";
    try {
      const rawHtml = marked.parse(message.content) as string;
      return DOMPurify.sanitize(rawHtml);
    } catch (e) {
      console.error("Error parsing markdown:", e);
      return message.content;
    }
  });

  let roleClass = $derived(
    message.role === "user"
      ? "bg-goclaw-neon-purple/20 text-white ml-auto border-goclaw-neon-purple/30 rounded-br-sm"
      : message.role === "system"
      ? "bg-red-900/20 text-red-200 mx-auto text-center border-red-500/30 text-sm"
      : "bg-white/5 text-white/90 mr-auto border-white/10 rounded-bl-sm"
  );
</script>

<div class="flex w-full mb-6">
  <div
    class="max-w-[85%] sm:max-w-[80%] p-4 rounded-2xl border shadow-lg prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 {roleClass}"
  >
    {#if message.thinking}
      <div class="mb-4 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div class="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-white/5">
          <Brain size={12} class="text-goclaw-neon-purple" />
          <span class="text-[10px] font-bold uppercase tracking-wider text-white/40">Thinking Process</span>
        </div>
        <div class="p-3 text-sm text-white/60 font-medium italic leading-relaxed whitespace-pre-wrap">
          {message.thinking}
        </div>
      </div>
    {/if}

    {#if message.toolDetails && message.toolDetails.length > 0}
      <div class="mb-4 space-y-2">
        {#each message.toolDetails as tool}
          <div class="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
            <button 
              class="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer"
              onclick={() => toolExpanded[tool.toolCallId] = !toolExpanded[tool.toolCallId]}
            >
              <div class="flex items-center gap-2">
                <Wrench size={12} class="text-amber-400" />
                <span class="text-[11px] font-mono font-bold text-white/80">{tool.name}</span>
                {#if tool.phase === 'completed'}
                  <CheckCircle2 size={10} class="text-emerald-500" />
                {:else if tool.phase === 'error'}
                  <AlertCircle size={10} class="text-red-500" />
                {:else}
                  <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                {/if}
              </div>
              {#if toolExpanded[tool.toolCallId]}
                <ChevronDown size={14} class="text-white/30" />
              {:else}
                <ChevronRight size={14} class="text-white/30" />
              {/if}
            </button>
            
            {#if toolExpanded[tool.toolCallId]}
              <div class="p-3 border-t border-white/5 bg-black/40 space-y-3">
                {#if tool.arguments}
                  <div>
                    <div class="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Arguments</div>
                    <pre class="text-[10px] font-mono bg-black/30 p-2 rounded border border-white/5 text-amber-200/80 overflow-x-auto">{JSON.stringify(tool.arguments, null, 2)}</pre>
                  </div>
                {/if}
                {#if tool.result}
                  <div>
                    <div class="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Result</div>
                    <pre class="text-[10px] font-mono bg-black/30 p-2 rounded border border-white/5 text-emerald-200/80 overflow-x-auto whitespace-pre-wrap">{typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}</pre>
                  </div>
                {/if}
                {#if tool.errorContent}
                  <div>
                    <div class="text-[9px] font-bold uppercase tracking-widest text-red-400/50 mb-1">Error</div>
                    <div class="text-[10px] font-mono bg-red-500/10 p-2 rounded border border-red-500/20 text-red-200/80">{tool.errorContent}</div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if parsedContent}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html parsedContent}
    {:else if !message.thinking && message.role === 'assistant' && (!message.toolDetails || message.toolDetails.length === 0)}
       <div class="flex items-center gap-2 text-white/30 italic text-sm">
         <span class="h-1.5 w-1.5 rounded-full bg-white/30 animate-pulse"></span>
         Empty response
       </div>
    {/if}
  </div>
</div>