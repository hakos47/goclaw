<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte.ts";
  import { getCategoryConfig } from "./event-categories";
  import { formatRelativeTime } from "$lib/format";
  import { Radio, User, Hash } from "lucide-svelte";
  
  import TaskEventCard from "./TaskEventCard.svelte";
  import MessageEventCard from "./MessageEventCard.svelte";
  import AgentEventCard from "./AgentEventCard.svelte";
  import TeamCrudEventCard from "./TeamCrudEventCard.svelte";
  import EventDetailDialog from "./EventDetailDialog.svelte";

  type Props = {
    entry: TeamEventEntry;
    resolveTeam: (teamId: string | null) => string;
  };

  let { entry, resolveTeam }: Props = $props();

  let showDetail = $state(false);

  let event = $derived(entry.event);
  let payload = $derived(entry.payload as any);
  let config = $derived(getCategoryConfig(event));
  let CategoryIcon = $derived(config.icon);

  // Type inference for router
  let isTask = $derived(event.startsWith("team.task."));
  let isMessage = $derived(event === "team.message.sent");
  let isAgent = $derived(event === "agent");
  let isCrud = $derived(
    event.startsWith("team.created") ||
    event.startsWith("team.updated") ||
    event.startsWith("team.deleted") ||
    event.startsWith("team.member.") ||
    event.startsWith("agent_link.")
  );
  let isRaw = $derived(!isTask && !isMessage && !isAgent && !isCrud);

  // Badge logic
  let badgeLabel = $derived.by(() => {
    let label = event;
    if (event === "agent" && payload?.type) {
      label = payload.type;
    }
    return label;
  });

  let badgeVariant = $derived.by(() => {
    if (badgeLabel.includes("failed") || badgeLabel.includes("cancelled") || badgeLabel.includes("deleted")) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (badgeLabel.includes("completed") || badgeLabel.includes("created") || badgeLabel.includes("added")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (badgeLabel.includes("started") || badgeLabel.includes("progress") || badgeLabel.includes("claimed")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-white/10 text-white/70 border-white/20";
  });

  // Footer metadata
  let channel = $derived(payload?.channel as string | undefined);
  let userId = $derived((payload?.user_id ?? payload?.userId) as string | undefined);
  let chatId = $derived((payload?.chat_id ?? payload?.chatId) as string | undefined);
  let hasFooter = $derived(!!(channel || userId || chatId));

</script>

<button
  type="button"
  onclick={() => showDetail = true}
  class="w-full cursor-pointer overflow-hidden rounded-xl border border-l-4 bg-[#050510]/80 backdrop-blur-md px-4 py-3 text-left transition-all hover:bg-white/[0.05] hover:shadow-[0_0_20px_rgba(217,70,239,0.05)] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 group {config.borderColor} shadow-inner"
>
  <!-- Header -->
  <div class="flex items-center gap-3">
    <div class="p-1.5 rounded-lg bg-black/40 border border-white/5 shadow-inner">
      <CategoryIcon class="h-4 w-4 shrink-0 {config.iconColor}" />
    </div>
    
    <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border {badgeVariant}">
      {badgeLabel}
    </span>
    
    {#if entry.teamId}
      <span class="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold text-white/50 border border-white/10 bg-white/5 uppercase">
        {resolveTeam(entry.teamId)}
      </span>
    {/if}
    
    <span class="ml-auto shrink-0 text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">
      {formatRelativeTime(new Date(entry.timestamp))}
    </span>
  </div>

  <!-- Body -->
  <div class="mt-2.5 min-w-0 pl-[42px]">
    {#if isTask}
      <TaskEventCard {entry} />
    {:else if isMessage}
      <MessageEventCard {entry} />
    {:else if isAgent}
      <AgentEventCard {entry} />
    {:else if isCrud}
      <TeamCrudEventCard {entry} />
    {:else if isRaw}
      <pre class="overflow-x-auto text-[11px] font-mono text-emerald-400/70 bg-[#020008]/80 p-2 rounded-lg border border-emerald-500/10 custom-scrollbar">{JSON.stringify(payload, null, 2)}</pre>
    {/if}
  </div>

  <!-- Footer -->
  {#if hasFooter}
    <div class="mt-3 flex flex-wrap items-center gap-2 pl-[42px] text-[10px] font-mono text-white/40">
      {#if channel}
        <span class="inline-flex items-center gap-1 rounded bg-black/40 border border-white/5 px-2 py-1 uppercase tracking-wider">
          <Radio class="h-3 w-3 text-white/30" />
          {channel}
        </span>
      {/if}
      {#if userId}
        <span class="inline-flex items-center gap-1 rounded bg-black/40 border border-white/5 px-2 py-1">
          <User class="h-3 w-3 text-white/30" />
          {userId}
        </span>
      {/if}
      {#if chatId}
        <span class="inline-flex items-center gap-1 rounded bg-black/40 border border-white/5 px-2 py-1">
          <Hash class="h-3 w-3 text-white/30" />
          chat: {chatId}
        </span>
      {/if}
    </div>
  {/if}
</button>

<EventDetailDialog
  open={showDetail}
  {entry}
  onClose={() => showDetail = false}
/>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.2);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(16, 185, 129, 0.4);
  }
</style>
