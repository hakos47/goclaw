<script lang="ts">
  import { cn } from "$lib/utils";

  type Props = {
    class?: string;
    children?: import("svelte").Snippet;
  };

  let { class: className, children }: Props = $props();
</script>

<p
  class={cn("text-sm opacity-60", className)}
>
  {@render children?.()}
</p>
