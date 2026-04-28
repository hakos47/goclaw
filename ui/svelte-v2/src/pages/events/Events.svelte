<script lang="ts">
  import { onMount, tick } from "svelte";
  import { Radar, Trash2, Pause, Play, ArrowDown, RefreshCw } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { teamEventStore } from "$lib/state/team-event-store.svelte.ts";
  import { useWs } from "$lib/state/ws.svelte";
  import { Methods } from "$lib/api/protocol";
  import type { TeamData } from "$lib/state/auth.svelte";
  
  import EventCard from "./components/cards/EventCard.svelte";
  import EventDetailModal from "./components/cards/EventDetailModal.svelte";
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte";

  const EVENT_CATEGORY_VALUES = ["all", "team.task", "team.message", "agent", "team.crud", "agent_link"] as const;
  const CATEGORY_KEY_MAP: Record<string, string> = {
    "all": "All Events",
    "team.task": "Tasks",
    "team.message": "Messages",
    "agent": "Agents",
    "team.crud": "Team Admin",
    "agent_link": "Links",
  };

  let categoryFilter = $state<string>("all");
  let teamFilter = $state<string>("all");
  let userFilter = $state<string>("all");
  let chatFilter = $state<string>("all");

  let isAtBottom = $state(true);
  let feedRef: HTMLDivElement;
  let teamMap = $state<Map<string, string>>(new Map());
  let selectedEvent = $state<TeamEventEntry | null>(null);

  // Derived filters based on the store
  let allEvents = $derived(teamEventStore.events);
  let paused = $derived(teamEventStore.paused);

  // Teams mapping
  const ws = useWs();
  onMount(() => {
    if (!ws.isConnected) return;
    ws.call<{ teams: TeamData[] }>(Methods.TEAMS_LIST)
      .then((res) => {
        const map = new Map<string, string>();
        for (const t of res.teams ?? []) {
          map.set(t.id, t.name);
        }
        teamMap = map;
      })
      .catch((err) => console.error("[Events] fetch teams failed:", err));
  });

  function resolveTeam(teamId: string | null): string {
    if (!teamId) return "Global";
    return teamMap.get(teamId) ?? teamId.slice(0, 8);
  }

  // Unique dropdown sets
  let uniqueTeams = $derived(Array.from(new Set(allEvents.map(e => e.teamId).filter(Boolean))) as string[]);
  let uniqueUsers = $derived(Array.from(new Set(allEvents.map(e => e.userId).filter(Boolean))).sort() as string[]);
  let uniqueChats = $derived(Array.from(new Set(allEvents.map(e => e.chatId).filter(Boolean))).sort() as string[]);

  // Derived filtered results
  let filteredEvents = $derived.by(() => {
    let result = allEvents;
    if (teamFilter !== "all") result = result.filter(e => e.teamId === teamFilter);
    if (userFilter !== "all") result = result.filter(e => e.userId === userFilter);
    if (chatFilter !== "all") result = result.filter(e => e.chatId === chatFilter);
    
    if (categoryFilter !== "all") {
      if (categoryFilter === "team.crud") {
        result = result.filter(e => 
          e.event === "team.created" || e.event === "team.updated" || e.event === "team.deleted" || e.event.startsWith("team.member.")
        );
      } else {
        result = result.filter(e => e.event.startsWith(categoryFilter));
      }
    }
    return result;
  });

  // Auto-scroll
  $effect(() => {
    // Dependency on filteredEvents.length
    const len = filteredEvents.length;
    if (isAtBottom && feedRef) {
      tick().then(() => {
        if (feedRef) feedRef.scrollTop = feedRef.scrollHeight;
      });
    }
  });

  function handleScroll(e: Event) {
    if (!feedRef) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef;
    isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
  }

  function scrollToBottom() {
    if (feedRef) {
      feedRef.scrollTop = feedRef.scrollHeight;
    }
    isAtBottom = true;
  }

</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 max-w-6xl mx-auto w-full">
  
  <!-- Bento Header -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] relative overflow-hidden shrink-0">
    <div class="absolute -top-24 -left-24 w-64 h-64 bg-goclaw-neon-purple/20 blur-[80px] pointer-events-none rounded-full"></div>
    <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full"></div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div class="h-14 w-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-goclaw-neon-purple/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Radar class="h-6 w-6 text-white group-hover:text-goclaw-neon-purple transition-colors drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
      </div>
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
            Events Telemetry
          </h1>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-inner {paused ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}">
            {paused ? 'Paused' : 'Live'}
          </span>
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          {filteredEvents.length} Captured Event{filteredEvents.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={() => teamEventStore.setPaused(!paused)}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
      >
        {#if paused}
          <Play class="h-4 w-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          <span class="text-[10px] font-black uppercase tracking-widest text-white">Resume</span>
        {:else}
          <Pause class="h-4 w-4 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
          <span class="text-[10px] font-black uppercase tracking-widest text-white">Pause</span>
        {/if}
      </button>

      <button 
        onclick={() => teamEventStore.clear()} 
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/20 transition-all shadow-[inset_0_1px_2px_rgba(239,68,68,0.1)]"
      >
        <Trash2 class="h-4 w-4 text-red-400 group-hover:drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]" />
        <span class="text-[10px] font-black uppercase tracking-widest text-red-100">Clear</span>
      </button>
    </div>
  </div>

  <!-- Filters Bar -->
  <div class="flex flex-wrap items-center gap-3 mb-4 shrink-0">
    <!-- Category Pills -->
    <div class="flex flex-wrap items-center gap-2 bg-[#050510]/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-inner">
      {#each EVENT_CATEGORY_VALUES as val}
        <button
          type="button"
          onclick={() => categoryFilter = val}
          class="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
            {categoryFilter === val ? 'bg-white/10 text-white shadow-md border border-white/10' : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'}"
        >
          {CATEGORY_KEY_MAP[val] ?? val}
        </button>
      {/each}
    </div>

    <!-- Dropdowns -->
    {#if uniqueTeams.length > 0}
      <select bind:value={teamFilter} class="h-9 rounded-xl border border-white/10 bg-[#050510]/80 backdrop-blur-md px-3 text-[10px] font-black uppercase tracking-widest text-white/70 focus:ring-1 focus:ring-emerald-500/50 outline-none">
        <option value="all">All Teams</option>
        {#each uniqueTeams as id}
          <option value={id}>{resolveTeam(id)}</option>
        {/each}
      </select>
    {/if}

    <select bind:value={userFilter} class="h-9 rounded-xl border border-white/10 bg-[#050510]/80 backdrop-blur-md px-3 text-[10px] font-black uppercase tracking-widest text-white/70 focus:ring-1 focus:ring-emerald-500/50 outline-none">
      <option value="all">All Users</option>
      {#each uniqueUsers as uid}
        <option value={uid}>{uid}</option>
      {/each}
    </select>

    <select bind:value={chatFilter} class="h-9 rounded-xl border border-white/10 bg-[#050510]/80 backdrop-blur-md px-3 text-[10px] font-black uppercase tracking-widest text-white/70 focus:ring-1 focus:ring-emerald-500/50 outline-none">
      <option value="all">All Chats</option>
      {#each uniqueChats as cid}
        <option value={cid}>{cid}</option>
      {/each}
    </select>
  </div>

  <!-- Feed Area -->
  <div class="flex-1 min-h-0 relative border border-white/5 rounded-2xl bg-[#030010]/50 backdrop-blur-sm overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
    {#if filteredEvents.length === 0}
      <div class="flex-1 flex flex-col items-center justify-center text-center p-8 relative">
        <div class="absolute inset-0 bg-goclaw-neon-purple/5 blur-[100px] pointer-events-none"></div>
        <Radar class="h-16 w-16 text-white/10 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
        <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-1">Silence on the line</h3>
        <p class="text-[10px] text-white/30 uppercase tracking-widest">{paused ? 'Feed is paused' : 'Waiting for incoming events...'}</p>
      </div>
    {:else}
      <div 
        bind:this={feedRef}
        onscroll={handleScroll}
        class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3"
      >
        {#each filteredEvents as entry (entry.id)}
          <EventCard {entry} {resolveTeam} onClick={() => selectedEvent = entry} />
        {/each}
      </div>

      <!-- Scroll to bottom FAB -->
      {#if !isAtBottom}
        <button
          type="button"
          onclick={scrollToBottom}
          class="absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-[#050510]/90 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-500/10 hover:scale-110 transition-all z-20"
          title="Scroll to bottom"
        >
          <ArrowDown class="h-5 w-5" />
        </button>
      {/if}
    {/if}
  </div>

</div>

{#if selectedEvent}
  <EventDetailModal entry={selectedEvent} onClose={() => selectedEvent = null} />
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
