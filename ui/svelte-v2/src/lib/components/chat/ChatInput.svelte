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
    
    // Parse agentId from session key (format: agent:agentId:tenantId:...)
    const parts = chatState.activeSessionKey.split(':');
    const agentId = parts[0] === 'agent' ? parts[1] : parts[0];
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
        <!-- Ambient Focus Glow -->
        <div class="absolute inset-0 bg-goclaw-neon-purple/10 blur-[40px] rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div class="relative flex flex-col p-2 rounded-[2rem] bg-black/40 backdrop-blur-3xl border border-[#d946ef]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] focus-within:border-goclaw-neon-purple/70 focus-within:shadow-[0_0_40px_rgba(217,70,239,0.2)] transition-all duration-500 overflow-hidden">
            
            <!-- Tactical Input Header -->
            <div class="flex items-center justify-between px-3 sm:px-4 pt-2 pb-1 border-b border-white/5 relative z-10">
                <div class="flex items-center gap-2 sm:gap-3 text-[7px] sm:text-[8px] font-mono text-goclaw-neon-cyan/50 uppercase tracking-[0.2em]">
                    <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> <span class="hidden sm:inline">UPLINK SECURE</span></span>
                    <span class="hidden sm:inline">|</span>
                    <span>ENC: AES-256</span>
                    <span class="hidden sm:inline">|</span>
                    <span class="hidden sm:inline">MODE: TACTICAL</span>
                </div>
                <div class="text-[7px] sm:text-[8px] font-mono text-[#d946ef]/40 uppercase tracking-[0.2em]">
                    ARES NET
                </div>
            </div>

            <!-- Input Area -->
            <div class="flex items-end gap-2 relative z-10 pt-1">
            
            <!-- Scanlines inside input box -->
            <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none rounded-[2rem]"></div>

            <!-- Attach Button -->
            <label class="relative z-10 p-3.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer">
                <input type="file" multiple onchange={handleFileChange} class="hidden" />
                <Paperclip class="h-5 w-5" />
            </label>

            <!-- Textarea -->
            <textarea
                bind:this={inputRef}
                bind:value={message}
                onkeydown={handleKeydown}
                placeholder="Initialize Neural Bridge..."
                class="flex-1 bg-transparent border-none outline-none text-white text-sm py-3.5 px-2 min-h-[52px] max-h-48 resize-none custom-scrollbar relative z-10 placeholder:text-white/20 placeholder:uppercase placeholder:tracking-widest placeholder:text-xs"
                rows="1"
            ></textarea>

            <!-- Send/Stop Button -->
            <div class="relative z-10 mb-0.5 mr-0.5">
                {#if chatState.activeSession?.isRunning}
                    <button 
                        onclick={() => abortRun()}
                        class="p-3.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center justify-center group/stop"
                    >
                        <StopCircle class="h-5 w-5 group-hover/stop:scale-95 transition-transform" />
                    </button>
                {:else}
                    <button 
                        onclick={handleSend}
                        disabled={!message.trim() && files.length === 0}
                        class="p-3.5 rounded-full bg-gradient-to-br from-goclaw-neon-purple/20 to-black border border-goclaw-neon-purple/40 text-goclaw-neon-purple hover:text-white hover:border-goclaw-neon-cyan hover:shadow-[0_0_25px_rgba(217,70,239,0.4)] active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group/send"
                    >
                        <Send class="h-5 w-5 transition-transform group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5" />
                    </button>
                {/if}
            </div>
            </div>
        </div>
    </div>
    
    <div class="flex justify-between items-center px-4">
        <p class="text-[8px] text-white/20 uppercase tracking-[0.4em] font-mono">
            [SYS_READY] <span class="text-goclaw-neon-cyan/30">WAITING FOR OPERATOR INPUT</span>
        </p>
        <div class="flex gap-1">
            <span class="w-1 h-3 bg-[#d946ef]/20"></span>
            <span class="w-1 h-3 bg-[#d946ef]/30"></span>
            <span class="w-1 h-3 bg-[#d946ef]/50"></span>
            <span class="w-1 h-3 bg-[#d946ef]/80"></span>
        </div>
    </div>
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
