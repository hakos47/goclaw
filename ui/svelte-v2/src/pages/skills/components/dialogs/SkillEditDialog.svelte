<script lang="ts">
  import { X, Loader2, Save } from "lucide-svelte";
  import type { SkillInfo } from "../../hooks/use-skills.svelte";

  let { skill, onClose, onSave } = $props<{
    skill: SkillInfo;
    onClose: () => void;
    onSave: (id: string, updates: Record<string, unknown>) => Promise<void>;
  }>();

  let name = $state(skill.name);
  let description = $state(skill.description || "");
  let visibility = $state(skill.visibility || "private");
  let tags = $state<string[]>(skill.tags || []);
  let tagInput = $state("");
  let loading = $state(false);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      tags = [...tags, t];
    }
    tagInput = "";
  }

  function removeTag(tag: string) {
    tags = tags.filter((t) => t !== tag);
  }

  async function handleSave() {
    if (!skill.id) return;
    loading = true;
    try {
      await onSave(skill.id, { name, description, visibility, tags });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#030014]/80 backdrop-blur-2xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" onclick={(e) => e.target === e.currentTarget && onClose()}>
  <div class="relative w-full max-w-md bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(217,70,239,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col">
    
    <!-- Header -->
    <div class="p-6 border-b border-white/5 bg-white/[0.02]">
      <h2 class="text-lg font-black uppercase tracking-widest text-white/90">Edit Skill Metadata</h2>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-5">
      
      <!-- Name -->
      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-white/50 uppercase tracking-widest">Name</label>
        <input 
          bind:value={name} 
          class="block w-full h-10 px-3 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md text-sm text-white focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner"
        />
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-white/50 uppercase tracking-widest">Description</label>
        <textarea 
          bind:value={description} 
          rows="3"
          class="block w-full p-3 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md text-sm text-white focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner resize-none"
        ></textarea>
      </div>

      <!-- Visibility -->
      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-white/50 uppercase tracking-widest">Visibility</label>
        <div class="flex gap-2">
          {#each ['private', 'internal', 'public'] as v}
            <button 
              onclick={() => visibility = v}
              class="flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg border transition-all {visibility === v ? 'border-goclaw-neon-purple/50 bg-goclaw-neon-purple/10 text-goclaw-neon-purple' : 'border-white/5 bg-white/[0.02] backdrop-blur-sm text-white/30 hover:border-white/20'}"
            >
              {v}
            </button>
          {/each}
        </div>
      </div>

      <!-- Tags -->
      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-white/50 uppercase tracking-widest">Tags</label>
        <div class="flex gap-2">
          <input 
            bind:value={tagInput} 
            onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tag..."
            class="block flex-1 h-9 px-3 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md text-xs text-white placeholder-white/30 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner"
          />
          <button 
            onclick={addTag}
            class="h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70 uppercase tracking-widest transition-colors"
          >
            Add
          </button>
        </div>

        {#if tags.length > 0}
          <div class="flex flex-wrap gap-1.5 mt-2">
            {#each tags as tag}
              <span class="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                {tag}
                <button onclick={() => removeTag(tag)} class="hover:text-red-400 transition-colors">
                  <X class="h-3 w-3" />
                </button>
              </span>
            {/each}
          </div>
        {/if}
      </div>

    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-white/5 bg-white/[0.03] backdrop-blur-md flex items-center justify-end gap-2">
      <button 
        onclick={onClose} 
        disabled={loading}
        class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-50 text-white/50"
      >
        Cancel
      </button>
      <button 
        onclick={handleSave} 
        disabled={loading || !name.trim()}
        class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-goclaw-neon-purple hover:bg-goclaw-neon-purple text-black transition-colors disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 flex items-center gap-2"
      >
        {#if loading}
          <Loader2 class="h-3 w-3 animate-spin" /> Saving...
        {:else}
          <Save class="h-3 w-3" /> Save Changes
        {/if}
      </button>
    </div>

  </div>
</div>
