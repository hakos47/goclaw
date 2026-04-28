<script lang="ts">
  import { AlertTriangle, Wrench, ChevronDown, Package } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import type { RuntimeStatus } from "../../hooks/use-runtimes.svelte";

  let { missing = [], onInstallItem, runtimes = undefined } = $props<{
    missing?: string[];
    onInstallItem: (dep: string) => Promise<void>;
    runtimes?: RuntimeStatus | null;
  }>();

  let expanded = $state(false);
  let installing = $state<string | null>(null);

  async function handleInstall(dep: string) {
    installing = dep;
    try {
      await onInstallItem(dep);
    } finally {
      installing = null;
    }
  }

  // Group dependencies by runtime (npm vs pip vs binary)
  const groupedDeps = $derived(() => {
    const groups: Record<string, string[]> = { npm: [], pip: [], bin: [] };
    for (const d of missing) {
      if (d.startsWith("npm:")) groups.npm.push(d.replace("npm:", ""));
      else if (d.startsWith("pip:")) groups.pip.push(d.replace("pip:", ""));
      else groups.bin.push(d);
    }
    return groups;
  });

  const getRuntimeInfo = (type: string) => {
    if (!runtimes) return null;
    return runtimes.runtimes.find(r => r.name === type);
  };
</script>

{#if missing.length > 0}
  <div class="mb-6 rounded-2xl bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-red-500/40 shadow-[inset_0_0_20px_rgba(239,68,68,0.1),0_0_20px_rgba(239,68,68,0.1)] overflow-hidden relative">
    <div class="absolute top-0 left-0 w-1 bg-red-500 h-full animate-pulse"></div>
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 blur-[50px] pointer-events-none"></div>

    <button 
      class="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left"
      onclick={() => expanded = !expanded}
    >
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center">
          <AlertTriangle class="h-5 w-5 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        </div>
        <div>
          <h3 class="text-sm font-black uppercase tracking-widest text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">System Dependencies Missing</h3>
          <p class="text-[10px] text-red-400/60 font-mono tracking-widest uppercase mt-0.5">
            {missing.length} {missing.length === 1 ? 'PACKAGE' : 'PACKAGES'} REQUIRED FOR ACTIVE SKILLS
          </p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-[10px] font-bold text-red-400/50 uppercase tracking-widest">
          {expanded ? 'HIDE DETAILS' : 'RESOLVE ISSUES'}
        </span>
        <ChevronDown class="h-5 w-5 text-red-400/50 transition-transform duration-300 {expanded ? 'rotate-180' : ''}" />
      </div>
    </button>

    {#if expanded}
      <div transition:slide={{ duration: 300 }} class="p-4 bg-white/[0.02] backdrop-blur-sm border-t border-red-500/20 space-y-4 relative z-10">
        
        {#if runtimes && !runtimes.ready}
          <div class="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-start gap-3">
            <AlertTriangle class="h-4 w-4 text-pink-400 shrink-0 mt-0.5" />
            <div class="text-[10px] uppercase tracking-widest text-pink-400/80 leading-relaxed font-bold">
              Host Environment Notice: Some language runtimes (Node.js, Python) are not detected on the host system. Package installation may fail until they are installed globally.
            </div>
          </div>
        {/if}

        <div class="grid gap-3">
          {#each missing as dep}
            {@const isInstalling = installing === dep}
            {@const isNpm = dep.startsWith("npm:")}
            {@const isPip = dep.startsWith("pip:")}
            {@const isBin = !isNpm && !isPip}
            {@const rInfo = getRuntimeInfo(isNpm ? "node" : isPip ? "python" : "system")}
            
            <div class="flex items-center justify-between p-3 rounded-xl bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 group hover:border-red-500/30 transition-colors">
              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-lg bg-white/[0.03] backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <Package class="h-4 w-4 {isNpm ? 'text-green-400' : isPip ? 'text-blue-400' : 'text-slate-400'}" />
                </div>
                <div>
                  <div class="font-mono text-sm text-white/90 group-hover:text-white transition-colors">{dep.replace(/^(pip|npm):/, "")}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[9px] uppercase tracking-widest text-white/40">
                      {isNpm ? 'NPM Package' : isPip ? 'Python Package' : 'System Binary'}
                    </span>
                    {#if rInfo && !rInfo.available}
                      <span class="px-1.5 py-0.5 rounded bg-red-500/20 text-[8px] font-bold text-red-400 uppercase tracking-widest">Runtime Missing</span>
                    {/if}
                  </div>
                </div>
              </div>
              
              {#if !isBin}
                <button 
                  disabled={isInstalling || (rInfo && !rInfo.available)}
                  onclick={() => handleInstall(dep)}
                  class="h-8 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-[10px] font-black uppercase tracking-widest text-red-400 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wrench class="h-3.5 w-3.5 {isInstalling ? 'animate-spin' : ''}" /> 
                  {isInstalling ? 'Installing...' : 'Install'}
                </button>
              {:else}
                <span class="text-[9px] font-bold text-pink-500 uppercase tracking-widest px-2 py-1 rounded bg-pink-500/10 border border-pink-500/30">
                  Manual Install Required
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
