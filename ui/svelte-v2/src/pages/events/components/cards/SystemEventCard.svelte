<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte";
  import { resolveAgent } from "$lib/state/agents.svelte";

  export let entry: TeamEventEntry;

  $: p = entry.payload as any;
  $: name = p.name || p.member_display_name || resolveAgent(p.member_agent_key);
  $: details = p.details || p.description;
</script>

<div class="space-y-1.5 w-full">
  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
    {#if name}
      <span class="truncate text-[11px] font-bold text-white/80 tracking-widest">{name}</span>
    {/if}
    
    {#if p.role}
      <span class="shrink-0 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/50">
        Role: {p.role}
      </span>
    {/if}
    
    {#if p.member_agent_key}
      <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">
        agent: {p.member_agent_key.slice(0, 8)}
      </span>
    {/if}
  </div>

  {#if details}
    <p class="break-words text-[11px] text-white/50 bg-black/30 p-2 rounded border border-white/5 line-clamp-2">
      {details}
    </p>
  {/if}

  {#if p.agent_key}
    <div class="mt-1">
      <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">agent: {p.agent_key.slice(0, 8)}</span>
    </div>
  {/if}
</div>
