<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte";
  import { resolveAgent } from "$lib/state/agents.svelte";
  import { _ } from "svelte-i18n";

  export let entry: TeamEventEntry;

  $: p = entry.payload as any;
  $: subtype = p.type;
  $: isTool = subtype === "tool.call" || subtype === "tool.result";
  $: isResult = subtype === "tool.result";
  
  $: toolName = p.payload?.name;
  $: isError = isResult && p.payload?.is_error;
  $: args = p.payload?.arguments;
  $: agentName = resolveAgent(p.agentId);
  $: isSkill = toolName === "use_skill";
  $: skillName = isSkill ? (args?.name as string) || "unknown" : null;
  $: displayName = isSkill ? `skill: ${skillName}` : toolName;

  $: runMessage = p.payload?.message;
  $: runContent = p.payload?.content;
  $: runError = p.payload?.error;

  function getRunKindBadge(kind: string) {
    if (kind === "delegation") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (kind === "announce") return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-white/10 text-white/50 border-white/20";
  }
</script>

{#if isTool}
  <div class="space-y-1.5 w-full">
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      {#if isResult}
        {#if displayName}
          <span class={`truncate font-mono text-[11px] font-bold tracking-wider ${isSkill ? "text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]" : "text-white/80"}`}>
            {displayName}
          </span>
        {/if}
        <span class="text-white/20">&rarr;</span>
        <span class="truncate text-[11px] font-bold text-white/60 uppercase tracking-widest">{agentName}</span>
        
        <span class={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${isError ? "bg-red-500/20 text-red-400 border-red-500/30" : isSkill ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}`}>
          {isError ? "Error" : isSkill ? "Activated" : "OK"}
        </span>
        
        {#if p.runKind}
          <span class={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${getRunKindBadge(p.runKind)}`}>
            {p.runKind}
          </span>
        {/if}
      {:else}
        <span class="truncate text-[11px] font-bold text-white/60 uppercase tracking-widest">{agentName}</span>
        <span class="text-white/20">&rarr;</span>
        {#if displayName}
          <span class={`truncate font-mono text-[11px] font-bold tracking-wider ${isSkill ? "text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]" : "text-white/80"}`}>
            {displayName}
          </span>
        {/if}
        {#if p.runKind}
          <span class={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${getRunKindBadge(p.runKind)}`}>
            {p.runKind}
          </span>
        {/if}
      {/if}
    </div>

    <!-- Structured Tool Arguments -->
    {#if !isResult && args && !isSkill && Object.keys(args).length > 0}
      <div class="mt-2 space-y-1 bg-black/40 border border-white/5 rounded-lg p-2.5">
        {#each Object.entries(args).slice(0, 3) as [key, value]}
          <div class="flex items-baseline gap-2">
            <span class="shrink-0 text-[10px] font-black uppercase tracking-widest text-white/30">{key}:</span>
            <span class="truncate font-mono text-[11px] text-white/60">
              {typeof value === "string" ? value : JSON.stringify(value)}
            </span>
          </div>
        {/each}
        {#if Object.keys(args).length > 3}
          <span class="text-[9px] font-bold uppercase tracking-widest text-white/20">+{Object.keys(args).length - 3} more args</span>
        {/if}
      </div>
    {/if}
    
    <!-- Context Row -->
    <div class="flex flex-wrap items-center gap-2 mt-2">
      {#if p.delegationId}
        <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">deleg: {p.delegationId.slice(0,8)}</span>
      {/if}
      {#if p.teamTaskId}
        <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">task: {p.teamTaskId.slice(0,8)}</span>
      {/if}
      {#if p.payload?.id && !isResult}
        <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">call: {p.payload.id.slice(0,8)}</span>
      {/if}
      {#if p.runId}
        <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">run: {p.runId.slice(0,8)}</span>
      {/if}
    </div>
  </div>
{:else}
  <div class="space-y-1.5 w-full">
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="truncate text-[11px] font-bold text-white/80 uppercase tracking-widest">{agentName}</span>
      {#if p.runKind}
        <span class={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${getRunKindBadge(p.runKind)}`}>
          {p.runKind}
        </span>
      {/if}
    </div>

    {#if runMessage}
      <p class="break-words text-[11px] text-white/50 line-clamp-2">{runMessage}</p>
    {/if}
    {#if runContent}
      <p class="break-words text-[11px] text-white/50 line-clamp-2">{runContent}</p>
    {/if}
    {#if subtype === "run.failed" && runError}
      <p class="break-words text-[11px] text-red-400 line-clamp-2 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">{runError}</p>
    {/if}
    
    <!-- Context Row -->
    <div class="flex flex-wrap items-center gap-2 mt-2">
      {#if p.delegationId}
        <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">deleg: {p.delegationId.slice(0,8)}</span>
      {/if}
      {#if p.parentAgentId}
        <span class="inline-flex items-center gap-1 rounded bg-black/50 border border-white/5 px-1.5 py-0.5 text-[9px] text-white/40 uppercase tracking-widest">
          parent: <span class="font-bold text-white/60">{resolveAgent(p.parentAgentId)}</span>
        </span>
      {/if}
      {#if p.teamTaskId}
        <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">task: {p.teamTaskId.slice(0,8)}</span>
      {/if}
      {#if p.runId}
        <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">run: {p.runId.slice(0,8)}</span>
      {/if}
    </div>
  </div>
{/if}
