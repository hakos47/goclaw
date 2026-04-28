<script lang="ts">
  import type { ComponentType } from "svelte";
  import type { Icon } from "lucide-svelte";

  let {
    icon: IconComponent,
    title,
    description
  }: {
    icon: ComponentType<Icon>;
    title: string;
    description?: string;
  } = $props();
</script>

<div class="flex flex-col items-center justify-center py-16 text-center">
  <div class="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
    <IconComponent class="h-10 w-10 text-white/20" />
  </div>
  <h3 class="mt-4 text-lg font-semibold text-white/90">{title}</h3>
  {#if description}
    <p class="mt-2 max-w-sm text-sm text-white/50">{description}</p>
  {/if}
</div>
