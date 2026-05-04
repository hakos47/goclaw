<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTextareaAttributes } from "svelte/elements";

  type Props = HTMLTextareaAttributes & {
    class?: string;
    value?: string | number | null;
  };

  let { class: className, value = $bindable(), ...restProps }: Props = $props();
</script>

<textarea
  class={cn(
    "flex min-h-[60px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-goclaw-neon-purple/50 focus-visible:border-goclaw-neon-purple/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/30",
    className
  )}
  bind:value
  {...restProps}
></textarea>
