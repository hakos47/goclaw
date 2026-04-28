<script lang="ts">
  import { ListTodo, MessageCircle, Bot, Settings, Link2 as LinkIcon } from "lucide-svelte";
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte";
  import AgentEventCard from "./AgentEventCard.svelte";
  import MessageEventCard from "./MessageEventCard.svelte";
  import TaskEventCard from "./TaskEventCard.svelte";
  import SystemEventCard from "./SystemEventCard.svelte";
  import GenericEventCard from "./GenericEventCard.svelte";

  export let entry: TeamEventEntry;
  export let resolveTeam: (teamId: string | null) => string;
  export let onClick: () => void;

  function getCategoryConfig(event: string) {
    if (event.startsWith("team.task.")) return { icon: ListTodo, border: "border-l-amber-500", color: "text-amber-500" };
    if (event === "team.message.sent") return { icon: MessageCircle, border: "border-l-emerald-500", color: "text-emerald-500" };
    if (event === "agent" || event.startsWith("run.") || event.startsWith("tool.")) return { icon: Bot, border: "border-l-goclaw-neon-purple", color: "text-goclaw-neon-purple" };
    if (event.startsWith("agent_link.")) return { icon: LinkIcon, border: "border-l-goclaw-neon-cyan", color: "text-goclaw-neon-cyan" };
    return { icon: Settings, border: "border-l-white/20", color: "text-white/40" };
  }

  $: config = getCategoryConfig(entry.event);
  $: CategoryIcon = config.icon;

  function getEventLabel(entry: TeamEventEntry) {
    let label = entry.event;
    if (label === "agent") {
      const p = entry.payload as any;
      if (p?.type) label = p.type;
    }
    return label;
  }

  function getBadgeVariant(label: string) {
    if (label.includes("failed") || label.includes("cancelled") || label.includes("deleted")) return "bg-red-500/20 text-red-400 border border-red-500/30";
    if (label.includes("completed") || label.includes("created") || label.includes("added")) return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    if (label.includes("started") || label.includes("progress") || label.includes("claimed")) return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    return "bg-white/5 text-white/50 border border-white/10";
  }

  function formatTime(timestamp: any) {
    try {
      const ts = typeof timestamp === 'string' && /^\d+$/.test(timestamp) ? parseInt(timestamp, 10) : timestamp;
      const date = new Date(ts);
      if (isNaN(date.getTime())) return String(timestamp);
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return date.toLocaleDateString();
    } catch {
      return String(timestamp);
    }
  }

  $: label = getEventLabel(entry);
  $: badgeClass = getBadgeVariant(label);
</script>

<button
  type="button"
  onclick={onClick}
  class={`w-full text-left relative overflow-hidden rounded-xl border border-white/5 bg-[#050510]/80 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] group/card flex flex-col p-4 pl-5 ${config.border} border-l-4`}
>
  <!-- Background Glow on Hover -->
  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

  <!-- Header -->
  <div class="flex items-center gap-3 w-full mb-3">
    <svelte:component this={CategoryIcon} class={`h-4 w-4 shrink-0 ${config.color} drop-shadow-[0_0_5px_currentColor]`} />
    
    <span class={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${badgeClass}`}>
      {label}
    </span>
    
    {#if entry.teamId}
      <span class="shrink-0 px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-bold text-white/50 uppercase tracking-wider">
        {resolveTeam(entry.teamId)}
      </span>
    {/if}
    
    <span class="ml-auto shrink-0 text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover/card:text-white/50 transition-colors">
      {formatTime(entry.timestamp)}
    </span>
  </div>

  <!-- Body -->
  <div class="pl-7 w-full">
    {#if label.startsWith("team.task.")}
      <TaskEventCard {entry} />
    {:else if label === "team.message.sent"}
      <MessageEventCard {entry} />
    {:else if label === "agent" || label.startsWith("run.") || label.startsWith("tool.")}
      <AgentEventCard {entry} />
    {:else if label.startsWith("team.") || label.startsWith("agent_link.")}
      <SystemEventCard {entry} />
    {:else}
      <GenericEventCard {entry} />
    {/if}
  </div>
</button>
