<script lang="ts">
  import { cn } from "$lib/utils";

  type Props = {
    class?: string;
    children?: import("svelte").Snippet;
  };

  let { class: className, children }: Props = $props();
</script>

<div
  class={cn("text-sm opacity-80 [&_p]:leading-relaxed", className)}
>
  {@render children?.()}
</div>
