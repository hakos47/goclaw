<script lang="ts">
  import { Search } from "lucide-svelte";

  let {
    value = $bindable(""),
    placeholder = "Search...",
    class: className = ""
  }: {
    value?: string;
    placeholder?: string;
    class?: string;
  } = $props();
</script>

<div class="relative {className}">
  <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
  <input
    type="text"
    bind:value
    {placeholder}
    class="w-full rounded-md bg-white/5 border border-white/10 py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/40 focus:border-goclaw-neon-purple focus:outline-none focus:ring-1 focus:ring-goclaw-neon-purple transition-all"
  />
</div>
