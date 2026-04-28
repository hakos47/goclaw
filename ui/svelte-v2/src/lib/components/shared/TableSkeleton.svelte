<script lang="ts">
  let { rows = 5 } = $props<{ rows?: number }>();
</script>

<div class="w-full space-y-4 animate-pulse">
  <div class="h-10 bg-white/5 rounded-xl border border-white/5"></div>
  {#each Array(rows) as _}
    <div class="h-16 bg-white/5 rounded-xl border border-white/5"></div>
  {/each}
</div>
