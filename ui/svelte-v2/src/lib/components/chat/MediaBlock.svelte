<script lang="ts">
  import type { MediaItem } from "../../types/chat";
  import AuthMediaItem from "./AuthMediaItem.svelte";

  let { items = [] } = $props<{ items: MediaItem[] }>();
</script>

{#if items.length > 0}
  <div class="flex flex-wrap gap-2 mt-2 w-full">
    {#each items as item}
      <AuthMediaItem {item} />
    {/each}
  </div>
{/if}
