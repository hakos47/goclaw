<script lang="ts">
  import { agentsState } from "../../../pages/agents/hooks/use-agents.svelte";
  import { Bot, Cpu, Link as LinkIcon, ArrowLeft } from "lucide-svelte";
  import { chatState } from "../../../lib/state/chat.svelte";

  let { agentId } = $props<{ agentId: string }>();

  let agent = $derived(agentsState.agents.find(a => a.id === agentId) || agentsState.agents.find(a => a.agent_key === agentId));

  function handleBack() {
    window.history.pushState({}, '', '/chat');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
</script>

<div class="h-16 flex items-center px-4 sm:px-6 border-b border-white/5 bg-[#030014]/80 backdrop-blur-3xl shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] z-20 relative overflow-hidden">
  <!-- Scanline Background -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
  <div class="absolute right-0 top-0 w-32 h-32 bg-goclaw-neon-purple/10 blur-[50px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

  <div class="flex items-center gap-3 sm:gap-4 flex-1 relative z-10">
    <!-- Mobile Back Button -->
    <button 
      onclick={handleBack}
      class="md:hidden p-2 -ml-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
    >
      <ArrowLeft class="h-5 w-5" />
    </button>

    <div class="h-10 w-10 rounded-xl bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_15px_rgba(217,70,239,0.2)]">
      {#if agent?.emoji}
        <span class="text-lg drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{agent.emoji}</span>
      {:else}
        <Bot class="h-5 w-5 text-goclaw-neon-purple" />
      {/if}
    </div>
    
    <div class="flex flex-col">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-bold text-white tracking-wider uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{agent?.name || agent?.display_name || agentId}</h2>
        {#if chatState.activeSession?.isRunning}
          <span class="flex h-2 w-2 relative" title="Uplink Active">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-3 text-[9px] font-mono text-white/40 uppercase tracking-widest mt-0.5">
        {#if agent?.model}
          <span class="flex items-center gap-1 group/model cursor-default">
             <Cpu class="h-3 w-3 text-goclaw-neon-cyan/50 group-hover/model:text-goclaw-neon-cyan transition-colors" /> 
             <span class="group-hover/model:text-white transition-colors">{agent.model}</span>
          </span>
        {/if}
        {#if chatState.activeSessionKey}
          <span class="flex items-center gap-1 group/link cursor-default">
             <LinkIcon class="h-3 w-3 text-goclaw-neon-purple/50 group-hover/link:text-goclaw-neon-purple transition-colors" /> 
             <span class="group-hover/link:text-white transition-colors">{chatState.activeSessionKey.split(':').slice(2).join(':')}</span>
          </span>
        {/if}
      </div>
    </div>
  </div>
</div>
