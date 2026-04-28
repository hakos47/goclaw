<script lang="ts">
  import { RefreshCw } from "lucide-svelte";

  let {
    estimatedTokens = 0,
    contextWindow = 0,
    compactionCount = 0
  }: {
    estimatedTokens?: number;
    contextWindow?: number;
    compactionCount?: number;
  } = $props();

  const formatTokens = (t: number) => t > 1000 ? (t/1000).toFixed(1) + 'k' : t.toString();
  
  let pct = $derived(
    contextWindow > 0 
      ? Math.min(Math.round((estimatedTokens / (contextWindow * 0.75)) * 100), 100)
      : 0
  );

  let barColor = $derived(
    pct >= 85 ? "from-rose-500 to-red-600 shadow-[0_0_8px_rgba(225,29,72,0.6)]" : 
    pct >= 60 ? "from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : 
    "from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
  );
</script>

{#if contextWindow <= 0}
  <span class="text-xs text-white/40">—</span>
{:else}
  <div class="flex items-center gap-2 min-w-[120px]">
    <div class="flex-1">
      <div
        class="h-1.5 w-full rounded-full bg-white/5 border border-white/5 overflow-hidden"
        title="~{formatTokens(estimatedTokens)} / {formatTokens(contextWindow)} tokens ({pct}%)"
      >
        <div
          class="h-full rounded-full transition-all bg-gradient-to-r {barColor}"
          style="width: {pct}%"
        ></div>
      </div>
      <div class="mt-1 flex items-center gap-1 text-[10px] text-white/50 font-mono">
        <span>{formatTokens(estimatedTokens)} / {formatTokens(contextWindow)}</span>
        {#if compactionCount > 0}
          <span class="inline-flex items-center gap-0.5" title="Compacted {compactionCount} times">
            · <RefreshCw class="h-2.5 w-2.5" />{compactionCount}
          </span>
        {/if}
      </div>
    </div>
  </div>
{/if}
