<script lang="ts">
  import { CheckCircle2, XCircle, Loader2, Circle } from "lucide-svelte";
  import type { ProgressStep } from "$lib/state/sse.svelte";

  interface Props {
    steps: ProgressStep[];
    elapsed?: number;
    class?: string;
  }

  let { steps, elapsed, class: className = "" }: Props = $props();

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
</script>

<div class={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 space-y-3 shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)] ${className}`}>
  {#each steps as step (step.id)}
    <div class="group">
      <div class="flex items-center gap-3 text-sm">
        {#if step.status === "done"}
          <CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        {:else if step.status === "error"}
          <XCircle class="h-4 w-4 shrink-0 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
        {:else if step.status === "running"}
          <Loader2 class="h-4 w-4 shrink-0 text-cyan-400 animate-spin drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
        {:else}
          <Circle class="h-4 w-4 shrink-0 text-white/20" />
        {/if}

        <span class={`font-mono uppercase tracking-widest text-[10px] ${step.status === 'pending' ? 'text-white/40' : 'text-white/80'}`}>
          {step.label}
        </span>
        
        <span class="text-[10px] font-mono text-white/40 ml-auto uppercase tracking-widest">
          {#if step.detail}
            {step.detail}
          {:else if step.status === "done" && step.total != null && step.total > 0}
            {step.total} items
          {/if}
        </span>
      </div>

      {#if step.status === "running" && step.total != null && step.total > 0}
        <div class="ml-7 mt-2 flex items-center gap-3">
          <div class="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
            <div
              class="h-full bg-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
              style="width: {Math.min(100, ((step.current ?? 0) / step.total) * 100)}%"
            ></div>
          </div>
          <span class="text-[9px] font-mono text-cyan-400 tabular-nums whitespace-nowrap uppercase tracking-widest">
            {step.current ?? 0}/{step.total}
          </span>
        </div>
      {/if}

      {#if step.status === "error" && step.errorMessage}
        <p class="ml-7 mt-1.5 text-[10px] font-mono text-rose-400 uppercase tracking-widest break-words leading-relaxed bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
          {step.errorMessage}
        </p>
      {/if}
    </div>
  {/each}

  {#if elapsed != null && steps.length > 0}
    <div class="text-[10px] font-mono text-white/30 pt-3 mt-3 border-t border-white/5 uppercase tracking-widest flex items-center justify-between">
      <span>Time Elapsed</span>
      <span>{formatTime(elapsed)}</span>
    </div>
  {/if}
</div>
