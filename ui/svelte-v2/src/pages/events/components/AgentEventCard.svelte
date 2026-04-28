<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte.ts";
  import { ArrowRight } from "lucide-svelte";
  import { _ } from "svelte-i18n";

  type Props = {
    entry: TeamEventEntry;
  };

  let { entry }: Props = $props();

  let payload = $derived(entry.payload as any);
  let pPayload = $derived(payload?.payload as any);
  let subtype = $derived(payload?.type || "unknown");
  let agentId = $derived(payload?.agentId || "Unknown Agent");

  let isTool = $derived(subtype === "tool.call" || subtype === "tool.result");
  let isResult = $derived(subtype === "tool.result");
  let toolName = $derived(pPayload?.name);
  let isError = $derived(isResult && pPayload?.is_error);
  let args = $derived(pPayload?.arguments);
  let isSkill = $derived(toolName === "use_skill");
  let skillName = $derived(isSkill ? (args?.name || "unknown") : null);
  let displayName = $derived(isSkill ? `skill: ${skillName}` : toolName);

  let message = $derived(pPayload?.message);
  let content = $derived(pPayload?.content);
  let runKind = $derived(payload?.runKind);

  function getRunKindVariant(kind: string) {
    if (kind === "delegation") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (kind === "announce") return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    return "bg-white/10 text-white/50 border-white/20";
  }

  // Tool arguments mapping
  let argEntries = $derived(args && !isSkill ? Object.entries(args) : []);
  let visibleArgs = $derived(argEntries.slice(0, 3));
  let remainingArgs = $derived(argEntries.length - 3);

  // Context flags
  let hasContext = $derived(!!(payload?.runId || payload?.delegationId || payload?.parentAgentId || payload?.teamTaskId || pPayload?.id));
</script>

{#snippet contextRow()}
  {#if hasContext}
    <div class="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-mono text-white/40 mt-1">
      {#if payload?.delegationId}
        <span class="rounded bg-black/40 px-1.5 py-0.5 border border-white/5">deleg: {payload.delegationId.slice(0, 8)}</span>
      {/if}
      {#if payload?.parentAgentId}
        <span class="inline-flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 border border-white/5">
          parent <span class="font-bold text-white/70">{payload.parentAgentId}</span>
        </span>
      {/if}
      {#if payload?.teamTaskId}
        <span class="rounded bg-black/40 px-1.5 py-0.5 border border-white/5">task: {payload.teamTaskId.slice(0, 8)}</span>
      {/if}
      {#if isTool && pPayload?.id}
        <span class="rounded bg-black/40 px-1.5 py-0.5 border border-white/5">call: {pPayload.id.slice(0, 8)}</span>
      {/if}
      {#if payload?.runId}
        <span class="rounded bg-black/40 px-1.5 py-0.5 border border-white/5">run: {payload.runId.slice(0, 8)}</span>
      {/if}
    </div>
  {/if}
{/snippet}

<div class="space-y-1.5 text-sm text-white/90">
  {#if isTool}
    <!-- Tool Card -->
    <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {#if isResult}
        {#if displayName}
          <span class="truncate font-mono font-medium drop-shadow-md {isSkill ? 'text-amber-400' : 'text-goclaw-neon-purple'}">
            {displayName}
          </span>
        {/if}
        <ArrowRight class="h-3.5 w-3.5 shrink-0 text-white/30" />
        <span class="truncate font-bold drop-shadow-md text-emerald-300">{agentId}</span>
        <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border {isError ? 'bg-red-500/20 text-red-400 border-red-500/30' : isSkill ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}">
          {isError ? "Error" : isSkill ? "Activated" : "OK"}
        </span>
      {:else}
        <span class="truncate font-bold drop-shadow-md text-emerald-300">{agentId}</span>
        <ArrowRight class="h-3.5 w-3.5 shrink-0 text-white/30" />
        {#if displayName}
          <span class="truncate font-mono font-medium drop-shadow-md {isSkill ? 'text-amber-400' : 'text-goclaw-neon-purple'}">
            {displayName}
          </span>
        {/if}
      {/if}

      {#if runKind}
        <span class="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border {getRunKindVariant(runKind)}">
          {runKind}
        </span>
      {/if}
    </div>

    {#if !isResult && visibleArgs.length > 0}
      <div class="space-y-0.5 text-[11px] mt-1 pl-2 border-l border-white/10">
        {#each visibleArgs as [key, value]}
          <div class="flex min-w-0 items-baseline gap-1.5">
            <span class="shrink-0 text-white/40">{key}:</span>
            <span class="min-w-0 truncate font-mono text-white/70">
              {typeof value === "string" ? value : JSON.stringify(value)}
            </span>
          </div>
        {/each}
        {#if remainingArgs > 0}
          <span class="text-white/30 italic text-[10px]">+ {remainingArgs} more args</span>
        {/if}
      </div>
    {/if}

    {@render contextRow()}

  {:else}
    <!-- Run Card -->
    <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span class="truncate font-bold drop-shadow-md text-emerald-300">{agentId}</span>
      {#if runKind}
        <span class="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border {getRunKindVariant(runKind)}">
          {runKind}
        </span>
      {/if}
    </div>

    {#if message}
      <p class="break-words text-[11px] text-white/60 line-clamp-2 border-l-2 border-emerald-500/30 pl-2 italic">
        "{message}"
      </p>
    {/if}
    {#if content}
      <p class="break-words text-[11px] text-white/60 line-clamp-2 mt-1">
        {content}
      </p>
    {/if}

    {@render contextRow()}

    {#if subtype === "run.failed" && pPayload?.error}
      <p class="break-words text-[11px] text-red-400 line-clamp-2 bg-red-500/10 p-1.5 rounded mt-1 border border-red-500/20">
        {pPayload.error}
      </p>
    {/if}
  {/if}
</div>
