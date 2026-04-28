<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte.ts";

  type Props = {
    entry: TeamEventEntry;
  };

  let { entry }: Props = $props();

  let payload = $derived(entry.payload as any);

  function taskStatusBadgeVariant(status: string) {
    if (status === "completed" || status === "approved") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (status === "failed" || status === "cancelled" || status === "rejected") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (status === "in_progress" || status === "claimed" || status === "dispatched") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-white/10 text-white/70 border-white/20";
  }
</script>

<div class="space-y-1 text-sm text-white/90">
  <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
    {#if payload?.subject}
      <span class="min-w-0 truncate font-semibold drop-shadow-md text-white">{payload.subject}</span>
    {/if}
    {#if payload?.status}
      <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border {taskStatusBadgeVariant(payload.status)}">
        {payload.status}
      </span>
    {/if}
  </div>
  <div class="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
    {#if payload?.task_id}
      <span class="rounded bg-black/40 px-1.5 py-0.5 font-mono border border-white/5 shadow-inner">
        task: {payload.task_id.slice(0, 8)}
      </span>
    {/if}
    {#if payload?.owner_agent_key || payload?.owner_display_name}
      <span class="rounded bg-black/40 px-1.5 py-0.5 truncate border border-white/5">
        Owner: {payload.owner_display_name || payload.owner_agent_key}
      </span>
    {/if}
    {#if payload?.reason}
      <span class="break-words mt-1 block w-full border-l-2 border-white/10 pl-2 text-white/60">Reason: {payload.reason}</span>
    {/if}
  </div>
</div>
