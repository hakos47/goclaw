<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte.ts";
  import { ArrowRight } from "lucide-svelte";

  type Props = {
    entry: TeamEventEntry;
  };

  let { entry }: Props = $props();

  let payload = $derived(entry.payload as any);

  let from = $derived(payload?.from_display_name || payload?.from_agent_key || "Unknown");
  let to = $derived(
    payload?.to_agent_key === "broadcast" 
      ? "all" 
      : payload?.to_display_name || payload?.to_agent_key || "Unknown"
  );
</script>

<div class="space-y-1.5 text-sm text-white/90">
  <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
    <span class="truncate font-bold drop-shadow-md text-emerald-300">{from}</span>
    <ArrowRight class="h-3.5 w-3.5 shrink-0 text-white/30" />
    <span class="truncate font-bold drop-shadow-md {to === 'all' ? 'text-amber-300' : 'text-emerald-300'}">{to}</span>
    
    {#if payload?.message_type}
      <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5 text-white/70">
        {payload.message_type}
      </span>
    {/if}
  </div>

  {#if payload?.preview}
    <p class="break-words text-[11px] text-white/60 leading-relaxed border-l-2 border-emerald-500/30 pl-2 py-0.5 italic">
      "{payload.preview}"
    </p>
  {/if}

  {#if payload?.task_id}
    <div class="mt-1">
      <span class="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/40 border border-white/5 shadow-inner">
        task: {payload.task_id.slice(0, 8)}
      </span>
    </div>
  {/if}
</div>
