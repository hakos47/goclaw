<script lang="ts">
  import { cn } from "$lib/utils";
  import { X } from "lucide-svelte";

  type Props = {
    class?: string;
    onClose?: () => void;
    children?: import("svelte").Snippet;
  };

  let { class: className, onClose, children }: Props = $props();
</script>

<div class={cn("relative p-6", className)}>
  {@render children?.()}
  
  {#if onClose}
    <button
      type="button"
      class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
      onclick={onClose}
    >
      <X size={16} />
      <span class="sr-only">Close</span>
    </button>
  {/if}
</div>
