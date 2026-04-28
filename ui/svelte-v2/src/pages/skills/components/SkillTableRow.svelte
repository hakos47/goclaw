<script lang="ts">
  import { Zap, Pencil, Trash2, Globe, Lock, Shield } from "lucide-svelte";
  import type { SkillInfo } from "../../hooks/use-skills.svelte";
  import Switch from "../../../lib/components/shared/Switch.svelte";
  
  let { skill, tab, hasTenantScope, toggling, onView, onEdit, onDelete, onToggle, onCycleVisibility, onSetTenantConfig, onDeleteTenantConfig } = $props<{
    skill: SkillInfo;
    tab: "core" | "custom";
    hasTenantScope: boolean;
    toggling: string | null;
    onView: (name: string) => void;
    onEdit: (skill: SkillInfo) => void;
    onDelete: (skill: SkillInfo) => void;
    onToggle: (skill: SkillInfo, enabled: boolean) => void;
    onCycleVisibility: (skill: SkillInfo) => void;
    onSetTenantConfig: (id: string, enabled: boolean) => Promise<void>;
    onDeleteTenantConfig: (id: string) => Promise<void>;
  }>();

  const isArchived = skill.status === "archived";
  const isDisabled = skill.enabled === false;
  const hasMissing = (skill.missing_deps?.length ?? 0) > 0;

  function handleVisibilityClick() {
    if (skill.id) onCycleVisibility(skill);
  }
</script>

<tr class="group hover:bg-white/[0.02] transition-colors {(isArchived || isDisabled) ? 'opacity-50 grayscale-[50%]' : ''}">
  <td class="p-4 align-middle">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded-lg bg-white/[0.03] backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] group-hover:border-amber-400/30 group-hover:bg-amber-400/10 transition-colors">
        <Zap class="h-4 w-4 {isDisabled ? 'text-white/30' : 'text-amber-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]'}" />
      </div>
      <div class="flex flex-col">
        <button 
          class="text-sm font-bold text-white hover:text-amber-400 tracking-wide text-left transition-colors"
          onclick={() => onView(skill.name)}
        >
          {skill.name}
        </button>
        <div class="flex items-center gap-2 mt-1">
          {#if skill.is_system}
            <span class="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[9px] font-black uppercase tracking-widest text-blue-400">Core</span>
          {/if}
          {#if skill.version}
            <span class="text-[10px] font-mono text-white/40 uppercase tracking-widest">v{skill.version}</span>
          {/if}
        </div>
      </div>
    </div>
  </td>
  
  <td class="p-4 align-middle max-w-xs">
    <p class="text-xs text-white/50 truncate uppercase tracking-widest">{skill.description || 'No description provided'}</p>
  </td>

  {#if tab === "custom"}
    <td class="p-4 align-middle">
      <span class="text-[10px] font-mono text-white/60">{skill.author || "—"}</span>
    </td>
  {/if}

  <td class="p-4 align-middle">
    <div class="flex flex-col gap-1.5 items-start">
      {#if isArchived}
        <span class="px-2 py-0.5 rounded border border-pink-500/30 bg-pink-500/10 text-[9px] font-bold text-pink-500 uppercase tracking-widest">Archived</span>
      {:else}
        <span class="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
      {/if}

      {#if hasMissing}
        {@const deps = skill.missing_deps!.map(d => d.replace(/^(pip|npm):/, ""))}
        {@const shown = deps.slice(0, 2)}
        {@const rest = deps.length - shown.length}
        <span class="px-2 py-0.5 rounded border border-red-500/50 bg-red-500/20 text-[9px] font-bold text-red-400 uppercase tracking-widest animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          MISSING: {shown.join(", ")}{rest > 0 ? ` +${rest}` : ''}
        </span>
      {/if}
    </div>
  </td>

  {#if tab === "custom"}
    <td class="p-4 align-middle">
      {#if skill.visibility}
        <button 
          onclick={handleVisibilityClick}
          disabled={!skill.id}
          class="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-white/[0.02] backdrop-blur-sm hover:bg-white/5 transition-colors
            {skill.visibility === 'public' ? 'border-goclaw-neon-purple/30 text-goclaw-neon-purple' : 
             skill.visibility === 'internal' ? 'border-purple-500/30 text-purple-400' : 
             'border-white/10 text-white/40'}"
        >
          {#if skill.visibility === 'public'}
            <Globe class="h-3 w-3" />
          {:else if skill.visibility === 'internal'}
            <Shield class="h-3 w-3" />
          {:else}
            <Lock class="h-3 w-3" />
          {/if}
          <span class="text-[9px] font-black uppercase tracking-widest">{skill.visibility}</span>
        </button>
      {/if}
    </td>
  {/if}

  <td class="p-4 align-middle text-right">
    <div class="flex items-center justify-end gap-2">
      {#if skill.id}
        {#if hasTenantScope}
          <!-- TODO: Tenant override button -->
          <div class="px-2 py-1 border border-amber-400/30 bg-amber-400/10 text-amber-400 text-[10px] rounded uppercase tracking-widest">Override</div>
        {:else}
          <div class="mr-2">
            <Switch 
              checked={skill.enabled !== false}
              disabled={toggling === skill.id}
              onChange={(checked) => onToggle(skill, checked)}
            />
          </div>
        {/if}
        
        <button 
          onclick={() => onEdit(skill)}
          class="inline-flex items-center justify-center rounded-lg transition-colors hover:bg-white/10 h-8 w-8 text-white/30 hover:text-white border border-transparent hover:border-white/10 p-0"
        >
          <Pencil class="h-3.5 w-3.5" />
        </button>

        {#if !skill.is_system}
          <button 
            onclick={() => onDelete(skill)}
            class="inline-flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/20 h-8 w-8 text-white/30 hover:text-red-500 border border-transparent hover:border-red-500/30 p-0"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        {/if}
      {/if}
    </div>
  </td>
</tr>
