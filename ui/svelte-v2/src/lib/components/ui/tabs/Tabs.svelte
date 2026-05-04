<script lang="ts">
  import { setContext } from "svelte";
  import { cn } from "$lib/utils";

  type Props = {
    value: string;
    onValueChange?: (value: string) => void;
    class?: string;
    children?: import("svelte").Snippet;
  };

  let { value = $bindable(), onValueChange, class: className, children }: Props = $props();

  const context = {
    get value() { return value; },
    set value(v: string) { 
      value = v; 
      onValueChange?.(v);
    }
  };

  setContext("tabs", context);
</script>

<div class={cn("w-full", className)}>
  {@render children?.()}
</div>
