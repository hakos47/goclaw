<script lang="ts">
  import { cn } from "$lib/utils";

  type Props = {
    class?: string;
    children?: import("svelte").Snippet;
  };

  let { class: className, children }: Props = $props();
</script>

<div
  class={cn(
    "inline-flex h-10 items-center justify-center rounded-xl bg-white/5 p-1 text-white/50 border border-white/10 backdrop-blur-md",
    className
  )}
>
  {@render children?.()}
</div>
