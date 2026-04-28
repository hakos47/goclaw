<script lang="ts">
  import { Send, Paperclip, X, Loader2, StopCircle } from "lucide-svelte";
  import { chatState, sendChatMessage, abortRun } from "../../state/chat.svelte";
  import { cn } from "../../utils";
  import { _ } from "svelte-i18n";

  let message = $state("");
  let files = $state<any[]>([]);
  let inputRef: HTMLTextAreaElement | undefined = $state();

  async function handleSend() {
    if ((!message.trim() && files.length === 0) || !chatState.activeSessionKey) return;
    
    // Parse agentId (for now we assume it's stored in the component or we can get it from session key)
    const agentId = chatState.activeSessionKey.split(':')[0];
    const msg = message;
    const currentFiles = [...files];
    
    message = "";
    files = [];
    
    await sendChatMessage(agentId, chatState.activeSessionKey, msg, currentFiles);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
        files = [...files, ...Array.from(target.files).map(f => ({ file: f }))];
    }
  }
</script>

<div class="p-4 sm:p-6 bg-transparent relative z-20">
  <div class="max-w-4xl mx-auto space-y-4">
    
    <!-- File Preview -->
    {#if files.length > 0}
        <div class="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
            {#each files as f, i}
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/60 group">
                    <span class="truncate max-w-[150px]">{f.file.name}</span>
                    <button onclick={() => removeFile(i)} class="hover:text-red-400 transition-colors">
                        <X class="h-3 w-3" />
                    </button>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Input Box -->
    <div class="relative group z-30">
        <div class="absolute inset-0 bg-goclaw-neon-cyan/5 blur-3xl rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
        <div class="relative flex items-end gap-2 p-2 rounded-[2rem] bg-[#030014]/60 backdrop-blur-3xl border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] focus-within:border-goclaw-neon-cyan/50 focus-within:ring-1 focus-within:ring-goclaw-neon-cyan/30 transition-all duration-300">
            
            <!-- Attach Button -->
            <label class="p-3 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-all cursor-pointer">
                <input type="file" multiple onchange={handleFileChange} class="hidden" />
                <Paperclip class="h-5 w-5" />
            </label>

            <!-- Textarea -->
            <textarea
                bind:this={inputRef}
                bind:value={message}
                onkeydown={handleKeydown}
                placeholder="Message your agent..."
                class="flex-1 bg-transparent border-none outline-none text-white text-sm py-3 px-1 min-h-[48px] max-h-48 resize-none custom-scrollbar"
                rows="1"
            ></textarea>

            <!-- Send/Stop Button -->
            {#if chatState.activeSession?.isRunning}
                <button 
                    onclick={() => abortRun()}
                    class="p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                >
                    <StopCircle class="h-5 w-5" />
                </button>
            {:else}
                <button 
                    onclick={handleSend}
                    disabled={!message.trim() && files.length === 0}
                    class="p-3 rounded-full bg-white/[0.05] border border-white/10 text-white hover:bg-goclaw-neon-cyan/20 hover:text-goclaw-neon-cyan hover:border-goclaw-neon-cyan/50 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)] group/send"
                >
                    <Send class="h-5 w-5 transition-transform group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5" />
                </button>
            {/if}
        </div>
    </div>
    
    <p class="text-[9px] text-center text-white/10 uppercase tracking-[0.3em] font-bold">
        Neural Bridge Active • Encryption Enabled
    </p>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
</style>
