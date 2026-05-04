<script lang="ts">
  import { cn } from "$lib/utils";

  type Props = {
    class?: string;
    children?: import("svelte").Snippet;
  };

  let { class: className, children }: Props = $props();
</script>

<h5
  class={cn("mb-1 font-bold leading-none tracking-tight", className)}
>
  {@render children?.()}
</h5>
