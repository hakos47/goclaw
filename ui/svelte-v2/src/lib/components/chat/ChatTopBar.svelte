<script lang="ts">
  import { agentsState } from "../../../pages/agents/hooks/use-agents.svelte";
  import { Bot, Cpu, Link as LinkIcon } from "lucide-svelte";
  import { chatState } from "../../../lib/state/chat.svelte";

  let { agentId } = $props<{ agentId: string }>();

  let agent = $derived(agentsState.agents.find(a => a.id === agentId) || agentsState.agents.find(a => a.agent_key === agentId));
</script>

<div class="h-14 flex items-center px-6 border-b border-white/5 bg-[#030014]/60 backdrop-blur-3xl shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.5)] z-20">
  <div class="flex items-center gap-4 flex-1">
    <div class="h-8 w-8 rounded-lg bg-goclaw-neon-purple/20 border border-goclaw-neon-purple/30 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.2)]">
      {#if agent?.emoji}
        <span class="text-sm">{agent.emoji}</span>
      {:else}
        <Bot class="h-4 w-4 text-goclaw-neon-purple" />
      {/if}
    </div>
    
    <div class="flex flex-col">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-bold text-white tracking-wide">{agent?.name || agent?.display_name || agentId}</h2>
        {#if chatState.activeSession?.isRunning}
          <span class="flex h-2 w-2 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-3 text-[10px] font-mono text-white/40 uppercase tracking-wider mt-0.5">
        {#if agent?.model}
          <span class="flex items-center gap-1"><Cpu class="h-3 w-3" /> {agent.model}</span>
        {/if}
        {#if chatState.activeSessionKey}
          <span class="flex items-center gap-1"><LinkIcon class="h-3 w-3" /> {chatState.activeSessionKey.split(':').slice(2).join(':')}</span>
        {/if}
      </div>
    </div>
  </div>
</div>
