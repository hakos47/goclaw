<script lang="ts">
  import { cn } from "$lib/utils";

  type Props = {
    class?: string;
    checked?: boolean;
    disabled?: boolean;
    onchange?: (checked: boolean) => void;
  };

  let { class: className, checked = $bindable(false), disabled = false, onchange }: Props = $props();

  function toggle() {
    if (disabled) return;
    checked = !checked;
    onchange?.(checked);
  }
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label="Toggle switch"
  {disabled}
  class={cn(
    "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goclaw-neon-purple/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50",
    checked ? "bg-goclaw-neon-purple" : "bg-white/10",
    className
  )}
  onclick={toggle}
>
  <span
    class={cn(
      "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
      checked ? "translate-x-4" : "translate-x-0"
    )}
  ></span>
</button>
