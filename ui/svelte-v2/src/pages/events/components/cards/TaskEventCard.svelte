<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte";
  import { resolveAgent } from "$lib/state/agents.svelte";

  export let entry: TeamEventEntry;

  $: p = entry.payload as any;
  $: owner = p.owner_display_name || resolveAgent(p.owner_agent_key);

  function getTaskStatusBadge(status: string) {
    if (status === "completed") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (status === "failed") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (status === "assigned" || status === "in_progress") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  }
</script>

<div class="space-y-1.5 w-full">
  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
    {#if p.subject}
      <span class="truncate text-[11px] font-bold text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] tracking-widest">{p.subject}</span>
    {/if}
    <span class={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${getTaskStatusBadge(p.status)}`}>
      {p.status}
    </span>
  </div>

  <div class="flex flex-wrap items-center gap-2 mt-2">
    {#if p.task_id}
      <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">task: {p.task_id.slice(0, 8)}</span>
    {/if}
    {#if p.owner_agent_key}
      <span class="inline-flex items-center gap-1 rounded bg-black/50 border border-white/5 px-1.5 py-0.5 text-[9px] text-white/40 uppercase tracking-widest">
        Owner: <span class="font-bold text-white/60">{owner}</span>
      </span>
    {/if}
  </div>

  {#if p.reason}
    <p class="mt-1 break-words text-[11px] text-white/50 bg-black/30 p-2 rounded border border-white/5 line-clamp-2">Reason: {p.reason}</p>
  {/if}
</div>
