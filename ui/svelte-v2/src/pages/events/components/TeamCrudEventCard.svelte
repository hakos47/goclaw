<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte.ts";
  import { ArrowRight } from "lucide-svelte";

  type Props = {
    entry: TeamEventEntry;
  };

  let { entry }: Props = $props();
  let payload = $derived(entry.payload as any);
</script>

<div class="text-sm text-white/90">
  {#if entry.event === "team.created"}
    <div>
      <span class="text-white/60">Team </span>
      <span class="font-bold text-amber-300 drop-shadow-md">{payload.team_name}</span>
      <span class="text-white/60"> created</span>
      {#if payload.lead_agent_key || payload.lead_display_name}
        <span class="text-white/40"> (lead: {payload.lead_display_name || payload.lead_agent_key})</span>
      {/if}
      {#if payload.member_count}
        <span class="ml-2 text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
          {payload.member_count} members
        </span>
      {/if}
    </div>
  {:else if entry.event === "team.updated"}
    <div>
      <span class="text-white/60">Team </span>
      <span class="font-bold text-amber-300 drop-shadow-md">{payload.team_name}</span>
      <span class="text-white/60"> updated</span>
      {#if payload.changes?.length > 0}
        <span class="ml-2 text-[11px] text-white/40 italic">({payload.changes.join(", ")})</span>
      {/if}
    </div>
  {:else if entry.event === "team.deleted"}
    <div class="text-red-400 font-medium">
      <span>Team </span>
      <span class="font-bold drop-shadow-md">{payload.team_name}</span>
      <span> deleted</span>
    </div>
  {:else if entry.event === "team.member.added"}
    <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span class="truncate font-bold text-emerald-300 drop-shadow-md">{payload.display_name || payload.agent_key}</span>
      <span class="shrink-0 text-white/50">added to</span>
      <span class="truncate font-bold text-amber-300 drop-shadow-md">{payload.team_name}</span>
      {#if payload.role}
        <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5 text-white/70">
          {payload.role}
        </span>
      {/if}
    </div>
  {:else if entry.event === "team.member.removed"}
    <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span class="truncate font-bold text-red-400 drop-shadow-md">{payload.display_name || payload.agent_key}</span>
      <span class="shrink-0 text-white/50">removed from</span>
      <span class="truncate font-bold text-amber-300 drop-shadow-md">{payload.team_name}</span>
    </div>
  {:else if entry.event === "agent_link.created"}
    <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span class="truncate font-bold text-fuchsia-300 drop-shadow-md">{payload.source_agent_key}</span>
      <ArrowRight class="h-3.5 w-3.5 shrink-0 text-white/30" />
      <span class="truncate font-bold text-fuchsia-300 drop-shadow-md">{payload.target_agent_key}</span>
      {#if payload.direction}
        <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5 text-white/70">
          {payload.direction}
        </span>
      {/if}
      {#if payload.status}
        <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          {payload.status}
        </span>
      {/if}
    </div>
  {:else if entry.event === "agent_link.updated"}
    <div>
      <span class="text-white/60">Link </span>
      <span class="font-bold text-fuchsia-300 drop-shadow-md">
        {payload.source_agent_key} <ArrowRight class="inline h-3 w-3 mx-1 text-white/50" /> {payload.target_agent_key}
      </span>
      <span class="text-white/60"> updated</span>
      {#if payload.changes?.length > 0}
        <span class="ml-2 text-[11px] text-white/40 italic">({payload.changes.join(", ")})</span>
      {/if}
    </div>
  {:else if entry.event === "agent_link.deleted"}
    <div class="text-red-400 font-medium">
      <span>Link </span>
      <span class="font-bold drop-shadow-md">
        {payload.source_agent_key} <ArrowRight class="inline h-3 w-3 mx-1 opacity-70" /> {payload.target_agent_key}
      </span>
      <span> deleted</span>
    </div>
  {:else}
    <pre class="overflow-x-auto text-[11px] text-emerald-400/80 custom-scrollbar">{JSON.stringify(payload, null, 2)}</pre>
  {/if}
</div>
