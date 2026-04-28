<script lang="ts">
  import { Shield } from "lucide-svelte";
  
  type Props = {
    title: string;
    description?: string;
    icon?: any;
    children?: any;
  };

  let { title, description, icon: Icon, children }: Props = $props();
</script>

<div class="flex flex-col gap-4 p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 hover:bg-black/60 transition-all">
  <div class="flex items-start justify-between">
    <div class="flex items-center gap-3">
      {#if Icon}
        <div class="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
          <Icon class="h-4 w-4" />
        </div>
      {/if}
      <div>
        <h3 class="text-xs font-black text-white/90 uppercase tracking-widest">{title}</h3>
        {#if description}
          <p class="text-[10px] text-white/40 uppercase tracking-widest mt-1">{description}</p>
        {/if}
      </div>
    </div>
  </div>
  
  <div class="pt-2">
    {@render children?.()}
  </div>
</div>
