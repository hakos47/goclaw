<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { X, Heart, Clock, Loader2, Play, Save, FileText, Settings2 } from "lucide-svelte";
  import { useAgentHeartbeat } from "../../hooks/use-agent-heartbeat.svelte";

  type Props = {
    agentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };

  let { agentId, open, onOpenChange }: Props = $props();

  let heartbeat = $derived(useAgentHeartbeat(agentId));

  // Local form state
  let enabled = $state(false);
  let intervalMin = $state(30);
  let channel = $state("");
  let chatId = $state("");
  let checklist = $state("");
  
  // Advanced
  let ackMaxChars = $state(300);
  let maxRetries = $state(2);
  let isolatedSession = $state(false);
  
  let checklistLoading = $state(false);
  let initialLoadDone = $state(false);

  $effect(() => {
    if (open && heartbeat.config && !initialLoadDone) {
      enabled = heartbeat.config.enabled;
      intervalMin = Math.round(heartbeat.config.intervalSec / 60);
      channel = heartbeat.config.channel || "";
      chatId = heartbeat.config.chatId || "";
      ackMaxChars = heartbeat.config.ackMaxChars;
      maxRetries = heartbeat.config.maxRetries;
      isolatedSession = heartbeat.config.isolatedSession;
      
      initialLoadDone = true;
      loadChecklist();
    }
  });

  $effect(() => {
    if (!open) {
      initialLoadDone = false; // reset when closed
    }
  });

  async function loadChecklist() {
    checklistLoading = true;
    try {
      checklist = await heartbeat.getChecklist();
    } catch (e) {
      console.error(e);
    } finally {
      checklistLoading = false;
    }
  }

  async function handleSave() {
    await heartbeat.update({
      enabled,
      intervalSec: intervalMin * 60,
      channel: channel || undefined,
      chatId: chatId || undefined,
      ackMaxChars,
      maxRetries,
      isolatedSession
    });
    
    await heartbeat.setChecklist(checklist);
    onOpenChange(false);
  }

  async function handleTest() {
    await heartbeat.test();
  }

</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
    <div 
        class="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        onclick={() => onOpenChange(false)}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Escape' && onOpenChange(false)}
        aria-label="Close dialog"
    ></div>

    <div class="relative w-full max-w-[600px] h-full flex flex-col bg-gradient-to-br from-[#030014]/95 to-[#1a0033]/90 border-l border-white/10 shadow-[-10px_0_50px_rgba(0,0,0,0.8)] overflow-hidden shrink-0 animate-slide-in-right">
      
      <!-- Cyber Grid Background -->
      <div class="absolute inset-0 pointer-events-none mix-blend-screen overflow-hidden">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80"></div>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <Heart class="h-5 w-5 animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
          <div>
            <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">{$_('agents.heartbeat.configTitle', {default: 'Heartbeat Configuration'})}</h2>
            <div class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Autonomous Cron Engine</div>
          </div>
        </div>
        
        <button onclick={() => onOpenChange(false)} class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors border border-white/5">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto scroller-no-scrollbar p-8 space-y-8 relative z-10">

        {#if heartbeat.loading && !initialLoadDone}
          <div class="flex items-center justify-center py-20">
             <Loader2 class="h-8 w-8 animate-spin text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
          </div>
        {:else}
          
          <!-- Core Settings -->
          <div class="space-y-4">
            <h3 class="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
               <Clock class="h-3 w-3" /> Core Schedule
            </h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="p-6 rounded-2xl border border-white/5 bg-black/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex items-center justify-between">
                <div>
                  <div class="text-[10px] font-bold text-white/80 uppercase tracking-widest">Enable Engine</div>
                  <div class="text-[10px] text-white/40 mt-1">Run cron schedule</div>
                </div>
                <button 
                  onclick={() => enabled = !enabled}
                  class={`w-11 h-6 rounded-full transition-all relative shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${enabled ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-white/10'}`}
                >
                  <div class={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div class="p-6 rounded-2xl border border-white/5 bg-black/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex flex-col justify-center relative group/input">
                <div class="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-3">Interval (Minutes)</div>
                <div class="relative">
                  <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-rose-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]"></div>
                  <input type="number" bind:value={intervalMin} min="5" class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-rose-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                </div>
              </div>
            </div>
          </div>

          <!-- Delivery -->
          <div class="space-y-4 pt-4 border-t border-white/5">
             <h3 class="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Delivery Target</h3>
             <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2 relative group/input">
                   <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Channel / Protocol</label>
                   <div class="relative">
                      <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-rose-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]"></div>
                      <input type="text" bind:value={channel} placeholder="e.g. discord" class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-rose-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                   </div>
                </div>
                <div class="space-y-2 relative group/input">
                   <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Chat ID</label>
                   <div class="relative">
                      <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-rose-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]"></div>
                      <input type="text" bind:value={chatId} placeholder="123456789" class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-rose-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                   </div>
                </div>
             </div>
          </div>

          <!-- Checklist -->
          <div class="space-y-4 pt-4 border-t border-white/5">
             <div>
               <h3 class="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText class="h-3 w-3" /> Priority Checklist
               </h3>
               <p class="text-[10px] text-white/40 mt-1">Instructions pushed as system context for every cron tick.</p>
             </div>
             
             {#if checklistLoading}
               <div class="h-40 rounded-2xl border border-white/5 bg-black/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                   <Loader2 class="h-6 w-6 animate-spin text-rose-500" />
               </div>
             {:else}
               <div class="relative group/input">
                 <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-rose-500/50 rounded-2xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]"></div>
                 <textarea bind:value={checklist} placeholder="- Check pending emails..." class="w-full h-40 bg-white/[0.02] hover:bg-white/[0.05] focus:bg-white/[0.05] border border-white/5 rounded-2xl p-5 text-[13px] font-mono text-rose-400 outline-none transition-colors scroller-no-scrollbar resize-y relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] leading-relaxed"></textarea>
               </div>
             {/if}
          </div>

          <!-- Advanced -->
          <div class="space-y-4 border-t border-white/5 pt-6">
             <h3 class="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                <Settings2 class="h-3 w-3" /> Advanced Rules
             </h3>
             <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="space-y-2 relative group/input">
                   <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Ack Max Chars</label>
                   <div class="relative">
                      <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-rose-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]"></div>
                      <input type="number" bind:value={ackMaxChars} class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-rose-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                   </div>
                </div>
                <div class="space-y-2 relative group/input">
                   <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Max Retries</label>
                   <div class="relative">
                      <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-rose-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]"></div>
                      <input type="number" bind:value={maxRetries} class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-rose-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                   </div>
                </div>
                <div class="space-y-2 flex flex-col justify-end">
                   <button onclick={() => isolatedSession = !isolatedSession} class={`h-11 px-4 rounded-xl border text-[10px] uppercase tracking-widest font-black transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${isolatedSession ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-white/[0.05] border-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white'}`}>
                      Isolated Session
                   </button>
                </div>
             </div>
          </div>

        {/if}

      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between relative z-10">
        <button 
          onclick={handleTest} 
          disabled={heartbeat.saving}
          class="h-10 px-5 rounded-xl border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] outline-none disabled:opacity-50"
        >
          {#if heartbeat.saving}
             <Loader2 class="h-4 w-4 animate-spin" />
          {:else}
             <Play class="h-4 w-4" /> TEST RUN
          {/if}
        </button>

        <div class="flex items-center gap-4">
          <button onclick={() => onOpenChange(false)} class="text-[10px] font-black text-white/50 hover:text-white uppercase tracking-widest px-4 transition-colors">Cancel</button>
          
          <button 
            onclick={handleSave}
            disabled={heartbeat.saving} 
            class="relative group h-10 px-6 rounded-xl bg-rose-500 text-black flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] border border-rose-400 outline-none disabled:opacity-50 overflow-hidden"
          >
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
            {#if heartbeat.saving}
               <Loader2 class="h-4 w-4 animate-spin relative z-10" /> <span class="relative z-10">saving...</span>
            {:else}
               <Save class="h-4 w-4 relative z-10" /> <span class="relative z-10">Save Config</span>
            {/if}
          </button>
        </div>
      </div>

    </div>
  </div>
  
  <style>
    @keyframes slide-in-right {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    .animate-slide-in-right {
        animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  </style>
{/if}
