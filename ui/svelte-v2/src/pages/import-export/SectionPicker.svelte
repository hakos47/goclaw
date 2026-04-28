<script lang="ts">
  import { Check } from "lucide-svelte";
  import { _ } from "svelte-i18n";

  export type SectionDef = {
    id: string;
    labelKey: string;
    required?: boolean;
    count?: number;
    countLabel?: string;
    children?: SectionDef[];
  };

  export let sections: SectionDef[];
  export let selected: Set<string>;
  export let onChange: (selected: Set<string>) => void;

  function handleToggle(sec: SectionDef) {
    if (sec.required) return;
    const next = new Set(selected);
    const isSelected = next.has(sec.id);

    if (isSelected) {
      next.delete(sec.id);
      if (sec.children) {
        for (const child of sec.children) next.delete(child.id);
      }
    } else {
      next.add(sec.id);
      if (sec.children) {
        for (const child of sec.children) next.add(child.id);
      }
    }
    onChange(next);
  }

  function handleChildToggle(parent: SectionDef, child: SectionDef) {
    if (child.required) return;
    const next = new Set(selected);
    const isSelected = next.has(child.id);

    if (isSelected) {
      next.delete(child.id);
    } else {
      next.add(child.id);
      if (!next.has(parent.id)) {
        next.add(parent.id);
      }
    }
    onChange(next);
  }

  // helper to check if section has any data (if preview info provided)
  const hasData = (sec: SectionDef) => sec.count === undefined || sec.count > 0 || !!sec.countLabel;
</script>

<div class="rounded-xl border border-white/5 bg-[#030014]/50 shadow-inner overflow-hidden">
  {#each sections as sec, idx}
    <div class={`p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${idx !== sections.length - 1 ? 'border-b border-white/5' : ''} ${hasData(sec) ? 'hover:bg-white/[0.02]' : 'opacity-50 grayscale'}`}>
      
      <div class="flex items-start sm:items-center gap-3 cursor-pointer" onclick={() => handleToggle(sec)}>
        <button 
          class={`mt-0.5 sm:mt-0 w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${sec.required ? 'bg-white/10 border-white/20 cursor-not-allowed' : selected.has(sec.id) ? 'bg-goclaw-neon-purple border-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'border-white/20 bg-black/50'}`}
        >
          {#if selected.has(sec.id) || sec.required}
             <Check class="w-3.5 h-3.5 text-white" strokeWidth={3} />
          {/if}
        </button>
        <div>
          <p class="text-sm font-bold text-white tracking-wide">{$_(`import-export:${sec.labelKey}`)}</p>
          {#if sec.required}
             <p class="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Required for integrity</p>
          {/if}
        </div>
      </div>

      {#if sec.countLabel || sec.count !== undefined}
        <div class="ml-8 sm:ml-0 flex-shrink-0">
          <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
             {sec.countLabel ? sec.countLabel : `${sec.count} items`}
          </span>
        </div>
      {/if}
    </div>

    {#if sec.children && sec.children.length > 0}
      <div class={`bg-black/20 pl-11 pr-4 py-2 border-b border-white/5 space-y-2 ${hasData(sec) ? '' : 'opacity-50'}`}>
        {#each sec.children as child}
           <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 cursor-pointer" onclick={() => handleChildToggle(sec, child)}>
                <button 
                  class={`w-4 h-4 rounded border flex items-center justify-center transition-all ${child.required ? 'bg-white/10 border-white/20 cursor-not-allowed' : selected.has(child.id) ? 'bg-goclaw-neon-cyan border-goclaw-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'border-white/20 bg-black/50'}`}
                >
                  {#if selected.has(child.id) || child.required}
                     <Check class="w-3 h-3 text-[#030014]" strokeWidth={3} />
                  {/if}
                </button>
                <span class="text-xs text-white/70">{$_(`import-export:${child.labelKey}`)}</span>
              </div>
              {#if child.countLabel || child.count !== undefined}
                <span class="text-[9px] font-mono text-white/40">{child.countLabel ? child.countLabel : child.count}</span>
              {/if}
           </div>
        {/each}
      </div>
    {/if}
  {/each}
</div>
