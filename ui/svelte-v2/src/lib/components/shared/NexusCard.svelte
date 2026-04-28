<script lang="ts">
  import type { ComponentType } from "svelte";
  import type { Snippet } from "svelte";
  
  type Props = {
    title: string;
    subtitle: string;
    icon: ComponentType;
    iconColorClass?: string;
    iconBgClass?: string;
    pattern?: "grid" | "diagonal" | "none";
    noPadding?: boolean;
    children?: Snippet;
    headerActions?: Snippet;
  };

  let { 
    title, 
    subtitle, 
    icon: Icon, 
    iconColorClass = "text-goclaw-neon-cyan", 
    iconBgClass = "bg-goclaw-neon-cyan/10 border-goclaw-neon-cyan/20",
    pattern = "grid", 
    noPadding = false,
    children, 
    headerActions 
  }: Props = $props();
</script>

<div class="relative overflow-hidden bg-black/40 backdrop-blur-3xl border border-[#d946ef]/20 shadow-[0_0_30px_rgba(217,70,239,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl group flex flex-col h-full">
  
  {#if pattern === "diagonal"}
    <div class="absolute inset-0 bg-[linear-gradient(45deg,rgba(6,182,212,0.02)_25%,transparent_25%,transparent_50%,rgba(6,182,212,0.02)_50%,rgba(6,182,212,0.02)_75%,transparent_75%,transparent)] bg-[length:20px_20px] pointer-events-none opacity-50"></div>
  {:else if pattern === "grid"}
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20"></div>
  {/if}

  <div class="relative z-10 flex flex-col md:flex-row border-b border-white/5">
    <div class="flex-1 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class={`p-2 rounded-xl border ${iconBgClass}`}>
          <Icon class={`h-5 w-5 animate-pulse-slow ${iconColorClass}`} />
        </div>
        <div>
          <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-white">{title}</h3>
          <p class="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">{subtitle}</p>
        </div>
      </div>
      {#if headerActions}
        {@render headerActions()}
      {/if}
    </div>
  </div>

  <div class={`relative z-10 flex-1 flex flex-col ${noPadding ? '' : 'p-5 md:p-6 overflow-y-auto'}`}>
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>
