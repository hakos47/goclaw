<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLInputAttributes } from "svelte/elements";

  type Props = HTMLInputAttributes & {
    class?: string;
    value?: string | number | null;
  };

  let { class: className, value = $bindable(), ...restProps }: Props = $props();
</script>

<input
  class={cn(
    "flex h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-goclaw-neon-purple/50 focus-visible:border-goclaw-neon-purple/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/30",
    className
  )}
  bind:value
  {...restProps}
/>
