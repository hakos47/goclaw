<script lang="ts">
  import { ChevronDown, Check } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";

  type Option = { value: string; label: string };

  type Props = {
    value: string;
    onChange: (v: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    theme?: "purple" | "emerald" | "yellow" | "cyan";
  };

  let { 
    value, 
    onChange, 
    options, 
    placeholder = "Select...", 
    className,
    theme = "purple"
  }: Props = $props();

  let open = $state(false);
  let containerRef: HTMLDivElement | undefined = $state();

  let selectedLabel = $derived(options.find(o => o.value === value)?.label || placeholder);

  function handleSelect(val: string) {
    onChange(val);
    open = false;
  }

  function toggleOpen() {
    open = !open;
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerRef && !containerRef.contains(e.target as Node)) {
        open = false;
    }
  }

  onMount(() => {
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  });

  // Theme maps
  const borderFocusMap = {
    purple: "group-focus-within/select:border-purple-500/50",
    emerald: "group-focus-within/select:border-emerald-500/50",
    yellow: "group-focus-within/select:border-yellow-500/50",
    cyan: "group-focus-within/select:border-cyan-500/50"
  };
  
  const shadowFocusMap = {
    purple: "shadow-[inset_0_0_15px_rgba(168,85,247,0.1)] group-focus-within/select:shadow-[inset_0_0_20px_rgba(168,85,247,0.3),0_0_15px_rgba(168,85,247,0.2)]",
    emerald: "shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] group-focus-within/select:shadow-[inset_0_0_20px_rgba(16,185,129,0.3),0_0_15px_rgba(16,185,129,0.2)]",
    yellow: "shadow-[inset_0_0_15px_rgba(234,179,8,0.1)] group-focus-within/select:shadow-[inset_0_0_20px_rgba(234,179,8,0.3),0_0_15px_rgba(234,179,8,0.2)]",
    cyan: "shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] group-focus-within/select:shadow-[inset_0_0_20px_rgba(6,182,212,0.3),0_0_15px_rgba(6,182,212,0.2)]"
  };

  const textActiveMap = {
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    yellow: "text-yellow-400",
    cyan: "text-cyan-400"
  };
</script>

<div bind:this={containerRef} class={cn("relative min-w-[160px] group", className)}>
  <div class="relative flex items-center group/select">
    <div class={cn("absolute inset-0 border-2 border-transparent rounded-xl pointer-events-none transition-colors z-20", borderFocusMap[theme], shadowFocusMap[theme])}></div>
    
    <button
      type="button"
      onclick={toggleOpen}
      class="w-full h-10 px-4 rounded-xl bg-[#050510]/80 backdrop-blur-md hover:bg-white/[0.05] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80 focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10 flex items-center justify-between gap-3"
    >
      <span class="truncate">{selectedLabel}</span>
      <ChevronDown class={cn("h-4 w-4 text-white/40 transition-transform duration-300", open && "rotate-180")} />
    </button>
  </div>

  {#if open}
    <div class="absolute z-[110] left-0 right-0 mt-2 p-1.5 rounded-2xl bg-[#0a0a0a]/95 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
      {#each options as o}
        <button
          type="button"
          onclick={() => handleSelect(o.value)}
          class="flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/5 text-left group/opt"
        >
          <span class={cn("truncate", o.value === value ? textActiveMap[theme] : "text-white/60 group-hover/opt:text-white")}>
            {o.label}
          </span>
          {#if o.value === value}
            <Check class={cn("h-3.5 w-3.5", textActiveMap[theme])} />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
</style>
