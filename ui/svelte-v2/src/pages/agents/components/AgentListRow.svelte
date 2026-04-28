<script lang="ts">
  import { Bot, Star, RotateCcw, Trash2, Sparkles } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import type { AgentData } from "../../../lib/types/agent";
  import { agentDisplayName, hasActiveChatGPTOAuthRouting, promptModeBadgeClass, UUID_RE, readPromptMode } from "../utils/agent-display";

  type Props = {
    agent: AgentData;
    ownerName?: string;
    onClick: () => void;
    onResummon?: () => void;
    onDelete?: () => void;
  };

  let { agent, ownerName, onClick, onResummon, onDelete }: Props = $props();

  let displayName = $derived(agentDisplayName(agent, $_('agents.card.unnamedAgent', {default: "Unnamed Agent"})));
  let selfEvolve = $derived(agent.agent_type === "predefined" && Boolean(agent.self_evolve));
  let emoji = $derived(agent.emoji ?? "");
  let hasOAuthRouting = $derived(hasActiveChatGPTOAuthRouting(agent.chatgpt_oauth_routing));
  let promptMode = $derived(readPromptMode(agent));
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  role="button"
  tabindex="0"
  onclick={onClick}
  onkeydown={(e) => e.key === "Enter" && onClick()}
  class="group relative flex w-full cursor-pointer items-center gap-3 rounded-xl bg-[#030014]/60 backdrop-blur-xl border border-white/5 px-4 py-3 text-left transition-all duration-300 hover:bg-[#030014]/80 hover:border-goclaw-neon-purple/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(217,70,239,0.15)] isolate overflow-hidden"
>
  <!-- Cybernetic Corners (Visible on Hover) -->
  <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 opacity-0 transition-all duration-300 border-white/20 group-hover:border-goclaw-neon-purple group-hover:opacity-100 rounded-tl-lg"></div>
  <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 opacity-0 transition-all duration-300 border-white/20 group-hover:border-goclaw-neon-cyan group-hover:opacity-100 rounded-br-lg"></div>
  
  <!-- Scanlines -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>

  <div class="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-goclaw-neon-purple/10 text-goclaw-neon-purple border border-goclaw-neon-purple/20 shadow-inner group-hover:shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all">
    {#if emoji}
      <span class="text-lg leading-none drop-shadow-md">{emoji}</span>
    {:else}
      <Bot class="h-4.5 w-4.5" />
    {/if}
    {#if agent.is_default}
      <div class="absolute -top-1 -right-1 bg-[#030014] rounded-full p-0.5">
        <Star class="h-3 w-3 shrink-0 fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
      </div>
    {/if}
  </div>

  <div class="relative z-10 min-w-0 flex-1">
    <div class="flex items-center gap-1.5">
      <span class="truncate text-[14px] font-bold text-white group-hover:text-goclaw-neon-purple transition-colors tracking-wide">{displayName}</span>
    </div>
    {#if agent.display_name && !UUID_RE.test(agent.agent_key)}
      <div class="truncate text-[10px] font-mono text-white/40 tracking-wider uppercase">{agent.agent_key}</div>
    {/if}
  </div>

  <div class="relative z-10 hidden shrink-0 sm:block">
    {#if agent.status === "summoning"}
      <span class="inline-flex items-center rounded-md border border-orange-400/50 bg-orange-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-orange-400 animate-pulse shadow-[inset_0_0_10px_rgba(251,146,60,0.2)]">
        <div class="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5 animate-bounce"></div>
        {$_('agents.card.summoning', {default: "Summoning"})}
      </span>
    {:else if agent.status === "summon_failed"}
      <span class="inline-flex items-center rounded-md border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]">
        {$_('agents.card.summonFailed', {default: "Failed"})}
      </span>
    {:else if agent.status === "active"}
      <span class="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]">
        <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
        {agent.status}
      </span>
    {:else}
      <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/50">
        <div class="w-1.5 h-1.5 rounded-full bg-white/30 mr-1.5"></div>
        {agent.status}
      </span>
    {/if}
  </div>

  <div class="relative z-10 hidden shrink-0 text-[10px] font-mono text-white/50 md:block md:w-40 md:truncate uppercase">
    {[agent.provider, agent.model].filter(Boolean).join(" / ")}
  </div>

  <div class="relative z-10 hidden shrink-0 items-center gap-1.5 lg:flex">
    <span class={`inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${promptModeBadgeClass(promptMode)}`}>
      {$_(`agents:detail.prompt.mode.${promptMode}`, {default: promptMode})}
    </span>
    {#if selfEvolve}
      <span class="inline-flex items-center rounded-md border border-orange-400/30 bg-orange-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-orange-400">
        <Sparkles class="mr-1 h-2.5 w-2.5" />
        {$_('agents.card.evolving', {default: "Evolving"})}
      </span>
    {/if}
    {#if hasOAuthRouting}
      <span class="inline-flex items-center rounded-md border border-goclaw-neon-purple/30 bg-goclaw-neon-purple/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-goclaw-neon-purple">
        {$_('agents.chatgptOAuthRouting.badge', {default: "Pro Routing"})}
      </span>
    {/if}
  </div>

  {#if ownerName}
    <div class="relative z-10 hidden shrink-0 text-[10px] font-mono text-white/50 xl:block xl:w-28 xl:truncate">
      {ownerName}
    </div>
  {/if}

  {#if agent.context_window > 0}
    <span class="relative z-10 hidden shrink-0 text-[10px] font-mono font-bold text-white/30 uppercase lg:block">
      {(agent.context_window / 1000).toFixed(0)}K
    </span>
  {/if}

  <div class="relative z-10 flex shrink-0 items-center gap-1">
    {#if agent.status === "summon_failed" && onResummon}
      <button
        class="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors h-8 px-2"
        onclick={(e) => { e.stopPropagation(); onResummon(); }}
      >
        <RotateCcw class="h-3 w-3" />
      </button>
    {/if}
    {#if onDelete}
      <button
        class="inline-flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/20 border border-transparent hover:border-red-500/30 h-8 w-8 text-white/30 hover:text-red-500"
        onclick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 class="h-4 w-4" />
      </button>
    {/if}
  </div>
</div>
