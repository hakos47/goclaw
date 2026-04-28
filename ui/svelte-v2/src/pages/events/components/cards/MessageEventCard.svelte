<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte";
  import { resolveAgent } from "$lib/state/agents.svelte";

  export let entry: TeamEventEntry;

  $: p = entry.payload as any;
  $: from = p.from_display_name || resolveAgent(p.from_agent_key);
  $: to = p.to_agent_key === "broadcast" ? "all" : (p.to_display_name || resolveAgent(p.to_agent_key));
</script>

<div class="space-y-1.5 w-full">
  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
    <span class="truncate text-[11px] font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] tracking-widest">{from}</span>
    <span class="text-white/20">&rarr;</span>
    <span class="truncate text-[11px] font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] tracking-widest">{to}</span>
    
    {#if p.message_type}
      <span class="shrink-0 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/50">
        {p.message_type}
      </span>
    {/if}
  </div>

  {#if p.preview}
    <p class="break-words text-[11px] text-white/60 italic border-l-2 border-emerald-500/30 pl-2 bg-emerald-500/5 py-1 rounded-r-md">"{p.preview}"</p>
  {/if}

  {#if p.task_id}
    <div class="mt-2">
      <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">task: {p.task_id.slice(0, 8)}</span>
    </div>
  {/if}
</div>
