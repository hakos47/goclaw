<script lang="ts">
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte";

  export let entry: TeamEventEntry;

  $: payload = entry.payload as Record<string, any>;
  $: isLog = entry.event === "log" && payload && typeof payload === "object";

  // For generic payloads, filter out empty/null values to keep UI clean
  $: entries = Object.entries(payload || {}).filter(([_, v]) => v != null && v !== "");
</script>

<div class="space-y-2 w-full">
  {#if isLog && payload.message}
    <!-- Special formatting if it happens to be a structured 'log' event -->
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${
        payload.level === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
        payload.level === 'warn' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
        'bg-blue-500/20 text-blue-400 border-blue-500/30'
      }`}>
        {payload.level || 'log'}
      </span>
      <span class="text-[11px] font-bold text-white/80">{payload.message}</span>
    </div>

    <!-- Render any extra attributes neatly -->
    {#if payload.attrs && Object.keys(payload.attrs).length > 0}
      <div class="flex flex-wrap gap-2 mt-1">
        {#each Object.entries(payload.attrs) as [k, v]}
          <span class="rounded bg-black/50 border border-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">
            {k}: {typeof v === 'object' ? JSON.stringify(v) : v}
          </span>
        {/each}
      </div>
    {/if}
  {:else if entries.length > 0}
    <!-- Generic Key-Value layout -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
      {#each entries as [k, v]}
        <div class="bg-black/30 border border-white/5 rounded-lg p-2 overflow-hidden flex flex-col">
          <span class="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{k}</span>
          {#if typeof v === 'object'}
            <pre class="text-[10px] font-mono text-white/50 bg-black/40 p-1.5 rounded overflow-x-auto whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
          {:else}
            <span class="text-[11px] font-bold text-white/70 truncate" title={String(v)}>{String(v)}</span>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-[10px] italic text-white/30 uppercase tracking-widest">No payload data</p>
  {/if}
</div>
