<script lang="ts">
  import { getContext } from "svelte";
  import { cn } from "$lib/utils";

  type Props = {
    value: string;
    class?: string;
    children?: import("svelte").Snippet;
  };

  let { value: contentValue, class: className, children }: Props = $props();

  const context = getContext<{ value: string; }>("tabs");

  let active = $derived(context.value === contentValue);
</script>

{#if active}
  <div
    class={cn("mt-2 ring-offset-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goclaw-neon-purple/50", className)}
  >
    {@render children?.()}
  </div>
{/if}
