<script lang="ts">
  import { cn } from "$lib/utils";
  import { fade, scale } from "svelte/transition";

  type Props = {
    open?: boolean;
    onClose?: () => void;
    children?: import("svelte").Snippet;
  };

  let { open = $bindable(false), onClose, children }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      open = false;
      onClose?.();
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    onkeydown={handleKeydown}
  >
    <!-- Overlay -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      transition:fade={{ duration: 200 }}
      class="fixed inset-0 bg-black/80 backdrop-blur-sm"
      onclick={() => { open = false; onClose?.(); }}
    ></div>

    <!-- Content Wrapper -->
    <div
      transition:scale={{ duration: 200, start: 0.95 }}
      class="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
    >
      {@render children?.()}
    </div>
  </div>
{/if}
