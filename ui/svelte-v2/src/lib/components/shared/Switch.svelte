<script lang="ts">
  let { checked = $bindable(false), disabled = false, onChange = () => {} } = $props<{
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
  }>();

  function toggle() {
    if (disabled) return;
    checked = !checked;
    onChange(checked);
  }
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  {disabled}
  onclick={toggle}
  class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goclaw-neon-purple/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50 {checked ? 'bg-goclaw-neon-purple' : 'bg-white/10'}"
>
  <span
    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform {checked ? 'translate-x-4' : 'translate-x-0'}"
  ></span>
</button>
