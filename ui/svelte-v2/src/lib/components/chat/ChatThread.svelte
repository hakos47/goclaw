<script lang="ts">
  import { chatState } from "../../state/chat.svelte";
  import { Brain, Terminal, User, Bot, Loader2 } from "lucide-svelte";
  import { cn } from "../../utils";
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import { onMount, tick } from "svelte";
  import ToolCallBlock from "./ToolCallBlock.svelte";
  import ThinkingBlock from "./ThinkingBlock.svelte";
  import MediaBlock from "./MediaBlock.svelte";

  let scrollContainer: HTMLDivElement | undefined = $state();

  marked.setOptions({
    gfm: true,
    breaks: true
  });

  function renderMarkdown(content: string) {
    if (!content) return "";
    
    // Phase 11: Extra fail-safe cleanup for <think> tags during streaming
    const preCleaned = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();
    
    // Parse markdown first
    const rawHtml = marked.parse(preCleaned) as string;
    const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
    
    // Remove all <img> tags that point to system paths (they'll be handled by MediaBlock)
    const images = doc.querySelectorAll('img');
    images.forEach(img => {
        const src = img.getAttribute('src') || '';
        if (src.startsWith('/app/') || src.startsWith('/home/') || src.includes('/ws/') || src.includes('?ft=')) {
            img.remove();
        }
    });

    // Remove raw text paths that might have been left as plain text
    let processedHtml = doc.body.innerHTML;
    const pathRegex = /(?:📸\s*|📷\s*|MEDIA:\s*|FILE:\s*)?`?(\/(?:app|home|var|tmp|mnt|usr)[^\s"'`]+\.(?:png|jpg|jpeg|gif|webp|mp4|webm))`?/gi;
    processedHtml = processedHtml.replace(pathRegex, '');

    return DOMPurify.sanitize(processedHtml);
  }

  // Auto-scroll logic
  $effect(() => {
    if (chatState.activeSession?.messages.length || chatState.activeSession?.streamText) {
        tick().then(() => {
            scrollContainer?.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
        });
    }
  });

  onMount(() => {
     scrollContainer?.scrollTo({ top: scrollContainer.scrollHeight });
  });
</script>

<div bind:this={scrollContainer} class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-gradient-to-b from-transparent to-[#050505]/40 opacity-95">
  {#if chatState.activeSession}
    {#each chatState.activeSession.messages as msg}
        {@const isOperator = msg.role === 'user'}
        <div class={cn("flex flex-col gap-3", isOperator ? "items-end" : "items-start")}>
            <!-- Tactical Header -->
            <div class={cn("flex items-center gap-3 px-2 w-full max-w-[95%] sm:max-w-[85%] mb-1", isOperator ? "flex-row-reverse" : "flex-row")}>
                <div class={cn("p-1.5 rounded-lg border shadow-[0_0_15px_rgba(0,0,0,0.5)] shrink-0 relative isolate", isOperator ? "bg-[#d946ef]/10 border-[#d946ef]/40 text-[#d946ef]" : "bg-goclaw-neon-cyan/10 border-goclaw-neon-cyan/40 text-goclaw-neon-cyan")}>
                    <div class={cn("absolute inset-0 opacity-20 blur-md rounded-lg", isOperator ? "bg-[#d946ef]" : "bg-goclaw-neon-cyan")}></div>
                    {#if isOperator}
                        <User class="h-3 w-3 relative z-10" />
                    {:else}
                        <Bot class="h-3 w-3 relative z-10" />
                    {/if}
                </div>
                <div class={cn("flex flex-col min-w-0 flex-1", isOperator ? "items-end" : "items-start")}>
                    <div class={cn("flex items-center gap-2", isOperator ? "flex-row-reverse" : "flex-row")}>
                        <span class={cn("text-[9px] font-mono uppercase tracking-widest shrink-0", isOperator ? "text-[#d946ef]/50" : "text-goclaw-neon-cyan/50")}>
                            {isOperator ? 'TX' : 'RX'}-{msg.timestamp?.toString(16).slice(-5).toUpperCase() || (isOperator ? 'USR01' : 'SYS01')}
                        </span>
                        <span class={cn("text-[10px] font-black uppercase tracking-widest truncate max-w-[150px] drop-shadow-[0_0_5px_currentColor]", isOperator ? "text-[#d946ef]" : "text-goclaw-neon-cyan")}>
                            {isOperator ? 'OPERATOR' : 'SYSTEM UPLINK'}
                        </span>
                    </div>
                    <span class="text-[8px] font-mono text-white/30 tracking-[0.2em] uppercase shrink-0">Auth: Secure</span>
                </div>
            </div>

            <div class={cn(
                "max-w-[85%] min-w-[50%] flex flex-col gap-2 relative isolate",
                msg.role === 'user' ? "items-end" : "items-start"
            )}>
                <!-- Tool Calls Group -->
                {#if msg.toolDetails && msg.toolDetails.length > 0}
                    <div class="w-full space-y-1 mb-2 bg-black/40 p-1.5 rounded-3xl border border-[#d946ef]/20 shadow-[0_0_30px_rgba(217,70,239,0.1)]">
                        {#each msg.toolDetails as toolCall}
                            <ToolCallBlock {toolCall} />
                        {/each}
                    </div>
                {/if}

                <!-- Thinking Block -->
                {#if msg.thinking}
                    <div class="w-full">
                        <ThinkingBlock text={msg.thinking} isStreaming={false} />
                    </div>
                {/if}

                <!-- Main Content Bubble -->
                {#if msg.content || (msg.mediaItems && msg.mediaItems.length > 0)}
                    <div class={cn(
                        "w-full px-5 py-4 rounded-3xl text-sm leading-relaxed transition-all duration-300 relative isolate overflow-hidden group/msg",
                        msg.role === 'user' 
                            ? "bg-[#d946ef]/10 border border-[#d946ef]/30 text-white rounded-tr-sm shadow-[0_0_30px_rgba(217,70,239,0.2)] backdrop-blur-3xl" 
                            : "bg-black/40 border border-[#d946ef]/20 text-white/90 rounded-tl-sm backdrop-blur-3xl shadow-[0_0_30px_rgba(217,70,239,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    )}>
                        <!-- Cybernetic Corners -->
                        <div class={cn("absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 opacity-80 transition-colors", msg.role === 'user' ? "border-[#d946ef] drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]" : "border-goclaw-neon-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]")}></div>
                        <div class={cn("absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 opacity-80 transition-colors", msg.role === 'user' ? "border-[#d946ef] drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]" : "border-goclaw-neon-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]")}></div>

                        <!-- Scanlines & Grid -->
                        {#if msg.role !== 'user'}
                            <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20"></div>
                        {/if}
                        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>

                        {#if msg.content}
                            <div class="markdown-content relative z-10">
                                {@html renderMarkdown(msg.content)}
                            </div>
                        {/if}

                        {#if msg.mediaItems && msg.mediaItems.length > 0}
                            <div class="relative z-10 mt-4 border-t border-white/5 pt-4">
                                <MediaBlock items={msg.mediaItems} />
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
            
            <span class="text-[10px] font-mono text-white/20 uppercase tracking-widest px-2 opacity-50">
                {new Date(msg.timestamp || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    {/each}

    <!-- Streaming Message (Active Run) -->
    {#if chatState.activeSession.isRunning || chatState.activeSession.streamText || chatState.toolStream.length > 0}
        <div class="flex flex-col gap-3 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="flex items-center gap-3 px-2 w-full max-w-[95%] sm:max-w-[85%] mb-1 flex-row">
                <div class="p-1.5 rounded-lg border shadow-[0_0_15px_rgba(0,0,0,0.5)] shrink-0 relative isolate bg-goclaw-neon-cyan/10 border-goclaw-neon-cyan/40 text-goclaw-neon-cyan">
                    <div class="absolute inset-0 opacity-20 blur-md rounded-lg bg-goclaw-neon-cyan animate-pulse"></div>
                    <Bot class="h-3 w-3 relative z-10" />
                </div>
                <div class="flex flex-col min-w-0 flex-1 items-start">
                    <div class="flex items-center gap-2 flex-row">
                        <span class="text-[9px] font-mono uppercase tracking-widest shrink-0 text-goclaw-neon-cyan/50 animate-pulse">
                            PROCESSING...
                        </span>
                        <span class="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px] drop-shadow-[0_0_5px_currentColor] text-goclaw-neon-cyan">
                            SYSTEM UPLINK
                        </span>
                    </div>
                    {#if chatState.activity}
                        <div class="flex items-center gap-1.5 mt-0.5 text-[8px] font-mono tracking-[0.2em] text-white/50 uppercase truncate">
                            <Loader2 class="h-2.5 w-2.5 animate-spin text-goclaw-neon-cyan shrink-0" />
                            {chatState.activity.phase} {chatState.activity.tool ? `[${chatState.activity.tool}]` : ''}
                        </div>
                    {/if}
                </div>
            </div>

            <div class="max-w-[95%] sm:max-w-[85%] min-w-[50%] flex flex-col gap-2 relative isolate items-start">
                
                <!-- Live Tool Calls -->
                {#if chatState.toolStream.length > 0}
                    <div class="w-full space-y-1 mb-2 bg-black/40 p-1.5 rounded-3xl border border-[#d946ef]/20 shadow-[0_0_30px_rgba(217,70,239,0.1)]">
                        {#each chatState.toolStream as toolCall}
                            <ToolCallBlock {toolCall} />
                        {/each}
                    </div>
                {/if}

                <!-- Live Thinking Block -->
                {#if chatState.activeSession.thinkingText}
                    <div class="w-full">
                        <ThinkingBlock text={chatState.activeSession.thinkingText} isStreaming={!chatState.activeSession.streamText} />
                    </div>
                {/if}

                <!-- Live Content Bubble -->
                {#if chatState.activeSession.streamText}
                    <div class="w-full relative group/msg px-6 py-5 rounded-3xl text-sm leading-relaxed transition-all duration-300 bg-black/40 border border-[#d946ef]/20 text-white/90 rounded-tl-sm backdrop-blur-3xl shadow-[0_0_30px_rgba(217,70,239,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)] isolate overflow-hidden">
                        <!-- Cybernetic Corners -->
                        <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 opacity-80 transition-colors border-goclaw-neon-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
                        <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 opacity-80 transition-colors border-goclaw-neon-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
                        
                        <!-- Scanlines & Grid -->
                        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20"></div>
                        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
                        
                        <div class="markdown-content relative z-10">
                            {@html renderMarkdown(chatState.activeSession.streamText || '...')}
                            <span class="inline-block w-1.5 h-3.5 bg-goclaw-neon-cyan/50 animate-pulse rounded-sm ml-1 align-text-bottom"></span>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
  {:else}
    <div class="h-full flex items-center justify-center opacity-10">
        <div class="text-center">
            <Bot class="h-20 w-20 mx-auto mb-4 stroke-1" />
            <p class="font-mono text-sm tracking-widest uppercase">Secure Comms Established</p>
        </div>
    </div>
  {/if}
</div>

<style>
  /* Global styles for the marked HTML content inside our component */
  :global(.markdown-content) {
    line-height: 1.8;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.025em;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji";
  }
  
  :global(.markdown-content p) {
    margin-bottom: 1rem;
  }
  :global(.markdown-content p:last-child) {
    margin-bottom: 0;
  }

  :global(.markdown-content a) {
    color: #d946ef; /* goclaw-neon-purple */
    text-decoration: none;
    border-bottom: 1px solid rgba(217, 70, 239, 0.4);
    transition: all 0.2s;
  }
  :global(.markdown-content a:hover) {
    color: white;
    border-color: white;
  }

  :global(.markdown-content strong) {
    color: white;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  :global(.markdown-content ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  :global(.markdown-content ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  :global(.markdown-content li) {
    margin-bottom: 0.5rem;
  }
  /* Style the bullet points using ::marker */
  :global(.markdown-content li::marker) {
    color: #d946ef;
  }

  :global(.markdown-content pre) {
    background-color: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 1rem;
    overflow-x: auto;
    margin-bottom: 1rem;
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
  }

  :global(.markdown-content code) {
    color: #22d3ee; /* goclaw-neon-cyan */
    background-color: rgba(34, 211, 238, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 0.375rem;
    font-family: monospace;
    font-size: 0.85em;
  }
  
  :global(.markdown-content pre code) {
    color: inherit;
    background-color: transparent;
    padding: 0;
  }

  :global(.markdown-content h1), :global(.markdown-content h2), :global(.markdown-content h3) {
    color: white;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  :global(.markdown-content blockquote) {
    border-left: 2px solid rgba(217, 70, 239, 0.5);
    background-color: rgba(217, 70, 239, 0.05);
    padding: 0.25rem 1rem;
    border-radius: 0 0.5rem 0.5rem 0;
    font-style: normal;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
</style>
