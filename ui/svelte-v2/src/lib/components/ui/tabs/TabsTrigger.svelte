<script lang="ts">
  import { getContext } from "svelte";
  import { cn } from "$lib/utils";

  type Props = {
    value: string;
    class?: string;
    children?: import("svelte").Snippet;
  };

  let { value: triggerValue, class: className, children }: Props = $props();

  const context = getContext<{ value: string; }>("tabs");

  let active = $derived(context.value === triggerValue);
</script>

<button
  type="button"
  class={cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goclaw-neon-purple/50 disabled:pointer-events-none disabled:opacity-50",
    active 
      ? "bg-goclaw-neon-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
      : "hover:bg-white/5 hover:text-white",
    className
  )}
  onclick={() => { (context as any).value = triggerValue; }}
>
  {@render children?.()}
</button>
