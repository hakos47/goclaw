<script lang="ts">
  import { Zap, Search, Settings } from "lucide-svelte";
  import { useAgentSkills } from "../../../hooks/use-agent-skills.svelte.ts";
  import { _ } from "svelte-i18n";

  type Props = {
    agentId: string;
  };

  let { agentId }: Props = $props();
  
  let skillsManager = useAgentSkills(agentId);
  let search = $state("");
  let toggling = $state<string | null>(null);

  let filtered = $derived(
    skillsManager.skills
      .filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const rank = (s: typeof a) => s.granted ? 2 : s.is_system ? 1 : 0;
        return rank(b) - rank(a); // Sort descending (granted first)
      })
  );

  async function handleToggle(skillId: string, currentlyGranted: boolean) {
    toggling = skillId;
    try {
      if (currentlyGranted) await skillsManager.revokeSkill(skillId);
      else await skillsManager.grantSkill(skillId);
    } finally {
      toggling = null;
    }
  }

  function visibilityVariantClass(v: string) {
    if (v === "public") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (v === "internal") return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    return "bg-white/10 text-white/60 border-white/20";
  }
</script>

<div class="relative group p-6 rounded-3xl bg-[#050505]/80 backdrop-blur-3xl border border-white/10 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.15)] hover:border-white/20 overflow-hidden mt-6">
  <!-- Animated cyber background grid -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

  <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <Zap class="h-4 w-4 text-amber-500 animate-[pulse_2s_ease-in-out_infinite]" />
      </div>
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Data Source Skills</h3>
        {#if !skillsManager.loading}
          <span class="text-[10px] text-white/30 font-bold ml-2">
            ({skillsManager.skills.filter(s => s.granted).length}/{skillsManager.skills.length})
          </span>
        {/if}
      </div>
    </div>
    
    <div class="relative w-full sm:w-64 group/search">
      <Search class="absolute left-3 top-3 h-4 w-4 text-white/30 group-focus-within/search:text-amber-500 transition-colors" />
      <div class="absolute inset-x-0 bottom-0 top-[0px] border-2 border-transparent group-focus-within/search:border-amber-500/30 rounded-xl pointer-events-none transition-colors z-20"></div>
      <input
        bind:value={search}
        placeholder="Filter skills..."
        class="w-full h-11 pl-10 pr-4 rounded-xl bg-[#030014]/90 border border-white/5 text-amber-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] relative z-10"
      />
    </div>
  </div>

  <div class="relative z-10">

  {#if skillsManager.loading && skillsManager.skills.length === 0}
    <div class="h-32 flex items-center justify-center border border-white/5 rounded-xl bg-white/[0.02]">
      <span class="text-xs text-white/30 truncate animate-pulse">Loading skills...</span>
    </div>
  {:else if skillsManager.skills.length === 0}
    <div class="h-32 flex items-center justify-center border border-dashed border-white/10 rounded-xl">
      <p class="text-[10px] text-white/30 uppercase tracking-widest italic">No Skills Available</p>
    </div>
  {:else}
    <div class="divide-y divide-white/5 rounded-2xl border border-white/5 bg-white/[0.02] max-h-[300px] overflow-y-auto custom-scrollbar">
      {#each filtered as skill (skill.id)}
        <div class="flex items-center justify-between gap-4 px-4 py-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-white/90 truncate">{skill.name}</span>
              <span class={`rounded text-[9px] font-bold px-1.5 py-0.5 border uppercase tracking-widest ${visibilityVariantClass(skill.visibility)}`}>
                {skill.visibility}
              </span>
              {#if skill.is_system}
                <span class="rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-widest">
                  System
                </span>
              {/if}
            </div>
            {#if skill.description}
              <p class="mt-1 truncate text-xs text-white/40">{skill.description}</p>
            {/if}
          </div>
          <div class="shrink-0 pl-4">
            {#if skill.is_system}
              <div class="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full border border-white/10">
                <Settings class="h-3 w-3 text-white/40" />
                <span class="text-[9px] text-white/40 uppercase tracking-widest font-bold">Base Tool</span>
              </div>
            {:else}
              <button 
                 onclick={() => handleToggle(skill.id, skill.granted)}
                 disabled={toggling === skill.id}
                 class={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${skill.granted ? 'bg-amber-500' : 'bg-white/10'} ${toggling === skill.id ? 'opacity-50' : ''}`}
               >
                 <span class={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${skill.granted ? 'translate-x-5' : 'translate-x-1'}`}></span>
               </button>
            {/if}
          </div>
        </div>
      {/each}
      {#if filtered.length === 0}
        <div class="px-4 py-8 text-center">
          <p class="text-[10px] text-white/30 uppercase tracking-widest italic">No Match Found</p>
        </div>
      {/if}
    </div>
  {/if}
  </div>
</div>
