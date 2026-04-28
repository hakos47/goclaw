<script lang="ts">
  import { ChevronDown, Check, Search } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";

  type Option = { value: string; label?: string };

  type Props = {
    value: string;
    onChange: (v: string) => void;
    options: Option[];
    placeholder?: string;
    allowCustom?: boolean;
    customLabel?: string;
    className?: string;
  };

  let { 
    value, onChange, options, 
    placeholder = "Select...", 
    allowCustom = true, 
    customLabel = "Use custom:",
    className 
  }: Props = $props();

  let open = $state(false);
  let search = $state("");
  let inputDirty = $state(false);
  let inputRef: HTMLInputElement | undefined = $state();
  let containerRef: HTMLDivElement | undefined = $state();

  // Sync search text with value when value changes externally (and user is not typing)
  $effect(() => {
    if (!inputDirty) {
        const match = options.find(o => o.value === value);
        search = match?.label || value;
    }
  });

  let filtered = $derived.by(() => {
    if (!inputDirty || !search) return options;
    const q = search.toLowerCase();
    return options.filter(o => 
        o.value.toLowerCase().includes(q) || 
        (o.label && o.label.toLowerCase().includes(q))
    );
  });

  let isCustomValue = $derived.by(() => {
    if (!search.trim()) return false;
    // Check if the current search string matches any option EXACTLY (id or label)
    return !options.some(o => o.value.toLowerCase() === search.toLowerCase() || (o.label && o.label.toLowerCase() === search.toLowerCase()));
  });

  function handleSelect(val: string) {
    onChange(val);
    const match = options.find(o => o.value === val);
    search = match?.label || val;
    open = false;
    inputDirty = false;
  }

  function handleInputChange(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    search = val;
    // We call onChange immediately so the parent knows about the manual typing
    onChange(val);
    inputDirty = true;
    if (!open && (options.length > 0 || allowCustom)) {
        open = true;
        setTimeout(() => {
            containerRef?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
  }

  function handleFocus() {
    inputDirty = false;
    if (options.length > 0 || allowCustom) {
        open = true;
        // Auto-scroll into view when opening
        setTimeout(() => {
            if (containerRef) {
                const rect = containerRef.getBoundingClientRect();
                const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                if (!isVisible) {
                    containerRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 150);
    }
    // Auto-select text on focus like React
    setTimeout(() => inputRef?.select(), 10);
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerRef && !containerRef.contains(e.target as Node)) {
        open = false;
        inputDirty = false;
    }
  }

  onMount(() => {
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  });
</script>

<div bind:this={containerRef} class={cn("relative w-full group", className)}>
  <div class="relative flex items-center group/combo-input">
    <div class="absolute inset-x-0 bottom-0 top-0 border-2 border-transparent group-focus-within/combo-input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)] group-focus-within/combo-input:shadow-[inset_0_0_20px_rgba(168,85,247,0.3),0_0_15px_rgba(168,85,247,0.2)]"></div>
    <input
      bind:this={inputRef}
      value={search}
      oninput={handleInputChange}
      onfocus={handleFocus}
      {placeholder}
      class={cn("w-full h-11 pl-4 pr-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white/90 placeholder-white/30 font-bold text-sm focus:outline-none focus:bg-white/[0.05] transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10", className)}
    />
    <div class="absolute right-3 flex items-center gap-1.5 pointer-events-none">
       <ChevronDown class={cn("h-4 w-4 text-white/20 transition-transform duration-300", open && "rotate-180")} />
    </div>
  </div>

  {#if open && (filtered.length > 0 || (allowCustom && isCustomValue && search.trim()))}
    <div class="absolute z-[110] left-0 right-0 mt-2 p-1.5 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
      {#each filtered as o}
        <button
          type="button"
          onclick={() => handleSelect(o.value)}
          class="flex w-full items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5 text-left group/opt"
        >
          <span class={cn("truncate", o.value === value ? "text-goclaw-neon-purple font-bold" : "text-white/60 group-hover/opt:text-white")}>
            {o.label || o.value}
          </span>
          {#if o.value === value}
            <Check class="h-3.5 w-3.5 text-goclaw-neon-purple" />
          {/if}
        </button>
      {/each}

      {#if allowCustom && isCustomValue && search.trim()}
        <button
          type="button"
          onclick={() => handleSelect(search.trim())}
          class="flex w-full items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5 text-left border-t border-white/5 mt-1 pt-3"
        >
          <span class="text-white/30 italic">{customLabel}</span>
          <span class="text-goclaw-neon-purple font-bold truncate">{search.trim()}</span>
        </button>
      {/if}
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
