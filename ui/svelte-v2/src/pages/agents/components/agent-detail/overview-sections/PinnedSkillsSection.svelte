<script lang="ts">
  import { Pin, X, Search } from "lucide-svelte";
  import { useAgentSkills } from "../../../hooks/use-agent-skills.svelte";
  import type { AgentData } from "../../../../../lib/types/agent";

  type Props = {
    agent: AgentData;
    onUpdate: (updates: Record<string, unknown>) => Promise<void>;
  };

  let { agent, onUpdate }: Props = $props();

  const MAX_PINNED = 10;

  let skillsManager = useAgentSkills(agent.id);
  
  function readPinnedSkills(ag: AgentData): string[] {
    const bag = (ag.other_config ?? {}) as Record<string, unknown>;
    return (bag.pinned_skills as string[]) || [];
  }

  let pinned = $state<string[]>([]);
  let savedPinned = $derived(readPinnedSkills(agent));
  
  // Sync when agent props change deeply
  $effect(() => {
    pinned = [...savedPinned];
  });

  let saving = $state(false);
  let dirty = $derived(JSON.stringify(pinned) !== JSON.stringify(savedPinned));

  let availableSkills = $derived.by(() => {
    const pinnedSet = new Set(pinned);
    return skillsManager.skills
      .filter((s) => s.granted && !pinnedSet.has(s.slug))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  function addPinned(slug: string) {
    if (slug && !pinned.includes(slug) && pinned.length < MAX_PINNED) {
      pinned.push(slug);
    }
  }

  function removePinned(slug: string) {
    pinned = pinned.filter((s) => s !== slug);
  }

  function skillName(slug: string) {
    const s = skillsManager.skills.find((sk) => sk.slug === slug);
    return s?.name ?? slug;
  }

  async function handleSave() {
    saving = true;
    try {
      const bag = { ...((agent.other_config ?? {}) as Record<string, unknown>) };
      if (pinned.length > 0) {
        bag.pinned_skills = pinned;
      } else {
        delete bag.pinned_skills;
      }
      await onUpdate({ other_config: bag });
    } finally {
      saving = false;
    }
  }
</script>

<div class="relative group p-6 rounded-3xl bg-[#050505]/80 backdrop-blur-3xl border border-white/10 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_40px_rgba(249,115,22,0.15)] hover:border-white/20 overflow-hidden mt-6">
  <!-- Animated cyber background grid -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

  <div class="relative z-10 flex items-center justify-between border-b border-white/10 pb-6 mb-6">
    <div class="flex items-start gap-3">
      <div class="h-8 w-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.2)]">
        <Pin class="h-4 w-4 text-orange-400 animate-[pulse_3s_ease-in-out_infinite]" />
      </div>
      <div>
        <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm flex items-center gap-2">
          Pinned System Skills
          <span class="text-[10px] text-white/30 font-mono">({pinned.length}/{MAX_PINNED})</span>
        </h3>
        <p class="text-[10px] text-white/40 mt-1">Pinned skills are explicitly hardcoded into the system prompt. Remaining use semantic lookup.</p>
      </div>
    </div>
    
    {#if dirty}
      <button 
        onclick={handleSave} 
        disabled={saving}
        class="shrink-0 flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:pointer-events-none outline-none relative overflow-hidden group/btn"
      >
        <span class="relative z-10">{saving ? 'Saving...' : 'Commit Cache'}</span>
        <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite] opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity"></div>
      </button>
    {/if}
  </div>

  <div class="relative z-10 space-y-6">
    <!-- Active Pins -->
    {#if pinned.length > 0}
      <div class="flex flex-wrap gap-3">
        {#each pinned as slug}
          <button
            onclick={() => removePinned(slug)}
            class="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#030014]/60 border border-orange-500/30 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all text-orange-400 outline-none shadow-[0_0_10px_rgba(249,115,22,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <span class="text-[10px] font-black uppercase tracking-widest leading-none drop-shadow-sm">{skillName(slug)}</span>
            <X class="h-3 w-3 opacity-50 group-hover:opacity-100" />
          </button>
        {/each}
      </div>
    {/if}

    <!-- Available to wire -->
    {#if pinned.length < MAX_PINNED && !skillsManager.loading}
      {#if availableSkills.length > 0}
       <div class="flex items-center gap-3 pt-6 border-t border-white/10 mt-6">
         <span class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] whitespace-nowrap">Add Skill:</span>
         <div class="relative flex-1 max-w-[300px] group/select">
            <div class="absolute inset-x-0 bottom-0 top-0 border-2 border-transparent group-focus-within/select:border-orange-500/30 rounded-xl pointer-events-none transition-colors z-20"></div>
            <select
              onchange={(e) => {
                addPinned(e.currentTarget.value);
                e.currentTarget.value = "";
              }}
              class="w-full h-11 pl-4 pr-10 rounded-xl bg-[#030014]/90 border border-white/10 text-[10px] font-black text-orange-400 uppercase tracking-widest outline-none shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] appearance-none cursor-pointer transition-colors relative z-10"
            >
              <option value="" disabled selected class="text-white/40">-- Select from Active --</option>
              {#each availableSkills as s}
                <option value={s.slug} class="bg-black text-orange-400 font-bold">{s.name}</option>
              {/each}
            </select>
            <div class="absolute right-4 top-3.5 z-30 pointer-events-none">
              <ChevronDown class="h-4 w-4 text-orange-500/50 group-hover/select:text-orange-500 transition-colors" />
            </div>
         </div>
       </div>
      {:else}
       <p class="text-[10px] text-white/30 italic uppercase tracking-widest">No additional granted skills available to pin.</p>
      {/if}
    {/if}
  </div>
</div>

<script module>
  import { ChevronDown } from "lucide-svelte";
</script>
